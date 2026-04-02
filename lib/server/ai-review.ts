import path from 'node:path';
import { promises as fs } from 'node:fs';
import { execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { promisify } from 'node:util';
import { z } from 'zod';
import { blackwhiteJson } from '@/lib/server/blackwhite';
import { getDemoCacheRoot, getWorkspaceRoot } from '@/lib/server/runtime-root';
import { getCaseAnalysis } from '@/lib/server/case-analysis';
import { getGeneratedCompensationReport } from '@/lib/server/compensation-approval-report';
import { getCreditReportData } from '@/lib/server/credit-report';
import { getGeneratedCreditReport } from '@/lib/server/credit-report-draft';

const execFileAsync = promisify(execFile);

const WORKSPACE_ROOT = getWorkspaceRoot();
const AI_REVIEW_CACHE_ROOT = path.join(getDemoCacheRoot(), 'ai-review');
const BRIEF_TABLES_PATH = path.join(WORKSPACE_ROOT, 'data', 'brief-tables.json');
const CREDIT_DOC_DIR = path.join(WORKSPACE_ROOT, 'docs', '授信及评价');
const CREDIT_EVAL_DOC = path.join(CREDIT_DOC_DIR, '副本14.机构评价报告-业务一部-季度.doc');

export const REVIEW_DOCUMENT_TYPES = ['compensation', 'brief', 'evaluation', 'credit'] as const;
export type ReviewDocumentType = (typeof REVIEW_DOCUMENT_TYPES)[number];

const reviewConclusionSchema = z.enum(['可提交', '建议修改后提交', '存在明显风险，不建议直接提交']);
const reviewSeveritySchema = z.enum(['high', 'medium', 'low']);
const reviewFocusSchema = z.enum(['完整性', '一致性', '合规性', '风险性', '成文性']);
const reviewStatusSchema = z.enum(['待复核', '已出首版意见', '已反馈重审', '可提交 OA']);

const reviewIssueSchema = z.object({
  title: z.string().min(1),
  severity: reviewSeveritySchema,
  focus: reviewFocusSchema,
  description: z.string().min(1),
});

const reviewSuggestionSchema = z.object({
  title: z.string().min(1),
  detail: z.string().min(1),
  basis: z.string().min(1),
});

const experienceItemSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  createdAt: z.string().min(1),
});

const generatedReviewSchema = z
  .object({
    status: reviewStatusSchema,
    conclusion: reviewConclusionSchema,
    summary: z.string().min(1),
    issues: z.array(reviewIssueSchema).min(1),
    risks: z.array(reviewIssueSchema).min(1),
    suggestions: z.array(reviewSuggestionSchema).min(1),
    basis: z.object({
      mode: z.string().min(1),
      materials: z.array(z.string()).min(1),
      policies: z.array(z.string()).default([]),
      experiences: z.array(z.string()).default([]),
    }),
    capturedExperiencePoints: z.array(z.string()).default([]),
    capturedExperience: z.string().nullable().optional(),
  })
  .transform((value) => ({
    ...value,
    capturedExperiencePoints:
      value.capturedExperiencePoints.length > 0
        ? value.capturedExperiencePoints
        : value.capturedExperience
          ? [value.capturedExperience]
          : [],
  }));

const reviewRoundSchema = z.object({
  id: z.string().min(1),
  index: z.number().int().positive(),
  request: z.string().min(1),
  review: generatedReviewSchema,
  createdAt: z.string().min(1),
});

const conversationEntrySchema = z.discriminatedUnion('kind', [
  z.object({
    id: z.string().min(1),
    kind: z.literal('user'),
    text: z.string().min(1),
    createdAt: z.string().min(1),
  }),
  z.object({
    id: z.string().min(1),
    kind: z.literal('assistant'),
    text: z.string().min(1),
    createdAt: z.string().min(1),
  }),
  z.object({
    id: z.string().min(1),
    kind: z.literal('review'),
    roundId: z.string().min(1),
    createdAt: z.string().min(1),
  }),
]);

const intentDecisionSchema = z.object({
  intent: z.enum(['chat', 'targeted_review', 'full_review']),
  reply: z.string().min(1),
  capturedExperiencePoints: z.array(z.string()).default([]),
});

const persistedSessionSchema = z.object({
  docType: z.enum(REVIEW_DOCUMENT_TYPES),
  review: generatedReviewSchema.nullable().default(null),
  experience: z.array(experienceItemSchema).default([]),
  conversation: z.array(conversationEntrySchema).default([]),
  reviewRounds: z.array(reviewRoundSchema).default([]),
  lastAddedExperienceIds: z.array(z.string()).default([]),
  submittedAt: z.string().nullable().default(null),
  lastUpdatedAt: z.string().min(1),
});

export type ReviewConclusion = z.infer<typeof reviewConclusionSchema>;
export type ReviewStatus = z.infer<typeof reviewStatusSchema>;
export type ReviewIssue = z.infer<typeof reviewIssueSchema>;
export type ReviewSuggestion = z.infer<typeof reviewSuggestionSchema>;
export type ReviewResult = z.infer<typeof generatedReviewSchema>;
export type ExperienceItem = z.infer<typeof experienceItemSchema>;
export type ReviewRound = z.infer<typeof reviewRoundSchema>;
export type ConversationEntry = z.infer<typeof conversationEntrySchema>;
type PersistedSession = z.infer<typeof persistedSessionSchema>;

export type ReviewReference = {
  id: string;
  title: string;
  kind: 'draft' | 'reference' | 'policy' | 'sample';
  note: string;
};

export type ReviewDocumentOption = {
  type: ReviewDocumentType;
  label: string;
  shortLabel: string;
  modeLabel: string;
  summary: string;
  reviewStatus: ReviewStatus;
  lastReviewedAt: string | null;
};

export type AiReviewContext = {
  current: ReviewDocumentOption;
  documents: ReviewDocumentOption[];
  roleLabel: string;
  modeLabel: string;
  status: ReviewStatus;
  draftTitle: string;
  draftBody: string;
  draftUpdatedAt: string;
  summary: string;
  references: ReviewReference[];
  presetPoints: string[];
  learnedExperience: ExperienceItem[];
  latestAddedExperience: ExperienceItem[];
  latestReview: ReviewResult | null;
  conversation: ConversationEntry[];
  reviewRounds: ReviewRound[];
  reviewCounts: {
    errors: number;
    warnings: number;
    low: number;
  };
  submittedAt: string | null;
};

const DOCUMENT_META: Record<ReviewDocumentType, Omit<ReviewDocumentOption, 'summary' | 'reviewStatus' | 'lastReviewedAt'> & { defaultSummary: string }> = {
  compensation: {
    type: 'compensation',
    label: '代偿补偿报告',
    shortLabel: '代偿补偿',
    modeLabel: '代偿补偿复核',
    defaultSummary: '重点检查时效、责任比例、补偿基数解释和证据链闭环。',
  },
  brief: {
    type: 'brief',
    label: '授信简报',
    shortLabel: '授信简报',
    modeLabel: '简报复核',
    defaultSummary: '重点检查趋势判断是否有数字支撑，以及口径和结论是否一致。',
  },
  evaluation: {
    type: 'evaluation',
    label: '机构评价报告',
    shortLabel: '机构评价',
    modeLabel: '机构评价复核',
    defaultSummary: '重点检查未达标指标、归因分析和整改建议是否准确完整。',
  },
  credit: {
    type: 'credit',
    label: '授信报告',
    shortLabel: '授信报告',
    modeLabel: '授信复核',
    defaultSummary: '重点检查申请额度、政策目标值、测算值与最终建议值之间的关系。',
  },
};

const PRESET_POINTS: Record<ReviewDocumentType, string[]> = {
  compensation: [
    '时效是否满足 120 日申报与 180 日解保要求',
    '补偿金额是否按未清偿本金和责任比例测算',
    '代偿原因、代偿通知、支付凭证和流水是否形成证据链',
    '法定代表人变更与反担保责任连续性是否说明清楚',
  ],
  brief: [
    '趋势判断是否由底表数据直接支撑',
    '同一指标在摘要、表格和结论中的口径是否一致',
    '关键结论是否缺少同比/环比或结构拆解解释',
    '成文是否符合业务简报的正式表达习惯',
  ],
  evaluation: [
    '未达标指标是否被逐项点明',
    '分析段落是否把数据变化与业务原因对应起来',
    '整改建议是否有量化抓手而非空泛表述',
    '评价结论是否与样本口径和底表等级一致',
  ],
  credit: [
    '申请额度、政策目标值、测算值和最终授信建议值是否一致可解释',
    '四类授信口径的分组说明是否自洽',
    '制度执行口径是否与本年说明保持一致',
    'OA 摘要与正文结论是否一致',
  ],
};

function getSessionPath(docType: ReviewDocumentType) {
  return path.join(AI_REVIEW_CACHE_ROOT, `${docType}.json`);
}

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

async function readTextFile(filePath: string) {
  return fs.readFile(filePath, 'utf8');
}

async function extractDocText(filePath: string) {
  const { stdout } = await execFileAsync('textutil', ['-convert', 'txt', '-stdout', filePath], {
    timeout: 120_000,
    env: process.env,
    maxBuffer: 20 * 1024 * 1024,
  });

  const text = stdout.trim();
  if (!text) {
    throw new Error(`无法从文档中提取文本：${filePath}`);
  }
  return text;
}

function formatTimestamp(value?: string | null) {
  if (!value) return '未生成';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Shanghai',
  }).format(date);
}

function buildCounts(review: ReviewResult | null) {
  if (!review) {
    return { errors: 0, warnings: 0, low: 0 };
  }

  const allItems = [...review.issues, ...review.risks];
  return {
    errors: allItems.filter((item) => item.severity === 'high').length,
    warnings: allItems.filter((item) => item.severity === 'medium').length,
    low: allItems.filter((item) => item.severity === 'low').length,
  };
}

async function readSession(docType: ReviewDocumentType): Promise<PersistedSession> {
  try {
    const raw = await fs.readFile(getSessionPath(docType), 'utf8');
    return persistedSessionSchema.parse(JSON.parse(raw));
  } catch {
    return {
      docType,
      review: null,
      experience: [],
      conversation: [],
      reviewRounds: [],
      lastAddedExperienceIds: [],
      submittedAt: null,
      lastUpdatedAt: new Date(0).toISOString(),
    };
  }
}

async function writeSession(session: PersistedSession) {
  await ensureDir(AI_REVIEW_CACHE_ROOT);
  await fs.writeFile(getSessionPath(session.docType), JSON.stringify(session, null, 2), 'utf8');
}

async function buildCompensationContext() {
  const [analysis, generated] = await Promise.all([
    getCaseAnalysis('baoji-sanjiacun'),
    getGeneratedCompensationReport(),
  ]);
  const draftBody = generated?.rawText ?? `${analysis.drafts.approval.title}\n\n${analysis.drafts.approval.body}`;
  const references: ReviewReference[] = [
    { id: 'approval-draft', title: '代偿补偿审批表草稿', kind: 'draft', note: '当前待复核正文' },
    { id: 'worksheet', title: '合规性自查工作底稿', kind: 'reference', note: analysis.drafts.worksheet.title },
    { id: 'case-rules', title: '规则核验结果', kind: 'reference', note: `已生成 ${analysis.rules.length} 条规则结果` },
    { id: 'oa', title: 'OA 审批单草稿', kind: 'reference', note: analysis.drafts.oa.title },
  ];

  return {
    draftTitle: generated?.structured.header.title ?? analysis.drafts.approval.title,
    draftBody,
    draftUpdatedAt: formatTimestamp(generated?.generatedAt),
    summary: `当前案件为 ${analysis.summary.company}，核心口径包括补偿金额 ${analysis.summary.compensationAmount}、责任比例 ${analysis.keyFacts.reGuaranteeRatio}，共 ${analysis.materials.length} 项材料匹配结果。`,
    references,
  };
}

async function buildBriefContext() {
  const raw = await readTextFile(BRIEF_TABLES_PATH);
  const data = JSON.parse(raw) as {
    metadata?: { title?: string; lastUpdated?: string };
    tables?: Array<{ name?: string; category?: string; data?: Array<Record<string, string>> }>;
  };
  const tables = data.tables ?? [];
  const lines = tables.slice(0, 5).map((table) => {
    const firstRow = table.data?.[0] ? JSON.stringify(table.data[0]) : '暂无行数据';
    return `${table.name ?? '未命名表'}（${table.category ?? '未分类'}）：${firstRow}`;
  });
  const draftBody = [
    data.metadata?.title ?? '业务一部担保业务简报',
    '',
    '本简报基于 12 张业务表格生成，以下为核心摘要：',
    ...lines,
  ].join('\n');

  const references: ReviewReference[] = [
    { id: 'brief-json', title: '业务表格数据', kind: 'reference', note: `已加载 ${tables.length} 张表格` },
    { id: 'brief-template', title: '简报模板', kind: 'sample', note: 'GuaranteeBusinessTemplate.docx' },
    { id: 'placeholder-map', title: '占位符映射', kind: 'reference', note: 'placeholder-mapping.json' },
  ];

  return {
    draftTitle: data.metadata?.title ?? '业务一部担保业务简报',
    draftBody,
    draftUpdatedAt: data.metadata?.lastUpdated ?? '2026-03-31',
    summary: `简报基于 ${tables.length} 张业务表格自动拼装，适合复核趋势判断、摘要口径与表格支撑是否一致。`,
    references,
  };
}

async function buildEvaluationContext() {
  const [data, evalText] = await Promise.all([getCreditReportData(), extractDocText(CREDIT_EVAL_DOC)]);
  const draftBody = [
    `机构名称：${data.evaluationSample.institution}`,
    `法定代表人：${data.evaluationSample.legalRep}`,
    '',
    data.evaluationSample.summary,
    '',
    `评价结论：${data.evaluationSample.conclusion}`,
  ].join('\n');

  const references: ReviewReference[] = [
    { id: 'evaluation-sample', title: '机构评价报告样稿', kind: 'draft', note: '季度机构评价文档' },
    { id: 'evaluation-bottom', title: '评价摘要提取', kind: 'reference', note: '从样稿中抽取主要分析段' },
    { id: 'credit-sheet', title: '授信统计表', kind: 'reference', note: '含机构评价和评价系数列' },
  ];

  return {
    draftTitle: `${data.evaluationSample.institution}机构评价报告`,
    draftBody: `${draftBody}\n\n原文摘录：\n${evalText.slice(0, 1800)}`,
    draftUpdatedAt: '2026-03-31',
    summary: `机构评价报告当前使用样稿与统计表口径，结论为“${data.evaluationSample.conclusion}”，适合复核未达标指标和整改建议。`,
    references,
  };
}

async function buildCreditContext() {
  const [data, generated] = await Promise.all([getCreditReportData(), getGeneratedCreditReport()]);
  const reportLines = [
    data.report.title,
    '',
    ...data.report.sections.flatMap((section) => [section.title, ...section.body, '']),
    `附件：${data.report.references.join('；')}`,
  ];
  const draftBody = generated?.rawText ?? reportLines.join('\n');

  const references: ReviewReference[] = [
    { id: 'credit-draft', title: '授信报告正文', kind: 'draft', note: data.report.reportNo },
    { id: 'credit-policy', title: '授信管理办法', kind: 'policy', note: '制度口径与审批要求' },
    { id: 'credit-stats', title: '授信统计表', kind: 'reference', note: `${data.stats.institutionCount} 家机构统计口径` },
    { id: 'oa-preview', title: 'OA 摘要', kind: 'reference', note: data.oaPreview.summary },
  ];

  return {
    draftTitle: data.report.title,
    draftBody,
    draftUpdatedAt: formatTimestamp(generated?.generatedAt) || data.report.createdAt,
    summary: `授信报告覆盖 ${data.stats.institutionCount} 家机构，拟授信总额 ${data.stats.grantedTotal.toFixed(1)} 亿元，当前按四类授信口径组织正文。`,
    references,
  };
}

async function buildDocumentContext(docType: ReviewDocumentType) {
  if (docType === 'compensation') return buildCompensationContext();
  if (docType === 'brief') return buildBriefContext();
  if (docType === 'evaluation') return buildEvaluationContext();
  return buildCreditContext();
}

export async function getAiReviewContext(docType: ReviewDocumentType): Promise<AiReviewContext> {
  const [session, currentContext] = await Promise.all([readSession(docType), buildDocumentContext(docType)]);
  const documents = await Promise.all(
    REVIEW_DOCUMENT_TYPES.map(async (type) => {
      const [context, docSession] = await Promise.all([
        type === docType ? currentContext : buildDocumentContext(type),
        readSession(type),
      ]);
      return {
        ...DOCUMENT_META[type],
        label: context.draftTitle || DOCUMENT_META[type].label,
        summary: context.summary,
        reviewStatus: docSession.review?.status ?? '待复核',
        lastReviewedAt: docSession.review ? formatTimestamp(docSession.lastUpdatedAt) : null,
      };
    }),
  );

  return {
    current: documents.find((item) => item.type === docType) ?? documents[0],
    documents,
    roleLabel: '综合复核岗',
    modeLabel: DOCUMENT_META[docType].modeLabel,
    status: session.review?.status ?? '待复核',
    draftTitle: currentContext.draftTitle,
    draftBody: currentContext.draftBody,
    draftUpdatedAt: currentContext.draftUpdatedAt,
    summary: currentContext.summary,
    references: currentContext.references,
    presetPoints: PRESET_POINTS[docType],
    learnedExperience: session.experience,
    latestAddedExperience: session.experience.filter((item) => session.lastAddedExperienceIds.includes(item.id)),
    latestReview: session.review,
    conversation: session.conversation,
    reviewRounds: session.reviewRounds,
    reviewCounts: buildCounts(session.review),
    submittedAt: session.submittedAt,
  };
}

function normalizeTexts(values: string[]) {
  return [...new Set(values.map((item) => item.trim()).filter(Boolean))];
}

function mergeExperience(existing: ExperienceItem[], additions: string[], createdAt: string) {
  const next = [...existing];
  const added: ExperienceItem[] = [];
  const existingTexts = new Set(existing.map((item) => item.text.trim()));

  for (const text of normalizeTexts(additions)) {
    if (existingTexts.has(text)) continue;
    const item = { id: randomUUID(), text, createdAt };
    next.push(item);
    added.push(item);
    existingTexts.add(text);
  }

  return { next, added };
}

function buildConversationHistory(conversation: ConversationEntry[], reviewRounds: ReviewRound[]) {
  return conversation.slice(-8).map((entry) => {
    if (entry.kind === 'review') {
      const round = reviewRounds.find((item) => item.id === entry.roundId);
      return {
        role: 'assistant',
        content: round ? `第 ${round.index} 轮复核：${round.review.summary}` : '一轮结构化复核结果',
      };
    }

    return {
      role: entry.kind === 'user' ? 'user' : 'assistant',
      content: entry.text,
    };
  });
}

async function classifyAiIntent(input: {
  docType: ReviewDocumentType;
  modeLabel: string;
  summary: string;
  draftTitle: string;
  presetPoints: string[];
  learnedExperience: ExperienceItem[];
  conversation: ConversationEntry[];
  reviewRounds: ReviewRound[];
  userMessage: string;
}) {
  return blackwhiteJson(
    intentDecisionSchema,
    [
      {
        role: 'system',
        content: [
          '你是一名国企业务审批前的 AI 综合复核助手。',
          '你的第一任务是判断用户这次输入的真实意图，而不是机械地重生成整份复核结果。',
          'intent 只能取 chat、targeted_review、full_review。',
          'chat：用户是在追问、解释、让你补充说明、讨论某个点，应该短答，不重生成整份结构化复核。',
          'targeted_review：用户让你只针对某一维度再看一遍，也应该短答，不重生成整份结构化复核。',
          'full_review：只有当用户确实希望你重新给出一整份完整复核结果时才选择这个意图。',
          '你还要判断这次输入里是否包含可长期复用、值得沉淀成审核经验的规则，capturedExperiencePoints 可返回 0 到 4 条。',
          '如果用户补充的是稳定的审核口径，例如正式报告的文风、成文规范、语句通顺、公文表达习惯，这类要求通常应沉淀为经验。',
          'reply 必须是对用户当前输入的直接回复；如果 intent 不是 full_review，reply 应简洁、可直接显示在聊天区。',
          '只返回 JSON。',
        ].join('\n'),
      },
      {
        role: 'user',
        content: JSON.stringify(
          {
            current_document: {
              type: input.docType,
              mode: input.modeLabel,
              summary: input.summary,
              draft_title: input.draftTitle,
            },
            preset_points: input.presetPoints,
            learned_experience: input.learnedExperience.map((item) => item.text),
            recent_conversation: buildConversationHistory(input.conversation, input.reviewRounds),
            user_message: input.userMessage,
            constraints: [
              '不要仅凭出现“再看一遍”“再检查”等字样就判定为 full_review，要综合语义判断。',
              '如果用户只是要求补充一个角度、解释一个点、检查某一类问题，优先判为 chat 或 targeted_review。',
              '只有当用户希望获得新的完整结论、问题、建议整套结果时，才判为 full_review。',
              'capturedExperiencePoints 必须是下次可以复用的审核规则，不能是空泛总结。',
              '如果用户补充的是“正式政府报告文风要严谨”“文字要通顺”“表述要符合公文习惯”这类稳定审核要求，应尽量沉淀成经验。',
            ],
          },
          null,
          2,
        ),
      },
    ],
    { temperature: 0.1, timeoutMs: 180_000 },
  );
}

async function generateFullReview(input: {
  docType: ReviewDocumentType;
  context: AiReviewContext;
  conversation: ConversationEntry[];
  reviewRounds: ReviewRound[];
  learnedExperience: ExperienceItem[];
  userMessage: string;
}) {
  return blackwhiteJson(
    generatedReviewSchema,
    [
      {
        role: 'system',
        content: [
          '你是一名国企业务审批前的 AI 综合复核助手。',
          '你只做辅助复核，不做自动审批，也不能把结论伪装成人工审批意见。',
          '你必须严格基于当前报告正文、关联材料、系统预置要点和已沉淀经验，输出结构化复核意见。',
          '问题、风险、建议都要具体，不能写空泛套话。',
          '只返回 JSON，不要输出 markdown 或解释。',
        ].join('\n'),
      },
      {
        role: 'user',
        content: JSON.stringify(
          {
            task: '请对当前报告生成一轮完整的审批前复核意见。',
            current_document: {
              type: input.docType,
              label: input.context.current.label,
              mode: input.context.modeLabel,
              summary: input.context.summary,
              draft_title: input.context.draftTitle,
              draft_body: input.context.draftBody.slice(0, 6000),
            },
            references: input.context.references,
            preset_points: input.context.presetPoints,
            learned_experience: input.learnedExperience.map((item) => item.text),
            recent_conversation: buildConversationHistory(input.conversation, input.reviewRounds),
            user_message: input.userMessage,
            output_schema: {
              status: '待复核 | 已出首版意见 | 已反馈重审 | 可提交 OA',
              conclusion: '可提交 | 建议修改后提交 | 存在明显风险，不建议直接提交',
              summary: 'string',
              issues: [{ title: 'string', severity: 'high|medium|low', focus: '完整性|一致性|合规性|风险性|成文性', description: 'string' }],
              risks: [{ title: 'string', severity: 'high|medium|low', focus: '完整性|一致性|合规性|风险性|成文性', description: 'string' }],
              suggestions: [{ title: 'string', detail: 'string', basis: 'string' }],
              basis: {
                mode: 'string',
                materials: ['string'],
                policies: ['string'],
                experiences: ['string'],
              },
              capturedExperiencePoints: ['string'],
            },
            constraints: [
              'issues 与 risks 至少各输出 1 条。',
              'severity 为 high 的问题必须是真正会影响提交判断的点。',
              'capturedExperiencePoints 只填写可长期复用的审核规则。',
              '每条沉淀经验都要是下次可直接复用的审核动作或核对规则。',
              '不要编造不存在的文件名、制度名、数字或结论。',
            ],
          },
          null,
          2,
        ),
      },
    ],
    { temperature: 0.15, timeoutMs: 180_000 },
  );
}

export async function runAiReview(docType: ReviewDocumentType, userMessage: string, action: 'start' | 'message') {
  const [context, session] = await Promise.all([getAiReviewContext(docType), readSession(docType)]);
  const now = new Date().toISOString();
  const baseSession: PersistedSession = action === 'start'
    ? {
        ...session,
        review: null,
        conversation: [],
        reviewRounds: [],
        lastAddedExperienceIds: [],
      }
    : session;

  if (action === 'start') {
    const review = await generateFullReview({
      docType,
      context,
      conversation: [],
      reviewRounds: [],
      learnedExperience: baseSession.experience,
      userMessage,
    });
    const merged = mergeExperience(baseSession.experience, review.capturedExperiencePoints, now);
    const round: ReviewRound = {
      id: randomUUID(),
      index: 1,
      request: userMessage,
      review,
      createdAt: now,
    };
    const nextSession: PersistedSession = {
      ...baseSession,
      review,
      experience: merged.next,
      reviewRounds: [round],
      conversation: [
        { id: randomUUID(), kind: 'user', text: userMessage, createdAt: now },
        { id: randomUUID(), kind: 'review', roundId: round.id, createdAt: now },
      ] satisfies ConversationEntry[],
      lastAddedExperienceIds: merged.added.map((item) => item.id),
      lastUpdatedAt: now,
    };
    await writeSession(nextSession);
    return {
      kind: 'review' as const,
      intent: 'full_review' as const,
      review,
      round,
      reply: null,
      addedExperience: merged.added,
    };
  }

  const intentResult = await classifyAiIntent({
    docType,
    modeLabel: context.modeLabel,
    summary: context.summary,
    draftTitle: context.draftTitle,
    presetPoints: context.presetPoints,
    learnedExperience: baseSession.experience,
    conversation: baseSession.conversation,
    reviewRounds: baseSession.reviewRounds,
    userMessage,
  });

  const mergedFromIntent = mergeExperience(baseSession.experience, intentResult.capturedExperiencePoints, now);

  if (intentResult.intent === 'full_review') {
    const review = await generateFullReview({
      docType,
      context,
      conversation: baseSession.conversation,
      reviewRounds: baseSession.reviewRounds,
      learnedExperience: mergedFromIntent.next,
      userMessage,
    });
    const merged = mergeExperience(mergedFromIntent.next, review.capturedExperiencePoints, now);
    const round: ReviewRound = {
      id: randomUUID(),
      index: baseSession.reviewRounds.length + 1,
      request: userMessage,
      review,
      createdAt: now,
    };
    const nextSession: PersistedSession = {
      ...baseSession,
      review,
      experience: merged.next,
      reviewRounds: [...baseSession.reviewRounds, round],
      conversation: [
        ...baseSession.conversation,
        { id: randomUUID(), kind: 'user', text: userMessage, createdAt: now },
        { id: randomUUID(), kind: 'review', roundId: round.id, createdAt: now },
      ].slice(-20) as ConversationEntry[],
      lastAddedExperienceIds: merged.added.map((item) => item.id),
      lastUpdatedAt: now,
    };
    await writeSession(nextSession);
    return {
      kind: 'review' as const,
      intent: intentResult.intent,
      review,
      round,
      reply: null,
      addedExperience: merged.added,
    };
  }

  const nextSession: PersistedSession = {
    ...baseSession,
    experience: mergedFromIntent.next,
    conversation: [
      ...baseSession.conversation,
      { id: randomUUID(), kind: 'user', text: userMessage, createdAt: now },
      { id: randomUUID(), kind: 'assistant', text: intentResult.reply, createdAt: now },
    ].slice(-20) as ConversationEntry[],
    lastAddedExperienceIds: mergedFromIntent.added.map((item) => item.id),
    lastUpdatedAt: now,
  };
  await writeSession(nextSession);

  return {
    kind: 'chat' as const,
    intent: intentResult.intent,
    review: null,
    round: null,
    reply: intentResult.reply,
    addedExperience: mergedFromIntent.added,
  };
}

export async function submitAiReview(docType: ReviewDocumentType, note?: string) {
  const session = await readSession(docType);
  if (!session.review) {
    throw new Error('当前报告尚未生成复核意见，不能提交 OA。');
  }

  const currentReview = session.review;
  const now = new Date().toISOString();
  const updated: PersistedSession = {
    ...session,
    submittedAt: now,
    lastUpdatedAt: now,
    review: {
      ...currentReview,
      status: '可提交 OA',
    },
    conversation: note
      ? ([...session.conversation, { id: randomUUID(), kind: 'assistant' as const, text: `提交备注：${note}`, createdAt: now }].slice(-20) as ConversationEntry[])
      : session.conversation,
  };

  await writeSession(updated);
  return {
    submittedAt: now,
    flow: ['综合复核岗确认', '业务负责人确认', '提交 OA'],
    memo: note?.trim() || currentReview.summary,
  };
}

export async function deleteAiReviewExperience(docType: ReviewDocumentType, id: string) {
  const session = await readSession(docType);
  const nextExperience = session.experience.filter((item) => item.id !== id);
  if (nextExperience.length === session.experience.length) {
    throw new Error('要删除的沉淀经验不存在。');
  }

  const updated: PersistedSession = {
    ...session,
    experience: nextExperience,
    lastAddedExperienceIds: session.lastAddedExperienceIds.filter((itemId) => itemId !== id),
    lastUpdatedAt: new Date().toISOString(),
  };
  await writeSession(updated);

  return {
    success: true,
    deletedId: id,
  };
}
