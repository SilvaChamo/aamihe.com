import { NextRequest, NextResponse } from 'next/server';
import { requireStaffSession } from '@/lib/admin-session';
import { listSenderAccounts } from '@/lib/sender-accounts';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireStaffSession(request);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const senders = await listSenderAccounts();
    return NextResponse.json({ success: true, senders });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Erro ao carregar remetentes' }, { status: 500 });
  }
}
