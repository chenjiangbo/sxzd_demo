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
    if (!text) return { title: '综合评价提示函', titleLines: [], greeting: '', opening: '', sections: [] };

    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    
    // 提取标题行（前两行，直到遇到称谓行）
    let titleLinesArr: string[] = [];
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
      if (!inGreeting && titleLinesArr.length < 2) {
        titleLinesArr.push(line);
      } else {
        bodyLines.push(line);
      }
    }
    
    // 解析正文中的章节
    const sections: { title: string; level: 1 | 2; content: string[] }[] = [];
    let currentSection: { title: string; level: 1 | 2; content: string[] } | null = null;
    
    for (const line of bodyLines) {
      // 一级标题：一、二、三...
      if (line.match(/^[一二三四五六七八九十]+、/)) {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          title: line,
          level: 1,
          content: []
        };
      }
      // 二级标题：（一）（二）（三）...
      else if (line.match(/^（[一二三四五六七八九十]+）/)) {
        // 二级标题作为独立 section 或追加到一级标题下
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          title: line,
          level: 2,
          content: []
        };
      }
      else if (currentSection) {
        if (line) {
          currentSection.content.push(line);
        }
      }
    }
    if (currentSection) {
      sections.push(currentSection);
    }
    
    return { title: titleLinesArr.join('') || '综合评价提示函', titleLines: titleLinesArr, greeting, opening, sections };
  };

  // 解析内容
  const { title, titleLines, greeting, opening, sections } = parsePromptLetterContent(content);

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
      <div className="font-['SimSun',serif] text-[16px] leading-[28pt] h-full flex flex-col">
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
          className="flex-1 w-full p-4 border border-gray-300 rounded font-['SimSun',serif] text-[16px] leading-[28pt] resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    );
  }

  return (
    <div className="font-['SimSun',serif] text-[16px] leading-[28pt] h-full flex flex-col">
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

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[21cm] mx-auto px-[3.17cm] pb-[2.54cm] bg-white">

          {/* 标题 - 仿宋二号加粗居中，保持两行 */}
          <div className="text-center mb-8">
            {titleLines.map((line, idx) => (
              <h1 key={idx} className="text-[22pt] font-bold mb-2 font-['FangSong','SimSun',serif] leading-[2em]">{line}</h1>
            ))}
          </div>

          {/* 称谓和问候语 */}
          {greeting && (
            <div className="mb-4">
              <p className="font-['FangSong','SimSun',serif] text-[16px] leading-[28pt] font-bold text-left">{greeting}</p>
            </div>
          )}
          {opening && (
            <div className="mb-6">
              <p className="font-['FangSong','SimSun',serif] text-[16px] leading-[28pt] text-left pl-[2em]">{opening}</p>
            </div>
          )}

          <div className="space-y-0">
            {sections.map((section, index) => (
              <div key={index}>
                {/* 一级标题 - 黑体三号加粗 */}
                {section.level === 1 && (
                  <h2 className="font-['SimHei','FangSong',serif] text-[16px] leading-[28pt] font-bold mb-3 text-left">{section.title}</h2>
                )}
                {/* 二级标题 - 楷体三号 */}
                {section.level === 2 && (
                  <h3 className="font-['KaiTi','FangSong',serif] text-[16px] leading-[28pt] mb-3 text-left pl-[2em]">{section.title}</h3>
                )}
                <div className="space-y-0 text-left">
                  {section.content.map((paragraph, pIndex) => (
                    <p key={pIndex} className="font-['FangSong','SimSun',serif] text-[16px] leading-[28pt] pl-[2em]">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            ))}

            {/* 如果没有解析到特定结构，直接显示内容 */}
            {sections.length === 0 && content && (
              <div className="whitespace-pre-line text-left font-['FangSong','SimSun',serif] text-[16px] leading-[28pt]">
                {content}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}