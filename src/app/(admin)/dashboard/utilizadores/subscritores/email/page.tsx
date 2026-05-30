import { redirect } from 'next/navigation';

export default function LegacyDashboardSubscriberEmailRoute() {
  redirect('/dashboard/enviar-email');
}
