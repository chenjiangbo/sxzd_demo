import path from 'node:path';
import { promises as fs } from 'node:fs';
import { NextResponse } from 'next/server';
import { getDemoCacheRoot } from '@/lib/server/runtime-root';

export async function POST() {
  const target = path.join(getDemoCacheRoot(), 'step-artifacts');
  await fs.rm(target, { recursive: true, force: true });
  await fs.mkdir(target, { recursive: true });

  return NextResponse.json({ ok: true, cleared: target });
}
