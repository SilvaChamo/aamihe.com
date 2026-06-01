import { redirect } from 'next/navigation';

type Props = { params: Promise<{ id: string }> };

export default async function DashboardDocumentosVerRedirect({ params }: Props) {
  const { id } = await params;
  redirect(`/admin/documentos-gerais/ver/${id}`);
}
