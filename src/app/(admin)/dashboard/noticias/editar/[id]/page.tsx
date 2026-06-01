import { redirect } from 'next/navigation';

type Props = { params: Promise<{ id: string }> };

export default async function DashboardNoticiasEditarRedirect({ params }: Props) {
  const { id } = await params;
  redirect(`/admin/noticias/editar/${id}`);
}
