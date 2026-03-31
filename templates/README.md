# Word 模板放置目录

请将你的 Word 模板文件 `brief-template.docx` 放在此目录下。

## 模板制作说明

1. **创建 Word 文档**
   - 使用 Microsoft Word 或 WPS 创建简报模板
   - 设计好页面布局、字体、样式等

2. **插入占位符**
   在需要动态填充数据的位置插入以下占位符：

   ### 单个指标占位符示例：
   ```
   {{report_title}}      - 报告标题
   {{report_period}}     - 报告期间（如：2026 年上半年）
   {{total_balance}}     - 在保余额
   {{total_balance_growth}} - 较年初增长
   {{compensation_amount}} - 代偿金额
   {{compensation_rate}}   - 代偿率
   ...等等（参考 placeholder-mapping.json）
   ```

   ### 表格占位符示例：
   ```
   {{table_overview}}         - 担保业务总体情况表
   {{table_product_structure}} - 分产品类型担保情况表
   {{table_industry_structure}} - 分行业担保情况表
   ...等等（共 12 张表格）
   ```

3. **保存模板**
   - 将文件保存为 `.docx` 格式（不要保存为 `.doc`）
   - 文件名必须为：`brief-template.docx`
   - 放入此 `templates` 目录

4. **技术实现提示**
   - 后端将使用 `docxtemplater` 库来解析和填充模板
   - 表格数据会以 HTML 表格或 docx 表格对象形式插入
   - 占位符语法支持嵌套和循环

## 下一步

模板文件准备好后，需要安装以下 Node.js 依赖：

```bash
npm install docxtemplater pizzip
```

然后修改 `app/api/generate-brief/route.ts` 中的 `fillWordTemplate` 函数，
使用真实的 docxtemplater API 来处理模板填充。
