'use client';

type Props = {
  content: string;
  fileName: string;
};

export default function PromptLetterPreviewClient({ content, fileName }: Props) {

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

  // 解析内容
  const { title, sections } = parsePromptLetterContent(content);

  if (!content) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <p>暂无内容</p>
      </div>
    );
  }

  return (
    <div className="font-['SimSun',serif] text-[15px] leading-relaxed">
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
            {sections.length === 0 && content && (
              <div className="whitespace-pre-line text-left">
                {content}
              </div>
            )}
          </div>

          <div className="mt-12 text-right">
            <div className="mb-20">陕西省信用再担保有限责任公司</div>
            <div>总经理 ：</div>
            <div className="mt-10">{new Date().getFullYear()}年{new Date().getMonth() + 1}月</div>
          </div>
      </div>
    </div>
  );
}