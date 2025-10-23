import { NextRequest, NextResponse } from 'next/server';

// Routes that are exempt from store validation
const EXEMPT_ROUTES = [
  '/',
  '/login',
  '/register',
  '/catalog',
  '/unauthorized',
  '/api',
  '/_next',
  '/favicon.ico',
];

// Helper function to check if route is exempt from validation
function isExemptRoute(pathname: string): boolean {
  return EXEMPT_ROUTES.some(route => {
    if (route === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(route);
  });
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip validation for exempt routes
  if (isExemptRoute(pathname)) {
    return NextResponse.next();
  }
  
  // For now, let the client-side handle the validation
  // The middleware will be enhanced later if needed
  // This allows the AuthContext to handle the store validation
  
  return NextResponse.next();
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};