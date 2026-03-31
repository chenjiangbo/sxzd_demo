#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
将 HTML 模板中的嵌套占位符转换为扁平化格式
例如：<%= overview.total_guarantee_amount %> -> <%= overview_total_guarantee_amount %>
"""

import re

def flatten_placeholders():
    template_file = 'templates/brief-template.html'
    
    with open(template_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 匹配所有 <%= xxx.yyy.zzz %> 格式的占位符
    pattern = r'<%= ([a-zA-Z_][a-zA-Z0-9_]*)\.([a-zA-Z_][a-zA-Z0-9_]*) %>'
    
    matches = re.findall(pattern, content)
    print(f'找到 {len(matches)} 个嵌套占位符:')
    
    # 替换为扁平化格式
    for section, key in matches:
        old = f'<%= {section}.{key} %>'
        new = f'<%= {section}_{key} %>'
        content = content.replace(old, new)
        print(f'  {old} -> {new}')
    
    # 保存修改后的文件
    with open(template_file, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f'\n✅ 已将 {len(matches)} 个嵌套占位符转换为扁平化格式')

if __name__ == '__main__':
    flatten_placeholders()
