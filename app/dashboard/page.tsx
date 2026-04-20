
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import StatsCard from "@/components/StatsCard";
import Link from "next/link";
import type { InventarioItem, HistorialMovimiento } from "@/lib/supabase";

// ---------------------------------------------------------------------------
// Tipos locales
// ---------------------------------------------------------------------------
interface DashboardStats {
  totalArticulos: number;
  stockBajo: number;
  prestamosActivos: number;
  dadosBaja: number;
}

// ---------------------------------------------------------------------------
// Componente principal del Dashboard
// ---------------------------------------------------------------------------
export default function DashboardPage() {
  const [stats, setStats]           = useState<DashboardStats | null>(null);
  const [stockBajoItems, setStockBajoItems] = useState<InventarioItem[]>([]);
  const [movimientos, setMovimientos]       = useState<HistorialMovimiento[]>([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [userName, setUserName]     = useState("Usuario");

  // -------------------------------------------------------------------------
  // Cargar datos del dashboard al montar el componente
  // -------------------------------------------------------------------------
  useEffect(() => {
    const loadDashboard = async () => {
      setIsLoading(true);
      try {
        // Obtener usuario actual
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: perfil } = await supabase
            .from("usuarios")
            .select("nombre_completo")
            .eq("id", user.id)
            .single();
          if (perfil) setUserName(perfil.nombre_completo.split(" ")[0]);
        }

        // Consultas en paralelo para mayor rendimiento
        const [
          { count: totalArticulos },
          { data: stockBajoData },
          { count: prestamosActivos },
          { count: dadosBaja },
          { data: movData },
        ] = await Promise.all([
          supabase.from("inventario").select("*", { count: "exact", head: true }),
          supabase
            .from("inventario")
            .select("*")
            .filter("stock_disponible", "lte", "stock_minimo") // stock_disponible <= stock_minimo
            .eq("estado", "activo")
            .limit(5),
          supabase
            .from("prestamos")
            .select("*", { count: "exact", head: true })
            .eq("estado", "activo"),
          supabase
            .from("inventario")
            .select("*", { count: "exact", head: true })
            .eq("estado", "dado_de_baja"),
          supabase
            .from("historial_inventario")
            .select(`
              *,
              inventario (nombre, clave),
              usuarios (nombre_completo)
            `)
            .order("fecha", { ascending: false })
            .limit(5),
        ]);

        setStats({
          totalArticulos: totalArticulos ?? 0,
          stockBajo:       stockBajoData?.length ?? 0,
          prestamosActivos: prestamosActivos ?? 0,
          dadosBaja:        dadosBaja ?? 0,
        });
        setStockBajoItems(stockBajoData as InventarioItem[] ?? []);
        setMovimientos(movData as HistorialMovimiento[] ?? []);
      } catch (err) {
        console.error("Error cargando dashboard:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, []);

  // -------------------------------------------------------------------------
  // Función auxiliar: color por tipo de movimiento
  // -------------------------------------------------------------------------
  const movimientoColor = (tipo: string) => {
    const map: Record<string, string> = {
      entrada:    "bg-emerald-100 text-emerald-700",
      salida:     "bg-orange-100 text-orange-700",
      prestamo:   "bg-blue-100 text-blue-700",
      devolucion: "bg-teal-100 text-teal-700",
      ajuste:     "bg-purple-100 text-purple-700",
      baja:       "bg-red-100 text-red-700",
    };
    return map[tipo] ?? "bg-gray-100 text-gray-700";
  };

  // -------------------------------------------------------------------------
  // Formatear fecha relativa simple
  // -------------------------------------------------------------------------
  const formatFecha = (fecha: string) => {
    const diff = Date.now() - new Date(fecha).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `hace ${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `hace ${hrs}h`;
    return new Date(fecha).toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
  };

  // -------------------------------------------------------------------------
  // Hora del saludo
  // -------------------------------------------------------------------------
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Buenos días";
    if (hour < 18) return "Buenas tardes";
    return "Buenas noches";
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* ------------------------------------------------------------------ */}
      {/* Encabezado                                                          */}
      {/* ------------------------------------------------------------------ */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {getGreeting()}, {userName} 👋
        </h1>
        <p className="text-gray-500 mt-1">
          Resumen general del sistema de inventario
        </p>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Tarjetas de estadísticas                                            */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard
          title="Total artículos"
          value={stats?.totalArticulos ?? 0}
          isLoading={isLoading}
          iconColor="blue"
          icon={
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          }
        />
        <StatsCard
          title="Stock bajo"
          value={stats?.stockBajo ?? 0}
          isLoading={isLoading}
          iconColor="amber"
          subtitle="Artículos bajo el mínimo"
          icon={
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
        />
        <StatsCard
          title="Préstamos activos"
          value={stats?.prestamosActivos ?? 0}
          isLoading={isLoading}
          iconColor="green"
          icon={
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          }
        />
        <StatsCard
          title="Dados de baja"
          value={stats?.dadosBaja ?? 0}
          isLoading={isLoading}
          iconColor="red"
          icon={
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          }
        />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Panel de dos columnas: Alertas + Movimientos recientes             */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alertas de stock bajo */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <h2 className="text-sm font-semibold text-gray-900">Artículos con stock bajo</h2>
            </div>
            <Link href="/inventario" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
              Ver todos →
            </Link>
          </div>

          <div className="divide-y divide-gray-50">
            {isLoading ? (
              /* Esqueleto de carga */
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="px-5 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg animate-pulse" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-32 bg-gray-100 rounded animate-pulse" />
                    <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
                  </div>
                </div>
              ))
            ) : stockBajoItems.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-gray-400">
                ✅ No hay artículos con stock bajo
              </div>
            ) : (
              stockBajoItems.map((item) => (
                <Link
                  key={item.id}
                  href={`/inventario/${item.id}`}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors"
                >
                  {/* Ícono artículo */}
                  <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#D97706" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.nombre}</p>
                    <p className="text-xs text-gray-400">{item.clave}</p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-red-600">{item.stock_disponible}</p>
                    <p className="text-xs text-gray-400">min: {item.stock_minimo}</p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Movimientos recientes */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-400" />
              <h2 className="text-sm font-semibold text-gray-900">Movimientos recientes</h2>
            </div>
            <Link href="/historial" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
              Ver historial →
            </Link>
          </div>

          <div className="divide-y divide-gray-50">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="px-5 py-3 flex items-center gap-3">
                  <div className="w-16 h-5 bg-gray-100 rounded-full animate-pulse" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-40 bg-gray-100 rounded animate-pulse" />
                    <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
                  </div>
                </div>
              ))
            ) : movimientos.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-gray-400">
                No hay movimientos registrados
              </div>
            ) : (
              movimientos.map((mov) => (
                <div key={mov.id} className="flex items-center gap-3 px-5 py-3">
                  <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full flex-shrink-0 ${movimientoColor(mov.tipo_movimiento)}`}>
                    {mov.tipo_movimiento}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">
                      {(mov.inventario as any)?.nombre ?? "—"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {(mov.usuarios as any)?.nombre_completo ?? "—"}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-medium text-gray-700">×{mov.cantidad}</p>
                    <p className="text-xs text-gray-400">{formatFecha(mov.fecha)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Accesos rápidos                                                     */}
      {/* ------------------------------------------------------------------ */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: "/inventario",   label: "Nuevo artículo",  color: "text-blue-600 bg-blue-50 hover:bg-blue-100" },
          { href: "/prestamos",    label: "Nueva salida",    color: "text-emerald-600 bg-emerald-50 hover:bg-emerald-100" },
          { href: "/historial",    label: "Ver historial",   color: "text-purple-600 bg-purple-50 hover:bg-purple-100" },
          { href: "/reportes",     label: "Generar reporte", color: "text-amber-600 bg-amber-50 hover:bg-amber-100" },
        ].map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={`
              flex items-center justify-center py-3 px-4 rounded-xl
              text-sm font-medium transition-colors
              ${action.color}
            `}
          >
            {action.label}
          </Link>
        ))}
      </div>
    </div>
  );
}