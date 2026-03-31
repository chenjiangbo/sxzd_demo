#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
整理 CSV 文件格式
将原始 CSV 文件按"序号"列分割成多个表格，每个表格之间用空行分隔
"""

import csv
import re

def process_csv():
    input_file = 'data/GuaranteeBusinessBriefTableData.csv'
    output_file = 'data/GuaranteeBusinessBriefTableData_cleaned.csv'
    
    # 读取原始 CSV 文件
    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 移除 BOM
    if content.startswith('\ufeff'):
        content = content[1:]
    
    # 按行分割
    lines = content.strip().split('\n')
    
    # 识别表头行（包含"序号"的行，包括带 BOM 的）
    table_starts = []
    for i, line in enumerate(lines):
        stripped = line.strip().lstrip('\ufeff')
        if stripped.startswith('序号'):
            table_starts.append(i)
    
    print(f"检测到 {len(table_starts)} 个表格")
    
    # 分割表格
    tables = []
    for i in range(len(table_starts)):
        start = table_starts[i]
        end = table_starts[i + 1] if i + 1 < len(table_starts) else len(lines)
        
        # 提取表格数据（包括表头和副表头）
        table_lines = lines[start:end]
        
        # 过滤掉空行
        table_lines = [line for line in table_lines if line.strip()]
        
        # 找到数据开始位置（跳过副表头）
        data_start = 1
        if len(table_lines) > 1 and not re.match(r'^\d', table_lines[1].strip()):
            data_start = 2
        
        # 保留表头和副表头
        header_lines = table_lines[:data_start]
        
        # 提取数据行（直到下一个"序号"或"合计"行）
        data_lines = []
        for j in range(data_start, len(table_lines)):
            line = table_lines[j].strip()
            if line.startswith('序号') or line.startswith('合计'):
                data_lines.append(line)
                break
            if line:  # 非空行
                data_lines.append(line)
        
        # 如果有合计行，添加到末尾
        has_total = any('合计' in line for line in table_lines)
        if has_total and not any('合计' in line for line in data_lines):
            for line in reversed(table_lines):
                if '合计' in line:
                    data_lines.append(line)
                    break
        
        # 合并表格
        full_table = header_lines + data_lines
        tables.append(full_table)
        print(f"表格 {len(tables)}: {len(full_table)} 行")
    
    # 写入新的 CSV 文件，表格之间用空行分隔
    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        for i, table in enumerate(tables):
            if i > 0:
                f.write('\n')  # 表格之间添加空行
            for line in table:
                # 确保使用英文逗号
                line = line.replace(',', ',')
                f.write(line + '\n')
    
    print(f"\n✅ 已生成标准化 CSV 文件：{output_file}")
    print(f"共 {len(tables)} 个表格")
    
    # 验证输出
    with open(output_file, 'r', encoding='utf-8') as f:
        new_content = f.read()
    
    sections = new_content.split('\n\n')
    print(f"验证：检测到 {len(sections)} 个段落")
    
    return len(tables)

if __name__ == '__main__':
    try:
        count = process_csv()
        print(f"\n🎉 CSV 整理完成！共 {count} 个表格")
    except Exception as e:
        print(f"\n❌ 处理失败：{e}")
        import traceback
        traceback.print_exc()
