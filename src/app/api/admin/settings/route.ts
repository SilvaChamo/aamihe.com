import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const SETTINGS_PATH = path.join(process.cwd(), 'aamihe_settings.json');

const DEFAULT_SETTINGS = {
  siteName: 'AAMIHE',
  siteDescription: 'Associação Académica de Medicina e Higiene',
  contactEmail: 'info@aamihe.com',
  postsPerPage: 10,
  allowRegistration: true,
  requireEmailVerification: true,
  maintenanceMode: false,
};

async function readSettings(): Promise<Record<string, unknown>> {
  try {
    const raw = await readFile(SETTINGS_PATH, 'utf8');
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function GET() {
  const settings = await readSettings();
  return NextResponse.json({ settings });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const current = await readSettings();
    const next = { ...current, ...body };
    await writeFile(SETTINGS_PATH, JSON.stringify(next, null, 2), 'utf8');
    return NextResponse.json({ success: true, settings: next });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao guardar definições';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
