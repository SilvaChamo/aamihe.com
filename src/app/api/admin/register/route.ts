import { NextResponse } from 'next/server';
import { createUser } from '@/lib/users';
import { validateSpamFields } from '@/lib/form-spam-guard';
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

    const spam = validateSpamFields({
      honeypot,
      formLoadedAt: Number(body.formLoadedAt || 0),
      mathA: Number(body.mathA),
      mathB: Number(body.mathB),
      mathAnswer: Number(body.mathAnswer),
      turnstileToken,
    });

    if (!spam.ok) {
      return NextResponse.json({ success: false, error: spam.error }, { status: 400 });
    }

    if (process.env.TURNSTILE_SECRET_KEY && turnstileToken) {
      const turnstileOk = await verifyTurnstile(turnstileToken);
      if (!turnstileOk) {
        return NextResponse.json(
          { success: false, error: 'Verificação de segurança falhou. Tente novamente.' },
          { status: 400 },
        );
      }
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

    await createUser({ username, email, password });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
