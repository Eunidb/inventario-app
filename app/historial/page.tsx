/**
 * @file app/historial/page.tsx
 * @description Historial de movimientos del inventario.
 * Filtros funcionales por tipo de movimiento, rango de fechas y búsqueda por texto.
 * Muestra quién hizo cada movimiento, qué artículo y los stocks antes/después.
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from '@/lib/client'
import Sidebar from "@/components/sidebar";

import type { HistorialMovimiento, TipoMovimientoEnum } from "@/lib/supabase";

// Cliente Supabase del navegador — instancia única por módulo
const supabase = createClient()

// ---------------------------------------------------------------------------
// Configuración visual por tipo de movimiento
// ---------------------------------------------------------------------------
const TIPO_MOV: Record<TipoMovimientoEnum, { label: string; cls: string; icon: string }> = {
  entrada:    { label: "Entrada",    cls: "bg-emerald-100 text-emerald-700", icon: "↓" },
  salida:     { label: "Salida",     cls: "bg-orange-100 text-orange-700",   icon: "↑" },
  prestamo:   { label: "Préstamo",   cls: "bg-blue-100 text-blue-700",       icon: "→" },
  devolucion: { label: "Devolución", cls: "bg-teal-100 text-teal-700",       icon: "↩" },
  ajuste:     { label: "Ajuste",     cls: "bg-purple-100 text-purple-700",   icon: "≈" },
  baja:       { label: "Baja",       cls: "bg-red-100 text-red-700",         icon: "✕" },
};

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------
export default function HistorialPage() {
  const [movimientos, setMovimientos] = useState<HistorialMovimiento[]>([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [total, setTotal]             = useState(0);

  // Filtros
  const [search, setSearch]         = useState("");
  const [tipoFilter, setTipoFilter] = useState<string>("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  // Paginación
  const [page, setPage] = useState(1);
  const PER_PAGE = 20;

  // -------------------------------------------------------------------------
  // Cargar historial con todos los filtros aplicados
  // -------------------------------------------------------------------------
  const loadHistorial = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("historial_inventario")
        .select(`
          *,
          inventario (id, nombre, clave),
          usuarios (nombre_completo)
        `, { count: "exact" })
        .order("fecha", { ascending: false })
        .range((page - 1) * PER_PAGE, page * PER_PAGE - 1);

      // Filtro por tipo de movimiento
      if (tipoFilter) {
        query = query.eq("tipo_movimiento", tipoFilter);
      }

      // Filtro por rango de fechas
      if (fechaDesde) {
        query = query.gte("fecha", new Date(fechaDesde).toISOString());
      }
      if (fechaHasta) {
        const hasta = new Date(fechaHasta);
        hasta.setHours(23, 59, 59, 999);
        query = query.lte("fecha", hasta.toISOString());
      }

      const { data, count, error } = await query;
      if (error) throw error;

      let result = (data as HistorialMovimiento[]) ?? [];

      // Filtro por texto (nombre de artículo o usuario) — en cliente
      if (search.trim()) {
        const s = search.toLowerCase();
        result = result.filter(
          (m) =>
            (m.inventario as any)?.nombre?.toLowerCase().includes(s) ||
            (m.inventario as any)?.clave?.toLowerCase().includes(s) ||
            (m.usuarios as any)?.nombre_completo?.toLowerCase().includes(s)
        );
      }

      setMovimientos(result);
      setTotal(count ?? 0);
    } catch (err) {
      console.error("Error cargando historial:", err);
    } finally {
      setIsLoading(false);
    }
  }, [search, tipoFilter, fechaDesde, fechaHasta, page]);

  // Debounce para la búsqueda de texto
  useEffect(() => {
    const t = setTimeout(loadHistorial, 300);
    return () => clearTimeout(t);
  }, [loadHistorial]);

  // -------------------------------------------------------------------------
  // Limpiar todos los filtros
  // -------------------------------------------------------------------------
  const limpiarFiltros = () => {
    setSearch("");
    setTipoFilter("");
    setFechaDesde("");
    setFechaHasta("");
    setPage(1);
  };

  const hayFiltros = search || tipoFilter || fechaDesde || fechaHasta;

  // -------------------------------------------------------------------------
  // Formatear fecha y hora
  // -------------------------------------------------------------------------
  const fmtFecha = (f: string) =>
    new Date(f).toLocaleString("es-MX", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      {/* Contenido Principal con margen responsive */}
      <main className="flex-1 transition-all duration-300 lg:ml-64 w-full">
        <div className="p-4 md:p-8 lg:p-10 pt-20 lg:pt-10 max-w-7xl mx-auto">

      {/* Encabezado */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Historial de movimientos</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Registro completo de entradas, salidas, préstamos y ajustes de inventario
        </p>
      </div>

      {/* Panel de filtros */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-5">
        <div className="flex flex-col gap-3">
          {/* Primera fila: búsqueda + tipo */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Buscar por artículo, clave o usuario..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={tipoFilter}
              onChange={(e) => { setTipoFilter(e.target.value); setPage(1); }}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700"
            >
              <option value="">Todos los tipos</option>
              {Object.entries(TIPO_MOV).map(([val, { label }]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>

          {/* Segunda fila: fechas + limpiar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <div className="flex items-center gap-2 flex-1">
              <label className="text-xs text-gray-500 whitespace-nowrap">Desde:</label>
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => { setFechaDesde(e.target.value); setPage(1); }}
                className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2 flex-1">
              <label className="text-xs text-gray-500 whitespace-nowrap">Hasta:</label>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => { setFechaHasta(e.target.value); setPage(1); }}
                className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {hayFiltros && (
              <button
                onClick={limpiarFiltros}
                className="text-sm text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg px-3 py-2 whitespace-nowrap transition-colors"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        {/* Chips de filtros activos */}
        {hayFiltros && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
            {tipoFilter && (
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${TIPO_MOV[tipoFilter as TipoMovimientoEnum]?.cls}`}>
                Tipo: {TIPO_MOV[tipoFilter as TipoMovimientoEnum]?.label}
              </span>
            )}
            {fechaDesde && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">
                Desde: {fechaDesde}
              </span>
            )}
            {fechaHasta && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">
                Hasta: {fechaHasta}
              </span>
            )}
            {search && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                Búsqueda: "{search}"
              </span>
            )}
          </div>
        )}
      </div>

      {/* Tabla de historial */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Contador */}
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            {isLoading ? "Cargando..." : `${total} movimiento(s) encontrado(s)`}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tipo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Artículo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Usuario</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cantidad</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Stock antes</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Stock después</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : movimientos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400 text-sm">
                    No se encontraron movimientos con los filtros aplicados
                  </td>
                </tr>
              ) : (
                movimientos.map((mov) => {
                  const tipo = TIPO_MOV[mov.tipo_movimiento] ?? {
                    label: mov.tipo_movimiento,
                    cls: "bg-gray-100 text-gray-600",
                    icon: "•",
                  };

                  return (
                    <tr key={mov.id} className="hover:bg-gray-50/50 transition-colors">
                      {/* Tipo */}
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${tipo.cls}`}>
                          <span className="font-bold">{tipo.icon}</span>
                          {tipo.label}
                        </span>
                      </td>

                      {/* Artículo */}
                      <td className="px-4 py-3.5">
                        <p className="font-medium text-gray-900">
                          {(mov.inventario as any)?.nombre ?? "—"}
                        </p>
                        <p className="text-xs text-gray-400">
                          {(mov.inventario as any)?.clave ?? ""}
                        </p>
                      </td>

                      {/* Usuario */}
                      <td className="px-4 py-3.5 text-gray-600 hidden sm:table-cell">
                        {(mov.usuarios as any)?.nombre_completo ?? "—"}
                      </td>

                      {/* Cantidad */}
                      <td className="px-4 py-3.5 text-center">
                        <span className="font-semibold text-gray-900">×{mov.cantidad}</span>
                      </td>

                      {/* Stock antes */}
                      <td className="px-4 py-3.5 text-center text-gray-500 hidden md:table-cell">
                        {mov.stock_antes ?? "—"}
                      </td>

                      {/* Stock después */}
                      <td className="px-4 py-3.5 text-center hidden md:table-cell">
                        {mov.stock_despues !== undefined && mov.stock_despues !== null ? (
                          <span
                            className={
                              mov.stock_despues < (mov.stock_antes ?? 0)
                                ? "text-red-600 font-medium"
                                : "text-emerald-600 font-medium"
                            }
                          >
                            {mov.stock_despues}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>

                      {/* Fecha */}
                      <td className="px-4 py-3.5 text-gray-500 text-xs hidden lg:table-cell">
                        {fmtFecha(mov.fecha)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            Página {page} · {PER_PAGE} por página
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              ← Anterior
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={movimientos.length < PER_PAGE}
              className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              Siguiente →
            </button>
          </div>
        </div>
      </div>
       </div>
      </main>
    </div>
  );
}