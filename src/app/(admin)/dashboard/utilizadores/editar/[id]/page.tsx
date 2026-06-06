'use client';

import { use } from 'react';
import { EditUserFormPage } from '@/components/Admin/UserFormPage';

export default function AdminEditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <EditUserFormPage userId={id} />;
}
