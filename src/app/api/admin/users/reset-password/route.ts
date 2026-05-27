import { NextRequest, NextResponse } from 'next/server';
import { findUserByLogin } from '@/lib/users';

/** Contas locais AAMIHE — reposição via painel (Editar utilizador). */
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email obrigatório' }, { status: 400 });
    }

    const user = await findUserByLogin(email);
    if (!user) {
      return NextResponse.json({ error: 'Utilizador não encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message:
        'Contas AAMIHE são geridas localmente. Use «Editar utilizador» para definir uma nova palavra-passe.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao processar pedido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
