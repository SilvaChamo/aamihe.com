import { redirect } from 'next/navigation';

export default function NovoDocumentoRedirect() {
  redirect('/admin/documentos-gerais');
}
