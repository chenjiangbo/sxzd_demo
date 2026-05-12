import fs from 'node:fs';
import path from 'node:path';

type CitationSource = {
  label: string;
  fileName: string;
  field: string;
  method: string;
};

const COMPENSATION_SOURCE_LABEL = '代偿补偿统计表';

const compensationCitationCss = `
        .comp-brief-citation {
            position: relative;
            display: inline;
            color: #002b5b;
            text-decoration-line: underline;
            text-decoration-style: dotted;
            text-decoration-color: rgba(0, 43, 91, 0.45);
            text-underline-offset: 3px;
            cursor: help;
        }

        .comp-brief-citation-popover {
            display: none;
            pointer-events: none;
            position: absolute;
            left: 50%;
            bottom: 100%;
            z-index: 100;
            width: 360px;
            transform: translateX(-50%);
            margin-bottom: 8px;
            padding: 12px 14px;
            border: 1px solid rgba(0, 43, 91, 0.14);
            border-radius: 14px;
            background: #fffaf0;
            color: #334155;
            box-shadow: 0 16px 40px rgba(11, 28, 48, 0.18);
            font-size: 12px;
            line-height: 1.7;
            text-align: left;
            text-indent: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            font-weight: 400;
            white-space: normal;
        }

        .comp-brief-citation:hover .comp-brief-citation-popover,
        .comp-brief-citation:focus .comp-brief-citation-popover {
            display: block;
        }

        .comp-brief-citation-popover::after {
            content: "";
            position: absolute;
            left: 50%;
            top: 100%;
            width: 12px;
            height: 12px;
            transform: translate(-50%, -50%) rotate(45deg);
            background: #fffaf0;
            border-right: 1px solid rgba(0, 43, 91, 0.14);
            border-bottom: 1px solid rgba(0, 43, 91, 0.14);
        }

        .comp-brief-citation-title {
            display: inline-block;
            margin-bottom: 6px;
            padding: 2px 10px;
            border-radius: 999px;
            background: rgba(0, 43, 91, 0.1);
            color: #002b5b;
            font-size: 11px;
            font-weight: 800;
        }

        .comp-brief-citation-line {
            display: block;
            margin-top: 3px;
        }

        .comp-brief-citation-box {
            display: block;
            margin-top: 6px;
            padding: 6px 8px;
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.72);
        }
`;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function createCitationMarkup(value: string, source: CitationSource): string {
  return `
<span class="comp-brief-citation" tabindex="0" data-comp-brief-citation="source">
    ${escapeHtml(value)}
    <span class="comp-brief-citation-popover" data-comp-brief-citation-popover="true">
        <span class="comp-brief-citation-title">数据来源</span>
        <span class="comp-brief-citation-box"><strong>来源文件：</strong>${escapeHtml(source.fileName)}</span>
    </span>
</span>`.trim();
}

function injectCitationStyles(html: string): string {
  if (html.includes('.comp-brief-citation-popover')) return html;
  return html.replace('</style>', `${compensationCitationCss}\n    </style>`);
}

function annotateStaticCompensationTable(html: string): string {
  const headers = ['序号', '合作银行', '补偿金额', '金额占比', '笔数', '笔数占比', '笔均', '合作业务代偿率'];
  const tbodyMatch = html.match(/<tbody>([\s\S]*?)<\/tbody>/);
  if (!tbodyMatch) return html;

  let rowNumber = 0;
  const annotatedBody = tbodyMatch[1].replace(/<tr>([\s\S]*?)<\/tr>/g, (rowHtml, cellsHtml: string) => {
    const hasDataCell = /<td/i.test(cellsHtml);
    if (!hasDataCell) return rowHtml;

    rowNumber += 1;
    let cellIndex = 0;
    const annotatedRow = rowHtml.replace(/<td([^>]*)>([\s\S]*?)<\/td>/g, (cellHtml, attrs: string, rawCellValue: string) => {
      const plainValue = rawCellValue.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
      if (!plainValue) return cellHtml;

      const hasColspan = /colspan=/i.test(attrs);
      const header = hasColspan ? '分组标题' : (headers[cellIndex] || `第${cellIndex + 1}列`);
      const citation = createCitationMarkup(plainValue, {
        label: `附表 / ${header}`,
        fileName: COMPENSATION_SOURCE_LABEL,
        field: `附表 / 第${rowNumber}行 / ${header}`,
        method: '当前模板内硬编码静态值',
      });

      if (!hasColspan) cellIndex += 1;
      return `<td${attrs}>${citation}</td>`;
    });

    return annotatedRow;
  });

  return html.replace(tbodyMatch[0], `<tbody>${annotatedBody}</tbody>`);
}

function flattenObject(obj: Record<string, any>, prefix: string, result: Record<string, string>): void {
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      const newKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        flattenObject(value, newKey, result);
      } else {
        result[newKey] = String(value ?? '');
      }
    }
  }
}

/**
 * 使用 HTML + 占位符替换生成代偿补偿简报
 * @returns 渲染后的 HTML
 */
export async function generateCompensationBriefHTML(): Promise<string> {
  try {
    console.log('开始生成代偿补偿 HTML 简报...');
    
    // 1. 读取占位符映射数据(异步)
    const mappingPath = path.join(process.cwd(), 'data', 'compensation-mapping.json');
    const mappingData = JSON.parse(await fs.promises.readFile(mappingPath, 'utf-8'));
    
    // 2. 准备渲染数据(扁平化)
    const flatData: Record<string, string> = {};
    flattenObject(mappingData, '', flatData);
    
    console.log('扁平化后的key示例:', Object.keys(flatData).slice(0, 10));
    console.log('meta.year值:', flatData['meta.year']);
    
    // 3. 读取 HTML 模板(异步)
    const templatePath = path.join(process.cwd(), 'templates', 'compensation-template.html');
    let templateContent = await fs.promises.readFile(templatePath, 'utf-8');
    
    // 检查模板中实际的占位符格式
    const placeholderMatches = templateContent.match(/\{\{[^}]+\}\}/g);
    console.log('模板中的占位符示例:', placeholderMatches ? placeholderMatches.slice(0, 10) : '无');
    
    // 4. 手动替换 {{placeholder}} 占位符
    templateContent = templateContent.split('{{report_title}}').join(escapeHtml(flatData.report_title || '代偿补偿简报'));

    console.log('开始替换占位符, 共', Object.keys(flatData).length, '个');
    let replaceCount = 0;
    for (const [key, value] of Object.entries(flatData)) {
      if (key === 'report_title') continue;
      const placeholder = `{{${key}}}`;
      const count = (templateContent.match(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
      if (count > 0) {
        console.log(`替换 ${placeholder} -> ${value} (出现${count}次)`);
        // 使用全局替换,处理所有出现的占位符
        templateContent = templateContent.split(placeholder).join(createCitationMarkup(value || '', {
          label: key,
          fileName: COMPENSATION_SOURCE_LABEL,
          field: key,
          method: '读取代偿补偿简报映射数据对应字段',
        }));
        replaceCount++;
      }
    }
    console.log('成功替换了', replaceCount, '个占位符');
    
    console.log('代偿补偿 HTML 简报生成成功!');
    
    return injectCitationStyles(annotateStaticCompensationTable(templateContent));
  } catch (error) {
    console.error('生成代偿补偿 HTML 简报失败:', error);
    throw new Error(`代偿补偿 HTML 简报生成失败:${error instanceof Error ? error.message : '未知错误'}`);
  }
}
