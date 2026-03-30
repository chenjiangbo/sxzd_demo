export type StepStatus = 'completed' | 'active' | 'attention' | 'optional' | 'pending';

export type WorkbenchStep = {
  key: string;
  number: string;
  title: string;
  shortTitle: string;
  description: string;
  status: StepStatus;
  hint: string;
};

export const CASE_INFO = {
  id: 'CAS-20251021-001',
  company: '宝鸡三家村餐饮管理有限公司',
  guarantor: '宝鸡市中小企业融资担保有限公司',
  bank: '陕西岐山农村商业银行股份有限公司',
  compensationAmount: '771,767.83',
  indemnityAmount: '1,543,535.66',
  latestSavedAt: '2026-03-28 10:24',
};

export const WORKBENCH_STEPS: WorkbenchStep[] = [
  {
    key: 'overview',
    number: '01',
    title: '案件总览',
    shortTitle: '案件总览',
    description: '查看业务链路与材料地图',
    status: 'completed',
    hint: '业务链路已归集，AI 初检摘要已完成。',
  },
  {
    key: 'integrity',
    number: '02',
    title: '材料完整性',
    shortTitle: '材料完整性',
    description: '检查要件是否齐全',
    status: 'completed',
    hint: '12 项要件已识别，1 项缺失，2 项待确认。',
  },
  {
    key: 'verify',
    number: '03',
    title: '一致性与规则',
    shortTitle: '一致性与规则',
    description: '核验字段、规则和金额',
    status: 'attention',
    hint: '存在贷款用途追溯说明待人工确认。',
  },
  {
    key: 'document',
    number: '04',
    title: '报告生成',
    shortTitle: '报告生成',
    description: '生成三份审查报告',
    status: 'completed',
    hint: '三份草稿已生成，可继续编辑或导出。',
  },
  {
    key: 'review',
    number: '05',
    title: '复核与提交',
    shortTitle: '复核与提交',
    description: '人工确认并发起 OA',
    status: 'active',
    hint: '等待业务人员确认风险项并提交 OA。',
  },
];

export function getStep(stepKey?: string) {
  return WORKBENCH_STEPS.find((step) => step.key === stepKey) ?? WORKBENCH_STEPS[0];
}
