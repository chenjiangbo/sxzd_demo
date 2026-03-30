import Link from 'next/link';
import RebuildCacheButton from '@/components/RebuildCacheButton';
import ClearStepArtifactsButton from '@/components/ClearStepArtifactsButton';
import StepTransitionButton from '@/components/StepTransitionButton';
import IntegrityChecklistTable from '@/components/IntegrityChecklistTable';
import {
  AlertTriangle,
  ArrowRight,
  Calculator,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Download,
  ExternalLink,
  FileCheck2,
  FileSearch,
  FileText,
  FolderTree,
  GanttChartSquare,
  ListChecks,
  Network,
  CircleSlash,
  Scale,
  ScanSearch,
  Send,
  Sparkles,
} from 'lucide-react';
import type { AnalysisDocument, CaseAnalysis, MaterialItem, RuleResult } from '@/lib/server/case-analysis';
import type { StepArtifact } from '@/lib/server/step-artifacts';
import { getStep, WORKBENCH_STEPS } from '@/lib/workbench';

type Props = {
  currentStepKey?: string;
  analysis: CaseAnalysis;
  selectedDocumentId?: string;
  selectedMaterialName?: string;
  selectedRuleName?: string;
  selectedDraftKey?: 'worksheet' | 'approval' | 'oa';
  stepArtifact?: StepArtifact;
};

function stepStatusLabel(stepKey: string, analysis: CaseAnalysis) {
  if (stepKey === 'integrity' && analysis.metrics.missingCount > 0) {
    return '待确认';
  }
  if (stepKey === 'verify' && analysis.rules.some((item) => item.conclusion === '待确认')) {
    return '待确认';
  }
  if (stepKey === 'review') {
    return '待提交';
  }
  return '已完成';
}

function statusClasses(stepKey: string, analysis: CaseAnalysis) {
  const label = stepStatusLabel(stepKey, analysis);
  if (label === '待确认') {
    return {
      dot: 'bg-primary text-white',
      card: 'border-amber-200 bg-amber-50',
      badge: 'bg-amber-100 text-amber-700',
      icon: 'bg-surface-container text-primary',
      complete: false,
      label,
    };
  }
  if (label === '待提交') {
    return {
      dot: 'bg-slate-200 text-slate-600',
      card: 'border-slate-200 bg-slate-50/70',
      badge: 'bg-slate-100 text-on-surface-variant',
      icon: 'bg-white text-slate-500',
      complete: false,
      label,
    };
  }
  return {
    dot: 'bg-emerald-500 text-white',
    card: 'border-emerald-200 bg-emerald-50/70',
    badge: 'bg-emerald-100 text-emerald-700',
    icon: 'bg-white text-emerald-600',
    complete: true,
    label,
  };
}

function formatMaterialStatus(status: MaterialItem['status']) {
  if (status === '已匹配') return 'bg-tertiary-fixed-dim/20 text-on-tertiary-container';
  if (status === '待确认') return 'bg-secondary/10 text-secondary';
  if (status === '缺失') return 'bg-error-container text-error';
  return 'bg-surface-container text-on-surface-variant';
}

function formatRuleStatus(conclusion: RuleResult['conclusion']) {
  if (conclusion === '通过') return 'bg-tertiary-fixed-dim/20 text-on-tertiary-container';
  if (conclusion === '待确认') return 'bg-amber-100 text-amber-700';
  return 'bg-error-container text-error';
}

function Stepper({ currentStepKey, analysis }: { currentStepKey: string; analysis: CaseAnalysis }) {
  const iconMap = {
    overview: FolderTree,
    integrity: FileCheck2,
    verify: Scale,
    document: FileText,
    review: ClipboardCheck,
  } as const;

  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-black text-primary">案件处理流程</h2>
          <p className="text-xs text-on-surface-variant">单笔案件按步骤推进，可回看已完成步骤。</p>
        </div>
        <div className="rounded-full bg-surface-container-low px-3 py-1 text-[11px] font-bold text-on-surface-variant">
          材料 {analysis.metrics.documentCount} 份 / 已匹配 {analysis.metrics.matchedCount} / 缺失 {analysis.metrics.missingCount}
        </div>
      </div>

      <div className="overflow-x-auto pb-1 xl:overflow-visible">
        <div className="flex min-w-max items-stretch gap-1.5 xl:min-w-0 xl:w-full">
          {WORKBENCH_STEPS.map((step, index) => {
            const style = statusClasses(step.key, analysis);
            const active = currentStepKey === step.key;
            const Icon = iconMap[step.key as keyof typeof iconMap] ?? FolderTree;
            const activeCard = 'border-primary bg-primary text-white shadow-lg shadow-primary/15';
            const activeBadge = 'bg-white/15 text-white';
            const activeNumber = 'bg-white text-primary';
            const activeIcon = 'bg-white/10 text-white';
            return (
              <div key={step.key} className="flex items-center xl:min-w-0 xl:flex-1">
                <Link
                  href={`/cases/workbench?step=${step.key}`}
                  className={`relative min-h-[82px] w-[152px] shrink-0 rounded-2xl border p-2.5 transition-all xl:w-full xl:min-w-0 ${
                    active ? activeCard : `${style.card} hover:border-secondary/30 hover:shadow-sm`
                  }`}
                >
                  <div className="flex h-full flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black ${active ? activeNumber : style.dot}`}>
                          {step.number}
                        </span>
                        <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${active ? activeIcon : style.icon}`}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                      </div>
                      <div className={active ? 'text-white' : ''}>
                        <p className="mt-1.5 text-[12px] font-black leading-tight">{step.shortTitle}</p>
                        <p className={`mt-0.5 text-[10px] leading-snug ${active ? 'text-white/80' : 'text-on-surface-variant'}`}>
                          {step.description}
                        </p>
                      </div>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between gap-2">
                      {!active && style.complete ? (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm" title="已完成">
                            <CheckCircle2 className="h-3 w-3" />
                          </span>
                          <span className="text-[10px] font-bold text-emerald-700">已完成</span>
                        </div>
                      ) : (
                        <span className={`inline-flex w-fit rounded-full px-2 py-1 text-[9px] font-bold ${active ? activeBadge : style.badge}`}>
                          {style.label}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
                {index < WORKBENCH_STEPS.length - 1 ? (
                  <div className="flex items-center justify-center px-0.5">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-surface-container-low text-primary">
                      <ArrowRight className="h-3 w-3" />
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function buildOverviewTags(analysis: CaseAnalysis) {
  return [
    '代偿补偿',
    analysis.keyFacts.productName,
    `主债权 ${analysis.summary.amount}`,
  ].filter(Boolean);
}

function buildTextSnippet(text: string | null | undefined, keywords: string[], fallbackLength = 180) {
  const normalized = text?.replace(/\s+/g, ' ').trim();
  if (!normalized) return '当前缓存中未提取到稳定正文片段。';

  for (const keyword of keywords.filter(Boolean)) {
    const index = normalized.indexOf(keyword);
    if (index >= 0) {
      const start = Math.max(0, index - 48);
      const end = Math.min(normalized.length, index + Math.max(keyword.length + 96, 140));
      return normalized.slice(start, end);
    }
  }

  return normalized.slice(0, fallbackLength);
}

function findDocumentsByNames(analysis: CaseAnalysis, fileNames: string[]) {
  const wanted = new Set(fileNames);
  return analysis.documents.filter((document) => wanted.has(document.name));
}

function buildMaterialSnippet(item: MaterialItem, analysis: CaseAnalysis) {
  const documents = findDocumentsByNames(analysis, item.matchedFiles);
  const primaryDocument = documents[0];
  const snippet = buildTextSnippet(
    primaryDocument?.extractedText ?? primaryDocument?.previewText,
    [item.name, analysis.summary.company, analysis.keyFacts.contractNo, analysis.keyFacts.unifiedCode],
  );

  return {
    documents,
    primaryDocument,
    snippet,
  };
}

function buildRuleEvidence(rule: RuleResult, analysis: CaseAnalysis) {
  const evidenceMap: Record<string, { docNames: string[]; materials: string[] }> = {
    债务人名称一致: {
      docNames: ['1+代偿补偿函-三家村.pdf', '1 代偿补偿函-三家村.pdf', 'tmp备案数据_1772420814804.xlsx', 'tmp解保台账数据_1772421102442.xlsx'],
      materials: ['代偿补偿申请函', '债务人基础资料'],
    },
    统一社会信用代码一致: {
      docNames: ['3营业执照及申请书.pdf', 'tmp备案数据_1772420814804.xlsx'],
      materials: ['债务人基础资料'],
    },
    借款合同号一致: {
      docNames: ['tmp备案数据_1772420814804.xlsx', '5.1 展期协议-2024.pdf'],
      materials: ['借款合同'],
    },
    保证合同号一致: {
      docNames: ['tmp备案数据_1772420814804.xlsx', '5.2 担保承诺函-2024.pdf'],
      materials: ['保证合同'],
    },
    委保合同号一致: {
      docNames: ['tmp备案数据_1772420814804.xlsx', '5.3 委保合同-2024.pdf'],
      materials: ['委托担保合同'],
    },
    '申报时效是否在 120 日内': {
      docNames: ['tmp解保台账数据_1772421102442.xlsx'],
      materials: ['代偿证明 / 代偿通知'],
    },
    '补偿金额是否等于未清偿本金 × 40%': {
      docNames: ['1+代偿补偿函-三家村.pdf', '1 代偿补偿函-三家村.pdf', 'tmp解保台账数据_1772421102442.xlsx'],
      materials: ['代偿补偿申请函', '代偿支付凭证 / 银行流水'],
    },
    '首次备案与展期记录是否可关联': {
      docNames: ['tmp备案数据_1772420814804.xlsx', '5.1 展期协议-2024.pdf'],
      materials: ['借款合同', '委托担保合同'],
    },
    '材料缺失是否影响继续': {
      docNames: ['1+代偿补偿函-三家村.pdf', '2 代偿审批文件.pdf'],
      materials: ['代偿补偿申请函', '代偿审批文件'],
    },
  };

  const config = evidenceMap[rule.name] ?? { docNames: [], materials: [] };
  const documents = findDocumentsByNames(analysis, config.docNames);
  const primaryDocument = documents[0];

  return {
    documents,
    materials: config.materials,
    snippet: buildTextSnippet(
      primaryDocument?.extractedText ?? primaryDocument?.previewText,
      [analysis.keyFacts.contractNo, analysis.keyFacts.guaranteeNo, analysis.keyFacts.entrustNo, analysis.keyFacts.compensationAmount, analysis.summary.company],
    ),
  };
}

function buildPendingReviewItems(analysis: CaseAnalysis) {
  const items = [
    ...analysis.rules
      .filter((rule) => rule.conclusion === '待确认')
      .map((rule) => ({
        title: rule.name,
        detail: rule.explanation,
        severity: '中风险',
      })),
    ...analysis.risks.map((risk) => ({
      title: risk.title,
      detail: risk.reason,
      severity: risk.impact === 'block' ? '高风险' : risk.impact === 'review' ? '中风险' : '低风险',
    })),
  ];

  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.title)) return false;
    seen.add(item.title);
    return true;
  });
}

function buildDiffRows(analysis: CaseAnalysis) {
  return [
    {
      name: '债权人名称标准化',
      raw: '陕西岐山农村商业银行 / 陕西岐山农村商业银行股份有限公司',
      normalized: analysis.summary.bank,
      result: '已统一归一后用于成文',
    },
    {
      name: '借款合同口径',
      raw: `${analysis.keyFacts.initialContractNo ?? '首次业务合同'} / ${analysis.keyFacts.contractNo}`,
      normalized: `当前展期业务采用 ${analysis.keyFacts.contractNo}`,
      result: '首次备案与展期业务已分层保留',
    },
    {
      name: '法定代表人口径',
      raw: analysis.keyFacts.originalLegalRep,
      normalized: analysis.keyFacts.currentLegalRep ? `${analysis.keyFacts.originalLegalRep} / ${analysis.keyFacts.currentLegalRep}` : analysis.keyFacts.originalLegalRep,
      result: analysis.keyFacts.currentLegalRep ? '存在变更，待人工确认连续性' : '当前仅识别到备案法代信息',
    },
    {
      name: '补偿金额成文口径',
      raw: `未清偿本金 ${analysis.keyFacts.uncompensatedPrincipal} 元`,
      normalized: `建议补偿金额 ${analysis.keyFacts.compensationAmount} 元`,
      result: `按 ${analysis.keyFacts.reGuaranteeRatio} 责任比例程序计算`,
    },
  ];
}

function impactBadge(impact: 'continue' | 'review' | 'block') {
  if (impact === 'block') return 'bg-error-container text-error';
  if (impact === 'review') return 'bg-amber-100 text-amber-700';
  return 'bg-tertiary-fixed-dim/20 text-on-tertiary-container';
}

function StepArtifactPanel({
  title,
  artifact,
  tone = 'primary',
}: {
  title: string;
  artifact?: StepArtifact;
  tone?: 'primary' | 'light';
}) {
  if (!artifact) return null;

  const boxClass =
    tone === 'primary'
      ? 'rounded-2xl bg-primary p-4 text-white shadow-xl shadow-primary/15'
      : 'rounded-2xl border border-slate-100 bg-white p-4 shadow-sm';
  const titleClass = tone === 'primary' ? 'text-lg font-black text-white' : 'text-lg font-black text-primary';
  const bodyClass = tone === 'primary' ? 'text-sm leading-relaxed text-white/88' : 'text-sm leading-relaxed text-on-surface-variant';
  const chipClass =
    tone === 'primary'
      ? 'bg-white/10 text-white'
      : 'bg-surface-container-low text-primary';

  return (
    <div className={boxClass}>
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className={`h-5 w-5 ${tone === 'primary' ? 'text-tertiary-fixed-dim' : 'text-secondary'}`} />
        <h3 className={titleClass}>{title}</h3>
      </div>
      <p className={bodyClass}>{artifact.summary}</p>
      {artifact.highlights.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {artifact.highlights.slice(0, 2).map((item) => (
            <span key={item} className={`rounded-full px-3 py-1 text-[11px] font-bold ${chipClass}`}>
              {item}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function buildMaterialGroups(analysis: CaseAnalysis) {
  const groups = [
    {
      title: '申报主文类',
      match: (name: string) => name.includes('代偿补偿函') || name.includes('申请'),
    },
    {
      title: '合同类',
      match: (name: string) => name.includes('合同') || name.includes('借据') || name.includes('担保承诺函') || name.includes('展期'),
    },
    {
      title: '主体证明类',
      match: (name: string) => name.includes('营业执照') || name.includes('创业担保') || name.includes('小微企业'),
    },
    {
      title: '代偿与支付类',
      match: (name: string) => name.includes('代偿') || name.includes('扣划') || name.includes('承保责任确认函') || name.includes('解除担保责任证明') || name.includes('支付凭证') || name.includes('流水'),
    },
    {
      title: '用途追溯与历史说明类',
      match: (name: string) => name.includes('用途举证') || name.includes('追溯'),
    },
    {
      title: '系统台账类',
      match: (name: string) => name.includes('备案数据') || name.includes('解保台账'),
    },
  ];

  const assignedIds = new Set<string>();
  const builtGroups = groups.map((group) => {
    const files = analysis.documents.filter((item) => group.match(item.name));
    files.forEach((item) => assignedIds.add(item.id));
    const joined = files.map((item) => item.name).join(' / ');
    const hasParallel = files.some((item) => item.name.includes('营业执照') || item.name.includes('创业担保') || item.name.includes('小微企业'));
    const hasPending =
      group.title === '用途追溯与历史说明类' ||
      analysis.materials.some((item) => item.status === '待确认' && joined.includes(item.matchedFiles[0] ?? ''));
    const hasMissing = group.title === '代偿与支付类' ? false : group.title === '系统台账类' ? false : group.title === '申报主文类' ? false : false;
    const status = hasParallel ? '同项多份' : hasPending ? '需人工确认' : hasMissing ? '存在缺失' : '已完成分类';

    return {
      title: group.title,
      count: files.length,
      status,
      files: files.map((item) => item.name),
    };
  });

  const otherFiles = analysis.documents.filter((item) => !assignedIds.has(item.id));
  if (otherFiles.length > 0) {
    builtGroups.push({
      title: '其他材料',
      count: otherFiles.length,
      status: '已完成分类',
      files: otherFiles.map((item) => item.name),
    });
  }

  return builtGroups;
}

function findDocumentByName(analysis: CaseAnalysis, fileName?: string) {
  if (!fileName) return null;
  return analysis.documents.find((document) => document.name === fileName) ?? null;
}

function buildSourceDocumentLink(document?: AnalysisDocument | null) {
  return document ? `/api/source-document?id=${document.id}` : '#';
}

function OverviewContent({ analysis }: { analysis: CaseAnalysis }) {
  const materialGroups = buildMaterialGroups(analysis);
  const groupedFileCount = materialGroups.reduce((sum, item) => sum + item.count, 0);
  const parallelMaterialCount = materialGroups.filter((item) => item.status === '同项多份').length;
  const ungroupedFileCount = Math.max(0, analysis.metrics.documentCount - groupedFileCount);
  const overviewTags = buildOverviewTags(analysis);
  const recordDocument = analysis.documents.find((item) => item.name.includes('备案数据'));
  const resolveDocument = analysis.documents.find((item) => item.name.includes('解保台账'));

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-secondary">Case Overview</p>
            <h2 className="mt-1.5 text-2xl font-black text-primary">{analysis.summary.company}项目代偿补偿案件总览</h2>
            <p className="mt-1.5 text-sm text-on-surface-variant">本页用于查看案件基础信息、业务链路、材料归集情况及 AI 初步分析结果。</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {overviewTags.map((tag) => (
                <span key={tag} className="rounded-full border border-slate-200 bg-surface-container-low px-3 py-1 text-[11px] font-bold text-primary">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={buildSourceDocumentLink(recordDocument)}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50"
            >
              查看台账
            </a>
            {resolveDocument ? (
              <a
                href={buildSourceDocumentLink(resolveDocument)}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50"
              >
                查看解保台账
              </a>
            ) : null}
            <a href="/api/material-package" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50">
              <Download className="h-4 w-4" />
              导出材料包
            </a>
            <RebuildCacheButton step="overview" compact />
            <ClearStepArtifactsButton step="overview" compact />
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Clock3 className="h-5 w-5 text-secondary" />
            <div>
              <h3 className="text-lg font-black text-primary">业务链路时间轴</h3>
              <p className="text-xs text-on-surface-variant">展示本案从首次备案、展期续接到代偿补偿申报的完整链路。</p>
            </div>
          </div>

          <div className="grid gap-3 xl:grid-cols-7">
              {analysis.timeline.map((item, index) => (
                <div key={`${item.date}-${item.title}`} className="min-w-0 rounded-2xl border border-slate-100 bg-surface-container-low p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-tertiary-fixed-dim/20 text-[10px] font-black text-secondary">{String(index + 1).padStart(2, '0')}</span>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-secondary">{item.date}</p>
                      <p className="text-[14px] font-black leading-tight text-primary">{item.title}</p>
                    </div>
                  </div>
                  <p className="mt-2 text-[11px] font-semibold leading-snug text-secondary">{item.source}</p>
                </div>
              ))}
          </div>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-secondary" />
            <div>
              <h3 className="text-lg font-black text-primary">案件主画像</h3>
              <p className="text-xs text-on-surface-variant">展示本案的主体信息、业务属性、金额口径和当前审查定位。</p>
            </div>
          </div>

          <div className="grid gap-3 xl:grid-cols-3">
            <div className="rounded-2xl bg-surface-container-low p-3.5">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-secondary">主体信息</p>
              <div className="mt-3 space-y-2.5 text-[14px]">
                <div className="flex justify-between gap-4"><span className="text-on-surface-variant">债务人名称</span><span className="font-bold text-primary">{analysis.summary.company}</span></div>
                <div className="flex justify-between gap-4"><span className="text-on-surface-variant">统一社会信用代码</span><span className="font-bold text-primary">{analysis.keyFacts.unifiedCode}</span></div>
                {analysis.keyFacts.originalLegalRep ? (
                  <div className="flex justify-between gap-4"><span className="text-on-surface-variant">备案法定代表人</span><span className="font-bold text-primary">{analysis.keyFacts.originalLegalRep}</span></div>
                ) : null}
                <div className="flex justify-between gap-4"><span className="text-on-surface-variant">担保机构</span><span className="text-right font-bold text-primary">{analysis.summary.guarantor}</span></div>
                <div className="flex justify-between gap-4"><span className="text-on-surface-variant">债权人</span><span className="text-right font-bold text-primary">{analysis.summary.bank}</span></div>
              </div>
            </div>

            <div className="rounded-2xl bg-surface-container-low p-3.5">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-secondary">业务属性</p>
              <div className="mt-3 grid gap-2.5 text-[14px]">
                <div className="flex justify-between gap-4"><span className="text-on-surface-variant">业务类型</span><span className="font-bold text-primary">代偿补偿</span></div>
                <div className="flex justify-between gap-4"><span className="text-on-surface-variant">产品类别</span><span className="font-bold text-primary">{analysis.keyFacts.productName}</span></div>
                <div className="flex justify-between gap-4"><span className="text-on-surface-variant">当前业务编号</span><span className="font-bold text-primary">{analysis.keyFacts.businessNo}</span></div>
                {analysis.keyFacts.initialBusinessNo ? (
                  <div className="flex justify-between gap-4"><span className="text-on-surface-variant">首次备案业务编号</span><span className="font-bold text-primary">{analysis.keyFacts.initialBusinessNo}</span></div>
                ) : null}
                <div className="flex justify-between gap-4"><span className="text-on-surface-variant">备案业务形态</span><span className="font-bold text-primary">{analysis.keyFacts.businessType}</span></div>
                <div className="flex justify-between gap-4"><span className="text-on-surface-variant">当前状态</span><span className="font-bold text-primary">待材料完整性检查</span></div>
                <div className="flex justify-between gap-4"><span className="text-on-surface-variant">审查方式</span><span className="font-bold text-primary">单笔单审</span></div>
                {analysis.keyFacts.directSubmitDate ? (
                  <div className="flex justify-between gap-4"><span className="text-on-surface-variant">直担提报日期</span><span className="font-bold text-primary">{analysis.keyFacts.directSubmitDate}</span></div>
                ) : null}
              </div>
            </div>

            <div className="rounded-2xl bg-surface-container-low p-3.5">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-secondary">金额与责任口径</p>
              <div className="mt-3 grid gap-2.5 text-[14px]">
                <div className="flex justify-between gap-4"><span className="text-on-surface-variant">主债权金额</span><span className="font-bold text-primary">{analysis.summary.amount}</span></div>
                <div className="flex justify-between gap-4"><span className="text-on-surface-variant">主债权起始日期</span><span className="font-bold text-primary">{analysis.keyFacts.debtStartDate}</span></div>
                <div className="flex justify-between gap-4"><span className="text-on-surface-variant">主债权到期日期</span><span className="font-bold text-primary">{analysis.keyFacts.debtMaturityDate}</span></div>
                {analysis.keyFacts.extensionStartDate ? (
                  <div className="flex justify-between gap-4"><span className="text-on-surface-variant">展期起始日期</span><span className="font-bold text-primary">{analysis.keyFacts.extensionStartDate}</span></div>
                ) : null}
                <div className="flex justify-between gap-4"><span className="text-on-surface-variant">代偿日期</span><span className="font-bold text-primary">{analysis.keyFacts.compensationDate}</span></div>
                <div className="flex justify-between gap-4"><span className="text-on-surface-variant">未清偿本金</span><span className="font-bold text-primary">{analysis.keyFacts.uncompensatedPrincipal} 元</span></div>
                <div className="flex justify-between gap-4"><span className="text-on-surface-variant">原担保机构代偿金额</span><span className="font-bold text-primary">{analysis.keyFacts.indemnityAmount} 元</span></div>
                <div className="flex justify-between gap-4"><span className="text-on-surface-variant">省级再担责任比例</span><span className="font-bold text-primary">{analysis.keyFacts.reGuaranteeRatio}</span></div>
                <div className="flex justify-between gap-4"><span className="text-on-surface-variant">建议补偿金额</span><span className="font-bold text-secondary">{analysis.keyFacts.compensationAmount} 元</span></div>
              </div>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3.5 xl:col-span-3">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-amber-700">风险提示</p>
              <div className="mt-3 grid gap-3 xl:grid-cols-3">
                {analysis.risks.slice(0, 3).map((risk) => (
                  <div key={`${risk.title}-${risk.reason}`} className="rounded-2xl bg-white p-3 shadow-sm">
                    <p className="text-[15px] font-black leading-snug text-amber-700">{risk.title}</p>
                    <p className="mt-2 text-[13px] leading-relaxed text-on-surface-variant">{risk.reason}</p>
                    {risk.recommendedMaterials.length > 0 ? (
                      <p className="mt-2 text-[12px] font-semibold leading-relaxed text-secondary">
                        建议优先查看：{risk.recommendedMaterials.join('、')}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <FolderTree className="h-5 w-5 text-secondary" />
            <div>
              <h3 className="text-lg font-black text-primary">材料总览</h3>
              <p className="text-xs text-on-surface-variant">展示本案资料包的归集数量、分类结构及当前识别状态。</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-6">
            {[
              ['材料总数', String(analysis.metrics.documentCount)],
              ['已完成分组', String(groupedFileCount)],
              ['核心清单项', String(analysis.materials.length)],
              ['已匹配清单项', `${analysis.metrics.matchedCount}/${analysis.materials.length}`],
              ['同项多份', String(parallelMaterialCount)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-surface-container-low p-2.5">
                <p className="text-[11px] font-black uppercase tracking-[0.12em] text-on-surface-variant">{label}</p>
                <p className="mt-1.5 text-lg font-black text-primary">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-[13px] leading-relaxed text-on-surface-variant">
            <p>材料总数：原始目录下的物理文件总数。</p>
            <p className="mt-1">已完成分组：已经归入“申报主文类、合同类、主体证明类、代偿与支付类、用途追溯与历史说明类、系统台账类、其他材料”的文件数。当前未归入分组：{ungroupedFileCount}。</p>
            <p className="mt-1">核心清单项：本案审查使用的 10 项核心材料要求；已匹配清单项表示这 10 项里已经找到对应文件的数量。</p>
            <p className="mt-1">同项多份：同一个材料要求命中了多份文件，例如同类合同的历史版和展期版同时存在。</p>
          </div>

          <div className="mt-4 space-y-3">
            {materialGroups.map((group) => (
              <details key={group.title} className="rounded-2xl border border-slate-100 bg-surface-container-low px-4 py-2.5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-primary">{group.title}</p>
                    <p className="mt-1 text-xs text-on-surface-variant">{group.count} 份文件</p>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-[11px] font-bold ${group.status === '同项多份' ? 'bg-amber-100 text-amber-700' : group.status === '需人工确认' ? 'bg-secondary/10 text-secondary' : 'bg-white text-on-surface-variant'}`}>
                    {group.status}
                  </span>
                </summary>
                <div className="mt-3 space-y-2 border-t border-slate-200 pt-3 text-xs text-on-surface-variant">
                  {group.files.length > 0 ? group.files.map((file) => <p key={file}>{file}</p>) : <p>当前未归集到该分组文件。</p>}
                </div>
              </details>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-secondary" />
            <div>
              <h3 className="text-lg font-black text-primary">AI 初检摘要</h3>
              <p className="text-xs text-on-surface-variant">展示系统对本案已完成的初步识别结果。</p>
            </div>
          </div>
          <div className="rounded-2xl bg-primary p-4 text-white">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-tertiary-fixed-dim">初步判断</p>
            <p className="mt-3 text-[14px] leading-relaxed text-white/88">
              系统已完成本案主数据绑定与整包材料的全文抽取，并把结构化结果缓存供后续步骤复用。当前识别出的业务链路为“首次备案 → 展期续接 → 代偿解保 → 补偿资料入台账”，依据台账与材料抽取结果，未清偿本金为 {analysis.keyFacts.uncompensatedPrincipal} 元，省再担责任比例为 {analysis.keyFacts.reGuaranteeRatio}，当前建议补偿金额为 {analysis.keyFacts.compensationAmount} 元。
            </p>
          </div>
        </section>
      </section>
    </div>
  );
}

function IntegrityContent({ analysis, stepArtifact }: { analysis: CaseAnalysis; stepArtifact?: StepArtifact }) {
  const total = analysis.materials.length;
  const checklistItems = analysis.materials.map((item) => {
    const evidence = buildMaterialSnippet(item, analysis);
    return {
      name: item.name,
      status: item.status,
      aiReason: item.aiReason,
      manualAttention: item.manualAttention,
      snippet: evidence.snippet,
      files: evidence.documents.map((document) => ({
        name: document.name,
        url: buildSourceDocumentLink(document),
        relativePath: document.relativePath,
        previewText: document.previewText,
      })),
    };
  });

  return (
    <div className="space-y-5">
      <section className="rounded-2xl xl:max-w-[420px]">
        <StepArtifactPanel title="本步检查结论" artifact={stepArtifact} tone="primary" />
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-primary">材料清单</h3>
            <p className="text-xs text-on-surface-variant">检查资料是否齐全、哪些文件已匹配、哪些需要人工确认。点击“查看详情”会在当前页弹窗查看原件。</p>
          </div>
          <div className="rounded-full bg-surface-container-low px-3 py-1 text-[11px] font-bold text-on-surface-variant">
            {total} 项材料 / {analysis.metrics.matchedCount} 已匹配 / {analysis.metrics.pendingCount} 待确认 / {analysis.metrics.missingCount} 缺失
          </div>
        </div>
        <IntegrityChecklistTable items={checklistItems} />
      </section>
    </div>
  );
}

function VerifyContent({ analysis, stepArtifact }: { analysis: CaseAnalysis; stepArtifact?: StepArtifact }) {
  const reportDays = (() => {
    if (!analysis.keyFacts.compensationDate || !analysis.keyFacts.reportDate) return null;
    const start = new Date(analysis.keyFacts.compensationDate);
    const end = new Date(analysis.keyFacts.reportDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
    return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  })();

  return (
    <div className="space-y-6">
      <section className="xl:max-w-[420px]">
        <StepArtifactPanel title="本步分析结论" artifact={stepArtifact} tone="primary" />
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <GanttChartSquare className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-black text-primary">规则命中结果</h3>
        </div>
        <div className="space-y-4">
          {analysis.rules.map((item) => {
            const evidence = buildRuleEvidence(item, analysis);
            return (
              <div key={item.name} className="rounded-2xl border border-slate-100 bg-surface-container-low p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-base font-black text-primary">{item.name}</p>
                    <p className="mt-2 text-sm font-semibold text-secondary">{item.value}</p>
                    <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">{item.explanation}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${formatRuleStatus(item.conclusion)}`}>{item.conclusion}</span>
                </div>

                <details className="mt-4 rounded-xl bg-white px-4 py-3">
                  <summary className="cursor-pointer list-none text-xs font-black uppercase tracking-[0.14em] text-on-surface-variant">
                    查看支撑依据
                  </summary>
                  <div className="mt-3 space-y-3">
                    <p className="rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-on-surface">{evidence.snippet}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {evidence.documents.map((document) => (
                        <a
                          key={`${item.name}-${document.id}`}
                          href={buildSourceDocumentLink(document)}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-full bg-surface-container px-2.5 py-1 text-[11px] font-semibold text-secondary transition-colors hover:bg-slate-100"
                        >
                          {document.name}
                        </a>
                      ))}
                    </div>
                  </div>
                </details>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-tertiary-fixed-dim/20 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Calculator className="h-5 w-5 text-tertiary-container" />
          <h3 className="text-lg font-black text-primary">自动时效与金额计算</h3>
        </div>
        <div className="grid gap-4 xl:grid-cols-3">
          <div className="rounded-xl bg-surface-container-low p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">申报时效</p>
            <p className="mt-2 text-3xl font-black text-primary">{reportDays ?? '--'} 天</p>
            <p className="mt-1 text-[11px] text-on-surface-variant">{analysis.keyFacts.compensationDate} 至 {analysis.keyFacts.reportDate}</p>
            <p className="mt-2 text-[11px] leading-relaxed text-on-surface-variant">当前按解保台账 `tmp解保台账数据_1772421102442.xlsx` 的“操作日期”作为时效截止点计算，因此这里显示到 {analysis.keyFacts.reportDate}。</p>
          </div>
          <div className="rounded-xl bg-surface-container-low p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">补偿责任比例</p>
            <p className="mt-2 text-3xl font-black text-primary">{analysis.keyFacts.reGuaranteeRatio}</p>
            <p className="mt-1 text-[11px] text-on-surface-variant">按省级再担责任比例计算</p>
          </div>
          <div className="rounded-xl bg-tertiary-fixed-dim/10 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-secondary">补偿金额计算</p>
            <p className="mt-2 text-3xl font-black text-secondary">{analysis.keyFacts.compensationAmount} 元</p>
            <p className="mt-2 text-xs text-on-surface-variant">
              {analysis.keyFacts.uncompensatedPrincipal} × {analysis.keyFacts.reGuaranteeRatio} = {analysis.keyFacts.compensationAmount}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function DocumentContent({
  analysis,
  selectedDraftKey = 'approval',
  stepArtifact,
}: {
  analysis: CaseAnalysis;
  selectedDraftKey?: 'worksheet' | 'approval' | 'oa';
  stepArtifact?: StepArtifact;
}) {
  const draftCards = [
    ['worksheet', analysis.drafts.worksheet, '主报告', '合规性自查工作底稿'],
    ['approval', analysis.drafts.approval, '主报告', '再担保代偿补偿审批表'],
  ] as const;
  const activeDraft = selectedDraftKey === 'worksheet' ? analysis.drafts.worksheet : analysis.drafts.approval;
  const oaDraft = analysis.drafts.oa;
  return (
    <div className="grid gap-6 xl:grid-cols-12">
      <section className="space-y-6 xl:col-span-8">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-secondary">Report Center</p>
            <h3 className="mt-1 text-2xl font-black text-primary">核心审查报告</h3>
          </div>
          <span className="rounded-full bg-surface-container-low px-3 py-1 text-[11px] font-bold text-on-surface-variant">已生成 2 份主报告 / 1 份 OA 草稿</span>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {draftCards.map(([key, draft, tag, shortName]) => (
            <Link
              href={`/cases/workbench?step=document&draft=${key}`}
              key={key}
              className={`relative block overflow-hidden rounded-2xl border bg-white p-5 shadow-sm transition-all ${selectedDraftKey === key ? 'border-secondary/30 ring-2 ring-secondary/10' : 'border-slate-100 hover:border-slate-200'}`}
            >
              <div className="mb-4 flex items-center justify-between">
                <span className={`rounded-full px-2 py-1 text-[10px] font-black ${selectedDraftKey === key ? 'bg-primary text-white' : 'bg-tertiary-fixed-dim/15 text-on-tertiary-container'}`}>{tag}</span>
                <FileText className="h-4 w-4 text-slate-300" />
              </div>
              <h3 className="text-base font-black leading-relaxed text-primary">{draft.title || shortName}</h3>
              <p className="mt-3 text-xs leading-relaxed text-on-surface-variant">
                {draft.manualReviewPoints.length > 0 ? `${draft.manualReviewPoints.length} 处人工复核提示` : '无额外人工复核提示'}
              </p>
              <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                <span className={`text-xs font-bold ${selectedDraftKey === key ? 'text-secondary' : 'text-on-surface-variant'}`}>{shortName}</span>
                <span className="text-xs font-bold text-secondary">查看预览</span>
              </div>
            </Link>
          ))}
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-primary">报告预览</h3>
              <p className="text-xs text-on-surface-variant">当前预览的是系统根据前序审查结果生成的正式报告草稿。</p>
            </div>
            <div className="flex gap-2">
              <button className="rounded-lg bg-surface-container-high px-4 py-2 text-sm font-bold text-primary transition-colors hover:bg-surface-container-highest">
                修改
              </button>
              <Link href={`/cases/workbench?step=document&draft=${selectedDraftKey}&refresh=1`} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50">
                重生成
              </Link>
              <a href={`/api/export-draft?kind=${selectedDraftKey}`} className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary/90">
                导出
              </a>
            </div>
          </div>

          <div className="space-y-5 rounded-2xl bg-surface-container-low p-6">
            <div className="text-center">
              <p className="text-xl font-black leading-relaxed tracking-[0.08em] text-primary">{activeDraft.title}</p>
              <p className="mt-2 text-xs text-on-surface-variant">案件编号：{analysis.summary.id} / 借款企业：{analysis.summary.company}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="rounded-xl bg-white p-4">
                <p className="text-xs text-on-surface-variant">借款企业</p>
                <p className="mt-1 font-bold text-primary">{analysis.summary.company}</p>
              </div>
              <div className="rounded-xl bg-white p-4">
                <p className="text-xs text-on-surface-variant">担保机构</p>
                <p className="mt-1 font-bold text-primary">{analysis.summary.guarantor}</p>
              </div>
              <div className="rounded-xl bg-white p-4">
                <p className="text-xs text-on-surface-variant">未清偿本金</p>
                <p className="mt-1 font-bold text-primary">{analysis.keyFacts.uncompensatedPrincipal} 元</p>
              </div>
              <div className="rounded-xl bg-white p-4">
                <p className="text-xs text-on-surface-variant">申请补偿金额</p>
                <p className="mt-1 font-bold text-secondary">{analysis.summary.compensationAmount}</p>
              </div>
            </div>
            <div className="rounded-xl bg-white p-6 shadow-inner">
              <pre className="whitespace-pre-wrap font-body text-[14px] leading-8 text-on-surface">{activeDraft.body}</pre>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6 xl:col-span-4">
        <StepArtifactPanel title="本步生成结论" artifact={stepArtifact} tone="primary" />

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-secondary" />
            <span className="text-sm font-black text-primary">报告生成说明</span>
          </div>
          <div className="space-y-3 text-sm leading-relaxed text-on-surface-variant">
            <p>当前主生成对象是《宝鸡三家村餐饮管理有限公司项目代偿补偿合规性自查工作底稿》和《宝鸡三家村餐饮管理有限公司项目再担保代偿补偿审批表》。</p>
            <p>两份主报告都基于材料清单、一致性核验、规则命中和风险项生成；OA 草稿作为后续提交辅助材料单独保留。</p>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-700" />
            <span className="text-sm font-black text-amber-700">人工复核点</span>
          </div>
          <ul className="space-y-2 text-sm leading-relaxed text-amber-800">
            {activeDraft.manualReviewPoints.length > 0 ? (
              activeDraft.manualReviewPoints.map((item) => <li key={item}>{item}</li>)
            ) : (
              <li>当前这份报告未返回额外人工复核点，可直接进入下一步复核与提交。</li>
            )}
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-secondary" />
            <span className="text-sm font-black text-primary">OA 草稿摘要</span>
          </div>
          <p className="text-sm font-semibold text-primary">{oaDraft.title}</p>
          <p className="mt-3 line-clamp-6 whitespace-pre-wrap text-sm leading-relaxed text-on-surface-variant">{oaDraft.body}</p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-secondary" />
            <span className="text-sm font-black text-primary">快捷操作</span>
          </div>
          <div className="grid gap-3">
            <a href={`/api/export-draft?kind=${selectedDraftKey}`} className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50">
              导出当前报告
            </a>
            <Link href={`/cases/workbench?step=document&draft=${selectedDraftKey}&refresh=1`} className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50">
              重新生成当前报告
            </Link>
            <a href="/api/oa-payload" className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-primary/90">
              预览 OA 提交数据
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

function ReviewContent({ analysis, stepArtifact }: { analysis: CaseAnalysis; stepArtifact?: StepArtifact }) {
  const pendingItems = buildPendingReviewItems(analysis);
  const diffRows = buildDiffRows(analysis);
  return (
    <div className="grid gap-6 xl:grid-cols-12">
      <section className="space-y-6 xl:col-span-7">
        <div className="rounded-2xl bg-gradient-to-r from-primary to-primary-container p-6 text-white shadow-xl shadow-primary/15">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-tertiary-fixed-dim" />
            <h3 className="text-lg font-black">AI 结论摘要</h3>
          </div>
          <p className="text-3xl font-black">建议补偿金额 {analysis.summary.compensationAmount}</p>
          <p className="mt-3 text-sm leading-relaxed text-white/85">{stepArtifact?.summary ?? analysis.reviewSummary}</p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-secondary" />
            <h3 className="text-lg font-black text-primary">待人工确认事项</h3>
          </div>
          <div className="space-y-4">
            {pendingItems.map((item) => (
              <div key={item.title} className="rounded-xl border-l-4 border-secondary bg-surface-container-low p-4 text-sm leading-relaxed text-on-surface">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold text-primary">{item.title}</p>
                  <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${item.severity === '高风险' ? 'bg-error-container text-error' : item.severity === '中风险' ? 'bg-amber-100 text-amber-700' : 'bg-tertiary-fixed-dim/20 text-on-tertiary-container'}`}>
                    {item.severity}
                  </span>
                </div>
                <p className="mt-1 text-on-surface-variant">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <FileSearch className="h-5 w-5 text-secondary" />
            <h3 className="text-lg font-black text-primary">差异对比</h3>
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-100">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-container-low text-[11px] uppercase tracking-[0.14em] text-on-surface-variant">
                <tr>
                  <th className="px-5 py-4">比较项</th>
                  <th className="px-5 py-4">系统值</th>
                  <th className="px-5 py-4">说明</th>
                  <th className="px-5 py-4">结论</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {diffRows.map((item) => (
                  <tr key={item.name}>
                    <td className="px-5 py-4 font-bold text-primary">{item.name}</td>
                    <td className="px-5 py-4">{item.raw}</td>
                    <td className="px-5 py-4 text-on-surface-variant">{item.normalized}</td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-surface-container px-2 py-1 text-[10px] font-bold text-primary">{item.result}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="space-y-6 xl:col-span-5">
        <StepArtifactPanel title="AI 提交建议" artifact={stepArtifact} tone="light" />

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Network className="h-5 w-5 text-secondary" />
              <h3 className="text-lg font-black text-primary">OA 流程预览</h3>
            </div>
            <span className="rounded-full bg-surface-container-low px-3 py-1 text-[11px] font-bold text-on-surface-variant">预计耗时 24h</span>
          </div>
          <div className="space-y-5 border-l-2 border-slate-100 pl-6">
            {analysis.oaFlow.map((title, index) => (
              <div key={title} className="relative">
                <div className={`absolute -left-[31px] top-1 h-4 w-4 rounded-full border-4 border-white ${index === 0 ? 'bg-secondary' : 'bg-slate-200'}`} />
                <p className={`text-sm font-bold ${index === 0 ? 'text-primary' : 'text-slate-400'}`}>{title}</p>
                <p className="mt-1 text-xs text-slate-400">{index === 0 ? '下一审批节点' : '后续流转节点'}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-error-container bg-error-container/30 p-6">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-error" />
            <h3 className="text-lg font-black text-on-error-container">风险提示</h3>
          </div>
          <ul className="space-y-3 text-sm leading-relaxed text-on-error-container">
            {analysis.risks.map((item) => (
              <li key={item.title}>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${impactBadge(item.impact)}`}>{item.impact === 'block' ? '高风险' : item.impact === 'review' ? '中风险' : '低风险'}</span>
                  <span>{item.title}</span>
                </div>
                <p className="mt-1 text-on-error-container/80">{item.reason}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Send className="h-5 w-5 text-secondary" />
            <h3 className="text-lg font-black text-primary">操作</h3>
          </div>
          <div className="grid gap-3">
            <a href="/api/oa-payload" className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-primary/90">
              导出 OA 提交数据
            </a>
            <a href="/api/export-draft?kind=approval" className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50">
              导出审批表草稿
            </a>
            <a href="/api/material-package" className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50">
              导出全部原始材料
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

function ContentByStep({
  currentStepKey,
  analysis,
  selectedDocumentId,
  selectedMaterialName,
  selectedRuleName,
  selectedDraftKey,
  stepArtifact,
}: {
  currentStepKey: string;
  analysis: CaseAnalysis;
  selectedDocumentId?: string;
  selectedMaterialName?: string;
  selectedRuleName?: string;
  selectedDraftKey?: 'worksheet' | 'approval' | 'oa';
  stepArtifact?: StepArtifact;
}) {
  if (currentStepKey === 'integrity') return <IntegrityContent analysis={analysis} stepArtifact={stepArtifact} />;
  if (currentStepKey === 'verify') return <VerifyContent analysis={analysis} stepArtifact={stepArtifact} />;
  if (currentStepKey === 'document') return <DocumentContent analysis={analysis} selectedDraftKey={selectedDraftKey} stepArtifact={stepArtifact} />;
  if (currentStepKey === 'review') return <ReviewContent analysis={analysis} stepArtifact={stepArtifact} />;
  return <OverviewContent analysis={analysis} />;
}

const titleMap: Record<string, { title: string; next?: string; nextLabel?: string }> = {
  overview: { title: '案件总览', next: 'integrity', nextLabel: '下一步：进入材料完整性检查' },
  integrity: { title: '材料完整性', next: 'verify', nextLabel: '下一步：进入一致性与规则' },
  verify: { title: '一致性与规则', next: 'document', nextLabel: '下一步：进入报告生成' },
  document: { title: '报告生成', next: 'review', nextLabel: '下一步：进入人工复核' },
  review: { title: '复核与提交' },
};

export default function CaseWorkbench({
  currentStepKey = 'overview',
  analysis,
  selectedDocumentId,
  selectedMaterialName,
  selectedRuleName,
  selectedDraftKey,
  stepArtifact,
}: Props) {
  const currentStep = getStep(currentStepKey);
  const content = titleMap[currentStep.key];
  const currentIndex = WORKBENCH_STEPS.findIndex((step) => step.key === currentStep.key);
  const previousStep = currentIndex > 0 ? WORKBENCH_STEPS[currentIndex - 1] : null;
  const overviewFooter = currentStep.key === 'overview';

  return (
    <main data-page-shell="true" className="ml-48 min-h-screen bg-background p-6 pb-24 pt-20 font-body transition-[padding-right] duration-200">
      <div className="mx-auto max-w-[1560px] space-y-6">
        <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-on-surface-variant">
                <Link href="/" className="transition-colors hover:text-primary">
                  代偿补偿
                </Link>
                <ChevronRight className="h-3.5 w-3.5" />
                <Link href="/" className="transition-colors hover:text-primary">
                  待审案件
                </Link>
                <ChevronRight className="h-3.5 w-3.5" />
                <span className="text-primary">{analysis.summary.company}</span>
              </div>
              <h1 className="mt-2 font-headline text-2xl font-black text-primary">{analysis.summary.company}</h1>
              <p className="mt-1 text-xs text-on-surface-variant">
                受理编号 {analysis.summary.id} / 当前步骤：{content.title} / 审查模式：单笔单审
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-secondary/10 px-3 py-1 text-[11px] font-black text-secondary">当前状态：{analysis.summary.statusLabel}</span>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-black text-amber-700">风险等级：{analysis.summary.riskLabel}</span>
            <RebuildCacheButton step={currentStep.key} iconOnly />
            <ClearStepArtifactsButton step={currentStep.key} iconOnly />
          </div>
        </div>
      </section>

        <Stepper currentStepKey={currentStep.key} analysis={analysis} />

        <section className="space-y-6">
          <ContentByStep
            currentStepKey={currentStep.key}
            analysis={analysis}
            selectedDocumentId={selectedDocumentId}
            selectedMaterialName={selectedMaterialName}
            selectedRuleName={selectedRuleName}
            selectedDraftKey={selectedDraftKey}
            stepArtifact={stepArtifact}
          />
        </section>
      </div>

      <footer data-page-footer="true" className="fixed bottom-0 left-48 right-0 z-30 flex items-center justify-between border-t border-slate-100 bg-white/92 px-6 py-2.5 shadow-[0_-10px_30px_rgba(0,0,0,0.03)] backdrop-blur-xl transition-[right] duration-200">
        <div className="text-[11px] font-bold text-on-surface-variant">
          当前步骤：{content.title}。系统已完成基础信息归集，退出后可从当前步骤恢复。
        </div>
        <div className="flex items-center gap-3">
          {overviewFooter ? (
            <>
              <button className="rounded-lg border border-slate-200 px-4 py-1.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50">
                查看全部材料
              </button>
              <button className="rounded-lg border border-slate-200 px-4 py-1.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50">
                查看台账明细
              </button>
            </>
          ) : null}
          {previousStep ? (
            <a href={`/cases/workbench?step=${previousStep.key}`} className="rounded-lg border border-slate-200 px-4 py-1.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50">
              返回上一步
            </a>
          ) : null}
          {content.next ? (
            <StepTransitionButton href={`/cases/workbench?step=${content.next}`} label={content.nextLabel ?? '下一步'} stepKey={content.next} />
          ) : (
            <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-bold text-white shadow-lg shadow-primary/15 transition-colors hover:bg-primary/90">
              采纳并提交 OA
              <CheckCircle2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </footer>
    </main>
  );
}
