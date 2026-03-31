import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import * as XLSX from 'xlsx';
import { z } from 'zod';
import { getDemoCacheRoot, getWorkspaceRoot } from '@/lib/server/runtime-root';
import { getCreditOverrides } from '@/lib/server/credit-overrides';

const execFileAsync = promisify(execFile);

const WORKSPACE_ROOT = getWorkspaceRoot();
const CREDIT_DOC_DIR = path.join(WORKSPACE_ROOT, 'docs', '授信及评价');
const CREDIT_REPORT_DOC = path.join(CREDIT_DOC_DIR, '副本关于2025年度合作担保机构再担保业务授信的报告(1).docx');
const CREDIT_POLICY_PDF = path.join(CREDIT_DOC_DIR, '陕西省信用再担保有限责任公司再担保业务授信管理办法.pdf');
const CREDIT_EVAL_DOC = path.join(CREDIT_DOC_DIR, '副本14.机构评价报告-业务一部-季度.doc');
const CREDIT_SPREADSHEET = path.join(CREDIT_DOC_DIR, '副本2025年合作担保机构授信情况统计表.xlsx');
const CREDIT_CACHE_ROOT = path.join(getDemoCacheRoot(), 'credit-report');
const CREDIT_CACHE_VERSION = '2026-03-31-credit-report-v1';

const spreadsheetInstitutionSchema = z.object({
  id: z.string(),
  name: z.string(),
  shortName: z.string(),
  regionLevel: z.enum(['省级', '市级', '县区']),
  rating: z.string(),
  factor: z.number(),
  growthRate: z.number(),
  scale2024: z.number(),
  totalCredit: z.number(),
  soeCredit: z.number(),
  nonRiskCredit: z.number(),
  riskCredit: z.number(),
  leverage: z.union([z.number(), z.string()]),
  leverageFactor: z.number(),
  filingRate: z.number(),
  filingFactor: z.number(),
  riskShareRatio: z.number(),
  riskShareFactor: z.number(),
  inclusiveRatio: z.number(),
  inclusiveFactor: z.number(),
  compensationRate: z.union([z.number(), z.string()]),
  compensationFactor: z.number(),
  recoveryRate: z.union([z.number(), z.string()]),
  recoveryFactor: z.number(),
  policyScore: z.number(),
  policyFactor: z.number(),
  groupKey: z.enum(['application', 'policy_target', 'measured', 'new_org']),
});

type SpreadsheetInstitution = z.infer<typeof spreadsheetInstitutionSchema>;

export type CreditPolicyTopicKey =
  | 'credit_formula'
  | 'eight_metrics'
  | 'rating_factor'
  | 'risk_split'
  | 'submission_materials'
  | 'approval_workflow'
  | 'credit_strategy';

export type CreditGroupKey = SpreadsheetInstitution['groupKey'];

export type CreditReportData = {
  availableYears: number[];
  stats: {
    institutionCount: number;
    applicationTotal: number;
    grantedTotal: number;
    riskCreditTotal: number;
    nonRiskCreditTotal: number;
    soeCreditTotal: number;
  };
  institutions: Array<
    SpreadsheetInstitution & {
      displayLabel: string;
      remark: string;
    }
  >;
  groups: Array<{
    key: CreditGroupKey;
    title: string;
    count: number;
    totalCredit: number;
    summary: string;
    decisionBasis: string;
    members: Array<SpreadsheetInstitution & { displayLabel: string; remark: string }>;
    policyTopic: CreditPolicyTopicKey;
  }>;
  summary: {
    oneLiner: string;
    highlights: string[];
    executionNotes: string[];
  };
  pendingItems: Array<{
    id: string;
    title: string;
    description: string;
    impact: string;
    checked: boolean;
    remark: string;
  }>;
  policyTopics: Record<
    CreditPolicyTopicKey,
    {
      title: string;
      clauseTitle: string;
      clauseExcerpt: string;
      executionTitle: string;
      executionExcerpt: string;
      columnTitle: string;
      relatedColumns: string[];
    }
  >;
  report: {
    title: string;
    reportNo: string;
    createdAt: string;
    department: string;
    sections: Array<{
      title: string;
      body: string[];
    }>;
    adoptedCriteria: string[];
    references: string[];
  };
  evaluationSample: {
    institution: string;
    legalRep: string;
    summary: string;
    conclusion: string;
  };
  oaPreview: {
    flow: string[];
    summary: string;
  };
};

const GROUP_META: Record<
  CreditGroupKey,
  {
    title: string;
    summary: string;
    decisionBasis: string;
    members: string[];
    totalCredit: number;
    policyTopic: CreditPolicyTopicKey;
  }
> = {
  application: {
    title: '按申请额度配置',
    summary: '测算额度高于年度政策目标值，且截至 4 月底目标完成率超过时间节点要求，同时申请额度不低于年度政策目标值。',
    decisionBasis: '对 12 家机构沿用“申请额度”口径，合计 165.7 亿元。',
    members: [
      '西安小微企业融资担保有限公司',
      '铜川财创融资担保集团有限公司',
      '榆林市中小企业融资担保有限责任公司',
      '西安浐灞融资担保有限公司',
      '澄城县华冠融资担保有限公司',
      '靖边县中小企业融资担保有限责任公司',
      '大荔县启成融资担保有限责任公司',
      '白水县裕昆融资担保有限公司',
      '蒲城县金财融资担保有限公司',
      '商洛市商州区兴商融资担保有限公司',
      '吴堡县政信融资担保有限责任公司',
      '绥德县融资担保有限责任公司',
    ],
    totalCredit: 165.7,
    policyTopic: 'credit_strategy',
  },
  policy_target: {
    title: '按政策目标值配置',
    summary: '对 21 家机构按政策目标值配置，其中 14 家测算额度高于政策目标值但进度未达标，7 家测算额度低于政策目标值但进度已达标。',
    decisionBasis: '该类机构合计授信 233.1 亿元，是本年授信的主配置口径。',
    members: [
      '西安投融资担保有限公司',
      '宝鸡市中小企业融资担保有限公司',
      '安康市财信融资担保有限公司',
      '杨凌农科融资担保有限公司',
      '西安航天基地融资担保有限公司',
      '西安曲江文化产业融资担保有限公司',
      '黄陵县中小企业融资担保有限责任公司',
      '吴起县中小企业融资担保有限责任公司',
      '安塞金诚融资担保有限责任公司',
      '陕西榆正融资担保有限公司',
      '清涧县财信融资担保有限责任公司',
      '神木市融资担保集团有限公司',
      '子洲县起航融资担保有限责任公司',
      '米脂县中小企业融资担保有限责任公司',
      '咸阳市融资担保股份有限公司',
      '汉中市资信融资担保有限公司',
      '延安市中小企业融资担保有限责任公司',
      '西安财金融资担保有限公司',
      '西咸新区融资担保有限公司',
      '陕西长安融资担保股份有限公司',
      '佳县中小企业融资担保有限责任公司',
    ],
    totalCredit: 233.1,
    policyTopic: 'credit_strategy',
  },
  measured: {
    title: '按测算值配置',
    summary: '测算额度低于年度政策目标值，且截至 4 月底目标完成率未达到时间节点要求。',
    decisionBasis: '对 7 家机构直接采用测算值配置，合计 47.5 亿元。',
    members: [
      '陕西文化产业融资担保有限公司',
      '渭南市公信融资担保有限公司',
      '商洛市融资担保有限公司',
      '西安创新融资担保有限公司',
      '西安市高陵区三阳融资担保有限公司',
      '西安沣东融资担保有限公司',
      '子长市中小企业融资担保有限责任公司',
    ],
    totalCredit: 47.5,
    policyTopic: 'credit_formula',
  },
  new_org: {
    title: '新机构按政策目标值配置',
    summary: '2024 年 11 月新加入体系，缺少上年度合作业务数据，单独按政策目标值配置。',
    decisionBasis: '循环担保按新机构口径单列授信 5.0 亿元。',
    members: ['陕西循环发展融资担保有限公司'],
    totalCredit: 5.0,
    policyTopic: 'credit_strategy',
  },
};

const SHORT_NAME_MAP: Record<string, string> = {
  '陕西循环发展融资担保有限公司': '循环担保',
  '陕西文化产业融资担保有限公司': '陕文化担保',
  '西安投融资担保有限公司': '西投保',
  '西安小微企业融资担保有限公司': '西安小微担保',
  '铜川财创融资担保集团有限公司': '铜川担保',
  '宝鸡市中小企业融资担保有限公司': '宝鸡担保',
  '咸阳市融资担保股份有限公司': '咸阳担保',
  '渭南市公信融资担保有限公司': '渭南担保',
  '汉中市资信融资担保有限公司': '汉中担保',
  '安康市财信融资担保有限公司': '安康担保',
  '商洛市融资担保有限公司': '商洛担保',
  '延安市中小企业融资担保有限责任公司': '延安担保',
  '榆林市中小企业融资担保有限责任公司': '榆林担保',
  '杨凌农科融资担保有限公司': '杨凌担保',
  '西安财金融资担保有限公司': '财金担保',
  '西安创新融资担保有限公司': '创新担保',
  '西安航天基地融资担保有限公司': '航天担保',
  '西安曲江文化产业融资担保有限公司': '曲江担保',
  '西安市高陵区三阳融资担保有限公司': '高陵担保',
  '西咸新区融资担保有限公司': '西咸担保',
  '西安沣东融资担保有限公司': '沣东担保',
  '西安浐灞融资担保有限公司': '浐灞担保',
  '陕西长安融资担保股份有限公司': '长安担保',
  '大荔县启成融资担保有限责任公司': '大荔担保',
  '澄城县华冠融资担保有限公司': '澄城担保',
  '白水县裕昆融资担保有限公司': '白水担保',
  '蒲城县金财融资担保有限公司': '蒲城担保',
  '商洛市商州区兴商融资担保有限公司': '兴商担保',
  '黄陵县中小企业融资担保有限责任公司': '黄陵担保',
  '吴起县中小企业融资担保有限责任公司': '吴起担保',
  '安塞金诚融资担保有限责任公司': '安塞担保',
  '子长市中小企业融资担保有限责任公司': '子长担保',
  '陕西榆正融资担保有限公司': '榆正担保',
  '清涧县财信融资担保有限责任公司': '清涧担保',
  '神木市融资担保集团有限公司': '神木担保',
  '佳县中小企业融资担保有限责任公司': '佳县担保',
  '吴堡县政信融资担保有限责任公司': '吴堡担保',
  '靖边县中小企业融资担保有限责任公司': '靖边担保',
  '绥德县融资担保有限责任公司': '绥德担保',
  '子洲县起航融资担保有限责任公司': '子洲担保',
  '米脂县中小企业融资担保有限责任公司': '米脂担保',
};

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

async function writeAtomically(filePath: string, payload: unknown) {
  const tempPath = `${filePath}.tmp`;
  await fs.writeFile(tempPath, JSON.stringify(payload, null, 2), 'utf8');
  await fs.rename(tempPath, filePath);
}

function hash(input: string) {
  return createHash('sha1').update(input).digest('hex');
}

async function extractDocText(filePath: string, cacheName: string) {
  await ensureDir(CREDIT_CACHE_ROOT);
  const cachePath = path.join(CREDIT_CACHE_ROOT, `${cacheName}.txt`);
  try {
    return await fs.readFile(cachePath, 'utf8');
  } catch {}

  const { stdout } = await execFileAsync('textutil', ['-convert', 'txt', '-stdout', filePath], {
    timeout: 120_000,
    env: process.env,
    maxBuffer: 20 * 1024 * 1024,
  });
  await fs.writeFile(cachePath, stdout, 'utf8');
  return stdout;
}

async function extractPolicyText() {
  await ensureDir(CREDIT_CACHE_ROOT);
  const cachePath = path.join(CREDIT_CACHE_ROOT, 'policy-ocr.json');
  try {
    const raw = await fs.readFile(cachePath, 'utf8');
    const parsed = JSON.parse(raw) as { pageCount: number; pages: Array<{ page: number; text: string }> };
    return parsed.pages.map((page) => page.text).join('\n\n');
  } catch {}

  const scriptPath = path.join(WORKSPACE_ROOT, 'scripts', 'pdf_vision_ocr.swift');
  const { stdout } = await execFileAsync('swift', [scriptPath, CREDIT_POLICY_PDF], {
    timeout: 600_000,
    env: process.env,
    maxBuffer: 50 * 1024 * 1024,
  });
  await fs.writeFile(cachePath, stdout, 'utf8');
  const parsed = JSON.parse(stdout) as { pageCount: number; pages: Array<{ page: number; text: string }> };
  return parsed.pages.map((page) => page.text).join('\n\n');
}

function normalizeRegionLevel(name: string): SpreadsheetInstitution['regionLevel'] {
  if (name.startsWith('陕西循环') || name.startsWith('陕西文化')) return '省级';
  if (name.includes('市') && !name.includes('县') && !name.includes('区')) return '市级';
  return '县区';
}

function detectGroup(name: string): CreditGroupKey {
  for (const [groupKey, meta] of Object.entries(GROUP_META) as Array<[CreditGroupKey, (typeof GROUP_META)[CreditGroupKey]]>) {
    if (meta.members.includes(name)) return groupKey;
  }
  throw new Error(`未找到机构分组：${name}`);
}

function toNumber(value: unknown) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim()) {
    const normalized = Number(value);
    return Number.isNaN(normalized) ? 0 : normalized;
  }
  return 0;
}

function formatYi(value: number, digits = 1) {
  return `${value.toFixed(digits)} 亿元`;
}

function formatPercent(value: number, digits = 2) {
  return `${(value * 100).toFixed(digits)}%`;
}

function extractSnippet(text: string, anchor: string, length = 280) {
  const index = text.indexOf(anchor);
  if (index < 0) return text.slice(0, length);
  return text.slice(Math.max(0, index - 80), index + length).replace(/\s+/g, ' ').trim();
}

async function buildInstitutions() {
  const workbookBuffer = await fs.readFile(CREDIT_SPREADSHEET);
  const workbook = XLSX.read(workbookBuffer, { type: 'buffer' });
  const rows = XLSX.utils.sheet_to_json<Array<string | number | null>>(workbook.Sheets[workbook.SheetNames[0]], {
    header: 1,
    defval: null,
  });
  const dataRows = rows.slice(5).filter((row) => typeof row[0] === 'number');

  return dataRows.map((row) =>
    spreadsheetInstitutionSchema.parse({
      id: `credit-${String(row[0]).padStart(2, '0')}`,
      name: String(row[1]),
      shortName: SHORT_NAME_MAP[String(row[1])] ?? String(row[1]).replace(/(融资担保股份有限公司|融资担保集团有限公司|融资担保有限责任公司|融资担保有限公司|中小企业融资担保有限责任公司)$/u, ''),
      regionLevel: normalizeRegionLevel(String(row[1])),
      scale2024: toNumber(row[2]),
      leverage: row[3] ?? 0,
      leverageFactor: toNumber(row[4]),
      filingRate: toNumber(row[5]),
      filingFactor: toNumber(row[6]),
      riskShareRatio: toNumber(row[7]),
      riskShareFactor: toNumber(row[8]),
      inclusiveRatio: toNumber(row[9]),
      inclusiveFactor: toNumber(row[10]),
      compensationRate: row[11] ?? 0,
      compensationFactor: toNumber(row[12]),
      recoveryRate: row[13] ?? 0,
      recoveryFactor: toNumber(row[14]),
      policyScore: toNumber(row[15]),
      policyFactor: toNumber(row[16]),
      rating: String(row[17] ?? ''),
      factor: toNumber(row[19]),
      growthRate: toNumber(row[20]),
      totalCredit: toNumber(row[21]),
      soeCredit: toNumber(row[22]),
      nonRiskCredit: toNumber(row[23]),
      riskCredit: toNumber(row[24]),
      groupKey: detectGroup(String(row[1])),
    }),
  );
}

function parseReportMetrics(reportText: string) {
  const applicationTotal = Number(reportText.match(/申请([0-9.]+)亿元授信规模/u)?.[1] ?? '489.3');
  const grantedTotal = Number(reportText.match(/最终授予授信额度([0-9.]+)亿元/u)?.[1] ?? '451.3');
  const riskCreditTotal = Number(reportText.match(/银担分险业务额度([0-9.]+)亿元/u)?.[1] ?? '375.6');
  const nonRiskCreditTotal = Number(reportText.match(/非银担分险业务额度([0-9.]+)亿元/u)?.[1] ?? '75.7');
  const soeCreditTotal = Number(reportText.match(/国有企业担保贷款授信额度([0-9.]+)亿元/u)?.[1] ?? '2.13');

  return {
    applicationTotal,
    grantedTotal,
    riskCreditTotal,
    nonRiskCreditTotal,
    soeCreditTotal,
  };
}

function buildPolicyTopics(policyText: string, reportText: string): CreditReportData['policyTopics'] {
  return {
    credit_formula: {
      title: '授信额度',
      clauseTitle: '制度条文',
      clauseExcerpt: extractSnippet(policyText, '担保机构授信额度=上年度再担保规模X（1+本年度再担保增长率）×额度系数。'),
      executionTitle: '本年执行口径',
      executionExcerpt: '2025 年授信不只看公式结果，还结合年度目标、时间节点完成率及申请额度形成四类配置结论。',
      columnTitle: '对应表列',
      relatedColumns: ['2024年度备案规模', '额度系数', '再担保增长率', '2025年总授信额度'],
    },
    eight_metrics: {
      title: '8 项指标',
      clauseTitle: '制度条文',
      clauseExcerpt: extractSnippet(policyText, '等8项指标，按照各指标评价结果，通过加权计算得出。'),
      executionTitle: '本年执行口径',
      executionExcerpt: '本年仍以 8 项指标形成额度系数，但最终授信结论要结合任务完成时点进行分类解释。',
      columnTitle: '对应表列',
      relatedColumns: ['担保放大倍数', '业务备案率', '分险业务占比', '支小支农占比', '担保代偿率', '代偿返还率', '政策目标完成', '机构评价'],
    },
    rating_factor: {
      title: '评级 A/B/C 换算',
      clauseTitle: '制度条文',
      clauseExcerpt: extractSnippet(policyText, '评级系数×5%'),
      executionTitle: '本年执行口径',
      executionExcerpt: '当前统计表已把机构评价与评价系数写入“机构评价 / 评价系数”两列，报告使用的是该列现成结果。',
      columnTitle: '对应表列',
      relatedColumns: ['机构评价', '评价系数', '额度系数'],
    },
    risk_split: {
      title: '非分险和分险额度',
      clauseTitle: '制度条文',
      clauseExcerpt: extractSnippet(policyText, '担保机构非银担分险业务额度按照本年度再担保合作政策确定。银担分险业务额度为担保机构授信额度减去非银担分险业务额度。'),
      executionTitle: '本年执行口径',
      executionExcerpt: extractSnippet(reportText, '本年合作担保机构非银担分险业务额度在2024年非银担分险业务备案规模基础上压降10%予以确定'),
      columnTitle: '对应表列',
      relatedColumns: ['2025年非分险额度', '2025年分险额度', '其中：国企额度'],
    },
    submission_materials: {
      title: '授信资料',
      clauseTitle: '制度条文',
      clauseExcerpt: extractSnippet(policyText, '担保机构在收到通知后，应当按时向省再担保公司报送相关基础资料，资料包括：'),
      executionTitle: '本年执行口径',
      executionExcerpt: '本次 demo 直接以统计表、授信管理办法和历史样稿作为核心输入，模拟业务一部完成授信成文。',
      columnTitle: '对应表列',
      relatedColumns: ['授信申请', '审计报告', '经营变化情况说明'],
    },
    approval_workflow: {
      title: '授信审批',
      clauseTitle: '制度条文',
      clauseExcerpt: extractSnippet(policyText, '业务A角负主要授信责任，撰写授信报告，业务B角协同出具明确的初评意见'),
      executionTitle: '本年执行口径',
      executionExcerpt: '业务一部先形成授信结论与报告草稿，再经风控法务合规审核、总经理办公会审议后最终确定额度。',
      columnTitle: '对应表列',
      relatedColumns: ['A/B 角分工', '风控法务部独立审核', '总经理办公会'],
    },
    credit_strategy: {
      title: '为什么不是都按测算值授信',
      clauseTitle: '制度条文',
      clauseExcerpt: '制度规定授信额度要综合考虑业务发展、政策目标、风险管理和机构评级因素，体现差异化管理与合理核定。',
      executionTitle: '本年执行口径',
      executionExcerpt: extractSnippet(reportText, '本年授信额度基于合作担保机构上年实际备案业务规模、年度合作政策目标值及当年全省体系建设重点工作内容进行测算'),
      columnTitle: '对应表列',
      relatedColumns: ['2025年总授信额度', '政策目标完成', '额度系数', '再担保增长率'],
    },
  };
}

function buildEvaluationSample(evalText: string): CreditReportData['evaluationSample'] {
  return {
    institution: evalText.match(/机构名称\s+([^\n]+)/u)?.[1]?.trim() ?? '西安小微企业融资担保有限公司',
    legalRep: evalText.match(/法定代表人\s+([^\n]+)/u)?.[1]?.trim() ?? '杨建凯',
    summary: extractSnippet(evalText, '从西安小微担保1-4月主要合作政策目标完成进度分析', 260),
    conclusion: evalText.match(/本次建议评定为“([^”]+)”类/u)?.[1] ?? '正常',
  };
}

function buildPendingItems(overrides: Awaited<ReturnType<typeof getCreditOverrides>>): CreditReportData['pendingItems'] {
  const items = [
    {
      id: 'new-org-rule',
      title: '循环担保是否按新机构处理',
      description: '循环担保 2024 年 11 月新加入体系，报告样稿建议按政策目标值单列授信 5 亿元。',
      impact: '影响新机构类口径说明和报告摘要表述。',
    },
    {
      id: 'label-alignment',
      title: '个别机构分组是否沿用样稿口径',
      description: '政策目标值类合并了两种业务情形，需确认本年仍按样稿统一归类展示。',
      impact: '影响 AI 归纳页的分组标题与报告成文口径。',
    },
    {
      id: 'non-risk-policy',
      title: '非分险压降 10% 口径是否沿用',
      description: '制度写法为“按本年度合作政策确定”，2025 年样稿采用“在 2024 年基础上压降 10%”的执行口径。',
      impact: '影响产品分项额度段落和制度助手提示。',
    },
    {
      id: 'soe-policy',
      title: '国企额度口径是否沿用',
      description: '样稿按 2023 年国企担保贷款业务规模的 40% 配置 2.13 亿元国企额度。',
      impact: '影响产品额度建议和 OA 摘要。',
    },
  ];

  return items.map((item) => ({
    ...item,
    checked: overrides.pendingItems[item.id]?.checked ?? false,
    remark: overrides.pendingItems[item.id]?.remark ?? '',
  }));
}

function buildReport(data: {
  metrics: ReturnType<typeof parseReportMetrics>;
  institutions: Array<SpreadsheetInstitution & { displayLabel: string; remark: string }>;
  overrides: Awaited<ReturnType<typeof getCreditOverrides>>;
}): CreditReportData['report'] {
  const { metrics, overrides } = data;
  const adoptedCriteria = [
    '本年授信以年度目标导向为主，结合申请额度和时间节点完成率形成四类配置结论。',
    '非银担分险额度继续按 2024 年备案规模压降 10% 的年度执行口径处理。',
    '国企担保贷款额度继续按 2023 年相关业务规模的 40% 配置。',
    ...Object.entries(overrides.groupLabels)
      .filter(([, value]) => value)
      .map(([key, value]) => `${GROUP_META[key as CreditGroupKey].title}：已人工确认展示标签为“${value}”。`),
    ...Object.entries(overrides.groupRemarks)
      .filter(([, value]) => value.trim())
      .map(([key, value]) => `${GROUP_META[key as CreditGroupKey].title}备注：${value.trim()}`),
  ];

  return {
    title: '关于 2025 年度合作担保机构再担保业务授信的报告',
    reportNo: 'SXZG-2025-089',
    createdAt: '2025年5月22日',
    department: '业务一部',
    sections: [
      {
        title: '一、综合授信情况',
        body: [
          `2025 年度 41 家合作担保机构共申请 ${metrics.applicationTotal.toFixed(1)} 亿元授信规模，经审核拟授予授信额度 ${metrics.grantedTotal.toFixed(1)} 亿元。`,
          '本年授信基于合作担保机构上年实际备案业务规模、年度合作政策目标值及当年全省体系建设重点工作内容进行测算，并综合考虑申请额度与时间节点完成率后进行分类配置。',
          '最终形成“按申请额度配置、按政策目标值配置、按测算值配置、新机构按政策目标值配置”四类授信结论。',
        ],
      },
      {
        title: '二、产品分项额度设定',
        body: [
          `本次拟为 41 家担保机构配置总授信额度 ${metrics.grantedTotal.toFixed(1)} 亿元，其中银担分险业务额度 ${metrics.riskCreditTotal.toFixed(1)} 亿元，非银担分险业务额度 ${metrics.nonRiskCreditTotal.toFixed(1)} 亿元。`,
          `同时，给予 14 家开展国有企业担保贷款业务的担保机构国企担保贷款额度 ${metrics.soeCreditTotal.toFixed(2)} 亿元，包含于各自总授信额度之中。`,
          '非银担分险业务额度继续按 2024 年备案规模压降 10% 的年度执行口径处理，银担分险额度由总授信额度扣除非分险额度后确定。',
        ],
      },
      {
        title: '三、授信额度运用',
        body: [
          '建议公司审定授信结论后，及时将授信额度与国担数字化平台相关模块进行关联，确保授信管理落实落细。',
          '业务一部将结合年度合作担保机构评价等次及授信使用情况进行动态监控，对额度使用和风险变化开展跟踪复核。',
        ],
      },
    ],
    adoptedCriteria,
    references: [
      '输入 1：2025 年合作担保机构授信情况统计表',
      '输入 2：陕西省信用再担保有限责任公司再担保业务授信管理办法',
      '输入 3：2025 年度合作担保机构再担保业务授信报告样稿',
    ],
  };
}

async function buildCreditReportData() {
  const [reportText, policyText, evalText, overrides] = await Promise.all([
    extractDocText(CREDIT_REPORT_DOC, 'report-sample'),
    extractPolicyText(),
    extractDocText(CREDIT_EVAL_DOC, 'evaluation-sample'),
    getCreditOverrides(),
  ]);

  const metrics = parseReportMetrics(reportText);
  const institutions = (await buildInstitutions()).map((institution) => ({
    ...institution,
    displayLabel: overrides.groupLabels[institution.groupKey] ?? GROUP_META[institution.groupKey].title,
    remark: overrides.groupRemarks[institution.groupKey] ?? '',
  }));

  const groups = (Object.entries(GROUP_META) as Array<[CreditGroupKey, (typeof GROUP_META)[CreditGroupKey]]>).map(([key, meta]) => {
    const members = institutions.filter((institution) => institution.groupKey === key);
    return {
      key,
      title: overrides.groupLabels[key] ?? meta.title,
      count: members.length,
      totalCredit: meta.totalCredit,
      summary: meta.summary,
      decisionBasis: meta.decisionBasis,
      members,
      policyTopic: meta.policyTopic,
    };
  });

  const pendingItems = buildPendingItems(overrides);
  const policyTopics = buildPolicyTopics(policyText, reportText);
  const report = buildReport({ metrics, institutions, overrides });
  const evaluationSample = buildEvaluationSample(evalText);

  return {
    availableYears: [2025],
    stats: {
      institutionCount: institutions.length,
      applicationTotal: metrics.applicationTotal,
      grantedTotal: metrics.grantedTotal,
      riskCreditTotal: metrics.riskCreditTotal,
      nonRiskCreditTotal: metrics.nonRiskCreditTotal,
      soeCreditTotal: metrics.soeCreditTotal,
    },
    institutions,
    groups,
    summary: {
      oneLiner: '本年授信以年度目标导向为主，结合申请额度和时间节点完成率，形成四类配置结论。',
      highlights: [
        `41 家机构申请 ${formatYi(metrics.applicationTotal)}，拟授信 ${formatYi(metrics.grantedTotal)}。`,
        `银担分险 ${formatYi(metrics.riskCreditTotal)}，非银担分险 ${formatYi(metrics.nonRiskCreditTotal)}，国企额度 ${formatYi(metrics.soeCreditTotal, 2)}。`,
        '政策目标值配置是本年主口径，覆盖 21 家机构。',
      ],
      executionNotes: [
        `非银担分险额度按 2024 年备案规模压降 10%，当前占总授信 ${formatPercent(metrics.nonRiskCreditTotal / metrics.grantedTotal)}。`,
        `国企担保贷款额度按 2023 年相关业务规模的 40% 配置，当前规模 ${formatYi(metrics.soeCreditTotal, 2)}。`,
      ],
    },
    pendingItems,
    policyTopics,
    report,
    evaluationSample,
    oaPreview: {
      flow: ['业务A角撰写授信报告', '业务B角初评', '部门负责人审批', '风控法务部独立审核', '总经理办公会审议'],
      summary: '当前材料与口径说明已齐备，可在人工确认待办事项后发起 OA 提交。',
    },
  } satisfies CreditReportData;
}

export async function getCreditAssistantContext() {
  const [reportText, policyText, data] = await Promise.all([
    extractDocText(CREDIT_REPORT_DOC, 'report-sample'),
    extractPolicyText(),
    getCreditReportData(),
  ]);

  return {
    policyText,
    reportText,
    year: data.availableYears[0],
    stats: data.stats,
    groups: data.groups.map((group) => ({
      title: group.title,
      count: group.count,
      totalCredit: group.totalCredit,
      summary: group.summary,
      decisionBasis: group.decisionBasis,
    })),
    institutions: data.institutions.map((item) => ({
      name: item.name,
      shortName: item.shortName,
      regionLevel: item.regionLevel,
      rating: item.rating,
      totalCredit: item.totalCredit,
      nonRiskCredit: item.nonRiskCredit,
      riskCredit: item.riskCredit,
      soeCredit: item.soeCredit,
      scale2024: item.scale2024,
      factor: item.factor,
      growthRate: item.growthRate,
      groupLabel: item.displayLabel,
    })),
    policyTopics: data.policyTopics,
  };
}

export async function getCreditReportData(options: { refresh?: boolean } = {}) {
  if (options.refresh) {
    const cachePath = path.join(CREDIT_CACHE_ROOT, `credit-data-${hash(CREDIT_CACHE_VERSION)}.json`);
    await fs.rm(cachePath, { force: true }).catch(() => null);
  }
  return buildCreditReportData();
}
