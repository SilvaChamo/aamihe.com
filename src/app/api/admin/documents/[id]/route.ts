import { NextResponse } from 'next/server';
import { requireAdminRole } from '@/lib/admin-session';
import { getDashboardDb } from '@/lib/dashboard-db';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const auth = await requireAdminRole(request);
    if ('error' in auth) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const { id } = await context.params;
    const db = await getDashboardDb();
    const document = db.documents.find((item) => item.id === id);

    if (!document) {
      return NextResponse.json({ success: false, error: 'Documento não encontrado.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, document });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Erro ao carregar documento.' }, { status: 500 });
  }
}
