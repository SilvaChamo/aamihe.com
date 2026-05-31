import { NextRequest, NextResponse } from 'next/server';
import { requireStaffSession } from '@/lib/admin-session';
import { validateSpamFields } from '@/lib/form-spam-guard';
import { findUserByLogin } from '@/lib/users';
import { requestPasswordResetEmail } from '@/lib/supabase-auth-email';

const GENERIC_MESSAGE =
  'Se existir uma conta com este email, receberá em breve um link para repor a senha.';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body.email || body.login || '').trim().toLowerCase();

    const staffAuth = await requireStaffSession(req);
    const isStaffRequest = !('error' in staffAuth);

    if (!isStaffRequest) {
      const spam = validateSpamFields({
        honeypot: String(body.honeypot || '').trim(),
        formLoadedAt: Number(body.formLoadedAt || 0),
        mathA: Number(body.mathA),
        mathB: Number(body.mathB),
        mathAnswer: Number(body.mathAnswer),
        turnstileToken: String(body.turnstileToken || ''),
      });

      if (!spam.ok) {
        return NextResponse.json({ error: spam.error }, { status: 400 });
      }
    }

    if (!email) {
      return NextResponse.json({ error: 'Indique o email da sua conta.' }, { status: 400 });
    }

    const user = await findUserByLogin(email);
    if (!user) {
      return NextResponse.json({ success: true, message: GENERIC_MESSAGE });
    }

    await requestPasswordResetEmail(user.email);
    return NextResponse.json({ success: true, message: GENERIC_MESSAGE });
  } catch (err: unknown) {
    console.error('[reset-password]', err);
    const message = err instanceof Error ? err.message : 'Erro ao processar pedido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
