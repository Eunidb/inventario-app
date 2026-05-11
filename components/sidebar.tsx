/**
 * @file components/sidebar.tsx
 * @description Barra lateral de navegación principal.
 *
 * Incluye el acceso a "Formatos" como sección independiente.
 * En mobile muestra un botón hamburguesa en la parte superior.
 * En desktop es una barra fija de 256px (w-64) en el lado izquierdo.
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
// Agrupada en secciones para mayor claridad visual en el sidebar.
const NAV_SECTIONS = [
  {
    label: "General",
    items: [
      { href: "/dashboard",   icon: LayoutDashboard, label: "Dashboard" },
      { href: "/inventario",  icon: Package,          label: "Inventario" },
    ],
  },
  {
    label: "Operaciones",
    items: [
      { href: "/movimientos", icon: ArrowLeftRight, label: "Movimientos" },
      { href: "/prestamos",   icon: RefreshCw,      label: "Préstamos" },
      { href: "/historial",   icon: Clock,           label: "Historial" },
    ],
  },
  {
    // Sección independiente para los formatos físicos de mantenimiento
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
  const [open, setOpen]         = useState(false);  // Control del menú en mobile
  const [userName, setUserName] = useState("");
  const [userRol, setUserRol]   = useState("");

  // Cargar nombre del usuario autenticado para mostrarlo en la parte inferior
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

  // Cerrar el menú mobile al cambiar de ruta
  useEffect(() => { setOpen(false); }, [pathname]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  // ─── Determina si un enlace está activo ─────────────────────────────────
  // Un ítem es "activo" si el pathname empieza con su href.
  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  // ─── Contenido del sidebar (reutilizado en mobile y desktop) ────────────
  const SidebarContent = () => (
    <div className="flex flex-col h-full">

      {/* Logo */}
      <div className="px-5 py-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-200">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-black text-slate-800 leading-none">InvControl</p>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Lab. Pier — Mantenimiento</p>
          </div>
        </div>
      </div>

      {/* Navegación por secciones */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            {/* Título de sección */}
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] px-3 mb-2">
              {section.label}
            </p>

            {/* Ítems de la sección */}
            <div className="space-y-0.5">
              {section.items.map(({ href, icon: Icon, label }) => {
                const active = isActive(href);
                return (
                  <Link key={href} href={href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all group ${
                      active
                        ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <Icon size={17} className={active ? "text-white" : "text-slate-400 group-hover:text-slate-600"} />
                    <span className="flex-1">{label}</span>
                    {/* Indicador de página activa */}
                    {active && <ChevronRight size={14} className="text-blue-200" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Pie del sidebar: usuario y botón de logout */}
      <div className="px-3 py-4 border-t border-slate-100">
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 mb-2">
          {/* Avatar con inicial del nombre */}
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-black text-xs flex-shrink-0">
            {userName.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-700 truncate">{userName || "Usuario"}</p>
            <p className="text-[10px] text-slate-400 capitalize">{userRol}</p>
          </div>
        </div>

        {/* Botón cerrar sesión */}
        <button onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all">
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* ── MOBILE: barra superior con botón hamburguesa ── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-slate-200 px-4 h-16 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <span className="text-sm font-black text-slate-800">InvControl</span>
        </div>
        <button onClick={() => setOpen(!open)}
          className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-all">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* ── MOBILE: overlay oscuro al abrir el menú ── */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setOpen(false)} />
      )}

      {/* ── MOBILE: panel deslizable ── */}
      <div className={`lg:hidden fixed top-0 left-0 h-full w-72 bg-white z-50 shadow-2xl transition-transform duration-300 ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}>
        <SidebarContent />
      </div>

      {/* ── DESKTOP: sidebar fijo de 256px ── */}
      <aside className="hidden lg:flex flex-col fixed top-0 left-0 h-screen w-64 bg-white border-r border-slate-100 z-30 shadow-sm">
        <SidebarContent />
      </aside>
    </>
  );
}