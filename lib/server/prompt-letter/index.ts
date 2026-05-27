import path from 'node:path';
import { promises as fs } from 'node:fs';
import * as XLSX from 'xlsx';
import { getDemoCacheRoot, getWorkspaceRoot } from '../runtime-root';
import { blackwhiteChat, type ChatMessage } from '@/lib/server/blackwhite';

const WORKSPACE_ROOT = getWorkspaceRoot();
const SKILL_DIR = path.join(WORKSPACE_ROOT, 'prompt_letter_skill_v3');
const SKILL_FILE = path.join(SKILL_DIR, 'SKILL.md');
const FIELD_MAPPING_FILE = path.join(SKILL_DIR, 'references', 'field_mapping.yaml');
const PROBLEM_RULES_FILE = path.join(SKILL_DIR, 'references', 'problem_rules.yaml');
const SAMPLE_OUTPUT_FILE = path.join(SKILL_DIR, 'references', 'sample_output.md');
const UPLOADS_DIR = path.join(getDemoCacheRoot(), 'prompt-letter', 'uploads');
const CACHE_DIR = path.join(getDemoCacheRoot(), 'prompt-letter', 'generated');

// ============================================
// 类型定义
// ============================================

export type UploadedFileInfo = {
  id: string;
  name: string;
  department: 'oneDept' | 'threeDept';
  filePath: string;
  fileSize: number;
  uploadedAt: string;
};

export type ExtractedData = {
  institutionName: string;
  rawText: string;
  structuredData: Record<string, unknown>;
};

export type GeneratedPromptLetter = {
  institutionName: string;
  rawText: string;
  generatedAt: string;
  fileName: string;
};

// ============================================
// 文件上传管理
// ============================================

export async function saveUploadedFile(file: File, department: 'oneDept' | 'threeDept'): Promise<UploadedFileInfo> {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });

  const id = `file_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  const filePath = path.join(UPLOADS_DIR, `${id}_${file.name}`);
  const arrayBuffer = await file.arrayBuffer();
  await fs.writeFile(filePath, new Uint8Array(arrayBuffer));

  return {
    id,
    name: file.name,
    department,
    filePath,
    fileSize: file.size,
    uploadedAt: new Date().toISOString(),
  };
}

export async function listUploadedFiles(): Promise<UploadedFileInfo[]> {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });

  const files = await fs.readdir(UPLOADS_DIR);
  const result: UploadedFileInfo[] = [];

  for (const fileName of files) {
    const filePath = path.join(UPLOADS_DIR, fileName);
    const stat = await fs.stat(filePath);
    const parts = fileName.split('_');
    const id = `${parts[0]}_${parts[1]}_${parts[2]}`;
    const originalName = parts.slice(3).join('_');

    result.push({
      id,
      name: originalName,
      department: originalName.includes('一部') || originalName.includes('综合评价') || originalName.endsWith('.docx')
        ? 'oneDept'
        : 'threeDept',
      filePath,
      fileSize: stat.size,
      uploadedAt: stat.birthtime.toISOString(),
    });
  }

  return result;
}

export async function removeUploadedFile(id: string): Promise<void> {
  const files = await fs.readdir(UPLOADS_DIR);
  for (const fileName of files) {
    if (fileName.startsWith(`${id}_`)) {
      await fs.unlink(path.join(UPLOADS_DIR, fileName));
    }
  }
}

// ============================================
// 文件内容提取
// ============================================

async function extractDocxText(filePath: string): Promise<string> {
  try {
    // 读取文件内容，docx 本质是 zip，直接返回文本
    const content = await fs.readFile(filePath);
    return content.toString();
  } catch {
    return '';
  }
}

async function extractXlsxData(filePath: string): Promise<Record<string, unknown>> {
  try {
    const buffer = await fs.readFile(filePath);
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const result: Record<string, unknown> = {};

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      result[sheetName] = data;
    }

    return result;
  } catch {
    return {};
  }
}

export async function extractFileContent(fileInfo: UploadedFileInfo): Promise<ExtractedData> {
  const ext = path.extname(fileInfo.name).toLowerCase();

  if (ext === '.xlsx' || ext === '.xls') {
    const data = await extractXlsxData(fileInfo.filePath);
    return {
      institutionName: fileInfo.name.replace(/\.(xlsx|xls)$/i, ''),
      rawText: JSON.stringify(data, null, 2),
      structuredData: data,
    };
  }

  // 对于 docx 文件
  const text = await extractDocxText(fileInfo.filePath);
  return {
    institutionName: fileInfo.name.replace(/\.docx$/i, ''),
    rawText: text,
    structuredData: {},
  };
}

// ============================================
// Skill 加载
// ============================================

async function loadSkillContent(): Promise<string> {
  try {
    return await fs.readFile(SKILL_FILE, 'utf8');
  } catch {
    return '';
  }
}

async function loadReferenceContent(): Promise<string> {
  const references: string[] = [];

  try {
    const fieldMapping = await fs.readFile(FIELD_MAPPING_FILE, 'utf8');
    references.push('## 字段映射配置\n```yaml\n' + fieldMapping + '\n```');
  } catch {}

  try {
    const problemRules = await fs.readFile(PROBLEM_RULES_FILE, 'utf8');
    references.push('## 问题判定规则\n```yaml\n' + problemRules + '\n```');
  } catch {}

  try {
    const sampleOutput = await fs.readFile(SAMPLE_OUTPUT_FILE, 'utf8');
    references.push('## 样本输出参考\n' + sampleOutput);
  } catch {}

  return references.join('\n\n');
}

// ============================================
// AI 生成
// ============================================

function buildSystemPrompt(skillContent: string, referenceContent: string): string {
  return [
    '你是陕西省信用再担保有限责任公司的综合评价提示函生成专家。',
    '',
    '你必须严格按照以下 Skill 文档中定义的所有规则生成提示函。这些规则包括：',
    '- 提示函的标准结构和格式',
    '- 数据字段说明和单位转换',
    '- 完成率计算规则',
    '- 问题判定规则（指标问题、代偿率风险、代偿追偿问题）',
    '- 建议生成规则（根据不同时期生成不同数量的建议）',
    '- 各种时期（2025上半年、2025下半年、2026上半年）的格式差异',
    '',
    '=== Skill 完整规则文档 ===',
    skillContent,
    '',
    '=== 参考配置文件 ===',
    referenceContent,
    '',
    '生成提示函时，请：',
    '1. 严格按照 Skill 中定义的格式和规则',
    '2. 正确识别时期（2025上半年/2025下半年/2026上半年）',
    '3. 正确计算各项指标的完成率',
    '4. 根据问题判定规则判断是否需要显示"二、存在问题"章节',
    '5. 根据时期和数据生成正确数量的建议',
    '6. 使用正确的单位转换（元→亿元）',
    '7. 确保固定结尾完全一致',
    '',
    '直接输出完整的提示函文本，不要包含任何 JSON 结构或额外说明。',
  ].join('\n');
}

function buildUserPrompt(extractedData: ExtractedData[]): string {
  const parts = extractedData.map((data, index) => {
    return [
      `### 文件 ${index + 1}: ${data.institutionName}`,
      '',
      '提取的内容：',
      '```',
      data.rawText.substring(0, 10000), // 限制长度避免超出 token
      '```',
      '',
      data.structuredData && Object.keys(data.structuredData).length > 0
        ? `结构化数据：\n\`\`\`json\n${JSON.stringify(data.structuredData, null, 2).substring(0, 5000)}\n\`\`\``
        : '',
    ].join('\n');
  });

  return [
    '请根据以下上传的文件内容，生成完整的综合评价提示函。',
    '',
    '上传的文件内容：',
    '',
    ...parts,
    '',
    '请根据 Skill 中的规则，生成完整的综合评价提示函。',
    '注意：',
    '- 从文件内容中提取机构名称、联系人、业务指标等关键信息',
    '- 如果一部 docx 中有占位符（如 **），请从三部 xlsx 中查找对应数据',
    '- 确保所有计算和格式严格遵循 Skill 规则',
    '- 直接输出完整的提示函文本',
  ].join('\n');
}

export async function generatePromptLetterWithAI(extractedData: ExtractedData[]): Promise<GeneratedPromptLetter> {
  console.log('[提示函生成] 开始加载 Skill 规则...');
  const skillContent = await loadSkillContent();
  const referenceContent = await loadReferenceContent();

  if (!skillContent) {
    throw new Error('无法加载 Skill 文件，请确保 prompt_letter_skill_v3/SKILL.md 存在');
  }

  console.log(`[提示函生成] Skill 规则加载完成 (${skillContent.length} 字符)`);
  console.log(`[提示函生成] 参考文件加载完成 (${referenceContent.length} 字符)`);

  const systemPrompt = buildSystemPrompt(skillContent, referenceContent);
  const userPrompt = buildUserPrompt(extractedData);

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  console.log('[提示函生成] 正在调用 AI 模型...');
  console.log(`[提示函生成] System prompt: ${systemPrompt.length} 字符`);
  console.log(`[提示函生成] User prompt: ${userPrompt.length} 字符`);

  const rawText = await blackwhiteChat(messages, {
    temperature: 0.3,
    timeoutMs: 300_000, // 5分钟超时
  });

  console.log(`[提示函生成] AI 生成完成 (${rawText.length} 字符)`);

  // 后处理：替换可能遗留的占位符
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const letterDate = `${year}年${month}月`;

  let processedText = rawText.trim();
  // 替换常见的占位符格式
  processedText = processedText.replace(/\{letter_date\}/gi, letterDate);
  processedText = processedText.replace(/\{year\}/gi, String(year));
  processedText = processedText.replace(/\{month\}/gi, String(month));
  processedText = processedText.replace(/\{current_date\}/gi, letterDate);
  processedText = processedText.replace(/\{date\}/gi, letterDate);

  console.log(`[提示函生成] 后处理完成，替换了占位符`);

  const institutionName = extractedData[0]?.institutionName || '未知机构';

  return {
    institutionName,
    rawText: processedText,
    generatedAt: new Date().toISOString(),
    fileName: `${institutionName}-综合评价提示函`,
  };
}

// ============================================
// 缓存管理
// ============================================

export async function saveGeneratedPromptLetter(letter: GeneratedPromptLetter): Promise<string> {
  await fs.mkdir(CACHE_DIR, { recursive: true });

  const fileName = `${Date.now()}_${letter.institutionName}.json`;
  const filePath = path.join(CACHE_DIR, fileName);
  await fs.writeFile(filePath, JSON.stringify(letter, null, 2), 'utf8');

  return filePath;
}

export async function getGeneratedPromptLetters(): Promise<GeneratedPromptLetter[]> {
  await fs.mkdir(CACHE_DIR, { recursive: true });

  const files = await fs.readdir(CACHE_DIR);
  const letters: GeneratedPromptLetter[] = [];

  for (const fileName of files.sort().reverse()) {
    try {
      const content = await fs.readFile(path.join(CACHE_DIR, fileName), 'utf8');
      letters.push(JSON.parse(content));
    } catch {}
  }

  return letters;
}

export async function clearGeneratedLetters(): Promise<void> {
  await fs.mkdir(CACHE_DIR, { recursive: true });
  const files = await fs.readdir(CACHE_DIR);
  for (const file of files) {
    await fs.unlink(path.join(CACHE_DIR, file));
  }
}
