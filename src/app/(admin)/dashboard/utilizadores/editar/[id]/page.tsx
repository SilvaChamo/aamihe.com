import { redirect } from 'next/navigation';

type Props = { params: Promise<{ id: string }> };

export default async function DashboardUtilizadoresEditarRedirect({ params }: Props) {
  const { id } = await params;
  redirect(`/admin/utilizadores/editar/${id}`);
}
