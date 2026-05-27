import PizZip from 'pizzip';

/**
 * 综合评价提示函 Word 文档生成器
 * 使用 Word XML 精确控制字体、字号、缩进、行距，输出真实的 .docx 文件
 */

// A4 页面设置（单位：twips，1 inch = 1440 twips，1 cm ≈ 567 twips）
const PAGE_SETTING = {
  // 页边距：上下 2.54cm，左右 3.17cm（Word 默认）
  marginTop: 1440,
  marginBottom: 1440,
  marginLeft: 1800,
  marginRight: 1800,
  // A4 纸张
  pageWidth: 11906,
  pageHeight: 16838,
};

// 字号（Word 中 1pt = 2 half-points）
const FONT_SIZE = {
  TITLE: 44,       // 二号（22pt）
  SUB_TITLE: 36,   // 小三（18pt）
  HEADING: 32,     // 三号（16pt）
  BODY: 32,        // 三号/仿宋（16pt）
};

// 行距（单位：1/240 行）
const LINE_SPACING = {
  DOUBLE: 480,     // 2 倍行距（240 × 2）
  BODY: 560,       // 正文固定 28pt 行距
};

// 首行缩进：2 字符 × 字号（三号 16pt = 320 twips × 2 = 640）
const FIRST_LINE_INDENT = 640;

/**
 * 转义 XML 特殊字符
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * 构建单个段落的 XML
 */
function buildParagraph(opts: {
  text: string;
  fontFamily: string;           // 中文字体名
  fontSize: number;             // half-points
  bold?: boolean;
  align?: 'left' | 'center' | 'right';
  firstLineIndent?: number;     // twips
  lineSpacing?: number;         // 1/240 行
  spacingBefore?: number;       // twips
  spacingAfter?: number;        // twips
  color?: string;
}): string {
  const {
    text,
    fontFamily,
    fontSize,
    bold = false,
    align = 'left',
    firstLineIndent = 0,
    lineSpacing = LINE_SPACING.BODY,
    spacingBefore = 0,
    spacingAfter = 0,
    color,
  } = opts;

  const alignMap: Record<string, string> = {
    left: 'left',
    center: 'center',
    right: 'right',
  };

  const indentAttr = firstLineIndent > 0
    ? `<w:ind w:firstLine="${firstLineIndent}"/>`
    : '';

  const colorXml = color ? `<w:color w:val="${color}"/>` : '';

  // 空行段落：保留行高但内容为空
  if (!text || text.trim() === '') {
    return `
      <w:p>
        <w:pPr>
          <w:spacing w:line="${lineSpacing}" w:lineRule="auto" w:before="${spacingBefore}" w:after="${spacingAfter}"/>
          <w:jc w:val="${alignMap[align]}"/>
        </w:pPr>
        <w:r>
          <w:rPr>
            <w:rFonts w:ascii="${fontFamily}" w:eastAsia="${fontFamily}" w:hAnsi="${fontFamily}"/>
            <w:sz w:val="${fontSize}"/>
            <w:szCs w:val="${fontSize}"/>
          </w:rPr>
          <w:t xml:space="preserve"> </w:t>
        </w:r>
      </w:p>`;
  }

  return `
      <w:p>
        <w:pPr>
          <w:spacing w:line="${lineSpacing}" w:lineRule="auto" w:before="${spacingBefore}" w:after="${spacingAfter}"/>
          ${indentAttr}
          <w:jc w:val="${alignMap[align]}"/>
        </w:pPr>
        <w:r>
          <w:rPr>
            <w:rFonts w:ascii="${fontFamily}" w:eastAsia="${fontFamily}" w:hAnsi="${fontFamily}"/>
            ${bold ? '<w:b/><w:bCs/>' : ''}
            <w:sz w:val="${fontSize}"/>
            <w:szCs w:val="${fontSize}"/>
            ${colorXml}
            <w:kern w:val="2"/>
          </w:rPr>
          <w:t xml:space="preserve">${escapeXml(text)}</w:t>
        </w:r>
      </w:p>`;
}

/**
 * 判断文本行的类型，并返回对应的段落配置
 */
function classifyLine(line: string): {
  type: 'title' | 'subtitle' | 'heading' | 'section' | 'greeting' | 'signature' | 'date' | 'body';
  text: string;
} {
  const trimmed = line.trim();

  // 主标题：包含 "综合评价的提示函" 或 "关于xxx"
  if (trimmed.startsWith('关于') && trimmed.includes('综合评价的提示函')) {
    return { type: 'title', text: trimmed };
  }

  // 副标题：主标题的第二行（xxx年xx半年综合评价的提示函）
  if (/^\d{4}年.*综合评价的提示函$/.test(trimmed)) {
    return { type: 'title', text: trimmed };
  }

  // 称谓行：以姓名+职务+冒号开头（如 "童彦董事长："、"滑全民总经理："）
  if (/^.{2,6}(董事长|总经理|执行董事|执行董事兼总经理|监事长)[：:]$/.test(trimmed)) {
    return { type: 'greeting', text: trimmed };
  }

  // 一级标题：一、二、三、四...
  if (/^[一二三四五六七八九十]+、/.test(trimmed)) {
    return { type: 'heading', text: trimmed };
  }

  // 二级标题：（一）（二）（三）...
  if (/^（[一二三四五六七八九十]+）/.test(trimmed)) {
    return { type: 'section', text: trimmed };
  }

  // 落款：陕西省信用再担保有限责任公司、总经理
  if (trimmed === '陕西省信用再担保有限责任公司' || trimmed.startsWith('总经理')) {
    return { type: 'signature', text: trimmed };
  }

  // 日期行
  if (/^\d{4}年\d{1,2}月(\d{1,2}日)?$/.test(trimmed)) {
    return { type: 'date', text: trimmed };
  }

  return { type: 'body', text: trimmed };
}

/**
 * 将提示函原始文本转换为 Word document.xml 的 body 内容
 */
function buildDocumentBody(rawText: string): string {
  const lines = rawText.split('\n');
  const paragraphs: string[] = [];

  // 段落之间的默认行距
  const BODY_SPACING_BEFORE = 0;
  const BODY_SPACING_AFTER = 0;
  const TITLE_SPACING_AFTER = 200;

  for (const line of lines) {
    const trimmed = line.trim();

    // 空行：保留段落间距
    if (trimmed === '') {
      paragraphs.push(buildParagraph({
        text: '',
        fontFamily: '仿宋',
        fontSize: FONT_SIZE.BODY,
        lineSpacing: LINE_SPACING.BODY,
      }));
      continue;
    }

    const classified = classifyLine(trimmed);

    switch (classified.type) {
      case 'title':
        paragraphs.push(buildParagraph({
          text: classified.text,
          fontFamily: '黑体',
          fontSize: FONT_SIZE.TITLE,
          bold: true,
          align: 'center',
          lineSpacing: LINE_SPACING.DOUBLE,
          spacingBefore: 200,
          spacingAfter: TITLE_SPACING_AFTER,
        }));
        break;

      case 'greeting':
        paragraphs.push(buildParagraph({
          text: classified.text,
          fontFamily: '仿宋',
          fontSize: FONT_SIZE.BODY,
          lineSpacing: LINE_SPACING.BODY,
          spacingBefore: 200,
          spacingAfter: 0,
        }));
        break;

      case 'heading':
        paragraphs.push(buildParagraph({
          text: classified.text,
          fontFamily: '黑体',
          fontSize: FONT_SIZE.HEADING,
          bold: true,
          lineSpacing: LINE_SPACING.BODY,
          spacingBefore: 200,
          spacingAfter: 0,
        }));
        break;

      case 'section':
        paragraphs.push(buildParagraph({
          text: classified.text,
          fontFamily: '楷体',
          fontSize: FONT_SIZE.HEADING,
          bold: false,
          firstLineIndent: FIRST_LINE_INDENT,
          lineSpacing: LINE_SPACING.BODY,
        }));
        break;

      case 'signature':
      case 'date':
        paragraphs.push(buildParagraph({
          text: classified.text,
          fontFamily: '仿宋',
          fontSize: FONT_SIZE.BODY,
          align: 'right',
          lineSpacing: LINE_SPACING.BODY,
          spacingBefore: 0,
          spacingAfter: 0,
        }));
        break;

      default:
        // 正文：首行缩进 2 字符
        paragraphs.push(buildParagraph({
          text: classified.text,
          fontFamily: '仿宋',
          fontSize: FONT_SIZE.BODY,
          firstLineIndent: FIRST_LINE_INDENT,
          lineSpacing: LINE_SPACING.BODY,
          spacingBefore: BODY_SPACING_BEFORE,
          spacingAfter: BODY_SPACING_AFTER,
        }));
        break;
    }
  }

  return paragraphs.join('');
}

/**
 * 生成完整的 Word document.xml
 */
function buildDocumentXml(rawText: string): string {
  const body = buildDocumentBody(rawText);
  const { marginTop, marginBottom, marginLeft, marginRight, pageWidth, pageHeight } = PAGE_SETTING;

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas"
  xmlns:mo="http://schemas.microsoft.com/office/mac/office/2008/main"
  xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
  xmlns:mv="urn:schemas-microsoft-com:mac:vml"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"
  xmlns:v="urn:schemas-microsoft-com:vml"
  xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
  xmlns:w10="urn:schemas-microsoft-com:office:word"
  xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml">
  <w:body>
    ${body}
    <w:sectPr>
      <w:pgSz w:w="${pageWidth}" w:h="${pageHeight}"/>
      <w:pgMar w:top="${marginTop}" w:right="${marginRight}" w:bottom="${marginBottom}" w:left="${marginLeft}" w:header="720" w:footer="720" w:gutter="0"/>
      <w:cols w:space="720"/>
      <w:docGrid w:type="lines" w:linePitch="312"/>
    </w:sectPr>
  </w:body>
</w:document>`;
}

/**
 * 构建 [Content_Types].xml
 */
function buildContentTypesXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`;
}

/**
 * 构建 _rels/.rels
 */
function buildRelsXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;
}

/**
 * 构建 word/_rels/document.xml.rels
 */
function buildDocRelsXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;
}

/**
 * 构建 word/styles.xml（默认样式）
 */
function buildStylesXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="仿宋" w:eastAsia="仿宋" w:hAnsi="仿宋"/>
        <w:sz w:val="32"/>
        <w:szCs w:val="32"/>
        <w:lang w:val="en-US" w:eastAsia="zh-CN"/>
      </w:rPr>
    </w:rPrDefault>
    <w:pPrDefault>
      <w:pPr>
        <w:spacing w:line="560" w:lineRule="auto"/>
      </w:pPr>
    </w:pPrDefault>
  </w:docDefaults>
</w:styles>`;
}

/**
 * 生成综合评价提示函 Word 文档
 * @param rawText - AI 生成的纯文本提示函内容
 * @returns Word 文档 Buffer（真实 .docx）
 */
export async function generatePromptLetterDocx(rawText: string): Promise<Buffer> {
  try {
    const zip = new PizZip();

    // 写入必要文件
    zip.file('[Content_Types].xml', buildContentTypesXml());
    zip.file('_rels/.rels', buildRelsXml());
    zip.file('word/document.xml', buildDocumentXml(rawText));
    zip.file('word/_rels/document.xml.rels', buildDocRelsXml());
    zip.file('word/styles.xml', buildStylesXml());

    // 生成 Buffer
    const buffer = zip.generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    }) as Buffer;

    return buffer;
  } catch (error) {
    console.error('生成提示函 Word 文档失败:', error);
    throw new Error(`Word 文档生成失败：${error instanceof Error ? error.message : '未知错误'}`);
  }
}
