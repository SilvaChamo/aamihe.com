import { redirect } from 'next/navigation';

type Props = { params: Promise<{ id: string }> };

export default async function DashboardUtilizadoresVerRedirect({ params }: Props) {
  const { id } = await params;
  redirect(`/admin/utilizadores/ver/${id}`);
}
