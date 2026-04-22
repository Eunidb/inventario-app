/**
 * @file app/historial/page.tsx
 * @description Vista de auditoría completa: todos los movimientos del inventario con filtros avanzados.
 */
"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/client";
import Sidebar from "@/components/sidebar";
import { Search, Filter, Download, ArrowDownCircle, ArrowUpCircle, SlidersHorizontal } from "lucide-react";

const TIPO_CONFIG: Record<string, { label: string; cls: string; signo: string }> = {
  entrada:    { label: "Entrada",    cls: "bg-emerald-100 text-emerald-700", signo: "+" },
  salida:     { label: "Salida",     cls: "bg-orange-100 text-orange-700",   signo: "−" },
  prestamo:   { label: "Préstamo",   cls: "bg-blue-100 text-blue-700",       signo: "−" },
  devolucion: { label: "Devolución", cls: "bg-teal-100 text-teal-700",       signo: "+" },
  ajuste:     { label: "Ajuste",     cls: "bg-purple-100 text-purple-700",   signo: "~" },
  baja:       { label: "Baja",       cls: "bg-red-100 text-red-700",         signo: "−" },
};

export default function HistorialPage() {
  const [historial, setHistorial] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch]       = useState("");
  const [tipoFilter, setTipoFilter] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [page, setPage]           = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const PER_PAGE = 20;

  const loadHistorial = useCallback(async () => {
    setIsLoading(true);
    const supabase = createClient();
    try {
      let q = supabase
        .from("historial_inventario")
        .select(`
          *,
          inventario(nombre, clave),
          usuarios(nombre_completo)
        `)
        .order("fecha", { ascending: false })
        .range((page - 1) * PER_PAGE, page * PER_PAGE - 1);

      if (tipoFilter) q = q.eq("tipo_movimiento", tipoFilter);
      if (fechaDesde) q = q.gte("fecha", fechaDesde);
      if (fechaHasta) q = q.lte("fecha", fechaHasta + "T23:59:59");

      const { data, error } = await q;
      if (error) throw error;
      setHistorial(data ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [tipoFilter, fechaDesde, fechaHasta, page]);

  useEffect(() => { loadHistorial(); }, [loadHistorial]);

  const filtered = historial.filter(m => {
    const term = search.toLowerCase();
    return !term ||
      m.inventario?.nombre?.toLowerCase().includes(term) ||
      m.inventario?.clave?.toLowerCase().includes(term) ||
      m.usuarios?.nombre_completo?.toLowerCase().includes(term);
  });

  const exportarCSV = () => {
    const headers = ["ID", "Artículo", "Clave", "Tipo", "Cantidad", "Stock Antes", "Stock Después", "Usuario", "Fecha", "Observaciones"];
    const rows = filtered.map(m => [
      m.id,
      m.inventario?.nombre ?? "",
      m.inventario?.clave ?? "",
      m.tipo_movimiento,
      m.cantidad,
      m.stock_antes ?? "",
      m.stock_despues ?? "",
      m.usuarios?.nombre_completo ?? "",
      new Date(m.fecha).toLocaleString("es-MX"),
      m.observaciones ?? "",
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `historial_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatFecha = (f: string) =>
    new Date(f).toLocaleString("es-MX", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 lg:ml-64 w-full">
        <div className="p-4 md:p-8 lg:p-10 pt-20 lg:pt-10 max-w-7xl mx-auto">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Historial</h1>
              <p className="text-slate-500 font-medium mt-1">Auditoría completa de todos los movimientos</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowFilters(f => !f)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm border transition-all ${showFilters ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"}`}>
                <Filter size={16} /> Filtros
              </button>
              <button onClick={exportarCSV}
                className="inline-flex items-center gap-2 bg-white text-slate-600 border border-slate-200 px-4 py-2.5 rounded-xl font-semibold text-sm hover:border-emerald-400 hover:text-emerald-600 transition-all">
                <Download size={16} /> Exportar
              </button>
            </div>
          </div>

          {/* Filtros */}
          <div className={`bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-6 space-y-4 transition-all ${showFilters ? "block" : "hidden"}`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative sm:col-span-2">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar por artículo, clave o usuario..."
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400" />
              </div>
              <select value={tipoFilter} onChange={e => { setTipoFilter(e.target.value); setPage(1); }}
                className="py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600 font-medium outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer">
                <option value="">Todos los tipos</option>
                {Object.entries(TIPO_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <input type="date" value={fechaDesde} onChange={e => { setFechaDesde(e.target.value); setPage(1); }}
                  className="py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600 outline-none focus:ring-2 focus:ring-blue-100" />
                <input type="date" value={fechaHasta} onChange={e => { setFechaHasta(e.target.value); setPage(1); }}
                  className="py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600 outline-none focus:ring-2 focus:ring-blue-100" />
              </div>
            </div>
          </div>

          {/* Si no hay filtros abiertos, mostrar barra simple */}
          {!showFilters && (
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar por artículo, clave o usuario..."
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400" />
              </div>
            </div>
          )}

          {/* Tabla */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Artículo</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Tipo</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Cantidad</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest hidden md:table-cell">Stock</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest hidden lg:table-cell">Usuario</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Fecha</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest hidden xl:table-cell">Notas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {isLoading ? (
                    [...Array(8)].map((_, i) => (
                      <tr key={i}><td colSpan={7} className="px-6 py-4">
                        <div className="h-4 bg-slate-100 rounded-lg animate-pulse w-full" />
                      </td></tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={7} className="py-16 text-center text-slate-400 text-sm font-medium">
                      No hay registros con los filtros actuales
                    </td></tr>
                  ) : filtered.map((m) => {
                    const cfg = TIPO_CONFIG[m.tipo_movimiento] ?? TIPO_CONFIG.ajuste;
                    return (
                      <tr key={m.id} className="hover:bg-slate-50/80 transition-colors text-sm">
                        <td className="px-6 py-3">
                          <p className="font-bold text-slate-800">{m.inventario?.nombre ?? "—"}</p>
                          <p className="text-[11px] font-mono text-slate-400">{m.inventario?.clave}</p>
                        </td>
                        <td className="px-6 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${cfg.cls}`}>
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-center font-black text-slate-700">
                          {cfg.signo}{m.cantidad}
                        </td>
                        <td className="px-6 py-3 hidden md:table-cell">
                          {m.stock_antes != null && (
                            <span className="text-xs text-slate-500">
                              {m.stock_antes} <span className="text-slate-300">→</span> <span className="font-bold text-slate-700">{m.stock_despues}</span>
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-3 hidden lg:table-cell text-slate-600">
                          {m.usuarios?.nombre_completo ?? "—"}
                        </td>
                        <td className="px-6 py-3 text-[11px] text-slate-500 whitespace-nowrap">
                          {formatFecha(m.fecha)}
                        </td>
                        <td className="px-6 py-3 hidden xl:table-cell text-[11px] text-slate-400 max-w-xs truncate">
                          {m.observaciones ?? "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">
                <span className="text-slate-900 font-bold">{filtered.length}</span> registros en esta página
              </p>
              <div className="flex gap-2">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                  className="px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 transition-all">Anterior</button>
                <button disabled={historial.length < PER_PAGE} onClick={() => setPage(p => p + 1)}
                  className="px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-40 transition-all">Siguiente</button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}