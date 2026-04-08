import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';

export async function GET() {
  try {
    const mappingPath = path.join(process.cwd(), 'data', 'compensation-mapping.json');
    
    if (!fs.existsSync(mappingPath)) {
      return NextResponse.json(
        { error: '代偿补偿数据文件不存在' },
        { status: 404 }
      );
    }
    
    const data = JSON.parse(fs.readFileSync(mappingPath, 'utf-8'));
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('读取代偿补偿数据失败:', error);
    return NextResponse.json(
      { error: '读取数据失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}
