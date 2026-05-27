import { NextResponse } from 'next/server';
import { listUsers } from '@/lib/users';

export async function GET() {
  try {
    const users = await listUsers();
    return NextResponse.json({ users });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao listar utilizadores';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
