'use client';

import { useState, useEffect } from 'react';

type Props = {
  content: string;
  fileName: string;
};

export default function PromptLetterPreviewClient({ content, fileName }: Props) {
  const [displayContent, setDisplayContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 模拟内容加载过程
    setIsLoading(true);
    
    // 模拟加载延迟
    const timer = setTimeout(() => {
      setDisplayContent(content);
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [content]);

  // 解析提示函内容结构
  const parsePromptLetterContent = (text: string) => {
    if (!text) return { title: '综合评价提示函', sections: [] };

    // 简单的解析逻辑，实际可根据需要改进
    const lines = text.split('\n');
    const sections = [];
    let currentSection: { title: string; content: string[] } | null = null;

    for (const line of lines) {
      if (line.trim().match(/^一、|二、|三、|四、|五、|六、|七、|八、|九、|十、/)) {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          title: line.trim(),
          content: []
        };
      } else if (currentSection) {
        if (line.trim()) {
          currentSection.content.push(line.trim());
        }
      } else {
        // 标题行或其他开头内容
        if (!sections.length && line.trim() && !line.includes('这是根据')) {
          sections.unshift({ title: line.trim(), content: [] });
        }
      }
    }

    if (currentSection) {
      sections.push(currentSection);
    }

    // 如果没有解析到标题，使用整个内容作为一个部分
    if (sections.length === 0) {
      sections.push({ title: '综合评价提示函', content: [text] });
    }

    return { title: sections[0]?.title || '综合评价提示函', sections: sections.slice(1) };
  };

  const { title, sections } = parsePromptLetterContent(displayContent);

  return (
    <div className="font-['SimSun',serif] text-[15px] leading-relaxed">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-lg font-medium text-primary">正在加载提示函内容...</p>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-6">{title}</h1>
          </div>

          <div className="space-y-6">
            {sections.map((section, index) => (
              <div key={index} className="indent-8">
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
            {sections.length === 0 && displayContent && (
              <div className="whitespace-pre-line text-left">
                {displayContent}
              </div>
            )}
          </div>

          <div className="mt-12 text-right">
            <div className="mb-20">陕西省信用再担保有限责任公司</div>
            <div>总经理 ：</div>
            <div className="mt-10">{'{letter_date}'}</div>
          </div>
        </div>
      )}
    </div>
  );
}