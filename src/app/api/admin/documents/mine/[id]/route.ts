import { NextResponse } from 'next/server';
import { requireSessionUser } from '@/lib/admin-session';
import { documentBelongsToUser } from '@/lib/document-ownership';
import {
  deleteDocumentById,
  getDocumentById,
  updateDocument,
} from '@/lib/aamihe-documents-store';
import {
  getFileExtension,
  resolveConferenceMimeType,
  titleFromFileName,
  validateConferenceFile,
} from '@/lib/conference-document-files';
import { storeConferenceFile } from '@/lib/conference-document-storage';
import {
  applyCompressedFileName,
  compressImageBuffer,
  isCompressibleImageMime,
} from '@/lib/compress-image-buffer';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const session = await requireSessionUser(request);
    if ('error' in session) {
      return NextResponse.json({ success: false, error: session.error }, { status: session.status });
    }

    const { id } = await context.params;
    const document = await getDocumentById(id);

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
    const current = await getDocumentById(id);

    if (!current || !documentBelongsToUser(current, session.user)) {
      return NextResponse.json({ success: false, error: 'Documento não encontrado.' }, { status: 404 });
    }

    const form = await request.formData();
    const title = String(form.get('title') || '').trim();
    const message = String(form.get('message') ?? '').trim();
    const file = form.get('file') as File | null;

    const patch: Parameters<typeof updateDocument>[1] = {
      message: message || undefined,
      updated_at: new Date().toISOString(),
      review_status: 'submitted',
      review_comment: undefined,
      review_comment_at: undefined,
      resubmitted_at: new Date().toISOString(),
      published: false,
      user_id: current.user_id || session.user.id,
    };

    if (title) {
      patch.title_pt = title;
    }

    if (file && file.size > 0) {
      const check = validateConferenceFile(file);
      if (!check.ok) {
        return NextResponse.json({ success: false, error: check.error }, { status: 400 });
      }

      let mimeType = resolveConferenceMimeType(file)!;
      let buffer = Buffer.from(await file.arrayBuffer());
      let fileName = file.name;
      if (isCompressibleImageMime(mimeType)) {
        const compressed = await compressImageBuffer(buffer, mimeType, fileName);
        buffer = Buffer.from(compressed.buffer);
        mimeType = compressed.mimeType;
        fileName = applyCompressedFileName(fileName, compressed.ext);
      }
      patch.file_url = await storeConferenceFile(buffer, fileName, mimeType);
      patch.file_type = getFileExtension(fileName);
      patch.mime_type = mimeType;
      if (!title) {
        patch.title_pt = titleFromFileName(fileName);
      }
    }

    const document = await updateDocument(id, patch);
    return NextResponse.json({ success: true, document });
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
    const document = await getDocumentById(id);

    if (!document || !documentBelongsToUser(document, session.user)) {
      return NextResponse.json({ success: false, error: 'Documento não encontrado.' }, { status: 404 });
    }

    await deleteDocumentById(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Erro ao eliminar documento.' }, { status: 500 });
  }
}
