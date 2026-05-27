import { redirect } from 'next/navigation';

type Props = {
  searchParams: Promise<{ next?: string }>;
};

export default async function LoginRedirectPage({ searchParams }: Props) {
  const params = await searchParams;
  const next = params.next;
  const dest =
    next && next.startsWith('/') && !next.startsWith('//')
      ? `/admin/login?next=${encodeURIComponent(next)}`
      : '/admin/login';
  redirect(dest);
}
