import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { getDashboardDb, saveDashboardDb } from '@/lib/dashboard-db';
import { readSpamFields, validateSpamFields } from '@/lib/form-spam-guard';
import { readLocaleFromFormData, type Locale } from '@/i18n/locale';
import { conferenceApiErrors } from '@/i18n/messages';
import {
  CONFERENCE_MAX_FILES,
  validateConferenceFile,
  resolveConferenceMimeType,
  getFileExtension,
  titleFromFileName,
} from '@/lib/conference-document-files';
import { storeConferenceFile } from '@/lib/conference-document-storage';
import {
  applyCompressedFileName,
  compressImageBuffer,
  isCompressibleImageMime,
} from '@/lib/compress-image-buffer';
import { notifySiteEmail, CONFERENCE_SUBMISSION_NOTIFY_EMAILS } from '@/lib/notify-email';
import { syncDocumentsToSupabase } from '@/lib/sync-site-documents';
import { resolveSessionUser } from '@/lib/admin-session';
import type { SiteDocumentRecord } from '@/lib/site-documents';

function collectFiles(form: FormData): File[] {
  const fromArray = form.getAll('files').filter((item): item is File => item instanceof File && item.size > 0);
  if (fromArray.length > 0) return fromArray;

  const single = form.get('file');
  if (single instanceof File && single.size > 0) return [single];

  return [];
}

export async function POST(request: Request) {
  let locale: Locale = 'pt';

  try {
    const form = await request.formData();
    locale = readLocaleFromFormData(form);
    const api = conferenceApiErrors[locale];

    const spam = validateSpamFields(readSpamFields(form), locale);
    if (!spam.ok) {
      return NextResponse.json({ success: false, error: spam.error }, { status: 400 });
    }

    const session = await resolveSessionUser(request);
    const sessionUser = session?.type === 'user' ? session.user : null;

    let name = String(form.get('name') || '').trim();
    let email = String(form.get('email') || '').trim();
    const message = String(form.get('message') || '').trim();
    const accepted = form.get('accepted') === 'true';
    const files = collectFiles(form);

    if (sessionUser) {
      email = sessionUser.email;
      if (!name) {
        name = [sessionUser.firstName, sessionUser.lastName].filter(Boolean).join(' ').trim()
          || sessionUser.username;
      }
    }

    if (!name || !email) {
      return NextResponse.json({ success: false, error: api.nameEmailRequired }, { status: 400 });
    }

    if (!accepted) {
      return NextResponse.json({ success: false, error: api.termsRequired }, { status: 400 });
    }

    if (files.length === 0) {
      return NextResponse.json({ success: false, error: api.selectFile }, { status: 400 });
    }

    if (files.length > CONFERENCE_MAX_FILES) {
      return NextResponse.json(
        { success: false, error: api.maxFiles(CONFERENCE_MAX_FILES) },
        { status: 400 },
      );
    }

    for (const file of files) {
      const check = validateConferenceFile(file, locale);
      if (!check.ok) {
        return NextResponse.json({ success: false, error: check.error }, { status: 400 });
      }
    }

    const db = await getDashboardDb();
    const now = new Date().toISOString();
    let sortOrder = db.documents.length + 1;

    const records: SiteDocumentRecord[] = await Promise.all(
      files.map(async (file) => {
        let mimeType = resolveConferenceMimeType(file)!;
        let buffer = Buffer.from(await file.arrayBuffer());
        let fileName = file.name;
        if (isCompressibleImageMime(mimeType)) {
          const compressed = await compressImageBuffer(buffer, mimeType, fileName);
          buffer = Buffer.from(compressed.buffer);
          mimeType = compressed.mimeType;
          fileName = applyCompressedFileName(fileName, compressed.ext);
        }
        const fileUrl = await storeConferenceFile(buffer, fileName, mimeType);
        const ext = getFileExtension(fileName);

        const record: SiteDocumentRecord = {
          id: `doc_${randomUUID().slice(0, 8)}`,
          site_slug: 'aamihe',
          title_pt: titleFromFileName(fileName),
          title_en: null,
          title_fr: null,
          file_url: fileUrl,
          file_type: ext,
          mime_type: mimeType,
          language: 'pt',
          category: 'conferencia',
          published: false,
          sort_order: sortOrder++,
          author: name,
          email,
          user_id: sessionUser?.id,
          message: message || undefined,
          review_status: 'submitted',
          year: String(new Date().getFullYear()),
          source: 'form',
          created_at: now,
          updated_at: now,
        };

        return record;
      }),
    );

    db.documents.push(...records);
    await saveDashboardDb(db);
    await syncDocumentsToSupabase();

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://aamihe.com';
    const adminUrl = `${siteUrl}/admin/documentos-gerais`;
    const fileLines = records.map(
      (record, index) =>
        `${index + 1}. ${files[index].name} — ${record.file_url.startsWith('http') ? record.file_url : `${siteUrl}${record.file_url}`}`,
    );

    await notifySiteEmail({
      to: [...CONFERENCE_SUBMISSION_NOTIFY_EMAILS],
      subject: `Nova submissão da conferência — ${name} (${records.length} ficheiro${records.length > 1 ? 's' : ''})`,
      text: [
        'Nova submissão de documento(s) da conferência AAMIHE.',
        '',
        `Nome: ${name}`,
        `E-mail: ${email}`,
        message ? `Mensagem: ${message}` : '',
        '',
        'Ficheiros:',
        ...fileLines,
        '',
        `Abrir painel: ${adminUrl}`,
      ].filter(Boolean).join('\n'),
      html: [
        '<p>Nova submissão de documento(s) da conferência AAMIHE.</p>',
        '<ul>',
        `<li><strong>Nome:</strong> ${name}</li>`,
        `<li><strong>E-mail:</strong> ${email}</li>`,
        message ? `<li><strong>Mensagem:</strong> ${message}</li>` : '',
        `<li><strong>Ficheiros (${records.length}):</strong></li>`,
        ...records.map(
          (record, index) =>
            `<li><a href="${record.file_url.startsWith('http') ? record.file_url : `${siteUrl}${record.file_url}`}">${files[index].name}</a></li>`,
        ),
        '</ul>',
        `<p><a href="${adminUrl}">Abrir painel de administração</a></p>`,
      ]
        .filter(Boolean)
        .join('\n'),
    });

    const count = records.length;
    return NextResponse.json({
      success: true,
      message: count === 1 ? api.successOne : api.successMany(count),
      documents: records,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: conferenceApiErrors[locale].sendError },
      { status: 500 },
    );
  }
}
