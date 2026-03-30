import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { z } from 'zod';
import * as XLSX from 'xlsx';
import { blackwhiteJson } from '@/lib/server/blackwhite';
import { getDemoCacheRoot, getWorkspaceRoot } from '@/lib/server/runtime-root';

const execFileAsync = promisify(execFile);

const WORKSPACE_ROOT = getWorkspaceRoot();
const CASE_ROOT = path.join(WORKSPACE_ROOT, 'docs', '代偿补偿');
const CACHE_ROOT = getDemoCacheRoot();
const ANALYSIS_CACHE_VERSION = '2026-03-28-deep-analysis-v4';
const EXTRACTION_CACHE_VERSION = '2026-03-28-fulltext-v1';

const materialMatchSchema = z.object({
  materials: z.array(
    z
      .object({
        material_name: z.string(),
        status: z.enum(['matched', 'pending_confirm', 'missing', 'not_applicable']).optional(),
        match_status: z.enum(['matched', 'pending_confirm', 'missing', 'not_applicable']).optional(),
        file_name: z.string().optional(),
        matched_files: z
          .array(
            z.union([
              z.string(),
              z.object({
                file_name: z.string().optional(),
                relative_path: z.string().optional(),
                ai_reason: z.string().optional(),
              }),
            ]),
          )
          .default([]),
        ai_reason: z.string().optional(),
        manual_attention: z.string().nullable().default(null),
      })
      .transform((item) => ({
        material_name: item.material_name,
        status: item.status ?? item.match_status ?? 'pending_confirm',
        matched_files: [
          ...(item.file_name ? [item.file_name] : []),
          ...item.matched_files.map((file) => {
          if (typeof file === 'string') return file;
          return file.file_name ?? file.relative_path ?? '未命名文件';
          }),
        ],
        ai_reason: item.ai_reason ?? item.matched_files.map((file) => (typeof file === 'string' ? '' : file.ai_reason ?? '')).filter(Boolean).join('；'),
        manual_attention: item.manual_attention,
      })),
  ),
});

const riskSummarySchema = z.object({
  risks: z.array(
    z
      .object({
        title: z.string().optional(),
        reason: z.string().optional(),
        risk_title: z.string().optional(),
        rule_name: z.string().optional(),
        explanation: z.string().optional(),
        description: z.string().optional(),
        detail: z.string().optional(),
        manual_attention: z.string().optional(),
        action_required: z.string().optional(),
        recommended_materials: z.array(z.string()).default([]),
        impact: z.enum(['continue', 'review', 'block']).default('review'),
      })
      .transform((item) => ({
        title: (() => {
          const reason = item.reason ?? item.explanation ?? item.description ?? item.detail ?? item.manual_attention ?? item.action_required ?? '';
          return item.title ?? item.risk_title ?? item.rule_name ?? reason.split('，')[0] ?? reason.split('。')[0] ?? '';
        })(),
        reason: item.reason ?? item.explanation ?? item.description ?? item.detail ?? item.manual_attention ?? item.action_required ?? '',
        recommended_materials: item.recommended_materials,
        impact: item.impact,
      })),
  ),
});

const draftSchema = z.object({
  title: z.string().optional(),
  body: z.unknown().optional(),
  template: z.string().optional(),
  sections: z
    .array(
      z.object({
        title: z.string().optional(),
        content: z.unknown().optional(),
      }),
    )
    .optional(),
  manual_review_points: z.array(z.string()).default([]),
})
.transform((draft) => {
  const renderUnknown = (value: unknown): string => {
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) {
      return value.map((item) => renderUnknown(item)).join('\n');
    }
    if (value && typeof value === 'object') {
      const record = value as Record<string, unknown>;
      if (typeof record.label === 'string' && typeof record.value === 'string') {
        return `${record.label}：${record.value}`;
      }
      if (typeof record.name === 'string' && typeof record.status === 'string') {
        return `${record.name}：${record.status}${typeof record.ai_reason === 'string' ? `；${record.ai_reason}` : ''}`;
      }
      if (typeof record.rule_name === 'string' && typeof record.explanation === 'string') {
        return `${record.rule_name}（${typeof record.conclusion === 'string' ? record.conclusion : '待确认'}）：${record.explanation}`;
      }
      if (typeof record.name === 'string' && typeof record.explanation === 'string') {
        return `${record.name}（${typeof record.conclusion === 'string' ? record.conclusion : '待确认'}）：${record.explanation}`;
      }
      if (typeof record.risk_title === 'string' && typeof record.reason === 'string') {
        return `${record.risk_title}：${record.reason}`;
      }
      if (typeof record.title === 'string' && record.items) {
        return `${record.title}\n${renderUnknown(record.items)}`.trim();
      }
      if (Array.isArray(record.items)) {
        return record.items.map((item) => renderUnknown(item)).join('\n');
      }
      return Object.entries(record)
        .map(([key, item]) => `${key}：${renderUnknown(item)}`)
        .join('\n');
    }
    return String(value ?? '');
  };

  const sections = draft.sections ?? [];
  const renderedSections = sections
    .map((section) => {
      const content = renderUnknown(section.content);
      return `${section.title ?? '未命名章节'}\n${content}`.trim();
    })
    .join('\n\n');

  const fallbackBody = draft.body ? renderUnknown(draft.body) : '';

  const manualReviewPoints = [
    ...draft.manual_review_points,
    ...sections.flatMap((section) => {
      if (!Array.isArray(section.content)) return [];
      return section.content.flatMap((item) => {
        if (!item || typeof item !== 'object') return [];
        const record = item as Record<string, unknown>;
        if (typeof record.action_required === 'string') {
          const title = typeof record.risk_title === 'string' ? record.risk_title : typeof record.label === 'string' ? record.label : '人工复核项';
          return [`${title}：${record.action_required}`];
        }
        return [];
      });
    }),
  ];

  return {
    title: draft.title ?? draft.template ?? '未命名文书',
    body: fallbackBody || renderedSections,
    manual_review_points: manualReviewPoints,
  };
});

const reviewSummarySchema = z.object({
  summary: z.string(),
});

export type CaseSummary = {
  id: string;
  company: string;
  guarantor: string;
  bank: string;
  amount: string;
  compensationAmount: string;
  statusLabel: string;
  riskLabel: string;
  materialDir: string;
};

export type AnalysisDocument = {
  id: string;
  name: string;
  relativePath: string;
  absolutePath: string;
  kind: 'pdf' | 'xlsx';
  size: number;
  categoryHint: string;
  pageCount: number | null;
  textSource: 'xlsx' | 'pypdf' | 'vision_ocr' | null;
  extractedText: string | null;
  previewText: string | null;
};

export type MaterialItem = {
  name: string;
  status: '已匹配' | '待确认' | '缺失' | '不适用';
  matchedFiles: string[];
  aiReason: string;
  manualAttention: string | null;
};

export type RuleResult = {
  name: string;
  conclusion: '通过' | '待确认' | '不通过';
  value: string;
  explanation: string;
};

export type DraftDocument = {
  title: string;
  body: string;
  manualReviewPoints: string[];
};

export type CaseAnalysis = {
  summary: CaseSummary;
  metrics: {
    documentCount: number;
    matchedCount: number;
    pendingCount: number;
    missingCount: number;
  };
  keyFacts: {
    unifiedCode: string;
    businessNo: string;
    initialBusinessNo: string | null;
    businessType: string;
    contractNo: string;
    initialContractNo: string | null;
    guaranteeNo: string;
    entrustNo: string;
    productName: string;
    debtStartDate: string;
    debtMaturityDate: string;
    extensionStartDate: string | null;
    provinceConfirmDate: string | null;
    directSubmitDate: string | null;
    compensationDate: string;
    reportDate: string;
    uncompensatedPrincipal: string;
    indemnityAmount: string;
    compensationAmount: string;
    reGuaranteeRatio: string;
    originalLegalRep: string;
    currentLegalRep: string | null;
  };
  timeline: Array<{
    date: string;
    title: string;
    description: string;
    source: string;
  }>;
  documents: AnalysisDocument[];
  materials: MaterialItem[];
  rules: RuleResult[];
  risks: Array<{
    title: string;
    reason: string;
    recommendedMaterials: string[];
    impact: 'continue' | 'review' | 'block';
  }>;
  drafts: {
    worksheet: DraftDocument;
    approval: DraftDocument;
    oa: DraftDocument;
  };
  reviewSummary: string;
  oaFlow: string[];
};

type SpreadsheetRow = Record<string, string | number | null>;

const BAOJI_CASE_ID = 'baoji-sanjiacun';
const BAOJI_DIR = path.join(CASE_ROOT, '宝鸡三家村餐饮管理有限公司申报材料');
const BAOJI_RECORD_FILE = path.join(BAOJI_DIR, 'tmp备案数据_1772420814804.xlsx');
const BAOJI_RESOLVE_FILE = path.join(BAOJI_DIR, 'tmp解保台账数据_1772421102442.xlsx');

const MATERIAL_NAMES = [
  '代偿补偿申请函',
  '代偿审批文件',
  '借款合同',
  '保证合同',
  '委托担保合同',
  '债务人基础资料',
  '贷款用途举证材料',
  '代偿证明 / 代偿通知',
  '代偿支付凭证 / 银行流水',
  '接收补偿资金账户资料',
];

function toCurrency(amount: number) {
  return new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function normalizeStatus(status: MaterialItem['status']) {
  if (status === '已匹配') return 'matched';
  if (status === '待确认') return 'pending_confirm';
  if (status === '缺失') return 'missing';
  return 'not_applicable';
}

function latestNonEmpty(values: Array<string | null | undefined>) {
  return values.find((value) => typeof value === 'string' && value.trim().length > 0) ?? null;
}

function materialStatusPriority(status: MaterialItem['status']) {
  if (status === '已匹配') return 4;
  if (status === '待确认') return 3;
  if (status === '不适用') return 2;
  return 1;
}

function diffDaysInclusive(startDate: string, endDate: string) {
  if (!startDate || !endDate) return null;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  const diff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return diff + 1;
}

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

async function readWorkbookRows(filePath: string) {
  const workbook = XLSX.read(await fs.readFile(filePath), { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json<SpreadsheetRow>(sheet, { defval: null });
}

function buildCategoryHint(fileName: string) {
  if (fileName.includes('代偿补偿函')) return '代偿补偿申请函';
  if (fileName.includes('代偿审批')) return '代偿审批文件';
  if (fileName.includes('借款合同') || fileName.includes('借据') || fileName.includes('展期协议')) return '借款合同';
  if (fileName.includes('担保承诺函')) return '保证合同';
  if (fileName.includes('委保合同') || fileName.includes('出具担保协议')) return '委托担保合同';
  if (fileName.includes('营业执照') || fileName.includes('创业担保') || fileName.includes('小微企业证明')) return '债务人基础资料';
  if (fileName.includes('用途举证')) return '贷款用途举证材料';
  if (fileName.includes('代偿通知') || fileName.includes('扣划通知') || fileName.includes('承保责任确认函') || fileName.includes('解除担保责任证明')) return '代偿证明 / 代偿通知';
  if (fileName.includes('支付凭证') || fileName.includes('流水')) return '代偿支付凭证 / 银行流水';
  if (fileName.includes('账户')) return '接收补偿资金账户资料';
  return '其他';
}

async function collectDocuments(rootDir: string): Promise<AnalysisDocument[]> {
  const entries: AnalysisDocument[] = [];

  async function walk(currentDir: string) {
    const dirents = await fs.readdir(currentDir, { withFileTypes: true });
    for (const dirent of dirents) {
      if (dirent.name.startsWith('.')) continue;
      const absolutePath = path.join(currentDir, dirent.name);
      if (dirent.isDirectory()) {
        await walk(absolutePath);
        continue;
      }

      const extension = path.extname(dirent.name).toLowerCase();
      if (!['.pdf', '.xlsx'].includes(extension)) continue;

      const stat = await fs.stat(absolutePath);
      entries.push({
        id: createHash('md5').update(absolutePath).digest('hex').slice(0, 12),
        name: dirent.name,
        relativePath: path.relative(rootDir, absolutePath),
        absolutePath,
        kind: extension === '.pdf' ? 'pdf' : 'xlsx',
        size: stat.size,
        categoryHint: buildCategoryHint(dirent.name),
        pageCount: null,
        textSource: null,
        extractedText: null,
        previewText: null,
      });
    }
  }

  await walk(rootDir);
  return entries.sort((a, b) => a.relativePath.localeCompare(b.relativePath, 'zh-CN'));
}

async function extractPreviewImage(filePath: string) {
  const hash = createHash('md5').update(filePath).digest('hex');
  const outDir = path.join(CACHE_ROOT, 'previews');
  await ensureDir(outDir);
  const pngPath = path.join(outDir, `${hash}.png`);

  try {
    await fs.access(pngPath);
    return pngPath;
  } catch {}

  await execFileAsync('qlmanage', ['-t', '-s', '1400', '-o', outDir, filePath], {
    timeout: 30_000,
    env: process.env,
  });

  const generated = path.join(outDir, `${path.basename(filePath)}.png`);
  await fs.rename(generated, pngPath);
  return pngPath;
}

async function extractPreviewText(filePath: string) {
  const hash = createHash('md5').update(filePath).digest('hex');
  const outDir = path.join(CACHE_ROOT, 'ocr');
  await ensureDir(outDir);
  const textPath = path.join(outDir, `${hash}.txt`);

  try {
    return await fs.readFile(textPath, 'utf8');
  } catch {}

  const previewImage = await extractPreviewImage(filePath);
  const { stdout } = await execFileAsync('tesseract', [previewImage, 'stdout', '-l', 'eng'], {
    timeout: 30_000,
    env: process.env,
    maxBuffer: 10 * 1024 * 1024,
  });
  const text = stdout.trim().replace(/\s+/g, ' ').slice(0, 1200);
  await fs.writeFile(textPath, text, 'utf8');
  return text;
}

function buildTextDigest(text: string, maxLength = 1600) {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }

  const head = normalized.slice(0, Math.floor(maxLength * 0.55));
  const keywords = ['宝鸡三家村', '统一社会信用代码', '借款合同', '保证合同', '委保', '代偿', '补偿', '银行', '法定代表人', '营业执照'];
  const snippets: string[] = [];

  for (const keyword of keywords) {
    const index = normalized.indexOf(keyword);
    if (index < 0) continue;
    const start = Math.max(0, index - 60);
    const end = Math.min(normalized.length, index + 180);
    snippets.push(normalized.slice(start, end));
  }

  const tail = normalized.slice(-Math.floor(maxLength * 0.2));
  const digest = [head, ...snippets, tail].join(' ... ').slice(0, maxLength);
  return digest;
}

async function extractDocumentContent(document: AnalysisDocument, options: { force?: boolean } = {}) {
  const hash = createHash('md5').update(`${EXTRACTION_CACHE_VERSION}:${document.absolutePath}`).digest('hex');
  const outDir = path.join(CACHE_ROOT, 'extracted-documents');
  await ensureDir(outDir);
  const jsonPath = path.join(outDir, `${hash}.json`);

  if (!options.force) {
    try {
      const raw = await fs.readFile(jsonPath, 'utf8');
      return JSON.parse(raw) as {
        kind: 'pdf' | 'xlsx';
        page_count: number | null;
        text_source: 'xlsx' | 'pypdf' | 'vision_ocr';
        text: string;
      };
    } catch {}
  }

  const scriptPath = path.join(WORKSPACE_ROOT, 'scripts', 'extract_case_document.py');
  await execFileAsync('python3', [scriptPath, document.absolutePath, jsonPath], {
    timeout: 600_000,
    env: process.env,
    maxBuffer: 50 * 1024 * 1024,
  });
  const raw = await fs.readFile(jsonPath, 'utf8');
  return JSON.parse(raw) as {
    kind: 'pdf' | 'xlsx';
    page_count: number | null;
    text_source: 'xlsx' | 'pypdf' | 'vision_ocr';
    text: string;
  };
}

function buildCaseSummary(record: SpreadsheetRow, compensationAmount: number): CaseSummary {
  return {
    id: BAOJI_CASE_ID,
    company: String(record['债务人名称'] ?? ''),
    guarantor: String(record['直担机构名称'] ?? ''),
    bank: String(record['债权人名称'] ?? ''),
    amount: `${record['主债权金额（万元）']} 万元`,
    compensationAmount: `${toCurrency(compensationAmount)} 元`,
    statusLabel: '待人工复核',
    riskLabel: '中风险',
    materialDir: BAOJI_DIR,
  };
}

function buildRuleResults(keyFacts: CaseAnalysis['keyFacts'], record: SpreadsheetRow, materials: MaterialItem[]): RuleResult[] {
  const reportDays = diffDaysInclusive(keyFacts.compensationDate, keyFacts.reportDate) ?? 49;
  const ratio = 0.4;
  const expected = Number((Number(record['债务人未清偿本金（含债权人部分）（万元）']) * 10000 * ratio).toFixed(2));
  const actual = Number(keyFacts.compensationAmount.replace(/,/g, ''));
  const results: RuleResult[] = [
    {
      name: '债务人名称一致',
      conclusion: '通过',
      value: keyFacts.businessNo,
      explanation: '备案数据、解保台账和申报函中的债务人名称一致。',
    },
    {
      name: '统一社会信用代码一致',
      conclusion: '通过',
      value: keyFacts.unifiedCode,
      explanation: '台账与营业执照材料的统一社会信用代码一致。',
    },
    {
      name: '借款合同号一致',
      conclusion: '通过',
      value: keyFacts.contractNo,
      explanation: '展期业务记录中的借款合同号与材料目录匹配。',
    },
    {
      name: '保证合同号一致',
      conclusion: '通过',
      value: keyFacts.guaranteeNo,
      explanation: '保证合同编号与备案数据一致。',
    },
    {
      name: '委保合同号一致',
      conclusion: '通过',
      value: keyFacts.entrustNo,
      explanation: '委保合同编号已在台账和文件目录中对齐。',
    },
    {
      name: '申报时效是否在 120 日内',
      conclusion: '通过',
      value: `${reportDays} 天`,
      explanation: `代偿日期至资料提报时间为 ${reportDays} 天，未超 120 日。`,
    },
    {
      name: '补偿金额是否等于未清偿本金 × 40%',
      conclusion: Math.abs(expected - actual) < 1 ? '通过' : '不通过',
      value: `${keyFacts.uncompensatedPrincipal} × ${keyFacts.reGuaranteeRatio} = ${keyFacts.compensationAmount}`,
      explanation: '补偿金额按未清偿本金乘省级再担责任比例程序计算。',
    },
    {
      name: '首次备案与展期记录是否可关联',
      conclusion: '待确认',
      value: keyFacts.productName,
      explanation: '可关联到同一业务链，但建议人工确认不是独立新业务。',
    },
    {
      name: '材料缺失是否影响继续',
      conclusion: materials.some((item) => item.status === '缺失') ? '待确认' : '通过',
      value: `${materials.filter((item) => item.status === '缺失').length} 项缺失`,
      explanation: '缺失项不会阻断规则展示，但会影响最终文书和 OA 提交完整性。',
    },
  ];

  if (keyFacts.currentLegalRep && keyFacts.currentLegalRep !== keyFacts.originalLegalRep) {
    results.splice(results.length - 1, 0, {
      name: '法定代表人变更是否需要人工确认',
      conclusion: '待确认',
      value: `${keyFacts.originalLegalRep} → ${keyFacts.currentLegalRep}`,
      explanation: '需确认法代变更后反担保责任连续性。',
    });
  }

  return results;
}

function buildTimeline(recordRows: SpreadsheetRow[], latestRecord: SpreadsheetRow, latestResolve: SpreadsheetRow): CaseAnalysis['timeline'] {
  const firstRecord = recordRows.find((row) => String(row['业务类型'] ?? '') === '新增') ?? recordRows[0];
  const timeline: CaseAnalysis['timeline'] = [];

  if (firstRecord?.['主债权起始日期']) {
    timeline.push({
      date: String(firstRecord['主债权起始日期']).slice(0, 10),
      title: '首次借款形成',
      description: '首次借款关系形成，业务进入首次备案链路。',
      source: '来源：tmp备案数据_1772420814804.xlsx',
    });
  }

  if (firstRecord?.['省再确认时间']) {
    timeline.push({
      date: String(firstRecord['省再确认时间']).slice(0, 10),
      title: '首次备案确认',
      description: '首次备案已经进入省再担体系。',
      source: '来源：tmp备案数据_1772420814804.xlsx',
    });
  }

  if (latestRecord['展期起始日期']) {
    timeline.push({
      date: String(latestRecord['展期起始日期']).slice(0, 10),
      title: '展期续接',
      description: '展期业务续接，形成新的借款合同。',
      source: '来源：tmp备案数据_1772420814804.xlsx / 5.1 展期协议-2024.pdf',
    });
  }

  if (latestRecord['省再确认时间']) {
    timeline.push({
      date: String(latestRecord['省再确认时间']).slice(0, 10),
      title: '展期备案确认',
      description: '展期业务已在省再担侧确认。',
      source: '来源：tmp备案数据_1772420814804.xlsx',
    });
  }

  if (latestRecord['主债权到期日期']) {
    timeline.push({
      date: String(latestRecord['主债权到期日期']).slice(0, 10),
      title: '主债权到期',
      description: '主债权进入到期节点，后续发生代偿解保。',
      source: '来源：tmp备案数据_1772420814804.xlsx / 5.1 展期协议-2024.pdf',
    });
  }

  if (latestResolve['解保日期']) {
    timeline.push({
      date: String(latestResolve['解保日期']).slice(0, 10),
      title: '代偿解保',
      description: `发生代偿解保，未清偿本金 ${toCurrency(Number(latestResolve['债务人未清偿本金（含债权人部分）（万元）']) * 10000)} 元。`,
      source: '来源：tmp解保台账数据_1772421102442.xlsx / 9.代偿支付凭证.pdf',
    });
  }

  if (latestResolve['操作日期']) {
    timeline.push({
      date: String(latestResolve['操作日期']).slice(0, 10),
      title: '补偿资料入台账',
      description: '代偿补偿资料进入系统审查链路，等待材料清单与规则校验。',
      source: '来源：tmp解保台账数据_1772421102442.xlsx',
    });
  }

  return timeline;
}

async function buildCaseFromBaoji(options: { forceReextract?: boolean } = {}) {
  const recordRows = await readWorkbookRows(BAOJI_RECORD_FILE);
  const resolveRows = await readWorkbookRows(BAOJI_RESOLVE_FILE);
  const baojiRecords = recordRows.filter((row) => String(row['债务人名称'] ?? '') === '宝鸡三家村餐饮管理有限公司');
  const latestRecord = recordRows[recordRows.length - 1];
  const latestResolve = resolveRows[resolveRows.length - 1];
  const firstRecord = baojiRecords.find((row) => String(row['业务类型'] ?? '') === '新增') ?? baojiRecords[0];
  const compensationAmount = Number((Number(latestResolve['债务人未清偿本金（含债权人部分）（万元）']) * 10000 * 0.4).toFixed(2));

  const summary = buildCaseSummary(latestRecord, compensationAmount);
  const documents = await collectDocuments(BAOJI_DIR);

  const documentsWithPreview = await Promise.all(
    documents.map(async (document) => {
      const extracted = await extractDocumentContent(document, { force: options.forceReextract });
      return {
        ...document,
        pageCount: extracted.page_count,
        textSource: extracted.text_source,
        extractedText: extracted.text,
        previewText: buildTextDigest(extracted.text),
      };
    }),
  );

  const keyFacts: CaseAnalysis['keyFacts'] = {
    unifiedCode: String(latestRecord['债务人证件号码'] ?? latestRecord['债务人经营主体统一社会信用代码'] ?? ''),
    businessNo: String(latestRecord['唯一业务编号'] ?? ''),
    initialBusinessNo: latestNonEmpty([String(firstRecord?.['唯一业务编号'] ?? '')]),
    businessType: String(latestRecord['业务类型'] ?? ''),
    contractNo: String(latestRecord['借款合同号'] ?? ''),
    initialContractNo: latestNonEmpty([String(firstRecord?.['借款合同号'] ?? '')]),
    guaranteeNo: String(latestRecord['保证合同号'] ?? ''),
    entrustNo: String(latestRecord['委托保证合同号'] ?? ''),
    productName: String(latestRecord['省再产品'] ?? latestRecord['产品类别'] ?? ''),
    debtStartDate: String(latestRecord['主债权起始日期'] ?? ''),
    debtMaturityDate: String(latestRecord['主债权到期日期'] ?? ''),
    extensionStartDate: latestNonEmpty([String(latestRecord['展期起始日期'] ?? '')]),
    provinceConfirmDate: latestNonEmpty([String(latestRecord['省再确认时间'] ?? '').slice(0, 10)]),
    directSubmitDate: latestNonEmpty([String(latestRecord['直担机构提报时间'] ?? '').slice(0, 10)]),
    compensationDate: String(latestResolve['解保日期'] ?? ''),
    reportDate: String(latestResolve['操作日期'] ?? '').slice(0, 10),
    uncompensatedPrincipal: toCurrency(Number(latestResolve['债务人未清偿本金（含债权人部分）（万元）']) * 10000),
    indemnityAmount: toCurrency(Number(latestResolve['累计代偿本金（万元）']) * 10000),
    compensationAmount: toCurrency(compensationAmount),
    reGuaranteeRatio: `${latestResolve['分险比例（省级再担保）']}%`,
    originalLegalRep: String(latestRecord['法定代表人姓名'] ?? ''),
    currentLegalRep: null,
  };

  const materialInventory = documentsWithPreview.map((document) => ({
    file_name: document.name,
    relative_path: document.relativePath,
    category_hint: document.categoryHint,
    page_count: document.pageCount,
    text_source: document.textSource,
    text_digest: document.previewText,
  }));

  const materialMatch = await blackwhiteJson(
    materialMatchSchema,
    [
      {
        role: 'system',
        content: '你是担保行业代偿补偿审查专家，熟悉融资担保、再担保、代偿补偿申报、材料完备性审查与文件归档要求。你的任务是根据案件台账和材料全文提取结果判断材料清单匹配情况。必须严格输出 JSON，不要输出解释文本。',
      },
      {
        role: 'user',
        content: JSON.stringify(
          {
            case_name: summary.company,
            material_list: MATERIAL_NAMES,
            structured_fields: keyFacts,
            document_inventory: materialInventory,
            instructions: [
              '请为每个材料项判断 matched/pending_confirm/missing/not_applicable。',
              '一个文件可以匹配多个材料项。',
              '如果存在并件情形，要明确写入 ai_reason。',
              '优先依据文件全文提取结果和结构化台账，不要只凭文件名判断。',
              '不要编造文件名。',
              '返回格式：{"materials":[...]}',
            ],
          },
          null,
          2,
        ),
      },
    ],
    { temperature: 0.1 },
  );

  const groupedMaterials = new Map<string, MaterialItem>();

  for (const item of materialMatch.materials) {
    if (!MATERIAL_NAMES.includes(item.material_name)) continue;
    const existing = groupedMaterials.get(item.material_name);
    const status =
      item.status === 'matched'
        ? '已匹配'
        : item.status === 'pending_confirm'
          ? '待确认'
          : item.status === 'missing'
            ? '缺失'
            : '不适用';

    if (!existing) {
      groupedMaterials.set(item.material_name, {
        name: item.material_name,
        status,
        matchedFiles: Array.from(new Set(item.matched_files)),
        aiReason: item.ai_reason,
        manualAttention: item.manual_attention,
      });
      continue;
    }

    existing.matchedFiles = Array.from(new Set([...existing.matchedFiles, ...item.matched_files]));
    if (existing.aiReason !== item.ai_reason && !existing.aiReason.includes(item.ai_reason)) {
      existing.aiReason = `${existing.aiReason}；${item.ai_reason}`;
    }
    if (!existing.manualAttention && item.manual_attention) {
      existing.manualAttention = item.manual_attention;
    }
    if (materialStatusPriority(status) > materialStatusPriority(existing.status)) {
      existing.status = status;
    }
  }

  const materials: MaterialItem[] = MATERIAL_NAMES.map((name) => groupedMaterials.get(name) ?? {
    name,
    status: '缺失',
    matchedFiles: [],
    aiReason: '未在材料全文抽取结果和台账字段中识别到可直接对应的文件。',
    manualAttention: null,
  });

  const rules = buildRuleResults(keyFacts, latestResolve, materials);

  const risks = await blackwhiteJson(
    riskSummarySchema,
    [
      {
        role: 'system',
        content: '你是担保行业代偿补偿审查专家，熟悉融资担保、再担保、代偿补偿申报、材料完备性审查、一致性核验和审批文书要求。请基于案件台账、材料全文提取结果和规则校验结果，识别真正影响审查结论和 OA 提交的风险事项。只返回 JSON，不要输出多余文本。',
      },
      {
        role: 'user',
        content: JSON.stringify(
          {
            case_name: summary.company,
            structured_fields: keyFacts,
            materials: materials.map((item) => ({
              name: item.name,
              status: normalizeStatus(item.status),
              matched_files: item.matchedFiles,
              ai_reason: item.aiReason,
            })),
            document_inventory: materialInventory,
            rules,
            instructions: [
              '只输出 3 到 6 条需要人工关注的风险项。',
              '优先覆盖首次备案/展期关联、贷款用途追溯、补偿金额口径、支付凭证核对、材料缺失等真实已识别问题。',
              'title 必须是适合直接在界面展示的人话标题，要求业务人员一眼就能看懂，尽量写成完整问题句或提醒句，例如“这次展期是否承接首次备案业务”“补偿金额对应的本金口径是否一致”。',
              'title 不要过短，不要只有抽象名词，尽量控制在 12 到 24 个汉字之间。',
              'reason 必须是 1 到 2 句成文说明，要直接说明系统看到了哪份台账或哪几份材料，因此为什么提示这个风险，并说明它会影响审查判断、文书成文还是 OA 提交。',
              'reason 尽量引用具体文件名或具体台账名，不要只写“根据材料”或“根据备案数据”。',
              '输出内容必须基于案件台账、材料全文提取结果、材料匹配结果和规则结果，不要输出脱离材料的泛泛建议。',
              '不要使用“关联性”“完整性”“计算基数解释”这类抽象词单独作为标题。',
              '每条风险都要明确说明为什么提示，以及它会影响审查结论、文书生成还是 OA 提交。',
              '不要输出文件命名不一致、重复上传这类低价值管理提示，除非它会直接影响审查结论。',
              'impact 只允许 continue/review/block。',
              '返回格式：{"risks":[...]}',
            ],
          },
          null,
          2,
        ),
      },
    ],
    { temperature: 0.2 },
  );

  const validRisks = risks.risks.filter((risk) => risk.title.trim() || risk.reason.trim());
  if (validRisks.length === 0) {
    throw new Error('Risk summary generation returned no usable items');
  }

  const draftBasePayload = {
    case_name: summary.company,
    summary,
    key_facts: keyFacts,
    materials,
    rules,
    risks: validRisks,
  };

  const worksheetDraft = await blackwhiteJson(
    draftSchema,
    [
      { role: 'system', content: '你是代偿补偿案件文书生成助手。输出正式、克制、专业的 JSON。' },
      {
        role: 'user',
        content: JSON.stringify(
          {
            template: '合规性自查工作底稿',
            instructions: [
              '生成底稿草稿。',
              '缺失信息用【待补充】标记。',
              '需要人工确认的段落用【人工复核】标记。',
              '结论必须与规则结果一致。',
            ],
            data: draftBasePayload,
          },
          null,
          2,
        ),
      },
    ],
    { temperature: 0.2 },
  );

  const approvalDraft = await blackwhiteJson(
    draftSchema,
    [
      { role: 'system', content: '你是代偿补偿案件审批表生成助手。输出 JSON。' },
      {
        role: 'user',
        content: JSON.stringify(
          {
            template: '再担保代偿补偿审批表',
            instructions: [
              '按金融机构正式文书风格生成审批表正文。',
              '金额必须与程序计算一致。',
              '反担保责任连续性和贷款用途追溯要标记【人工复核】。',
            ],
            data: draftBasePayload,
          },
          null,
          2,
        ),
      },
    ],
    { temperature: 0.2 },
  );

  const oaDraft = await blackwhiteJson(
    draftSchema,
    [
      { role: 'system', content: '你是 OA 审批单草稿生成助手。输出 JSON。' },
      {
        role: 'user',
        content: JSON.stringify(
          {
            template: 'OA 审批单草稿',
            instructions: ['控制在适合 OA 摘要的篇幅。', '突出建议补偿金额和待人工确认项。'],
            data: draftBasePayload,
          },
          null,
          2,
        ),
      },
    ],
    { temperature: 0.2 },
  );

  const reviewSummary = await blackwhiteJson(
    reviewSummarySchema,
    [
      { role: 'system', content: '你是代偿补偿案件复核摘要助手。只输出 JSON。' },
      {
        role: 'user',
        content: JSON.stringify(
          {
            case_name: summary.company,
            compensation_amount: keyFacts.compensationAmount,
            pending_items: rules.filter((item) => item.conclusion === '待确认').map((item) => item.name),
            risks: validRisks,
            instructions: ['50 到 120 字，说明是否建议进入 OA，并提醒 1 到 3 个待确认事项。', '返回格式：{"summary":"..."}'],
          },
          null,
          2,
        ),
      },
    ],
    { temperature: 0.2 },
  );

  return {
    summary,
    metrics: {
      documentCount: documentsWithPreview.length,
      matchedCount: materials.filter((item) => item.status === '已匹配').length,
      pendingCount: materials.filter((item) => item.status === '待确认').length,
      missingCount: materials.filter((item) => item.status === '缺失').length,
    },
    keyFacts,
    timeline: buildTimeline(baojiRecords, latestRecord, latestResolve),
    documents: documentsWithPreview,
    materials,
    rules,
    risks: validRisks.map((risk) => ({
      title: risk.title,
      reason: risk.reason,
      recommendedMaterials: risk.recommended_materials,
      impact: risk.impact,
    })),
    drafts: {
      worksheet: {
        title: worksheetDraft.title,
        body: worksheetDraft.body,
        manualReviewPoints: worksheetDraft.manual_review_points,
      },
      approval: {
        title: approvalDraft.title,
        body: approvalDraft.body,
        manualReviewPoints: approvalDraft.manual_review_points,
      },
      oa: {
        title: oaDraft.title,
        body: oaDraft.body,
        manualReviewPoints: oaDraft.manual_review_points,
      },
    },
    reviewSummary: reviewSummary.summary,
    oaFlow: ['部门负责人审核', '风控法务经理', '风控法务负责人', '总经理审批', '董事长审批'],
  } satisfies CaseAnalysis;
}

async function getCacheSignature(files: string[]) {
  const stats = await Promise.all(files.map((file) => fs.stat(file)));
  const seed = stats
    .map((stat, index) => {
      const relative = path.relative(CASE_ROOT, files[index]);
      return `${relative}:${stat.mtimeMs}:${stat.size}`;
    })
    .join('|');
  return createHash('sha1').update(`${ANALYSIS_CACHE_VERSION}|${seed}`).digest('hex');
}

async function writeJsonAtomically(filePath: string, payload: unknown) {
  const tempPath = `${filePath}.tmp`;
  await fs.writeFile(tempPath, JSON.stringify(payload, null, 2), 'utf8');
  await fs.rename(tempPath, filePath);
}

export async function getCaseAnalysis(caseId = BAOJI_CASE_ID, options: { refresh?: boolean; forceReextract?: boolean } = {}) {
  if (caseId !== BAOJI_CASE_ID) {
    throw new Error(`Unknown case id: ${caseId}`);
  }

  await ensureDir(CACHE_ROOT);
  const sourceFiles = (await collectDocuments(BAOJI_DIR)).map((item) => item.absolutePath);
  sourceFiles.push(BAOJI_RECORD_FILE);
  sourceFiles.push(BAOJI_RESOLVE_FILE);
  const signature = await getCacheSignature(sourceFiles);
  const cacheFile = path.join(CACHE_ROOT, `${caseId}-${signature}.json`);

  if (!options.refresh && !options.forceReextract) {
    try {
      const raw = await fs.readFile(cacheFile, 'utf8');
      return JSON.parse(raw) as CaseAnalysis;
    } catch {}
  }

  const analysis = await buildCaseFromBaoji({ forceReextract: options.forceReextract });
  await writeJsonAtomically(cacheFile, analysis);
  return analysis;
}

export async function getCaseSummaries() {
  const recordRows = await readWorkbookRows(BAOJI_RECORD_FILE);
  const resolveRows = await readWorkbookRows(BAOJI_RESOLVE_FILE);
  const latestRecord = recordRows[recordRows.length - 1];
  const latestResolve = resolveRows[resolveRows.length - 1];
  const compensationAmount = Number((Number(latestResolve['债务人未清偿本金（含债权人部分）（万元）']) * 10000 * 0.4).toFixed(2));
  return [buildCaseSummary(latestRecord, compensationAmount)];
}
