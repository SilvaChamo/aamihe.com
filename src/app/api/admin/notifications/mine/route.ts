import { NextResponse } from 'next/server';
import { requireSessionUser } from '@/lib/admin-session';
import {
  countUnreadForUserId,
  listNotificationsForUserId,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/lib/aamihe-notifications-store';

export async function GET(request: Request) {
  try {
    const session = await requireSessionUser(request);
    if ('error' in session) {
      return NextResponse.json({ success: false, error: session.error }, { status: session.status });
    }

    const countOnly = new URL(request.url).searchParams.get('countOnly') === '1';
    const unread = await countUnreadForUserId(session.user.id);

    if (countOnly) {
      return NextResponse.json(
        { success: true, unread },
        { headers: { 'Cache-Control': 'private, max-age=15' } },
      );
    }

    const notifications = await listNotificationsForUserId(session.user.id);

    return NextResponse.json(
      { success: true, notifications, unread },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Erro ao carregar notificações.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireSessionUser(request);
    if ('error' in session) {
      return NextResponse.json({ success: false, error: session.error }, { status: session.status });
    }

    const body = await request.json();

    if (body.markAllRead) {
      await markAllNotificationsRead(session.user.id);
    } else if (body.id) {
      const ok = await markNotificationRead(String(body.id), session.user.id);
      if (!ok) {
        return NextResponse.json({ success: false, error: 'Notificação não encontrada.' }, { status: 404 });
      }
    } else {
      return NextResponse.json({ success: false, error: 'Pedido inválido.' }, { status: 400 });
    }

    const unread = await countUnreadForUserId(session.user.id);
    return NextResponse.json({ success: true, unread });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Erro ao actualizar notificações.' }, { status: 500 });
  }
}
