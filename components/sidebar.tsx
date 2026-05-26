/**
 * @file components/sidebar.tsx
 * @description Barra lateral de navegación principal.
 *
 * CAMBIOS:
 * - Aplicación estricta del color institucional (#004091).
 * - Animaciones y transiciones formales (deslizamiento suave, fade-in, transformaciones en hover).
 * - Revisión ortográfica completa (tildes en Préstamos, Configuración, sesión).
 * - Optimización de responsividad (overlay con transición de opacidad).
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
  FileText,
  BarChart2,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ClipboardList,
} from "lucide-react";

// ─── Definición de la navegación ────────────────────────────────────────────
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
      { href: "/reportes",       icon: BarChart2, label: "Reportes" },
      { href: "/configuracion",  icon: Settings,  label: "Configuración" },
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

  useEffect(() => { setOpen(false); }, [pathname]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  // ─── Contenido del sidebar ────────────────────────────────────────────────
  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#004091] rounded-xl flex items-center justify-center flex-shrink-0 shadow-md shadow-[#004091]/20 transition-transform hover:scale-105 duration-300">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-black text-slate-800 leading-none tracking-tight">InvControl</p>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Lab. Pier — Mantenimiento</p>
          </div>
        </div>
      </div>

      {/* Navegación por secciones */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="animate-in fade-in slide-in-from-left-2 duration-500 fill-mode-both">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] px-3 mb-3">
              {section.label}
            </p>
            <div className="space-y-1">
              {section.items.map(({ href, icon: Icon, label }) => {
                const active = isActive(href);
                return (
                  <Link key={href} href={href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ease-in-out group ${
                      active
                        ? "bg-[#004091] text-white shadow-md shadow-[#004091]/20"
                        : "text-slate-600 hover:bg-[#004091]/5 hover:text-[#004091]"
                    }`}
                  >
                    <Icon size={18} className={`transition-colors duration-300 ${active ? "text-white" : "text-slate-400 group-hover:text-[#004091]"}`} />
                    <span className="flex-1 transition-transform duration-300 group-hover:translate-x-1">{label}</span>
                    {active && <ChevronRight size={14} className="text-white/70" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Pie del sidebar */}
      <div className="px-3 py-4 border-t border-slate-100 bg-white">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100 mb-3 transition-colors hover:border-slate-200 duration-300">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#004091] to-[#001f47] flex items-center justify-center text-white font-black text-xs flex-shrink-0 shadow-inner">
            {userName.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-800 truncate">{userName || "Usuario"}</p>
            <p className="text-[10px] text-slate-500 capitalize">{userRol}</p>
          </div>
        </div>

        <button onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-500 border border-transparent hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all duration-300 group">
          <LogOut size={16} className="transition-transform group-hover:-translate-x-1 duration-300" />
          Cerrar sesión
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* ── MOBILE: Barra superior ── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 h-16 flex items-center justify-between shadow-sm transition-all">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#004091] rounded-lg flex items-center justify-center shadow-md shadow-[#004091]/20">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <span className="text-sm font-black text-slate-800 tracking-tight">InvControl</span>
        </div>
        <button onClick={() => setOpen(!open)}
          className="p-2 rounded-xl text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-100 transition-all active:scale-95 duration-200">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* ── MOBILE: Overlay oscuro con transición ── */}
      <div 
        className={`lg:hidden fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setOpen(false)} 
      />

      {/* ── MOBILE: Panel deslizable ── */}
      <div className={`lg:hidden fixed top-0 left-0 h-full w-[280px] bg-white z-50 shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}>
        <SidebarContent />
      </div>

      {/* ── DESKTOP: Sidebar fijo ── */}
      <aside className="hidden lg:flex flex-col fixed top-0 left-0 h-screen w-64 bg-white border-r border-slate-100 z-30 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <SidebarContent />
      </aside>
    </>
  );
}