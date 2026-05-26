/**
 * @file middleware.ts
 * @description Protección global de rutas con Supabase SSR.
 *
 * SEGURIDAD:
 * - Valida la sesión en el servidor (getUser), no en el cliente.
 * - Cubre TODAS las rutas privadas de la aplicación.
 * - Redirige a /login si no hay sesión activa.
 * - Redirige a /dashboard si ya hay sesión y se intenta acceder a /login o /register.
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/* Prefijos de rutas que requieren sesión autenticada */
const PROTECTED_PREFIXES = [
  '/dashboard',
  '/inventario',
  '/prestamos',
  '/movimientos',
  '/historial',
  '/reportes',
  '/formatos',
  '/configuracion',
]

/* Rutas de autenticación: se redirigen al dashboard si ya hay sesión */
const AUTH_PAGES = ['/login', '/register']

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  /* Cliente Supabase con lectura/escritura de cookies para renovar tokens */
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response = NextResponse.next({ request })
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  /*
   * getUser() verifica el token con el servidor de Supabase.
   * Es más seguro que getSession(), que solo lee la cookie local.
   */
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  const isProtected = PROTECTED_PREFIXES.some(prefix => pathname.startsWith(prefix))
  const isAuthPage  = AUTH_PAGES.includes(pathname)

  /* Sin sesión en ruta protegida → login */
  if (!user && isProtected) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname) // conserva destino
    return NextResponse.redirect(loginUrl)
  }

  /* Con sesión en página de auth → dashboard */
  if (user && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  /*
   * Excluye assets estáticos y archivos de imagen para no ejecutar
   * el middleware en cada recurso estático (mejora de rendimiento).
   */
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}