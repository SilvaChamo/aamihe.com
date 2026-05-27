import { redirect } from 'next/navigation';

export default function EditarDocumentoRedirect() {
  redirect('/admin/documentos-gerais');
}
