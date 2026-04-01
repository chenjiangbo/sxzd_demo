import { NextRequest, NextResponse } from 'next/server';
import { getCreditOverrides, updateGroupOverride, updatePendingItem } from '@/lib/server/credit-overrides';

export async function GET() {
  const overrides = await getCreditOverrides();
  return NextResponse.json(overrides);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  if (body.type === 'group') {
    if (typeof body.groupKey !== 'string') {
      return NextResponse.json({ error: 'Missing groupKey' }, { status: 400 });
    }
    const overrides = await updateGroupOverride(body.groupKey, {
      label: typeof body.label === 'string' ? body.label : undefined,
      remark: typeof body.remark === 'string' ? body.remark : undefined,
    });
    return NextResponse.json({ ok: true, overrides });
  }

  if (body.type === 'pending') {
    if (typeof body.itemId !== 'string') {
      return NextResponse.json({ error: 'Missing itemId' }, { status: 400 });
    }
    const overrides = await updatePendingItem(body.itemId, {
      checked: typeof body.checked === 'boolean' ? body.checked : undefined,
      remark: typeof body.remark === 'string' ? body.remark : undefined,
    });
    return NextResponse.json({ ok: true, overrides });
  }

  return NextResponse.json({ error: 'Unsupported override type' }, { status: 400 });
}
