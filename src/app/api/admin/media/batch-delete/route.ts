import { NextResponse } from 'next/server';
import { deleteMediaItems, type MediaDeleteInput } from '@/lib/media-delete';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const raw = Array.isArray(body.items) ? body.items : [];

    const parsed: (MediaDeleteInput | null)[] = raw.map((item: unknown) => {
      if (!item || typeof item !== 'object') return null;
      const row = item as { id?: string; url?: string };
      const id = String(row.id || '').trim();
      const url = row.url ? String(row.url).trim() : undefined;
      if (!id) return null;
      return { id, url };
    });
    const items = parsed.filter((item): item is MediaDeleteInput => item !== null);

    if (items.length === 0) {
      return NextResponse.json({ success: false, error: 'Nenhum item válido.' }, { status: 400 });
    }

    const { deleted, failed } = await deleteMediaItems(items);

    return NextResponse.json({
      success: failed.length === 0,
      deleted,
      failed,
      error:
        failed.length > 0
          ? `${failed.length} item(ns) não eliminado(s). ${deleted} eliminado(s) com sucesso.`
          : undefined,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Erro ao eliminar em massa' }, { status: 500 });
  }
}
