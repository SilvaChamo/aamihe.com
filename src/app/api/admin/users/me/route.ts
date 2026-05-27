import { NextRequest, NextResponse } from 'next/server';
import { findUserByLogin, getUserById } from '@/lib/users';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('id');
    const email = searchParams.get('email');

    let user = null;

    if (userId) {
      user = await getUserById(userId);
    } else if (email) {
      const found = await findUserByLogin(email);
      user = found ? await getUserById(found.id) : null;
    }

    if (!user) {
      return NextResponse.json({ error: 'Utilizador não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ user: { ...user, articles: 0 } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao carregar perfil';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
