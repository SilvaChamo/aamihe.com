import { NextResponse } from 'next/server';
import {
  deleteMediaItem,
  listMediaTrash,
  restoreMediaItem,
  restoreMediaItems,
} from '@/lib/media-delete';
import { invalidateGalleryCatalogCache } from '@/lib/media-registry';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const items = await listMediaTrash();
    return NextResponse.json(
      { success: true, items },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Erro ao carregar reciclagem' }, { status: 500 });
  }
}

type TrashBody = {
  action?: 'restore' | 'purge';
  id?: string;
  ids?: string[];
};

function parseTrashIds(body: TrashBody): string[] {
  if (Array.isArray(body.ids)) {
    return body.ids.map((value) => String(value || '').trim()).filter(Boolean);
  }
  const single = String(body.id || '').trim();
  return single ? [single] : [];
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as TrashBody;
    const ids = parseTrashIds(body);
    const action = body.action;

    if (ids.length === 0 || (action !== 'restore' && action !== 'purge')) {
      return NextResponse.json({ success: false, error: 'Pedido inválido' }, { status: 400 });
    }

    if (action === 'restore') {
      if (ids.length === 1) {
        const result = await restoreMediaItem(ids[0]);
        if (!result.ok) {
          return NextResponse.json({ success: false, error: result.error }, { status: result.status });
        }
        return NextResponse.json({ success: true, url: result.url, restored: 1 });
      }

      const { restored, failed, urls } = await restoreMediaItems(ids);
      return NextResponse.json({
        success: failed.length === 0,
        restored,
        failed,
        urls,
        error:
          failed.length > 0
            ? `${failed.length} item(ns) não restaurado(s). ${restored} restaurado(s) com sucesso.`
            : undefined,
      });
    }

    if (ids.length > 1) {
      const failed: { id: string; error: string }[] = [];
      let purged = 0;
      for (const id of ids) {
        const result = await deleteMediaItem({ id }, { permanent: true });
        if (result.ok) {
          purged += 1;
        } else {
          failed.push({ id, error: result.error });
        }
      }
      invalidateGalleryCatalogCache();
      return NextResponse.json({
        success: failed.length === 0,
        purged,
        failed,
        error:
          failed.length > 0
            ? `${failed.length} item(ns) não eliminado(s). ${purged} eliminado(s) com sucesso.`
            : undefined,
      });
    }

    const result = await deleteMediaItem({ id: ids[0] }, { permanent: true });
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: result.status });
    }

    invalidateGalleryCatalogCache();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Erro ao processar reciclagem' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id')?.trim();
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID em falta' }, { status: 400 });
    }

    const result = await deleteMediaItem({ id }, { permanent: true });
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: result.status });
    }

    invalidateGalleryCatalogCache();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Erro ao eliminar permanentemente' }, { status: 500 });
  }
}
