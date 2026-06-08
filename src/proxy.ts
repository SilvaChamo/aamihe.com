import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { clearStaleSupabaseAuthCookiesFromRequest } from '@/lib/supabase-auth-cookies';

function shouldSkipSession(pathname: string): boolean {
  if (pathname.startsWith('/api/admin') || pathname.startsWith('/api/auth')) {
    return false;
  }
  return (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/') ||
    pathname.includes('.')
  );
}

function needsSessionRefresh(pathname: string): boolean {
  return (
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/api/admin') ||
    pathname.startsWith('/api/auth')
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  let response = NextResponse.next({ request });

  // Sempre limpar cookies cloud/legados — evita HTTP 431 no localhost
  clearStaleSupabaseAuthCookiesFromRequest(request.cookies.getAll(), response);

  if (shouldSkipSession(pathname) || !needsSessionRefresh(pathname)) {
    return response;
  }

  if (pathname.startsWith('/auth/callback') || pathname.startsWith('/auth/confirm')) {
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|ttf|woff2?)$).*)'],
};
