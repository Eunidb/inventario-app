/**
 * @file components/sidebar.tsx
 * FIX: Manejo de desbordamiento y anchos fijos para evitar textos cortados.
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from '@/lib/client';
import { 
  Menu, X, LayoutDashboard, Box, 
  ArrowLeftRight, History, BarChart3, 
  Settings, LogOut, 
  ArrowBigUp
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Inicio", icon: <LayoutDashboard size={20} /> },
  { href: "/inventario", label: "Inventario", icon: <Box size={20} /> },
  { href: "/prestamos", label: "Préstamos", icon: <ArrowLeftRight size={20} /> },
  { href: "/movimientos", label: "Movimientos", icon: <ArrowBigUp size={20} /> },
  { href: "/historial", label: "Historial", icon: <History size={20} /> },
  { href: "/reportes", label: "Reportes", icon: <BarChart3 size={20} /> },
  { href: "/configuracion", label: "Configuración", icon: <Settings size={20} /> },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);


  const handleLogout = async () => {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Error cerrando sesión:", error.message);
    return;
  }

  router.push("/");
  router.refresh(); // importante en Next 13+
};

  return (
    <>
      {/* BOTÓN MÓVIL */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button onClick={() => setIsOpen(!isOpen)} className="p-2 bg-slate-900 text-white rounded-xl">
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* ASIDE */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-40
          flex flex-col bg-[#0f172a] text-white
          transition-all duration-300 ease-in-out overflow-hidden
          ${isOpen ? "translate-x-0" : "-translate-x-full"} 
          lg:translate-x-0
          ${isCollapsed ? "lg:w-20" : "lg:w-64"}
          w-64
        `}
      >
        {/* LOGO AREA */}
        <div className="flex items-center h-20 px-4 border-b border-white/5 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-max">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Box size={22} strokeWidth={2.5} />
            </div>
            <span className={`font-black text-xl tracking-tight transition-opacity duration-300 ${isCollapsed ? "opacity-0" : "opacity-100"}`}>
              InvControl
            </span>
          </div>
        </div>

        {/* NAV ITEMS */}
        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center h-12 rounded-xl transition-all duration-200 group
                  ${isActive ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"}
                  ${isCollapsed ? "justify-center" : "px-3"}
                `}
              >
                <div className="flex items-center gap-3 min-w-max">
                  <span className="flex-shrink-0">{item.icon}</span>
                  <span className={`text-sm font-bold transition-opacity duration-300 ${isCollapsed ? "lg:hidden" : "block"}`}>
                    {item.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* FOOTER AREA (LOGOUT) */}
        <div className="p-4 border-t border-white/5">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex items-center justify-center w-full py-2 mb-2 text-slate-500 hover:text-white"
          >
            {isCollapsed ? <ArrowLeftRight size={16} /> : <span className="text-xs font-bold uppercase tracking-widest">Reducir</span>}
          </button>
          
          <button 
           onClick={handleLogout}
          className={`flex items-center gap-3 w-full h-12 rounded-xl text-red-400 hover:bg-red-500/10 transition-all ${isCollapsed ? "justify-center" : "px-3"}`}>
            <LogOut size={20} className="flex-shrink-0" />
            <span className={`text-sm font-bold min-w-max ${isCollapsed ? "lg:hidden" : "block"}`}>
              Cerrar Sesión
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}