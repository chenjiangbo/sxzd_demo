'use client';

import { useState, useEffect } from 'react';

type Props = {
  content: string;
  fileName: string;
  institutionName: string;
  onContentUpdated?: (institutionName: string, newContent: string) => void;
};

export default function PromptLetterPreviewClient({ content, fileName, institutionName, onContentUpdated }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingContent, setEditingContent] = useState(content);
  const [isSaving, setIsSaving] = useState(false);

  // 当外部 content 变化时，同步到编辑状态
  useEffect(() => {
    setEditingContent(content);
  }, [content]);

  // 保存编辑
  const handleSave = async () => {
    if (!institutionName) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/prompt-letter/update-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          institutionName,
          content: editingContent,
        }),
      });
      if (res.ok) {
        // 通知父组件更新
        if (onContentUpdated) {
          onContentUpdated(institutionName, editingContent);
        }
        setIsEditing(false);
      } else {
        alert('保存失败');
      }
    } catch {
      alert('保存失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  // 取消编辑
  const handleCancel = () => {
    setEditingContent(content);
    setIsEditing(false);
  };

  // 解析提示函内容结构
  const parsePromptLetterContent = (text: string) => {
    if (!text) return { title: '综合评价提示函', greeting: '', sections: [] };

    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    
    // 提取标题行（前两行，直到遇到称谓行）
    let titleLines: string[] = [];
    let greeting = '';
    let opening = '';  // 问候语（您好！...）
    let bodyLines: string[] = [];
    let inGreeting = false;
    let inOpening = false;
    
    for (const line of lines) {
      // 检测称谓行：姓名+职务+冒号
      if (!inGreeting && !inOpening && line.match(/^[\u4e00-\u9fa5]{2,8}(董事长|总经理|负责人)?[：:]/)) {
        inGreeting = true;
        greeting = line;
        continue;
      }
      
      // 检测问候语（您好！开头）
      if (inGreeting && !inOpening && line.startsWith('您好！')) {
        inOpening = true;
        opening = line;
        continue;
      }
      
      // 在称谓行之前的是标题
      if (!inGreeting && titleLines.length < 2) {
        titleLines.push(line);
      } else {
        bodyLines.push(line);
      }
    }
    
    // 合并标题
    const title = titleLines.join('') || '综合评价提示函';
    
    // 解析正文中的章节
    const sections = [];
    let currentSection: { title: string; content: string[] } | null = null;
    
    for (const line of bodyLines) {
      if (line.match(/^一、|二、|三、|四、|五、|六、|七、|八、|九、|十、/)) {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          title: line,
          content: []
        };
      } else if (currentSection) {
        if (line) {
          currentSection.content.push(line);
        }
      }
    }
    if (currentSection) {
      sections.push(currentSection);
    }
    
    return { title, greeting, opening, sections };
  };

  // 解析内容
  const { title, greeting, opening, sections } = parsePromptLetterContent(content);

  if (!content) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <p>暂无内容</p>
      </div>
    );
  }

  // 编辑模式：纯 textarea
  if (isEditing) {
    return (
      <div className="font-['SimSun',serif] text-[15px] leading-relaxed">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-2 mb-4">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving ? '保存中...' : '保存'}
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              取消
            </button>
          </div>
          <textarea
            value={editingContent}
            onChange={(e) => setEditingContent(e.target.value)}
            className="w-full h-[calc(100vh-200px)] p-4 border border-gray-300 rounded font-['SimSun',serif] text-[15px] leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="font-['SimSun',serif] text-[15px] leading-relaxed">
      <div className="max-w-4xl mx-auto">
        {/* 编辑按钮 */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => {
              setEditingContent(content);
              setIsEditing(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            编辑
          </button>
        </div>

          {/* 标题 */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">{title}</h1>
          </div>

          {/* 称谓和问候语 */}
          {greeting && (
            <div className="mb-4">
              <p className="font-bold text-left">{greeting}</p>
            </div>
          )}
          {opening && (
            <div className="mb-6">
              <p className="text-left indent-8">{opening}</p>
            </div>
          )}

          <div className="space-y-6">
            {sections.map((section, index) => (
              <div key={index}>
                <h2 className="font-bold text-lg mb-3 text-left">{section.title}</h2>
                <div className="space-y-3 text-left">
                  {section.content.map((paragraph, pIndex) => (
                    <p key={pIndex} className="leading-8 indent-8">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            ))}

            {/* 如果没有解析到特定结构，直接显示内容 */}
            {sections.length === 0 && content && (
              <div className="whitespace-pre-line text-left">
                {content}
              </div>
            )}
          </div>
      </div>
    </div>
  );
}