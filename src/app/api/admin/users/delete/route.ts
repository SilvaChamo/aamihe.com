import { NextRequest, NextResponse } from 'next/server';
import { deleteUser } from '@/lib/users';

export async function POST(req: NextRequest) {
  try {
    const { id, ids } = await req.json();
    const targetIds: string[] = ids ? ids : id ? [id] : [];

    if (targetIds.length === 0) {
      return NextResponse.json({ error: 'ID(s) obrigatório(s)' }, { status: 400 });
    }

    const errors: string[] = [];

    for (const userId of targetIds) {
      try {
        await deleteUser(userId);
      } catch (err: unknown) {
        errors.push(err instanceof Error ? err.message : String(err));
      }
    }

    if (errors.length === targetIds.length) {
      return NextResponse.json({ error: errors.join('; ') }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      deleted: targetIds.length - errors.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao eliminar utilizador';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
