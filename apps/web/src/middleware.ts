import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC_PATHS = [
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/internal/foundation',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static assets, internal next files, api routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get('stocksense_access_token')?.value;
  const isPublic = PUBLIC_PATHS.some((path) => pathname.startsWith(path));

  // If user has auth cookie and accesses public auth routes (except internal foundation) -> redirect to dashboard
  if (token && isPublic && pathname !== '/internal/foundation') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If user lacks auth cookie and accesses protected routes -> redirect to login
  if (!token && !isPublic) {
    const loginUrl = new URL('/login', request.url);
    if (pathname !== '/' && pathname !== '/dashboard') {
      loginUrl.searchParams.set('redirect', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
