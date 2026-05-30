import { redirect } from 'next/navigation';

export default function LegacySubscriberEmailRoute() {
  redirect('/admin/enviar-email');
}
