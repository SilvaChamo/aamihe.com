'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SubmissaoResumoRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/meus-documentos');
  }, [router]);

  return <div className="p-6 text-gray-500 text-sm">A redireccionar…</div>;
}
