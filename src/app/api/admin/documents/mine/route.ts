import { NextResponse } from 'next/server';
import { requireSessionUser } from '@/lib/admin-session';
import {
  backfillUserIdForDocuments,
  listDocumentsForUser,
} from '@/lib/aamihe-documents-store';

export async function GET(request: Request) {
  try {
    const session = await requireSessionUser(request);
    if ('error' in session) {
      return NextResponse.json({ success: false, error: session.error }, { status: session.status });
    }

    let documents = await listDocumentsForUser(session.user);
    const backfilled = await backfillUserIdForDocuments(session.user, documents);

    if (backfilled > 0) {
      documents = await listDocumentsForUser(session.user);
    }

    return NextResponse.json(
      { success: true, documents },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Erro ao carregar documentos' }, { status: 500 });
  }
}
