import { NextResponse } from 'next/server';
import { requireSessionUser } from '@/lib/admin-session';
import { getDashboardDb, saveDashboardDb } from '@/lib/dashboard-db';
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

    const db = await getDashboardDb();
    const unread = countUnreadForUser(db.notifications ?? [], session.user.id);
    const countOnly = new URL(request.url).searchParams.get('countOnly') === '1';

    if (countOnly) {
      return NextResponse.json(
        { success: true, unread },
        { headers: { 'Cache-Control': 'private, no-store' } },
      );
    }

    const notifications = listNotificationsForUser(db.notifications ?? [], session.user.id);

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
    const db = await getDashboardDb();
    const notifications = db.notifications ?? [];

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

    db.notifications = notifications;
    await saveDashboardDb(db);

    const unread = countUnreadForUser(notifications, session.user.id);
    return NextResponse.json({ success: true, unread });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Erro ao actualizar notificações.' }, { status: 500 });
  }
}
