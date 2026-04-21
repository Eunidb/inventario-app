/**
 * @file app/(dashboard)/layout.tsx
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/server"; // Asegúrate de la ruta correcta
import Sidebar from "@/components/sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const supabase = await createClient();

  // Siempre usar getUser() en layouts para mayor seguridad
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* El Sidebar se renderiza una sola vez aquí para todas las sub-rutas */}
      <Sidebar />
      
      <main className="flex-1 overflow-auto p-4">
        {children}
      </main>
    </div>
  );
}