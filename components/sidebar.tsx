/**
 * @file components/sidebar.tsx
 * @description Barra lateral de navegación principal altamente responsiva y formal.
 * Aplica la identidad visual unificada de Laboratorios Pier con micro-interacciones.
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/client";
import {
  LayoutDashboard,
  Package,
  ArrowLeftRight,
  RefreshCw,
  Clock,
  BarChart2,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ClipboardList,
} from "lucide-react";

// ─── DEFINICIÓN DE LA NAVEGACIÓN ────────────────────────────────────────────
const NAV_SECTIONS = [
  {
    label: "General",
    items: [
      { href: "/dashboard",   icon: LayoutDashboard, label: "Dashboard" },
      { href: "/inventario",  icon: Package,         label: "Inventario" },
    ],
  },
  {
    label: "Operaciones",
    items: [
      { href: "/movimientos", icon: ArrowLeftRight, label: "Movimientos" },
      { href: "/prestamos",   icon: RefreshCw,      label: "Préstamos" },
      { href: "/historial",   icon: Clock,          label: "Historial" },
    ],
  },
  {
    label: "Mantenimiento",
    items: [
      { href: "/formatos", icon: ClipboardList, label: "Formatos de Trabajo" },
    ],
  },
  {
    label: "Administración",
    items: [
      { href: "/reportes",     icon: BarChart2, label: "Reportes" },
      { href: "/configuracion", icon: Settings,  label: "Configuración" },
    ],
  },
];

export default function Sidebar() {
  const pathname  = usePathname();
  const router    = useRouter();
  const [open, setOpen]         = useState(false);
  const [userName, setUserName] = useState("");
  const [userRol, setUserRol]   = useState("");

  useEffect(() => {
    const loadUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("usuarios")
          .select("nombre_completo, rol")
          .eq("id", user.id)
          .maybeSingle();
        if (data) {
          setUserName(data.nombre_completo?.split(" ")[0] ?? "Usuario");
          setUserRol(data.rol ?? "");
        }
      }
    };
    loadUser();
  }, []);

  // Cierra el menú desplegable móvil de forma automática al cambiar de ruta
  useEffect(() => { setOpen(false); }, [pathname]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  // ─── DISEÑO CONTENIDO INTERNO DEL SIDEBAR ──────────────────────────────────
  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white [color-scheme:light]">
      
      {/* Identidad de la Plataforma con Degradado */}
      <div className="px-5 py-6 border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#013b82] to-[#014ba0] rounded-xl flex items-center justify-center flex-shrink-0 shadow-md shadow-[#014ba0]/20 transition-transform hover:scale-105 duration-300">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-black text-slate-900 leading-none tracking-tight">InvControl</p>
            <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">Lab. Pier — Mantenimiento</p>
          </div>
        </div>
      </div>

      {/* Bloque de Navegación Dinámica */}
      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-7 custom-scrollbar">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="animate-fadeIn">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.18em] px-3 mb-3.5">
              {section.label}
            </p>
            <div className="space-y-1.5">
              {section.items.map(({ href, icon: Icon, label }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ease-in-out group ${
                      active
                        ? "bg-[#014ba0] text-white shadow-md shadow-[#014ba0]/15"
                        : "text-slate-600 hover:bg-slate-50 hover:text-[#014ba0]"
                    }`}
                  >
                    <Icon 
                      size={18} 
                      className={`transition-colors duration-200 shrink-0 ${
                        active ? "text-white" : "text-slate-400 group-hover:text-[#014ba0]"
                      }`} 
                    />
                    <span className="flex-1 truncate transition-transform duration-200 group-hover:translate-x-0.5">
                      {label}
                    </span>
                    {active && <ChevronRight size={14} className="text-white/80 animate-fadeIn" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bloque de Usuario del Sistema */}
      <div className="px-3 py-4 border-t border-slate-100 bg-slate-50/40">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-white border border-slate-100 shadow-sm transition-all hover:border-slate-200 duration-300">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-950 via-[#013b82] to-[#014ba0] flex items-center justify-center text-white font-black text-xs flex-shrink-0 shadow-sm">
            {userName.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black text-slate-900 truncate leading-tight">{userName || "Usuario"}</p>
            <p className="text-[10px] text-slate-400 font-bold capitalize mt-0.5 tracking-wide">{userRol || "Personal"}</p>
          </div>
        </div>

        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-500 border border-transparent hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all duration-200 group mt-3 active:scale-[0.99]"
        >
          <LogOut size={16} className="transition-transform group-hover:-translate-x-0.5 duration-200 text-slate-400 group-hover:text-red-500" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* ── INTERFAZ MÓVIL: Barra superior fija ── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 h-16 flex items-center justify-between shadow-sm [color-scheme:light]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-[#013b82] to-[#014ba0] rounded-lg flex items-center justify-center shadow-md shadow-[#014ba0]/10">
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <span className="text-sm font-black text-slate-900 tracking-tight">InvControl</span>
        </div>
        
        <button 
          onClick={() => setOpen(!open)}
          className="p-2.5 rounded-xl text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all active:scale-95 duration-200"
          aria-label="Alternar menú de navegación"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* ── INTERFAZ MÓVIL: Fondo difuminado (Overlay) ── */}
      <div 
        className={`lg:hidden fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${
          open ? "opacity-100 animate-fadeIn" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setOpen(false)} 
      />

      {/* ── INTERFAZ MÓVIL: Cajón lateral desplegable ── */}
      <div className={`lg:hidden fixed top-0 left-0 h-full w-[280px] bg-white z-50 shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}>
        <SidebarContent />
      </div>

      {/* ── INTERFAZ ESCRITORIO: Panel lateral fijo estructurado ── */}
      <aside className="hidden lg:flex flex-col fixed top-0 left-0 h-screen w-64 bg-white border-r border-slate-100 z-30 shadow-[4px_0_24px_rgba(0,0,0,0.015)]">
        <SidebarContent />
      </aside>
    </>
  );
}