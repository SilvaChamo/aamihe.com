import { redirect } from 'next/navigation';

export default function DocumentosGeraisRedirect() {
  redirect('/galeria?tipo=documentos');
}
