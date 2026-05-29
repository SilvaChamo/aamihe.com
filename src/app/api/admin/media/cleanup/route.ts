import { NextResponse } from 'next/server';
import { cleanupMediaCatalog } from '@/lib/media-catalog-cleanup';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const dryRun = Boolean(body?.dryRun);

    const result = await cleanupMediaCatalog({ dryRun });

    return NextResponse.json({
      success: true,
      message: dryRun
        ? `Simulação: ficariam ${result.supabaseAfter} entradas (${result.deletedFromSupabase} removidas).`
        : `Catálogo limpo: ${result.supabaseBefore} → ${result.supabaseAfter} entradas (${result.deletedFromSupabase} duplicados/órfãos removidos).`,
      ...result,
    });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : 'Erro na limpeza do catálogo';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
