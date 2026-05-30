import { NextRequest, NextResponse } from 'next/server';
import { validateSpamFields } from '@/lib/form-spam-guard';
import { findUserByLogin } from '@/lib/users';

/** Pedido de reposição de senha — envio de link por email (a implementar). */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body.email || body.login || '').trim().toLowerCase();
    const honeypot = String(body.honeypot || '').trim();

    const spam = validateSpamFields({
      honeypot,
      formLoadedAt: Number(body.formLoadedAt || 0),
      mathA: Number(body.mathA),
      mathB: Number(body.mathB),
      mathAnswer: Number(body.mathAnswer),
      turnstileToken: String(body.turnstileToken || ''),
    });

    if (!spam.ok) {
      return NextResponse.json({ error: spam.error }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ error: 'Indique o email da sua conta.' }, { status: 400 });
    }

    const user = await findUserByLogin(email);
    if (!user) {
      return NextResponse.json({
        success: true,
        message:
          'Se existir uma conta com este email, receberá em breve um link para repor a senha.',
      });
    }

    return NextResponse.json({
      success: true,
      message:
        'Se existir uma conta com este email, receberá em breve um link para repor a senha.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao processar pedido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
