import { NextRequest, NextResponse } from 'next/server';
import { requireStaffSession } from '@/lib/admin-session';
import { RECOMMENDED_DAILY_EMAIL_LIMIT } from '@/lib/email-send-quota';
import { getEmailProviderStatus } from '@/lib/notify-email';
import { broadcastToSubscribers, loadBroadcastPageData, sendNormalEmail } from '@/lib/subscriber-broadcast';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireStaffSession(request);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const light = request.nextUrl.searchParams.get('light') === '1';
    const { emails, quota, senders } = await loadBroadcastPageData({
      countRecipients: !light,
    });
    const emailProvider = getEmailProviderStatus();
    return NextResponse.json({
      success: true,
      count: emails.length,
      quota,
      senders,
      recommendedDailyLimit: RECOMMENDED_DAILY_EMAIL_LIMIT,
      emailConfigured: emailProvider.configured,
      emailFrom: emailProvider.from,
      emailHint: emailProvider.hint,
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

    if (mode === 'normal') {
      const sent = await sendNormalEmail({
        subject,
        html,
        preheader,
        message,
        senderId,
        to: String(body.to || ''),
        cc: String(body.cc || ''),
        bcc: String(body.bcc || ''),
        mode,
      });
      return NextResponse.json({ success: true, sent });
    }

    const sent = await broadcastToSubscribers({
      subject,
      html,
      preheader,
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
