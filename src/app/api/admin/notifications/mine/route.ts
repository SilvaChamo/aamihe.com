import { NextResponse } from 'next/server';
import { requireSessionUser } from '@/lib/admin-session';
import { getNotificationsList, saveNotificationsList } from '@/lib/dashboard-notifications-store';
import {
  countUnreadForUser,
  listNotificationsForUser,
} from '@/lib/subscriber-notifications';

export async function GET(request: Request) {
  try {
    const session = await requireSessionUser(request);
    if ('error' in session) {
      return NextResponse.json({ success: false, error: session.error }, { status: session.status });
    }

    const all = await getNotificationsList();
    const unread = countUnreadForUser(all, session.user.id);
    const countOnly = new URL(request.url).searchParams.get('countOnly') === '1';

    if (countOnly) {
      return NextResponse.json(
        { success: true, unread },
        { headers: { 'Cache-Control': 'private, max-age=15' } },
      );
    }

    const notifications = listNotificationsForUser(all, session.user.id);

    return NextResponse.json(
      { success: true, notifications, unread },
      { headers: { 'Cache-Control': 'private, max-age=15' } },
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
    const notifications = await getNotificationsList();

    if (body.markAllRead) {
      for (const item of notifications) {
        if (item.user_id === session.user.id) {
          item.read = true;
        }
      }
    } else if (body.id) {
      const item = notifications.find(
        (entry) => entry.id === body.id && entry.user_id === session.user.id,
      );
      if (!item) {
        return NextResponse.json({ success: false, error: 'Notificação não encontrada.' }, { status: 404 });
      }
      item.read = true;
    } else {
      return NextResponse.json({ success: false, error: 'Pedido inválido.' }, { status: 400 });
    }

    await saveNotificationsList(notifications);

    const unread = countUnreadForUser(notifications, session.user.id);
    return NextResponse.json({ success: true, unread });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Erro ao actualizar notificações.' }, { status: 500 });
  }
}
