import { NextResponse } from 'next/server';
import { createUser } from '@/lib/users';
import { verifyTurnstile } from '@/lib/turnstile';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const username = String(body.username || '').trim();
    const email = String(body.email || '').trim();
    const password = String(body.password || '');
    const confirmPassword = String(body.confirmPassword || '');
    const turnstileToken = String(body.turnstileToken || '');
    const honeypot = String(body.honeypot || '').trim();

    if (honeypot) {
      return NextResponse.json({ success: false, error: 'Verificação anti-robô falhou.' }, { status: 400 });
    }

    if (!username || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Preencha todos os campos obrigatórios.' },
        { status: 400 },
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'As senhas não coincidem.' },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'A senha deve ter pelo menos 6 caracteres.' },
        { status: 400 },
      );
    }

    const turnstileOk = await verifyTurnstile(turnstileToken);
    if (!turnstileOk) {
      return NextResponse.json(
        { success: false, error: 'Confirme que é humano antes de continuar.' },
        { status: 400 },
      );
    }

    await createUser({ username, email, password });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
