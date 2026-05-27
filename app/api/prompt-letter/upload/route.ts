import { NextRequest, NextResponse } from 'next/server';
import { saveUploadedFile, listUploadedFiles, removeUploadedFile, type UploadedFileInfo } from '@/lib/server/prompt-letter';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const department = (formData.get('department') as string) || 'oneDept';

    if (files.length === 0) {
      return NextResponse.json(
        { success: false, error: '未选择文件' },
        { status: 400 }
      );
    }

    console.log(`[上传路由] 开始上传 ${files.length} 个文件, 部门: ${department}`);

    const savedFiles: UploadedFileInfo[] = [];

    for (const file of files) {
      if (!file || file.size === 0) continue;

      try {
        const fileInfo = await saveUploadedFile(
          file,
          department === 'threeDept' ? 'threeDept' : 'oneDept'
        );
        savedFiles.push(fileInfo);
        console.log(`[上传路由] 已保存: ${fileInfo.name} (${fileInfo.fileSize} bytes)`);
      } catch (err) {
        console.error(`[上传路由] 保存失败: ${file.name}`, err);
        return NextResponse.json(
          { success: false, error: `文件 ${file.name} 保存失败: ${(err as Error).message}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: `${savedFiles.length} 个文件上传成功`,
      files: savedFiles,
    });
  } catch (error) {
    console.error('[上传路由] 上传文件时出错:', error);
    return NextResponse.json(
      { success: false, error: '上传失败: ' + (error instanceof Error ? error.message : '未知错误') },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const files = await listUploadedFiles();
    return NextResponse.json({
      success: true,
      files,
    });
  } catch (error) {
    console.error('[上传路由] 获取文件列表时出错:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: '缺少文件 ID' },
        { status: 400 }
      );
    }

    await removeUploadedFile(id);
    console.log(`[上传路由] 已删除文件: ${id}`);

    return NextResponse.json({
      success: true,
      message: '文件已删除',
    });
  } catch (error) {
    console.error('[上传路由] 删除文件时出错:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
