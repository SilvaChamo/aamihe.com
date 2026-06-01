import { redirect } from 'next/navigation';
import { LOGIN_PATH } from '@/lib/login-path';

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function AdminLoginAliasPage({ searchParams }: Props) {
  const params = await searchParams;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') query.set(key, value);
    else if (Array.isArray(value)) value.forEach((v) => query.append(key, v));
  }
  const qs = query.toString();
  redirect(qs ? `${LOGIN_PATH}?${qs}` : LOGIN_PATH);
}
