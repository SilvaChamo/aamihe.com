import { redirect } from 'next/navigation';

export default function LegacySubscriberEmailRoute() {
  redirect('/dashboard/enviar-email');
}
