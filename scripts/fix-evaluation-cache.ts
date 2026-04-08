/**
 * 从 AI 网关日志中提取评价报告结果并生成缓存文件
 * 用于解决 502 Proxy Error 问题(AI 已返回但代理超时)
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';

const EVALUATION_REPORT_GENERATION_VERSION = '2026-04-02-evaluation-report-template-v2';

async function main() {
  // 1. 读取日志文件
  const logPath = path.join(process.cwd(), 'data', 'log-495.json');
  console.log('读取日志文件:', logPath);
  
  const logContent = await fs.readFile(logPath, 'utf8');
  const logData = JSON.parse(logContent);
  
  // 2. 提取 AI 响应内容
  const aiResponse = logData.payload.response_payload.choices[0].message.content;
  console.log('AI 响应长度:', aiResponse.length);
  
  // 3. 解析 AI 返回的 JSON
  const narrative = JSON.parse(aiResponse);
  console.log('解析后的叙事结构:', Object.keys(narrative));
  
  // 4. 构建机构快照(从日志的请求中提取)
  const requestMessages = logData.payload.request_payload.messages;
  const userMessage = requestMessages.find((m: any) => m.role === 'user')?.content || '';
  
  // 从 prompt 中提取机构信息
  const institution = {
    id: 'eval-03', // 吴起担保的 ID
    name: '吴起县中小企业融资担保有限责任公司',
    shortName: '吴起担保',
    regionLevel: '县区',
    overallStatus: '良好',
    targetScale: 15.00,
    actualScale: 0.47,
    scaleCompletionRate: 0.0313,
    targetCustomerRatio: 0.008,
    actualCustomerRatio: 0.0106,
    customerRatioCompletionRate: 1.325,
    targetReGuarantee: 12.00,
    actualReGuarantee: 0.45,
    reGuaranteeCompletionRate: 0.0375,
    targetRiskShare: 0.0099,
    actualRiskShare: 0.0106,
    riskShareCompletionRate: 1.0707,
    targetLeverage: 2.03,
    actualLeverage: 3.48,
    leverageCompletionRate: 1.7143,
    targetCompensationRate: 0.20,
    actualCompensationRate: 0.0005,
    compensationRateStatus: '达标',
    targetRecoveryRate: 0.001,
    actualRecoveryRate: 0.0,
    recoveryRateCompletionRate: 0.0,
  };
  
  // 5. 构建完整的文档对象
  const document = {
    institution,
    generatedAt: new Date().toISOString(),
    investigator: '（待填写）',
    interviewee: '（待填写）',
    surveyDate: `${new Date().getFullYear()}年${new Date().getMonth() + 1}月${new Date().getDate()}日`,
    narrative,
  };
  
  // 6. 写入缓存文件
  const cacheDir = path.join(process.cwd(), '.cache', 'demo-analysis', 'evaluation-report', 'generated');
  const cachePath = path.join(cacheDir, `${institution.id}-${EVALUATION_REPORT_GENERATION_VERSION}.json`);
  
  await fs.mkdir(cacheDir, { recursive: true });
  await fs.writeFile(cachePath, JSON.stringify(document, null, 2), 'utf8');
  
  console.log('✅ 缓存文件已生成:', cachePath);
  console.log('现在可以刷新页面重新生成报告,将直接读取缓存而不调用 AI');
}

main().catch((error) => {
  console.error('❌ 错误:', error);
  process.exit(1);
});
