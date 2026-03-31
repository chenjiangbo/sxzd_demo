# 担保业务简报 Word 模板制作指南

## 📋 快速开始

### 第一步：准备 Word 模板

1. **打开 Word**，创建新文档
2. **设置页面布局**：
   - 页边距：上 3.7cm，下 3.5cm，左 2.8cm，右 2.6cm
   - 纸张方向：纵向
   - 字体：标题黑体，正文宋体

3. **编写模板内容结构**（参考以下格式）：

```
                    业务一部担保业务简报
                    
报告期间：{{overview.total_guarantee_amount}}

一、总体概况

截至{{overview.total_guarantee_amount}}末，在保余额{{overview.total_guarantee_amount}}亿元，
较年初增长{{overview.yoy_growth_pct}}%；
在保户数{{overview.customer_count}}，增长{{overview.customer_yoy_growth_pct}}%。

{{table_1}}

二、合作机构统计

{{table_2}}

三、再担保业务情况

{{table_3}}

四、分险业务统计

{{table_4}}

五、备案业务统计

{{table_5}}

六、分险业务占比分析

{{table_6}}

七、合作银行统计

{{table_7}}

八、担保机构综合实力

{{table_8}}

九、创业担保贷款

{{table_9}}

十、科技创新担保

{{table_10}}

十一、融资成本分析

{{table_11}}

十二、区域分布情况

{{table_12}}

备注：{{remark}}
```

### 第二步：插入占位符

#### 文本占位符（直接使用 JSON 中的数据）

在需要动态填充数据的位置插入以下占位符：

**基本信息**：
- `{{meta.issue_number}}` - 期号（如：第 15 期）
- `{{meta.publish_date}}` - 发布日期

**总体概况**：
- `{{overview.total_guarantee_amount}}` - 总担保金额（亿元）
- `{{overview.yoy_growth_pct}}` - 同比增长率
- `{{overview.customer_count}}` - 客户数量
- `{{overview.re_guarantee_amount}}` - 再担保金额
- `{{overview.nfgf_amount}}` - 国担基金金额
- `{{overview.member_count}}` - 成员数量
- `{{overview.total_capital}}` - 总资本
- `{{overview.leverage_ratio}}` - 杠杆率

**重点业务**：
- `{{focus.operational_amount}}` - 经营性金额
- `{{focus.sme_agri_amount}}` - 支农支小金额
- `{{focus.agri_re_amount}}` - 农业再担保金额

**风险分担**：
- `{{risk_sharing.total_amount}}` - 风险分担总额
- `{{risk_sharing.share_ratio}}` - 分担比例

**其他数据**：
- 参考 `data/placeholder-mapping.json` 文件中的所有字段

#### 表格占位符（共 12 张表）

在原来表格的位置插入以下占位符（每个占位符单独一行）：

```
{{table_1}}    - 合作银行业务规模统计表
{{table_2}}    - 担保机构业务规模统计表
{{table_3}}    - 合作银行再担保业务统计表
{{table_4}}    - 担保机构再担保业务统计表
{{table_5}}    - 担保机构备案业务统计表
{{table_6}}    - 担保机构分险业务占比分析表
{{table_7}}    - 合作银行分险业务统计表
{{table_8}}    - 担保机构综合实力排名表
{{table_9}}    - 创业担保贷款机构排名表
{{table_10}}   - 科技创新担保机构排名表
{{table_11}}   - 融资成本分析表
{{table_12}}   - 区域分布情况表
```

### 第三步：保存模板

1. **文件格式**：必须保存为 `.docx` 格式（不能是 `.doc`）
2. **文件名**：`GuaranteeBusinessTemplate.docx`
3. **存放位置**：`data/` 目录

---

## 🔧 技术实现细节

### 当前系统的工作流程

1. **读取模板**：从 `data/GuaranteeBusinessTemplate.docx` 读取
2. **解析 XML**：提取 Word 文档的 `word/document.xml`
3. **替换文本占位符**：使用 `placeholder-mapping.json` 中的数据
4. **生成表格**：从 `GuaranteeBusinessBriefTableData.csv` 读取数据，自动生成 Word 原生表格
5. **打包输出**：生成新的 Word 文档

### 表格生成逻辑

系统会自动：
- 解析 CSV 文件，按空行分割成 12 个表格
- 将每个表格转换为 Word XML 格式
- 替换模板中的 `{{table_1}}`, `{{table_2}}`, ... `{{table_12}}` 占位符
- 生成的表格包含：
  - 灰色表头背景
  - 黑色边框
  - 居中对齐的表头
  - 数据行右对齐（第一列左对齐）

---

## ✅ 验证模板

### 检查清单

- [ ] 所有文本占位符使用双花括号 `{{key}}`
- [ ] 表格占位符单独成行
- [ ] 文件保存为 `.docx` 格式
- [ ] 文件名正确：`GuaranteeBusinessTemplate.docx`
- [ ] 文件放在 `data/` 目录

### 测试方法

1. 启动开发服务器：
```bash
npm run dev
```

2. 访问简报页面：`http://localhost:3000/brief`

3. 点击"生成简报"按钮

4. 下载生成的 Word 文档，检查：
   - 文本占位符是否正确替换
   - 12 张表格是否出现在正确位置
   - 表格格式是否正确（表头、边框、对齐方式）

---

## 🐛 常见问题

### Q1: 生成的表格乱码或格式错误？
**A**: 确保 Word 模板中的 `{{table_n}}` 占位符前后没有其他文字，应该单独成行。

### Q2: 某些数据没有替换成功？
**A**: 检查占位符名称是否与 `placeholder-mapping.json` 中的 key 完全一致（包括大小写）。

### Q3: 表格数量不对？
**A**: CSV 文件中的表格是通过空行分割的。确保每个表格之间有空行分隔。

### Q4: 如何调整表格样式？
**A**: 修改 `lib/server/word-table-generator.ts` 中的 `createWordTableXML` 函数：
- `tableWidth`: 表格总宽度（默认 9000 twips）
- `w:fill`: 表头背景色（默认 E7E6E6 浅灰色）
- `w:sz`: 字体大小（默认 21 = 10.5 磅）

### Q5: 可以添加更多表格吗？
**A**: 可以。只需：
1. 在 CSV 文件中添加新的表格数据（用空行分隔）
2. 在 Word 模板中插入对应的占位符 `{{table_13}}`, `{{table_14}}` 等
3. 系统会自动处理，无需修改代码

---

## 📊 CSV 数据格式说明

CSV 文件结构示例：

```csv
序号，合作银行简称，合作业务规模，
,,业务规模（万元）,规模占比
2，农业银行，1380145.19,98.21%
3，陕西农信，491482.77,52.48%
合计,,3142800.98,56.18%

序号，担保机构简称，业务规模 (万元）,规模占比
1，西安小微担保，1184030.57,30.69%
2，西安财金担保，791695.37,20.52%
合计,,3858461.83,100%
```

**说明**：
- 每个表格之间用**空行**分隔
- 第一行为表头
- 第二行可选（副表头或说明）
- 之后为数据行
- 最后一行可以是合计行

---

## 🎯 最佳实践

### 1. 模板设计
- 保持简洁的布局，避免复杂的格式
- 使用标准字体（宋体、黑体），避免特殊字体
- 段落间距适中，便于阅读

### 2. 占位符使用
- 文本占位符可以 inline 使用（在段落中间）
- 表格占位符必须单独成行
- 占位符前后不要加空格

### 3. 数据准确性
- 定期检查 `placeholder-mapping.json` 数据的准确性
- CSV 数据应与业务系统保持一致
- 生成后人工复核关键数据

### 4. 版本管理
- 模板文件命名包含版本号（如：`GuaranteeBusinessTemplate_v1.0.docx`）
- 定期备份历史版本
- 记录每次修改的内容

---

## 📞 技术支持

如需进一步定制或遇到问题，请参考：
- docxtemplater 官方文档：https://docxtemplater.com/docs/
- WordprocessingML 规范：https://docs.microsoft.com/en-us/openspecs/office_standards/ms-docx

---

**最后更新**: 2026 年 3 月 31 日
