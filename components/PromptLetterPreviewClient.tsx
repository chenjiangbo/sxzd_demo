'use client';

type Props = {
  content: string;
  fileName: string;
};

export default function PromptLetterPreviewClient({ content, fileName }: Props) {

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

  return (
    <div className="font-['SimSun',serif] text-[15px] leading-relaxed">
      <div className="max-w-4xl mx-auto">
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