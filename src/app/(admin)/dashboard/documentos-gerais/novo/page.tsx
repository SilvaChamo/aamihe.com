import { redirect } from 'next/navigation';

export default function NovoDocumentoRedirect() {
  redirect('/dashboard/documentos-gerais');
}
