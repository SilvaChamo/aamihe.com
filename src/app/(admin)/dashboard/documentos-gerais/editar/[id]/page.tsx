import { redirect } from 'next/navigation';

export default function EditarDocumentoRedirect() {
  redirect('/dashboard/documentos-gerais');
}
