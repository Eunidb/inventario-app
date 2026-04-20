/**
 * @file app/dashboard/layout.tsx
 * @description Layout raíz del área autenticada.
 * Protege las rutas: redirige al login si no hay sesión activa.
 * Incluye el Sidebar en todas las páginas del dashboard.
 */

import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Sidebar from "@/components/sidebar";

// ---------------------------------------------------------------------------
// Props del layout
// ---------------------------------------------------------------------------
interface DashboardLayoutProps {
  children: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Layout del dashboard (Server Component)
// ---------------------------------------------------------------------------
export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  // Crear cliente de Supabase para el servidor usando cookies de sesión
 const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  // Verificar si el usuario tiene sesión activa
  const { data: { session } } = await supabase.auth.getSession();

  // Si no hay sesión, redirigir al login
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar de navegación */}
      <Sidebar />

      {/* Área de contenido principal */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}