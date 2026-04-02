content = '''import { createHash } from 'node:crypto';
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
  scaleCompletionRate: z.number(),
  targetCustomerRatio: z.number(),
  actualCustomerRatio: z.number(),
  customerRatioCompletionRate: z.number(),
  targetReGuarantee: z.number(),
  actualReGuarantee: z.number(),
  reGuaranteeCompletionRate: z.number(),
  targetRiskShare: z.number(),
  actualRiskShare: z.number(),
  riskShareCompletionRate: z.number(),
  targetLeverage: z.number(),
  actualLeverage: z.number(),
  leverageCompletionRate: z.number(),
  targetCompensationRate: z.number(),
  actualCompensationRate: z.number(),
  compensationRateStatus: z.string(),
  targetRecoveryRate: z.number(),
  actualRecoveryRate: z.number(),
  recoveryRateCompletionRate: z.number(),
  policyScore: z.number(),
  overallStatus: z.enum(['优秀', '良好', '达标', '待改进']),
});

type SpreadsheetInstitution = z.infer<typeof spreadsheetInstitutionSchema>;

export type EvaluationGroupKey = SpreadsheetInstitution['overallStatus'];

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
  '优秀': {
    title: '优秀（8 项指标≥6 项达标）',
    summary: '大部分政策目标完成良好，业务质量与风险控制均衡。',
    decisionBasis: '给予表彰并优先配置资源。',
    members: [],
  },
  '良好': {
    title: '良好（8 项指标 4-5 项达标）',
    summary: '部分指标完成较好，但仍有提升空间。',
    decisionBasis: '继续保持良好发展态势。',
    members: [],
  },
  '达标': {
    title: '达标（8 项指标 3 项达标）',
    summary: '基本完成核心目标，需加强业务拓展与风险控制。',
    decisionBasis: '需加强业务拓展与风险控制。',
    members: [],
  },
  '待改进': {
    title: '待改进（8 项指标<3 项达标）',
    summary: '多数指标未达标，需重点督导改进。',
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

function isTargetMet(completionRate: number, status?: string): boolean {
  if (status) return status === '达标' || status.includes('达标');
  return completionRate >= 1.0;
}

function detectOverallStatus(metrics: {
  scaleRate: number;
  customerRatioRate: number;
  reGuaranteeRate: number;
  riskShareRate: number;
  leverageRate: number;
  compensationStatus: string;
  recoveryRate: number;
  filingRate?: number;
}): EvaluationGroupKey {
  let metCount = 0;
  
  if (isTargetMet(metrics.scaleRate)) metCount++;
  if (isTargetMet(metrics.customerRatioRate)) metCount++;
  if (isTargetMet(metrics.reGuaranteeRate)) metCount++;
  if (isTargetMet(metrics.riskShareRate)) metCount++;
  if (isTargetMet(metrics.leverageRate)) metCount++;
  if (isTargetMet(0, metrics.compensationStatus)) metCount++;
  if (isTargetMet(metrics.recoveryRate)) metCount++;
  if (metrics.filingRate && isTargetMet(metrics.filingRate)) metCount++;
  
  if (metCount >= 6) return '优秀';
  if (metCount >= 4) return '良好';
  if (metCount >= 3) return '达标';
  return '待改进';
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

  return dataRows.map((row, index) => {
    const name = String(row[1] ?? '');
    
    const targetScale = Number(row[2]) || 0;
    const actualScale = Number(row[3]) || 0;
    const scaleCompletionRate = targetScale > 0 ? actualScale / targetScale : 0;
    
    const targetCustomerRatio = Number(row[4]) || 0;
    const actualCustomerRatio = Number(row[5]) || 0;
    const customerRatioCompletionRate = targetCustomerRatio > 0 ? actualCustomerRatio / targetCustomerRatio : 0;
    
    const targetReGuarantee = Number(row[6]) || 0;
    const actualReGuarantee = Number(row[7]) || 0;
    const reGuaranteeCompletionRate = targetReGuarantee > 0 ? actualReGuarantee / targetReGuarantee : 0;
    
    const targetRiskShare = Number(row[8]) || 0;
    const actualRiskShare = Number(row[9]) || 0;
    const riskShareCompletionRate = targetRiskShare > 0 ? actualRiskShare / targetRiskShare : 0;
    
    const targetLeverage = Number(row[10]) || 0;
    const actualLeverage = Number(row[11]) || 0;
    const leverageCompletionRate = targetLeverage > 0 ? actualLeverage / targetLeverage : 0;
    
    const targetCompensationRate = Number(row[12]) || 0;
    const actualCompensationRate = Number(row[13]) || 0;
    const compensationRateStatus = String(row[14] ?? '');
    
    const targetRecoveryRate = Number(row[15]) || 0;
    const actualRecoveryRate = Number(row[16]) || 0;
    const recoveryRateCompletionRate = targetRecoveryRate > 0 ? actualRecoveryRate / targetRecoveryRate : 0;
    
    const filingRate = Number(row[17]) || 0;
    const policyScore = Number(row[18]) || 0;
    
    const overallStatus = detectOverallStatus({
      scaleRate: scaleCompletionRate,
      customerRatioRate: customerRatioCompletionRate,
      reGuaranteeRate: reGuaranteeCompletionRate,
      riskShareRate: riskShareCompletionRate,
      leverageRate: leverageCompletionRate,
      compensationStatus: compensationRateStatus,
      recoveryRate: recoveryRateCompletionRate,
      filingRate,
    });
    
    return spreadsheetInstitutionSchema.parse({
      id: `eval-${String(index + 1).padStart(2, '0')}`,
      name,
      shortName: SHORT_NAME_MAP[name] ?? name.replace(/(融资担保股份有限公司 | 融资担保集团有限公司 | 融资担保有限责任公司 | 融资担保有限公司 | 中小企业融资担保有限责任公司)$/u, ''),
      regionLevel: normalizeRegionLevel(name),
      rating: String(row[19] ?? ''),
      targetScale,
      actualScale,
      scaleCompletionRate,
      targetCustomerRatio,
      actualCustomerRatio,
      customerRatioCompletionRate,
      targetReGuarantee,
      actualReGuarantee,
      reGuaranteeCompletionRate,
      targetRiskShare,
      actualRiskShare,
      riskShareCompletionRate,
      targetLeverage,
      actualLeverage,
      leverageCompletionRate,
      targetCompensationRate,
      actualCompensationRate,
      compensationRateStatus,
      targetRecoveryRate,
      actualRecoveryRate,
      recoveryRateCompletionRate,
      policyScore,
      overallStatus,
    });
  });
}

function buildReport({ institutions, groups }: Pick<EvaluationReportData, 'institutions' | 'groups'>) {
  const totalTarget = institutions.reduce((sum, i) => sum + i.targetScale, 0);
  const totalActual = institutions.reduce((sum, i) => sum + i.actualScale, 0);
  const overallRate = totalTarget > 0 ? totalActual / totalTarget : 0;

  return {
    title: '2025 年度合作担保机构评价报告',
    reportNo: '陕再担评〔2026〕1 号',
    createdAt: new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }),
    department: '陕西省信用再担保有限责任公司',
    sections: [
      {
        title: '一、总体情况',
        body: [
          `2025 年度纳入评价范围的合作担保机构共 ${institutions.length} 家。从评价结果看，优秀机构 ${groups.find((g) => g.key === '优秀')?.count ?? 0} 家，良好机构 ${groups.find((g) => g.key === '良好')?.count ?? 0} 家，达标机构 ${groups.find((g) => g.key === '达标')?.count ?? 0} 家，待改进机构 ${groups.find((g) => g.key === '待改进')?.count ?? 0} 家。`,
          `全年累计完成新增担保业务规模${totalActual.toFixed(2)}亿元，整体完成率${(overallRate * 100).toFixed(1)}%。`,
        ],
      },
      {
        title: '二、分组评价',
        body: groups.flatMap((group) => [
          `${group.title}：共${group.count}家机构。${group.summary}${group.decisionBasis}`,
        ]),
      },
      {
        title: '三、主要特点',
        body: [
          '优秀机构各项指标完成均衡，支小支农占比普遍达标。',
          '部分机构受宏观经济影响，业务规模拓展不及预期。',
          '风险控制在合理区间，代偿率整体可控。',
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
      '8 项指标≥6 项达标为优秀',
      '8 项指标 4-5 项达标为良好',
      '8 项指标 3 项达标为达标',
      '8 项指标<3 项达标为待改进',
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
    displayLabel: GROUP_META[institution.overallStatus].title,
    remark: '',
  }));

  const groups = (Object.entries(GROUP_META) as Array<[EvaluationGroupKey, (typeof GROUP_META)[EvaluationGroupKey]]>).map(([key, meta]) => {
    const members = institutions.filter((institution) => institution.overallStatus === key);
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
      excellentCount: groups.find((g) => g.key === '优秀')?.count ?? 0,
      goodCount: groups.find((g) => g.key === '良好')?.count ?? 0,
    },
    institutions,
    groups,
    summary: {
      oneLiner: `2025 年度 ${institutions.length} 家机构累计完成 ${actualTotal.toFixed(2)} 亿元，完成率 ${((targetTotal > 0 ? actualTotal / targetTotal : 0) * 100).toFixed(1)}%。`,
      highlights: [
        `优秀机构 ${groups.find((g) => g.key === '优秀')?.count ?? 0} 家`,
        `良好机构 ${groups.find((g) => g.key === '良好')?.count ?? 0} 家`,
        '整体完成率达标',
      ],
      executionNotes: [
        '按 8 项核心指标达标数量分类展示',
        '突出优秀与良好机构',
        '重点督导待改进机构',
      ],
    },
    report: buildReport({ institutions, groups }),
  };

  await fs.writeFile(cachePath, JSON.stringify(data, null, 2), 'utf8');
  return data;
}
'''

with open('D:/zj-17/sxzd_demo-main/lib/server/evaluation-report.ts', 'w', encoding='utf-8', newline='\n') as f:
    f.write(content)
print('File created successfully')
