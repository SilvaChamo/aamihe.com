import { redirect } from 'next/navigation';

export default function DashboardDocumentosEditarRedirect() {
  redirect('/admin/documentos-gerais');
}
