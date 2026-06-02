import { NextResponse } from 'next/server';
import { listDocuments } from '@/lib/aamihe-documents-store';
import { localizeDocument } from '@/lib/site-documents';
import type { SiteDocumentCategory, SiteDocumentLanguage } from '@/lib/site-documents';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') as SiteDocumentCategory | null;
    const language = (searchParams.get('language') || 'pt') as SiteDocumentLanguage;

    let documents = await listDocuments({ published: true });
    if (category) {
      documents = documents.filter((d) => d.category === category);
    }

    return NextResponse.json({
      success: true,
      documents: documents
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((doc) => localizeDocument(doc, language)),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Erro ao carregar documentos' }, { status: 500 });
  }
}
