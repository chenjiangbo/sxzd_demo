export type ApprovalBorrowRow = {
  index: string;
  item: string;
  content: string;
};

export type ApprovalRiskRow = {
  compensationDate: string;
  uncompensatedPrincipal: string;
  indemnityAmount: string;
  ratio: string;
  compensationAmount: string;
};

export const REVEAL_ORDER = [
  'header',
  'debtorProfile',
  'borrowRows',
  'counterGuarantee',
  'filingInfo',
  'compensationReason',
  'riskRows',
  'recoveryPlan',
  'conclusion',
] as const;

export type GeneratedCompensationReport = {
  rawText: string;
  generatedAt: string;
  structured: {
    header: {
      guarantorName: string;
      date: string;
      title: string;
    };
    sections: {
      debtorProfile: string[];
      borrowRows: ApprovalBorrowRow[];
      counterGuarantee: string[];
      filingInfo: string[];
      compensationReason: string[];
      riskRows: ApprovalRiskRow[];
      riskExplanation: string[];
      recoveryPlan: string[];
      conclusion: string[];
    };
  };
};

export function normalizeCompensationReportText(text: string) {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/^```[\w-]*\n?/gm, '')
    .replace(/```$/gm, '')
    .replace(/\*\*/g, '')
    .replace(/__/g, '')
    .replace(/`/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
