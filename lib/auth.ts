/**
 * @file lib/auth.ts
 * @description Utilidades de autenticación y autorización para Client Components.
 *
 * POR QUÉ se consulta la DB y no user_metadata:
 * - user_metadata es controlado por el cliente y puede ser manipulado.
 * - La tabla `usuarios` es la fuente de verdad protegida por RLS.
 */

import { createClient } from '@/lib/client'

export type RolUsuario = 'admin' | 'tecnico' | 'usuario'

/**
 * Obtiene el rol real del usuario autenticado desde la base de datos.
 * @returns El rol del usuario o null si no está autenticado.
 */
export async function getRolUsuario(): Promise<RolUsuario | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('id', user.id)
    .maybeSingle()

  return (data?.rol as RolUsuario) ?? null
}

/**
 * Verifica si el usuario autenticado tiene rol de administrador.
 * Consulta la base de datos — no confía en metadatos del cliente.
 */
export async function esAdmin(): Promise<boolean> {
  const rol = await getRolUsuario()
  return rol === 'admin'
}