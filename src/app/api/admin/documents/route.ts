import { NextResponse } from 'next/server';
import { getDashboardDb, saveDashboardDb } from '@/lib/dashboard-db';
import type { SiteDocumentCategory } from '@/lib/site-documents';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') as SiteDocumentCategory | null;
    const db = await getDashboardDb();
    let documents = db.documents;
    if (category) {
      documents = documents.filter((item) => item.category === category);
    }
    return NextResponse.json({ success: true, documents });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Erro ao carregar documentos' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const db = await getDashboardDb();
    const index = db.documents.findIndex((d) => d.id === body.id);
    if (index === -1) {
      return NextResponse.json({ success: false, error: 'Documento não encontrado' }, { status: 404 });
    }

    db.documents[index] = {
      ...db.documents[index],
      ...body,
      category: 'conferencia',
      updated_at: new Date().toISOString(),
    };
    await saveDashboardDb(db);
    return NextResponse.json({ success: true, document: db.documents[index] });
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

    const db = await getDashboardDb();
    db.documents = db.documents.filter((d) => d.id !== id);
    await saveDashboardDb(db);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Erro ao eliminar documento' }, { status: 500 });
  }
}
