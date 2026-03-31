# 担保业务简报生成 - 快速开始指南

## 🎯 功能概述

本系统用于自动生成《业务一部担保业务简报》，支持：
- ✅ 从 JSON 文件读取文本数据
- ✅ 从 CSV 文件读取表格数据
- ✅ 自动生成 Word 文档（含 12 张表格）
- ✅ 一键下载生成的简报

---

## 📁 项目结构

```
sxzd_demo-main/
├── data/
│   ├── GuaranteeBusinessTemplate.docx    # Word 模板（需要制作）
│   ├── GuaranteeBusinessBriefTableData.csv  # 12 张表格数据
│   ├── placeholder-mapping.json          # 文本占位符数据
│   └── TEMPLATE_GUIDE.md                 # 模板制作指南
├── lib/server/
│   ├── brief-generator.ts                # Word 文档生成核心逻辑
│   └── word-table-generator.ts           # 表格 XML 生成工具
├── app/api/generate-brief/
│   └── route.ts                          # API 接口
├── components/
│   └── BriefGenerator.tsx                # 前端界面
└── test-table-generation.ts              # 测试脚本
```

---

## 🚀 快速开始

### 步骤 1：准备环境

确保已安装 Node.js 18+ 和 npm：

```bash
node --version  # 应 >= 18.0.0
npm --version   # 应 >= 9.0.0
```

### 步骤 2：安装依赖

```bash
npm install
```

系统已包含所需依赖：
- `docxtemplater` - Word 文档处理
- `pizzip` - ZIP 压缩（docx 格式基础）
- Next.js, React - Web 框架

### 步骤 3：制作 Word 模板

**重要**：这是最关键的一步！

1. **打开 Word**，创建新文档
2. **插入占位符**（参考 `data/TEMPLATE_GUIDE.md`）：

```
                    业务一部担保业务简报
                    
报告期间：{{overview.total_guarantee_amount}}

一、总体概况

截至报告期末，在保余额{{overview.total_guarantee_amount}}亿元，
同比增长{{overview.yoy_growth_pct}}%。

{{table_1}}

二、合作机构统计

{{table_2}}

...（继续插入 table_3 到 table_12）
```

3. **保存为** `data/GuaranteeBusinessTemplate.docx`

⚠️ **注意事项**：
- 必须保存为 `.docx` 格式（不是 `.doc`）
- 表格占位符 `{{table_n}}` 必须单独成行
- 文本占位符可以在段落中间

### 步骤 4：验证数据文件

检查以下文件是否存在且格式正确：

```bash
# 检查 CSV 文件
ls data/GuaranteeBusinessBriefTableData.csv

# 检查 JSON 文件
ls data/placeholder-mapping.json
```

CSV 文件格式示例：
```csv
序号，合作银行简称，合作业务规模，
,,业务规模（万元）,规模占比
2，农业银行，1380145.19,98.21%
3，陕西农信，491482.77,52.48%
合计,,3142800.98,56.18%

序号，担保机构简称，业务规模 (万元）,规模占比
1，西安小微担保，1184030.57,30.69%
...
```

### 步骤 5：运行测试

```bash
# 运行测试脚本（可选但推荐）
npx ts-node test-table-generation.ts
```

预期输出：
```
=== 开始测试表格生成 ===

📄 读取 CSV 文件...
✅ CSV 文件大小：xxxx 字节

📊 分割表格数据...
✅ 共解析出 12 个表格

表格 1:
  表头：序号 | 合作银行简称 | 合作业务规模 |
  行数：26
  ...

🚀 测试完整简报生成...
✅ 模板文件存在
⚙️  正在生成 Word 文档...
✅ 生成成功！
📁 输出文件：test-brief-output.docx
📦 文件大小：xx.xx KB

=== 测试完成 ===
```

### 步骤 6：启动开发服务器

```bash
npm run dev
```

访问：http://localhost:3000/brief

### 步骤 7：生成简报

1. 点击左侧菜单"简报"
2. 选择报告期间（上半年/下半年/自定义）
3. 点击"生成简报"按钮
4. 等待生成完成
5. 点击下载按钮获取 Word 文档

---

## 🔧 常见问题排查

### Q1: "无法读取 Word 文档内容"
**原因**：模板文件不存在或格式错误  
**解决**：
```bash
# 检查文件是否存在
ls data/GuaranteeBusinessTemplate.docx

# 确保是 .docx 格式（不是 .doc）
```

### Q2: "CSV 表格数据加载失败"
**原因**：CSV 文件路径错误或格式问题  
**解决**：
```bash
# 检查 CSV 文件
ls data/GuaranteeBusinessBriefTableData.csv

# 用 Excel 打开检查格式是否正确
# 确保表格之间有空行分隔
```

### Q3: 生成的文档中表格显示为 `{{table_1}}`
**原因**：占位符未被替换  
**解决**：
- 确保 `{{table_1}}` 单独成行
- 前后不要有其他文字
- 检查 CSV 中是否有对应的表格数据

### Q4: 表格乱码或格式错乱
**原因**：Word XML 解析问题  
**解决**：
- 用 Word 打开模板，检查是否有特殊格式
- 简化模板样式，使用标准字体
- 避免使用复杂的合并单元格

### Q5: 某些数据没有替换
**原因**：占位符名称不匹配  
**解决**：
```bash
# 检查 placeholder-mapping.json 中的 key
# 确保与 Word 模板中的占位符完全一致
# 包括大小写和标点符号
```

---

## 📊 数据结构说明

### placeholder-mapping.json

```json
{
  "meta": {
    "issue_number": "第 15 期",
    "total_issue": "87",
    "publish_date": "2025 年 7 月 15 日"
  },
  "overview": {
    "total_guarantee_amount": "693.92",
    "yoy_growth_pct": "18.42",
    ...
  },
  "focus": { ... },
  "risk_sharing": { ... },
  ...
}
```

所有字段都可以作为占位符使用：
- `{{meta.issue_number}}` → 第 15 期
- `{{overview.total_guarantee_amount}}` → 693.92

### GuaranteeBusinessBriefTableData.csv

按空行分割成 12 个表格：
- 表格 1：合作银行业务规模统计表（26 行）
- 表格 2：担保机构业务规模统计表（39 行）
- 表格 3：合作银行再担保业务统计表（26 行）
- ...
- 表格 12：区域分布情况表（11 行）

---

## 🎨 自定义样式

### 修改表格样式

编辑 `lib/server/word-table-generator.ts`：

```typescript
// 表格宽度（单位：twips，1/20 磅）
const tableWidth = 9000;  // 默认值

// 表头背景色（十六进制颜色）
<w:shd w:fill="E7E6E6"/>  // 浅灰色

// 字体大小
<w:sz w:val="21"/>  // 21 = 10.5 磅

// 边框粗细
w:sz="4"  // 内部边框
w:sz="8"  // 外边框
```

### 修改文本样式

在 Word 模板中直接修改：
- 选中文本 → 设置字体、字号、颜色
- 段落格式 → 调整行距、缩进
- 页面布局 → 调整页边距

---

## 📈 性能优化建议

### 1. 添加缓存
```typescript
// 在内存中缓存模板和数据
const cache = new Map();

// 避免重复读取文件
```

### 2. 异步处理
```typescript
// 使用 Promise.all 并行读取多个文件
const [template, mapping, csv] = await Promise.all([
  fs.readFile(templatePath),
  fs.readFile(mappingPath),
  fs.readFile(csvPath)
]);
```

### 3. 减少文件大小
```typescript
// 压缩生成的 Word 文档
const buf = zip.generate({
  type: 'nodebuffer',
  compression: 'DEFLATE',  // 启用压缩
});
```

---

## 🔄 部署到生产环境

### 构建应用
```bash
npm run build
npm start
```

### 环境变量（可选）
创建 `.env` 文件：
```env
PORT=3000
NODE_ENV=production
```

### Docker 部署（可选）
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 📞 技术支持

### 文档资源
- **模板制作指南**: `data/TEMPLATE_GUIDE.md`
- **方案对比**: `docs/WORD_VS_HTML_COMPARISON.md`
- **docxtemplater 官方文档**: https://docxtemplater.com/docs/

### 调试技巧
1. 查看控制台日志
2. 使用测试脚本验证
3. 检查生成的 XML 文件
4. 对比输入数据和输出文档

### 社区支持
- GitHub Issues
- Stack Overflow (标签：docxtemplater, nextjs)
- Microsoft Office 开发者论坛

---

## ✅ 检查清单

在开始使用前，请确认：

- [ ] Node.js 版本 >= 18.0.0
- [ ] 已运行 `npm install`
- [ ] Word 模板已制作并放在正确位置
- [ ] CSV 数据文件存在且格式正确
- [ ] JSON 映射文件完整
- [ ] 运行测试脚本无错误
- [ ] 开发服务器正常启动
- [ ] 能够成功生成并下载简报

---

## 🎉 完成！

如果一切正常，你现在应该能够：
1. ✅ 访问 http://localhost:3000/brief
2. ✅ 选择报告期间
3. ✅ 点击生成按钮
4. ✅ 下载包含 12 张表格的 Word 简报

**祝你使用愉快！** 🚀

---

**最后更新**: 2026 年 3 月 31 日
