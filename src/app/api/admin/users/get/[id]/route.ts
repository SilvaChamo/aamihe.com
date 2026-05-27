import { NextResponse } from 'next/server';
import { getUserById } from '@/lib/users';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await getUserById(id);

    if (!user) {
      return NextResponse.json({ error: 'Utilizador não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao carregar utilizador';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
