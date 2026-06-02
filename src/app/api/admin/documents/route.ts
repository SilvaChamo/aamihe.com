import { NextResponse } from 'next/server';
import {
  deleteDocumentById,
  getDocumentById,
  listDocuments,
  updateDocument,
} from '@/lib/aamihe-documents-store';
import type { SiteDocumentCategory } from '@/lib/site-documents';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') as SiteDocumentCategory | null;
    const documents = await listDocuments(category ? { category } : undefined);
    return NextResponse.json({ success: true, documents });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Erro ao carregar documentos' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const existing = await getDocumentById(String(body.id || ''));
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Documento não encontrado' }, { status: 404 });
    }

    const document = await updateDocument(existing.id, {
      ...body,
      category: 'conferencia',
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, document });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Erro ao actualizar documento' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID em falta' }, { status: 400 });
    }

    await deleteDocumentById(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Erro ao eliminar documento' }, { status: 500 });
  }
}
