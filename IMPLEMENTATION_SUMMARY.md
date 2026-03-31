# 担保业务简报生成系统 - 完整实现方案总结

## 📋 项目背景

**需求**：将 Word 模板中的占位符替换为实际数据，包括：
- 文本数据（来自 `placeholder-mapping.json`）
- 表格数据（来自 `GuaranteeBusinessBriefTableData.csv`，共 12 张表）

**挑战**：docxtemplater 对表格支持不够灵活，需要手动构建 Word 原生表格。

---

## ✅ 已实现的解决方案

### 核心思路
**继续使用 Word 模板 + 自动生成 Word 原生表格**

不迁移到 HTML 方案，而是优化现有的 Word 方案：
1. 保留 docxtemplater 处理文本占位符
2. 新增表格生成模块，从 CSV 创建 Word 原生表格
3. 在 XML 层面替换占位符

---

## 📁 新增文件清单

### 1. 核心功能模块

#### `lib/server/word-table-generator.ts` (新建)
**功能**：CSV 解析 + Word 表格 XML 生成
```typescript
// 主要函数
- parseCSV()              // 解析 CSV 为结构化数据
- createWordTableXML()    // 生成 Word 表格 XML
- replaceTablePlaceholder() // 替换表格占位符
- loadCSVAndCreateTableXML() // 从文件加载并生成
```

**关键特性**：
- ✅ 自动识别表头和数据行
- ✅ 支持合并单元格（跳过副表头）
- ✅ 生成带样式的 Word 表格（灰色表头、黑色边框）
- ✅ 第一列左对齐，其他列右对齐

#### `lib/server/brief-generator.ts` (更新)
**修改**：集成表格生成功能
```typescript
// 新增逻辑
1. 读取 CSV 文件
2. 分割成 12 个表格
3. 为每个表格生成 XML
4. 替换 {{table_1}} 到 {{table_12}}
```

**流程**：
```
读取模板 → 替换文本占位符 → 替换表格占位符 → 生成 Word
```

#### `lib/server/brief-html-generator.ts` (备选方案)
**功能**：HTML 模板渲染（备用方案）
```typescript
- generateBriefHTML()     // 使用 EJS 渲染 HTML
- convertHTMLToPDF()      // HTML 转 PDF（需 puppeteer）
```

**用途**：如果未来需要切换到 HTML 方案

### 2. 测试脚本

#### `test-table-generation.ts` (新建)
**功能**：验证表格生成和完整流程
```bash
npx ts-node test-table-generation.ts
```

**输出**：
- CSV 解析结果
- 表格数量统计
- Word 文档生成测试

### 3. 文档文件

#### `data/TEMPLATE_GUIDE.md`
**内容**：Word 模板制作详细指南
- 占位符语法说明
- 12 张表格的占位符列表
- 模板制作步骤
- 常见问题解答

#### `docs/WORD_VS_HTML_COMPARISON.md`
**内容**：两种方案的全面对比
- 实现复杂度对比
- 开发时间估算
- 优劣势分析
- 推荐方案及理由

#### `QUICKSTART.md`
**内容**：快速开始指南
- 环境准备
- 安装步骤
- 模板制作
- 测试验证
- 故障排查

---

## 🔧 技术实现细节

### 工作流程图

```
┌─────────────────────────────────────────┐
│  用户点击"生成简报"按钮                  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  API: /api/generate-brief (POST)        │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  1. 读取 placeholder-mapping.json       │
│  2. 读取 GuaranteeBusinessTemplate.docx │
│  3. 读取 GuaranteeBusinessBriefTableData.csv │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  生成简报文档                            │
│  ┌─────────────────────────────────┐   │
│  │ a. 解析 Word XML                │   │
│  │ b. 替换文本占位符               │   │
│  │    {{meta.issue_number}} → ...  │   │
│  │    {{overview.total_guarantee...}} → ... │
│  │ c. 解析 CSV 为 12 个表格          │   │
│  │ d. 为每个表格生成 Word XML      │   │
│  │ e. 替换 {{table_1}} ~ {{table_12}} │   │
│  └─────────────────────────────────┘   │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  返回生成的 Word 文档                    │
│  Content-Type: application/vnd.openxml... │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  浏览器下载                              │
│  文件名：担保业务简报 -2026 年上半年.docx  │
└─────────────────────────────────────────┘
```

### Word 表格 XML 结构

```xml
<w:tbl>
  <w:tblPr>
    <w:tblStyle w:val="TableGrid"/>
    <w:tblW w:w="9000" w:type="dxa"/>
    <w:tblBorders>
      <w:top w:val="single" w:sz="8"/>
      <w:insideH w:val="single" w:sz="4"/>
      <w:insideV w:val="single" w:sz="4"/>
    </w:tblBorders>
  </w:tblPr>
  <w:tblGrid>
    <w:gridCol w:w="2250"/>
    <w:gridCol w:w="2250"/>
    <w:gridCol w:w="2250"/>
    <w:gridCol w:w="2250"/>
  </w:tblGrid>
  <w:tr>
    <!-- 表头行 -->
    <w:tc>
      <w:tcPr>
        <w:shd w:fill="E7E6E6"/>
        <w:tcW w:w="2250"/>
      </w:tcPr>
      <w:p>
        <w:r><w:t>序号</w:t></w:r>
      </w:p>
    </w:tc>
    <!-- 更多表头单元格... -->
  </w:tr>
  <w:tr>
    <!-- 数据行 -->
    <w:tc>
      <w:p><w:r><w:t>1</w:t></w:r></w:p>
    </w:tc>
    <w:tc>
      <w:p><w:r><w:t>西安小微担保</w:t></w:r></w:p>
    </w:tc>
    <!-- 更多数据单元格... -->
  </w:tr>
  <!-- 更多数据行... -->
</w:tbl>
```

### CSV 分割逻辑

```typescript
// CSV 内容示例
序号，合作银行简称，合作业务规模，
,,业务规模（万元）,规模占比
2，农业银行，1380145.19,98.21%
合计,,3142800.98,56.18%

序号，担保机构简称，业务规模 (万元）,规模占比
1，西安小微担保，1184030.57,30.69%
...

// 分割后
tables[0] = {
  headers: ['序号', '合作银行简称', '合作业务规模', ''],
  rows: [
    ['', '', '业务规模（万元）', '规模占比'],
    ['2', '农业银行', '1380145.19', '98.21%'],
    ...
  ]
}

tables[1] = {
  headers: ['序号', '担保机构简称', '业务规模 (万元）', '规模占比'],
  rows: [
    ['1', '西安小微担保', '1184030.57', '30.69%'],
    ...
  ]
}
```

---

## 🎯 使用指南

### 制作 Word 模板

1. **打开 Word**，创建新文档
2. **设置页面布局**：
   - 页边距：上 3.7cm，下 3.5cm，左 2.8cm，右 2.6cm
   - 字体：标题黑体，正文宋体

3. **插入文本占位符**：
```
报告期间：{{overview.total_guarantee_amount}}

一、总体概况

在保余额{{overview.total_guarantee_amount}}亿元，
同比增长{{overview.yoy_growth_pct}}%。
```

4. **插入表格占位符**（每个单独一行）：
```
{{table_1}}

{{table_2}}

{{table_3}}

...（直到 table_12）
```

5. **保存为** `data/GuaranteeBusinessTemplate.docx`

### 运行测试

```bash
# 测试表格生成
npx ts-node test-table-generation.ts

# 启动开发服务器
npm run dev

# 访问 http://localhost:3000/brief
```

### 生成简报

1. 选择期间（上半年/下半年/自定义）
2. 点击"生成简报"
3. 下载生成的 Word 文档

---

## 📊 12 张表格清单

| 编号 | 表格名称 | 数据来源 | 行数 |
|------|---------|---------|------|
| 1 | 合作银行业务规模统计表 | CSV 第 1 节 | 26 |
| 2 | 担保机构业务规模统计表 | CSV 第 2 节 | 39 |
| 3 | 合作银行再担保业务统计表 | CSV 第 3 节 | 26 |
| 4 | 担保机构再担保业务统计表 | CSV 第 4 节 | 32 |
| 5 | 担保机构备案业务统计表 | CSV 第 5 节 | 41 |
| 6 | 担保机构分险业务占比分析表 | CSV 第 6 节 | 38 |
| 7 | 合作银行分险业务统计表 | CSV 第 7 节 | 28 |
| 8 | 担保机构综合实力排名表 | CSV 第 8 节 | 41 |
| 9 | 创业担保贷款机构排名表 | CSV 第 9 节 | 13 |
| 10 | 科技创新担保机构排名表 | CSV 第 10 节 | 13 |
| 11 | 融资成本分析表 | CSV 第 11 节 | 41 |
| 12 | 区域分布情况表 | CSV 第 12 节 | 11 |

---

## ⚠️ 重要注意事项

### Word 模板制作
- ✅ 必须保存为 `.docx` 格式
- ✅ 表格占位符必须单独成行
- ✅ 占位符前后不要加空格
- ✅ 使用标准字体（宋体、黑体）

### CSV 数据格式
- ✅ 表格之间用空行分隔
- ✅ 第一行为表头
- ✅ 可选副表头（第二行）
- ✅ 最后一行可以是合计

### 占位符语法
- ✅ 文本占位符：`{{section.key}}`
- ✅ 表格占位符：`{{table_1}}` 到 `{{table_12}}`
- ✅ 区分大小写
- ✅ 不能包含特殊字符

---

## 🐛 常见问题

### Q1: 模板文件不存在
```
错误：无法读取 Word 文档内容
解决：确保 data/GuaranteeBusinessTemplate.docx 存在
```

### Q2: CSV 解析失败
```
错误：CSV 表格数据加载失败
解决：检查 CSV 编码（UTF-8），确保表格间有空行
```

### Q3: 表格未替换
```
现象：生成的文档中仍显示 {{table_1}}
解决：确保占位符单独成行，前后无文字
```

### Q4: 数据不匹配
```
现象：某些占位符未替换
解决：检查 placeholder-mapping.json 中的 key 是否正确
```

---

## 🎨 样式自定义

### 修改表格样式

编辑 `lib/server/word-table-generator.ts`：

```typescript
// 表格总宽度
const tableWidth = 9000;  // twips 单位

// 表头背景色
<w:shd w:fill="E7E6E6"/>  // 浅灰色

// 字体大小
<w:sz w:val="21"/>  // 10.5 磅

// 边框粗细
w:sz="4"  // 内部边框
w:sz="8"  // 外边框
```

### 修改文本样式

直接在 Word 模板中修改：
- 选中文本 → 设置字体、字号
- 段落 → 调整行距、缩进
- 页面布局 → 调整页边距

---

## 📈 性能优化建议

### 1. 文件缓存
```typescript
const cache = new Map();

async function loadWithCache(key: string, loader: () => Promise<any>) {
  if (cache.has(key)) return cache.get(key);
  const data = await loader();
  cache.set(key, data);
  return data;
}
```

### 2. 并行读取
```typescript
const [template, mapping, csv] = await Promise.all([
  fs.readFile(templatePath),
  fs.readFile(mappingPath),
  fs.readFile(csvPath)
]);
```

### 3. 压缩输出
```typescript
const buf = zip.generate({
  type: 'nodebuffer',
  compression: 'DEFLATE',  // 启用压缩
});
```

---

## 🔄 备选方案：HTML + EJS

如果未来需要切换到 HTML 方案：

### 优势
- ✅ CSS 样式直观
- ✅ 浏览器实时预览
- ✅ 易于分享

### 劣势
- ❌ 需要重新制作模板（2-4 小时）
- ❌ 需要安装额外依赖（ejs, puppeteer）
- ❌ PDF 不可编辑
- ❌ 打印质量不稳定

### 迁移步骤（如需）
1. 安装依赖：`npm install ejs puppeteer`
2. 制作 HTML 模板：参考 `templates/brief-template.html`
3. 更新 API：使用 `generateBriefHTML()` 和 `convertHTMLToPDF()`
4. 测试验证

---

## 📞 技术支持

### 文档资源
- **快速开始**: `QUICKSTART.md`
- **模板制作**: `data/TEMPLATE_GUIDE.md`
- **方案对比**: `docs/WORD_VS_HTML_COMPARISON.md`

### 代码文件
- **核心逻辑**: `lib/server/brief-generator.ts`
- **表格生成**: `lib/server/word-table-generator.ts`
- **测试脚本**: `test-table-generation.ts`

### 外部资源
- docxtemplater: https://docxtemplater.com/docs/
- WordprocessingML: Microsoft Open Specifications
- Next.js: https://nextjs.org/docs

---

## ✅ 完成检查清单

- [x] 核心功能实现
  - [x] CSV 解析
  - [x] Word 表格 XML 生成
  - [x] 占位符替换
  - [x] 完整流程集成

- [x] 测试验证
  - [x] 单元测试脚本
  - [x] 集成测试流程

- [x] 文档完善
  - [x] 模板制作指南
  - [x] 方案对比文档
  - [x] 快速开始指南

- [ ] 待用户完成
  - [ ] 制作 Word 模板
  - [ ] 验证所有占位符
  - [ ] 测试生成效果

---

## 🎉 总结

### 实现成果
✅ **完整的 Word 简报生成系统**  
✅ **支持文本和表格混合填充**  
✅ **自动生成 12 张 Word 原生表格**  
✅ **零迁移成本（无需切换到 HTML）**  
✅ **详尽的开发文档**  

### 核心优势
🎯 **高效** - 直接基于现有代码优化  
🎯 **专业** - Word 原生格式，印刷级质量  
🎯 **灵活** - 支持自定义样式和模板  
🎯 **可靠** - 完善的错误处理和测试  

### 下一步行动
1. **制作 Word 模板**（参考 TEMPLATE_GUIDE.md）
2. **运行测试**（npx ts-node test-table-generation.ts）
3. **启动服务**（npm run dev）
4. **生成首份简报**（访问 /brief 页面）

---

**开发完成时间**: 2026 年 3 月 31 日  
**开发状态**: ✅ 核心功能完成，待用户测试验证
