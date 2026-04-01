import path from 'node:path';
import { promises as fs } from 'node:fs';
import { z } from 'zod';
import { getDemoCacheRoot } from '@/lib/server/runtime-root';

const CREDIT_OVERRIDE_DIR = path.join(getDemoCacheRoot(), 'credit-report');
const CREDIT_OVERRIDE_FILE = path.join(CREDIT_OVERRIDE_DIR, 'overrides.json');

const pendingStateSchema = z.object({
  checked: z.boolean().default(false),
  remark: z.string().default(''),
});

const overridesSchema = z.object({
  updatedAt: z.string().default(''),
  groupLabels: z.record(z.string(), z.string()).default({}),
  groupRemarks: z.record(z.string(), z.string()).default({}),
  pendingItems: z.record(z.string(), pendingStateSchema).default({}),
  lastSubmittedOa: z
    .object({
      submittedAt: z.string(),
      referenceNo: z.string(),
      summary: z.string(),
    })
    .nullable()
    .default(null),
});

export type CreditOverrides = z.infer<typeof overridesSchema>;

async function ensureDir() {
  await fs.mkdir(CREDIT_OVERRIDE_DIR, { recursive: true });
}

async function writeAtomically(filePath: string, payload: unknown) {
  const tempPath = `${filePath}.tmp`;
  await fs.writeFile(tempPath, JSON.stringify(payload, null, 2), 'utf8');
  await fs.rename(tempPath, filePath);
}

async function readOverridesFile() {
  await ensureDir();
  try {
    const raw = await fs.readFile(CREDIT_OVERRIDE_FILE, 'utf8');
    return overridesSchema.parse(JSON.parse(raw));
  } catch {
    const empty = overridesSchema.parse({});
    await writeAtomically(CREDIT_OVERRIDE_FILE, empty);
    return empty;
  }
}

export async function getCreditOverrides() {
  return readOverridesFile();
}

export async function updateGroupOverride(groupKey: string, payload: { label?: string; remark?: string }) {
  const current = await readOverridesFile();
  const next: CreditOverrides = {
    ...current,
    updatedAt: new Date().toISOString(),
    groupLabels: payload.label ? { ...current.groupLabels, [groupKey]: payload.label } : current.groupLabels,
    groupRemarks: payload.remark !== undefined ? { ...current.groupRemarks, [groupKey]: payload.remark } : current.groupRemarks,
  };
  await writeAtomically(CREDIT_OVERRIDE_FILE, next);
  return next;
}

export async function updatePendingItem(itemId: string, payload: { checked?: boolean; remark?: string }) {
  const current = await readOverridesFile();
  const previous = current.pendingItems[itemId] ?? { checked: false, remark: '' };
  const next: CreditOverrides = {
    ...current,
    updatedAt: new Date().toISOString(),
    pendingItems: {
      ...current.pendingItems,
      [itemId]: {
        checked: payload.checked ?? previous.checked,
        remark: payload.remark ?? previous.remark,
      },
    },
  };
  await writeAtomically(CREDIT_OVERRIDE_FILE, next);
  return next;
}

export async function recordOaSubmission(summary: string) {
  const current = await readOverridesFile();
  const now = new Date();
  const referenceNo = `OA-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
  const next: CreditOverrides = {
    ...current,
    updatedAt: now.toISOString(),
    lastSubmittedOa: {
      submittedAt: now.toISOString(),
      referenceNo,
      summary,
    },
  };
  await writeAtomically(CREDIT_OVERRIDE_FILE, next);
  return next.lastSubmittedOa;
}
