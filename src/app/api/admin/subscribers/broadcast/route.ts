import { NextRequest, NextResponse } from 'next/server';
import { requireStaffSession } from '@/lib/admin-session';
import { getEmailSendQuota, RECOMMENDED_DAILY_EMAIL_LIMIT } from '@/lib/email-send-quota';
import { listSenderAccounts } from '@/lib/sender-accounts';
import { broadcastToSubscribers, collectSubscriberEmails } from '@/lib/subscriber-broadcast';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireStaffSession(request);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const emails = await collectSubscriberEmails();
    const quota = await getEmailSendQuota();
    const senders = await listSenderAccounts();
    return NextResponse.json({
      success: true,
      count: emails.length,
      quota,
      senders,
      recommendedDailyLimit: RECOMMENDED_DAILY_EMAIL_LIMIT,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Erro ao carregar destinatários' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireStaffSession(request);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const subject = String(body.subject || '').trim();
    const html = String(body.html || '').trim();
    const preheader = String(body.preheader || '').trim();
    const message = String(body.message || '').trim();
    const senderId = String(body.senderId || '').trim();
    const mode = body.mode === 'normal' ? 'normal' : 'marketing';

    if (!subject || (!html && !message)) {
      return NextResponse.json({ error: 'Assunto e conteúdo são obrigatórios.' }, { status: 400 });
    }

    const sent = await broadcastToSubscribers({
      subject,
      html,
      preheader: mode === 'normal' ? preheader : '',
      message,
      senderId,
      mode,
    });
    return NextResponse.json({ success: true, sent });
  } catch (error) {
    console.error(error);
    const msg = error instanceof Error ? error.message : 'Erro ao enviar e-mails';
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}
