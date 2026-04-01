export type GeneratedCreditReport = {
  rawText: string;
  generatedAt: string;
};

export type CreditReportBlock =
  | { kind: 'section'; text: string }
  | { kind: 'item'; text: string }
  | { kind: 'paragraph'; text: string };

export type ParsedCreditReport = {
  title: string;
  addressee: string;
  blocks: CreditReportBlock[];
  attachmentLine: string | null;
  signatureDepartment: string | null;
  signatureDate: string | null;
};

const SECTION_HEADING_RE = /^[一二三四五六七八九十]+、/;
const ITEM_HEADING_RE = /^（[一二三四五六七八九十]+）/;
const DATE_RE = /^\d{4}年\d{1,2}月\d{1,2}日$/;

export function normalizeCreditReportText(text: string) {
  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
}

export function parseCreditReportText(text: string): ParsedCreditReport {
  const normalized = normalizeCreditReportText(text);
  const lines = normalized
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 3) {
    return {
      title: lines[0] ?? '',
      addressee: lines[1] ?? '',
      blocks: lines.slice(2).map((line) => ({ kind: 'paragraph' as const, text: line })),
      attachmentLine: null,
      signatureDepartment: null,
      signatureDate: null,
    };
  }

  let attachmentLine: string | null = null;
  let signatureDate: string | null = null;
  let signatureDepartment: string | null = null;
  let bodyEnd = lines.length;

  if (bodyEnd >= 1 && DATE_RE.test(lines[bodyEnd - 1])) {
    signatureDate = lines[bodyEnd - 1];
    bodyEnd -= 1;
  }

  if (bodyEnd >= 1) {
    signatureDepartment = lines[bodyEnd - 1];
    bodyEnd -= 1;
  }

  if (bodyEnd >= 1 && lines[bodyEnd - 1].startsWith('附件')) {
    attachmentLine = lines[bodyEnd - 1];
    bodyEnd -= 1;
  }

  const bodyLines = lines.slice(2, bodyEnd);
  const blocks: CreditReportBlock[] = bodyLines.map((line) => {
    if (SECTION_HEADING_RE.test(line)) {
      return { kind: 'section', text: line };
    }
    if (ITEM_HEADING_RE.test(line)) {
      return { kind: 'item', text: line };
    }
    return { kind: 'paragraph', text: line };
  });

  return {
    title: lines[0] ?? '',
    addressee: lines[1] ?? '',
    blocks,
    attachmentLine,
    signatureDepartment,
    signatureDate,
  };
}
