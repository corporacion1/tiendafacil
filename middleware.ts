import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Solo aplicar a rutas API
  if (!request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Excluir rutas públicas
  const publicRoutes = [
    '/api/auth/login', 
    '/api/auth/register',
    '/api/auth/verify'
  ];
  
  if (publicRoutes.includes(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return NextResponse.json(
      { error: 'Token de autenticación requerido' },
      { status: 401 }
    );
  }

  // Verificar token de Tienda Fácil
  if (token.startsWith('tf-token-')) {
    try {
      const tokenData = token.replace('tf-token-', '');
      const decoded = atob(tokenData);
      const userData = JSON.parse(decoded);
      
      // Verificar expiración
      const now = Math.floor(Date.now() / 1000);
      if (userData.exp && userData.exp < now) {
        return NextResponse.json(
          { error: 'Token expirado' },
          { status: 401 }
        );
      }

      // Agregar usuario a los headers para que las APIs lo usen
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-data', JSON.stringify(userData));
      
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    } catch (error) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }
  }

  return NextResponse.json(
    { error: 'Token no válido' },
    { status: 401 }
  );
}

export const config = {
  matcher: ['/api/:path*']
};