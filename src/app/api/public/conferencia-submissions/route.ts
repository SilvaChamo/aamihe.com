import { NextResponse } from 'next/server';
import { getDashboardDb, saveDashboardDb } from '@/lib/dashboard-db';
import { validatePublicFormSpam } from '@/lib/form-spam-guard';
import { saveUploadedBuffer } from '@/lib/persist-media';
import { notifySiteEmail } from '@/lib/notify-email';
import { syncDocumentsToSupabase } from '@/lib/sync-site-documents';
import { isSupabaseConfigured } from '@/lib/supabase/server';
import { randomUUID } from 'node:crypto';

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

export async function POST(request: Request) {
  try {
    const form = await request.formData();

    const spam = await validatePublicFormSpam(form);
    if (!spam.ok) {
      return NextResponse.json({ success: false, error: spam.error }, { status: 400 });
    }

    const name = String(form.get('name') || '').trim();
    const email = String(form.get('email') || '').trim();
    const message = String(form.get('message') || '').trim();
    const accepted = form.get('accepted') === 'true';
    const file = form.get('file') as File | null;

    if (!name || !email) {
      return NextResponse.json({ success: false, error: 'Nome e e-mail são obrigatórios.' }, { status: 400 });
    }

    if (!accepted) {
      return NextResponse.json({ success: false, error: 'Deve aceitar os termos e condições.' }, { status: 400 });
    }

    if (!file || file.size === 0) {
      return NextResponse.json({ success: false, error: 'Envie um documento em PDF.' }, { status: 400 });
    }

    const isPdf =
      file.type === 'application/pdf' ||
      file.name.toLowerCase().endsWith('.pdf');

    if (!isPdf) {
      return NextResponse.json({ success: false, error: 'Apenas ficheiros PDF são aceites.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileUrl = await storeConferencePdf(buffer, file.name);
    const db = await getDashboardDb();
    const now = new Date().toISOString();

    const record = {
      id: `doc_${randomUUID().slice(0, 8)}`,
      site_slug: 'aamihe',
      title_pt: file.name.replace(/\.pdf$/i, ''),
      title_en: null,
      title_fr: null,
      file_url: fileUrl,
      language: 'pt' as const,
      category: 'conferencia' as const,
      published: false,
      sort_order: db.documents.length + 1,
      author: name,
      email,
      message: message || undefined,
      year: String(new Date().getFullYear()),
      source: 'form' as const,
      created_at: now,
      updated_at: now,
    };

    db.documents.push(record);
    await saveDashboardDb(db);
    await syncDocumentsToSupabase();

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://aamihe.com';
    const adminUrl = `${siteUrl}/admin/documentos-gerais`;

    await notifySiteEmail({
      subject: `Nova submissão da conferência — ${name}`,
      text: [
        'Nova submissão de documento da conferência AAMIHE.',
        '',
        `Nome: ${name}`,
        `E-mail: ${email}`,
        message ? `Mensagem: ${message}` : '',
        `Ficheiro: ${file.name}`,
        `URL: ${fileUrl.startsWith('/') ? siteUrl + fileUrl : fileUrl}`,
        '',
        `Rever no painel: ${adminUrl}`,
      ]
        .filter(Boolean)
        .join('\n'),
    });

    return NextResponse.json({
      success: true,
      message: 'Documento enviado com sucesso. Será publicado após revisão.',
      document: record,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Erro ao enviar documento.' }, { status: 500 });
  }
}
