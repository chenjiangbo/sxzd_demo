import { createHash } from 'node:crypto';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import * as XLSX from 'xlsx';
import { z } from 'zod';
import { getDemoCacheRoot, getWorkspaceRoot } from '@/lib/server/runtime-root';

const WORKSPACE_ROOT = getWorkspaceRoot();
const EVALUATION_DOC_DIR = path.join(WORKSPACE_ROOT, 'docs', '机构评价');
const EVALUATION_SPREADSHEET = path.join(EVALUATION_DOC_DIR, 'evaluation-report-2026-04-01.xls');
const EVALUATION_CACHE_ROOT = path.join(getDemoCacheRoot(), 'evaluation-report');
const EVALUATION_CACHE_VERSION = '2026-04-01-evaluation-report-v1';

const spreadsheetInstitutionSchema = z.object({
  id: z.string(),
  name: z.string(),
  shortName: z.string(),
  regionLevel: z.enum(['省级', '市级', '县区']),
  rating: z.string(),
  targetScale: z.number(),
  actualScale: z.number(),
  completionRate: z.number(),
  targetCustomer: z.number(),
  actualCustomer: z.number(),
  customerCompletionRate: z.number(),
  leverage: z.number(),
  filingRate: z.number(),
  riskShareRatio: z.number(),
  inclusiveRatio: z.number(),
  compensationRate: z.number(),
  recoveryRate: z.number(),
  policyScore: z.number(),
  groupKey: z.enum(['excellent', 'good', 'qualified', 'improving']),
});

type SpreadsheetInstitution = z.infer<typeof spreadsheetInstitutionSchema>;

export type EvaluationGroupKey = SpreadsheetInstitution['groupKey'];

export type EvaluationReportData = {
  availableYears: number[];
  stats: {
    institutionCount: number;
    targetTotal: number;
    actualTotal: number;
    overallCompletionRate: number;
    excellentCount: number;
    goodCount: number;
  };
  institutions: Array<
    SpreadsheetInstitution & {
      displayLabel: string;
      remark: string;
    }
  >;
  groups: Array<{
    key: EvaluationGroupKey;
    title: string;
    count: number;
    totalTarget: number;
    totalActual: number;
    avgCompletionRate: number;
    summary: string;
    decisionBasis: string;
    members: Array<SpreadsheetInstitution & { displayLabel: string; remark: string }>;
  }>;
  summary: {
    oneLiner: string;
    highlights: string[];
    executionNotes: string[];
  };
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
};

const GROUP_META: Record<
  EvaluationGroupKey,
  {
    title: string;
    summary: string;
    decisionBasis: string;
    members: string[];
  }
> = {
  excellent: {
    title: '优秀（完成率≥100%）',
    summary: '超额完成年度政策目标，业务规模与质量双优。',
    decisionBasis: '给予表彰并优先配置资源。',
    members: [],
  },
  good: {
    title: '良好（90%≤完成率<100%）',
    summary: '基本完成年度目标，部分指标表现突出。',
    decisionBasis: '继续保持良好发展态势。',
    members: [],
  },
  qualified: {
    title: '达标（70%≤完成率<90%）',
    summary: '完成大部分目标，但仍有提升空间。',
    decisionBasis: '需加强业务拓展与风险控制。',
    members: [],
  },
  improving: {
    title: '待改进（完成率<70%）',
    summary: '距离目标差距较大，需重点督导。',
    decisionBasis: '制定专项改进方案并限期整改。',
    members: [],
  },
};

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

function hash(input: string) {
  return createHash('sha1').update(input).digest('hex');
}

function detectGroup(completionRate: number): EvaluationGroupKey {
  if (completionRate >= 1.0) return 'excellent';
  if (completionRate >= 0.9) return 'good';
  if (completionRate >= 0.7) return 'qualified';
  return 'improving';
}

function normalizeRegionLevel(name: string): SpreadsheetInstitution['regionLevel'] {
  if (name.startsWith('陕西循环') || name.startsWith('陕西文化')) return '省级';
  if (name.includes('市') && !name.includes('县') && !name.includes('区')) return '市级';
  return '县区';
}

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
};

async function buildInstitutions() {
  const workbookBuffer = await fs.readFile(EVALUATION_SPREADSHEET);
  const workbook = XLSX.read(workbookBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json<Array<string | number | null>>(workbook.Sheets[sheetName], {
    header: 1,
    defval: null,
  });

  const dataRows = rows.slice(4).filter((row) => typeof row[0] === 'number');

  return dataRows.map((row) => {
    const name = String(row[1] ?? '');
    const targetScale = Number(row[2]) || 0;
    const actualScale = Number(row[3]) || 0;
    const completionRate = targetScale > 0 ? actualScale / targetScale : 0;
    const targetCustomer = Number(row[4]) || 0;
    const actualCustomer = Number(row[5]) || 0;
    const customerCompletionRate = targetCustomer > 0 ? actualCustomer / targetCustomer : 0;

    return spreadsheetInstitutionSchema.parse({
      id: `eval-${String(row[0]).padStart(2, '0')}`,
      name,
      shortName: SHORT_NAME_MAP[name] ?? name.replace(/(融资担保股份有限公司 | 融资担保集团有限公司 | 融资担保有限责任公司 | 融资担保有限公司 | 中小企业融资担保有限责任公司)$/u, ''),
      regionLevel: normalizeRegionLevel(name),
      rating: String(row[14] ?? ''),
      targetScale,
      actualScale,
      completionRate,
      targetCustomer,
      actualCustomer,
      customerCompletionRate,
      leverage: Number(row[6]) || 0,
      filingRate: Number(row[7]) || 0,
      riskShareRatio: Number(row[8]) || 0,
      inclusiveRatio: Number(row[9]) || 0,
      compensationRate: Number(row[10]) || 0,
      recoveryRate: Number(row[11]) || 0,
      policyScore: Number(row[12]) || 0,
      groupKey: detectGroup(completionRate),
    });
  });
}

function buildReport(data: {
  institutions: Array<SpreadsheetInstitution & { displayLabel: string; remark: string }>;
  groups: EvaluationReportData['groups'];
}): EvaluationReportData['report'] {
  const excellentCount = data.institutions.filter((i) => i.groupKey === 'excellent').length;
  const goodCount = data.institutions.filter((i) => i.groupKey === 'good').length;
  const totalTarget = data.institutions.reduce((sum, i) => sum + i.targetScale, 0);
  const totalActual = data.institutions.reduce((sum, i) => sum + i.actualScale, 0);
  const overallRate = totalTarget > 0 ? totalActual / totalTarget : 0;

  return {
    title: '2025 年度合作担保机构经营情况评价报告',
    reportNo: '陕再担保〔2025〕评价报告',
    createdAt: '2025 年 12 月 31 日',
    department: '业务一部',
    sections: [
      {
        title: '一、总体情况',
        body: [
          `2025 年度，全省 ${data.institutions.length} 家合作担保机构累计完成担保业务规模 ${totalActual.toFixed(2)} 亿元，目标完成率为 ${(overallRate * 100).toFixed(1)}%。`,
          `其中，优秀机构 ${excellentCount} 家，良好机构 ${goodCount} 家，整体呈现稳中有进的发展态势。`,
        ],
      },
      {
        title: '二、分组评价情况',
        body: data.groups.map((group) => 
          `${group.title}：${group.count} 家机构，目标规模 ${group.totalTarget.toFixed(2)} 亿元，实际完成 ${group.totalActual.toFixed(2)} 亿元，平均完成率 ${(group.avgCompletionRate * 100).toFixed(1)}%。${group.summary}`
        ),
      },
      {
        title: '三、主要特点',
        body: [
          '业务规模稳步增长，多数机构完成年度目标。',
          '支小支农主业突出，普惠金融服务能力持续增强。',
          '风险控制总体有效，代偿率保持在合理区间。',
        ],
      },
      {
        title: '四、存在问题',
        body: [
          '部分机构业务进度滞后，距离目标差距较大。',
          '银担分险业务推进不平衡，合作深度有待加强。',
          '个别机构风险控制压力增大，需引起高度重视。',
        ],
      },
      {
        title: '五、工作建议',
        body: [
          '对优秀机构给予表彰和资源倾斜。',
          '对良好机构加强指导，推动向优秀梯队迈进。',
          '对待改进机构开展专项督导，限期整改提升。',
        ],
      },
    ],
    adoptedCriteria: [
      '完成率≥100% 为优秀',
      '90%≤完成率<100% 为良好',
      '70%≤完成率<90% 为达标',
      '完成率<70% 为待改进',
    ],
    references: [
      '输入 1：体系机构评价报告 (2026-04-01).xls',
      '输入 2：陕西省信用再担保有限责任公司机构评价管理办法',
    ],
  };
}

export async function getEvaluationReportData() {
  await ensureDir(EVALUATION_CACHE_ROOT);
  const cachePath = path.join(EVALUATION_CACHE_ROOT, `evaluation-data-${hash(EVALUATION_CACHE_VERSION)}.json`);
  
  try {
    const cached = await fs.readFile(cachePath, 'utf8');
    return JSON.parse(cached) as EvaluationReportData;
  } catch {}

  const institutions = (await buildInstitutions()).map((institution) => ({
    ...institution,
    displayLabel: GROUP_META[institution.groupKey].title,
    remark: '',
  }));

  const groups = (Object.entries(GROUP_META) as Array<[EvaluationGroupKey, (typeof GROUP_META)[EvaluationGroupKey]]>).map(([key, meta]) => {
    const members = institutions.filter((institution) => institution.groupKey === key);
    const totalTarget = members.reduce((sum, m) => sum + m.targetScale, 0);
    const totalActual = members.reduce((sum, m) => sum + m.actualScale, 0);
    const avgCompletionRate = totalTarget > 0 ? totalActual / totalTarget : 0;

    return {
      key,
      title: meta.title,
      count: members.length,
      totalTarget,
      totalActual,
      avgCompletionRate,
      summary: meta.summary,
      decisionBasis: meta.decisionBasis,
      members,
    };
  });

  const targetTotal = institutions.reduce((sum, i) => sum + i.targetScale, 0);
  const actualTotal = institutions.reduce((sum, i) => sum + i.actualScale, 0);

  const data: EvaluationReportData = {
    availableYears: [2025],
    stats: {
      institutionCount: institutions.length,
      targetTotal,
      actualTotal,
      overallCompletionRate: targetTotal > 0 ? actualTotal / targetTotal : 0,
      excellentCount: groups.find((g) => g.key === 'excellent')?.count ?? 0,
      goodCount: groups.find((g) => g.key === 'good')?.count ?? 0,
    },
    institutions,
    groups,
    summary: {
      oneLiner: `2025 年度 ${institutions.length} 家机构累计完成 ${actualTotal.toFixed(2)} 亿元，完成率 ${((targetTotal > 0 ? actualTotal / targetTotal : 0) * 100).toFixed(1)}%。`,
      highlights: [
        `优秀机构 ${groups.find((g) => g.key === 'excellent')?.count ?? 0} 家`,
        `良好机构 ${groups.find((g) => g.key === 'good')?.count ?? 0} 家`,
        '整体完成率达标',
      ],
      executionNotes: [
        '按完成率四档分类展示',
        '突出优秀与良好机构',
        '重点督导待改进机构',
      ],
    },
    report: buildReport({ institutions, groups }),
  };

  await fs.writeFile(cachePath, JSON.stringify(data, null, 2), 'utf8');
  return data;
}
