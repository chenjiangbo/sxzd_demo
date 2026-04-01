import { NextRequest, NextResponse } from 'next/server';
import { getEvaluationReportData } from '@/lib/server/evaluation-report';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const institutionId = searchParams.get('id');
    
    if (!institutionId) {
      return NextResponse.json({ error: '缺少机构 ID' }, { status: 400 });
    }
    
    const data = await getEvaluationReportData();
    const institution = data.institutions.find(i => i.id === institutionId);
    
    if (!institution) {
      return NextResponse.json({ error: '未找到该机构' }, { status: 404 });
    }
    
    // 生成该机构的单独报告
    const report = {
      title: `2025 年度${institution.name}评价报告`,
      reportNo: `陕再担评〔2026〕${institution.id.replace('eval-', '')}号`,
      createdAt: new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }),
      department: '陕西省信用再担保有限责任公司',
      institutionName: institution.name,
      sections: [
        {
          title: '一、机构基本情况',
          body: [
            `${institution.name}（简称：${institution.shortName}），区域层级：${institution.regionLevel}，信用评级：${institution.rating}。`,
          ],
        },
        {
          title: '二、政策目标完成情况',
          body: [
            `1. 新增担保业务规模：目标${institution.targetScale.toFixed(2)}亿元，实际完成${institution.actualScale.toFixed(2)}亿元，完成率${(institution.scaleCompletionRate * 100).toFixed(1)}%。`,
            `2. 小微三农占比：目标${(institution.targetCustomerRatio * 100).toFixed(1)}%，实际${(institution.actualCustomerRatio * 100).toFixed(1)}%，完成率${(institution.customerRatioCompletionRate * 100).toFixed(1)}%。`,
            `3. 再担保规模：目标${institution.targetReGuarantee.toFixed(2)}亿元，实际${institution.actualReGuarantee.toFixed(2)}亿元，完成率${(institution.reGuaranteeCompletionRate * 100).toFixed(1)}%。`,
            `4. 分险业务占比：目标${(institution.targetRiskShare * 100).toFixed(1)}%，实际${(institution.actualRiskShare * 100).toFixed(1)}%，完成率${(institution.riskShareCompletionRate * 100).toFixed(1)}%。`,
            `5. 担保放大倍数：目标${institution.targetLeverage.toFixed(2)}倍，实际${institution.actualLeverage.toFixed(2)}倍，完成率${(institution.leverageCompletionRate * 100).toFixed(1)}%。`,
            `6. 代偿率控制：目标不超过${(institution.targetCompensationRate * 100).toFixed(2)}%，实际${(institution.actualCompensationRate * 100).toFixed(2)}%，${institution.compensationRateStatus}。`,
            `7. 代偿返还率：目标${(institution.targetRecoveryRate * 100).toFixed(1)}%，实际${(institution.actualRecoveryRate * 100).toFixed(1)}%，完成率${(institution.recoveryRateCompletionRate * 100).toFixed(1)}%。`,
          ],
        },
        {
          title: '三、综合评价',
          body: [
            `根据 8 项核心指标达标情况评估，该机构综合评价结果为：**${institution.overallStatus}**。`,
            `政策打分：${institution.policyScore.toFixed(1)}分。`,
          ],
        },
        {
          title: '四、存在问题',
          body: [
            institution.scaleCompletionRate < 1.0 ? `· 新增担保业务规模未完成目标，差距${((1 - institution.scaleCompletionRate) * 100).toFixed(1)}%。` : '',
            institution.customerRatioCompletionRate < 1.0 ? `· 小微三农占比未达目标要求。` : '',
            institution.reGuaranteeCompletionRate < 1.0 ? `· 再担保业务推进缓慢。` : '',
            institution.compensationRateStatus !== '达标' ? `· 代偿率控制需加强。` : '',
          ].filter(Boolean),
        },
        {
          title: '五、工作建议',
          body: [
            institution.overallStatus === '优秀' ? '· 继续保持良好发展态势，发挥示范引领作用。' : '',
            institution.overallStatus === '良好' ? '· 向优秀梯队迈进，进一步提升业务质量。' : '',
            institution.overallStatus === '达标' ? '· 加强业务拓展与风险控制，确保完成各项目标。' : '',
            institution.overallStatus === '待改进' ? '· 制定专项改进方案，限期整改提升。' : '',
          ].filter(Boolean),
        },
      ],
      adoptedCriteria: [
        '8 项指标≥6 项达标为优秀',
        '8 项指标 4-5 项达标为良好',
        '8 项指标 3 项达标为达标',
        '8 项指标<3 项达标为待改进',
      ],
    };
    
    return NextResponse.json({ report, institution });
  } catch (error) {
    console.error('获取机构评价报告失败:', error);
    return NextResponse.json({ error: '获取数据失败' }, { status: 500 });
  }
}
