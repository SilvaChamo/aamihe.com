import { NextResponse } from 'next/server';
import { requireSessionUser } from '@/lib/admin-session';
import { documentBelongsToUser } from '@/lib/document-ownership';
import { getDashboardDb, saveDashboardDb } from '@/lib/dashboard-db';
import { saveUploadedBuffer } from '@/lib/persist-media';
import { syncDocumentsToSupabase } from '@/lib/sync-site-documents';
import { isSupabaseConfigured } from '@/lib/supabase/server';

async function storeConferencePdf(buffer: Buffer, originalName: string): Promise<string> {
  if (isSupabaseConfigured()) {
    const { uploadFileToStore } = await import('@/lib/supabase-media');
    const record = await uploadFileToStore(
      buffer,
      originalName,
      'application/pdf',
      'documentos',
      'Conferência',
    );
    return record.url;
  }

  const saved = await saveUploadedBuffer(buffer, originalName, 'uploads/conferencia');
  return saved.url;
}

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const session = await requireSessionUser(request);
    if ('error' in session) {
      return NextResponse.json({ success: false, error: session.error }, { status: session.status });
    }

    const { id } = await context.params;
    const db = await getDashboardDb();
    const document = db.documents.find((item) => item.id === id);

    if (!document || !documentBelongsToUser(document, session.user)) {
      return NextResponse.json({ success: false, error: 'Documento não encontrado.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, document });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Erro ao carregar documento.' }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await requireSessionUser(request);
    if ('error' in session) {
      return NextResponse.json({ success: false, error: session.error }, { status: session.status });
    }

    const { id } = await context.params;
    const db = await getDashboardDb();
    const index = db.documents.findIndex((item) => item.id === id);

    if (index === -1 || !documentBelongsToUser(db.documents[index], session.user)) {
      return NextResponse.json({ success: false, error: 'Documento não encontrado.' }, { status: 404 });
    }

    const form = await request.formData();
    const title = String(form.get('title') || '').trim();
    const message = String(form.get('message') ?? '').trim();
    const file = form.get('file') as File | null;

    const current = db.documents[index];

    if (title) {
      current.title_pt = title;
    }

    current.message = message || undefined;
    current.updated_at = new Date().toISOString();

    if (!current.user_id) {
      current.user_id = session.user.id;
    }

    if (file && file.size > 0) {
      const isPdf =
        file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      if (!isPdf) {
        return NextResponse.json({ success: false, error: 'Apenas ficheiros PDF são aceites.' }, { status: 400 });
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      current.file_url = await storeConferencePdf(buffer, file.name);
      if (!title) {
        current.title_pt = file.name.replace(/\.pdf$/i, '');
      }
    }

    current.review_status = 'submitted';
    current.review_comment = undefined;
    current.review_comment_at = undefined;
    current.resubmitted_at = new Date().toISOString();
    current.published = false;

    db.documents[index] = current;
    await saveDashboardDb(db);
    await syncDocumentsToSupabase();

    return NextResponse.json({ success: true, document: current });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Erro ao actualizar documento.' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const session = await requireSessionUser(_request);
    if ('error' in session) {
      return NextResponse.json({ success: false, error: session.error }, { status: session.status });
    }

    const { id } = await context.params;
    const db = await getDashboardDb();
    const document = db.documents.find((item) => item.id === id);

    if (!document || !documentBelongsToUser(document, session.user)) {
      return NextResponse.json({ success: false, error: 'Documento não encontrado.' }, { status: 404 });
    }

    db.documents = db.documents.filter((item) => item.id !== id);
    await saveDashboardDb(db);
    await syncDocumentsToSupabase();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Erro ao eliminar documento.' }, { status: 500 });
  }
}
