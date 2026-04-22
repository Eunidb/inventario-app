/**
 * @file app/movimientos/page.tsx
 * @description Registro de movimientos manuales: entradas, salidas y ajustes de stock.
 */
"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/client";
import Sidebar from "@/components/sidebar";
import ModalMovimiento from "@/components/ModalMovimiento";
import { Plus, Search, ArrowDownCircle, ArrowUpCircle, SlidersHorizontal, Filter } from "lucide-react";

const TIPO_CONFIG: Record<string, { label: string; cls: string; Icon: any }> = {
  entrada:   { label: "Entrada",   cls: "bg-emerald-50 text-emerald-700 border-emerald-100", Icon: ArrowDownCircle },
  salida:    { label: "Salida",    cls: "bg-orange-50 text-orange-700 border-orange-100",   Icon: ArrowUpCircle },
  ajuste:    { label: "Ajuste",    cls: "bg-purple-50 text-purple-700 border-purple-100",   Icon: SlidersHorizontal },
  prestamo:  { label: "Préstamo",  cls: "bg-blue-50 text-blue-700 border-blue-100",         Icon: ArrowUpCircle },
  devolucion:{ label: "Devolución",cls: "bg-teal-50 text-teal-700 border-teal-100",         Icon: ArrowDownCircle },
  baja:      { label: "Baja",      cls: "bg-red-50 text-red-700 border-red-100",            Icon: ArrowUpCircle },
};

export default function MovimientosPage() {
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [search, setSearch]           = useState("");
  const [tipoFilter, setTipoFilter]   = useState("");
  const [page, setPage]               = useState(1);
  const [modalOpen, setModalOpen]     = useState(false);
  const PER_PAGE = 15;

  const loadMovimientos = useCallback(async () => {
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

      const { data, error } = await q;
      if (error) throw error;
      setMovimientos(data ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [tipoFilter, page]);

  useEffect(() => { loadMovimientos(); }, [loadMovimientos]);

  const filtered = movimientos.filter(m => {
    const term = search.toLowerCase();
    return !term ||
      m.inventario?.nombre?.toLowerCase().includes(term) ||
      m.inventario?.clave?.toLowerCase().includes(term) ||
      m.usuarios?.nombre_completo?.toLowerCase().includes(term);
  });

  const formatFecha = (f: string) =>
    new Date(f).toLocaleString("es-MX", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

  // Resumen del día
  const hoy = new Date().toDateString();
  const hoyMov = movimientos.filter(m => new Date(m.fecha).toDateString() === hoy);
  const entradas = hoyMov.filter(m => m.tipo_movimiento === "entrada").reduce((a, m) => a + Number(m.cantidad), 0);
  const salidas  = hoyMov.filter(m => ["salida", "prestamo"].includes(m.tipo_movimiento)).reduce((a, m) => a + Number(m.cantidad), 0);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 lg:ml-64 w-full">
        <div className="p-4 md:p-8 lg:p-10 pt-20 lg:pt-10 max-w-7xl mx-auto">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Movimientos</h1>
              <p className="text-slate-500 font-medium mt-1">Entradas, salidas y ajustes de inventario</p>
            </div>
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5"
            >
              <Plus size={18} /> Registrar Movimiento
            </button>
          </div>

          {/* Resumen hoy */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Movimientos hoy",  val: hoyMov.length, cls: "text-slate-700",   bg: "bg-white" },
              { label: "Entradas hoy",     val: entradas,       cls: "text-emerald-600", bg: "bg-emerald-50" },
              { label: "Salidas hoy",      val: salidas,        cls: "text-orange-600",  bg: "bg-orange-50" },
              { label: "Total registros",  val: movimientos.length, cls: "text-blue-600", bg: "bg-blue-50" },
            ].map(s => (
              <div key={s.label} className={`${s.bg} rounded-2xl border border-slate-100 shadow-sm p-4`}>
                <p className={`text-2xl font-black ${s.cls}`}>{s.val}</p>
                <p className="text-xs font-bold text-slate-400 uppercase mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Filtros */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por artículo o usuario..."
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400" />
            </div>
            <select value={tipoFilter} onChange={e => { setTipoFilter(e.target.value); setPage(1); }}
              className="py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600 font-medium outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer">
              <option value="">Todos los tipos</option>
              {Object.entries(TIPO_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>

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
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {isLoading ? (
                    [...Array(6)].map((_, i) => (
                      <tr key={i}><td colSpan={6} className="px-6 py-5">
                        <div className="h-5 bg-slate-100 rounded-lg animate-pulse w-full" />
                      </td></tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={6} className="py-16 text-center text-slate-400 text-sm font-medium">
                      No hay movimientos registrados
                    </td></tr>
                  ) : filtered.map((m) => {
                    const cfg = TIPO_CONFIG[m.tipo_movimiento] ?? TIPO_CONFIG.ajuste;
                    const Icon = cfg.Icon;
                    return (
                      <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-slate-800">{m.inventario?.nombre ?? "—"}</p>
                          <p className="text-[11px] font-mono text-slate-400">{m.inventario?.clave}</p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-bold border ${cfg.cls}`}>
                            <Icon size={11} />
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm font-black text-slate-800">
                            {["salida","prestamo","baja"].includes(m.tipo_movimiento) ? "−" : "+"}{m.cantidad}
                          </span>
                        </td>
                        <td className="px-6 py-4 hidden md:table-cell">
                          {m.stock_antes != null && (
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                              <span>{m.stock_antes}</span>
                              <span className="text-slate-300">→</span>
                              <span className="text-slate-800">{m.stock_despues}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 hidden lg:table-cell text-sm text-slate-600">
                          {m.usuarios?.nombre_completo ?? "—"}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500 font-medium">
                          {formatFecha(m.fecha)}
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
                Mostrando <span className="text-slate-900 font-bold">{filtered.length}</span> movimientos
              </p>
              <div className="flex gap-2">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                  className="px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 transition-all">Anterior</button>
                <button disabled={movimientos.length < PER_PAGE} onClick={() => setPage(p => p + 1)}
                  className="px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-40 transition-all">Siguiente</button>
              </div>
            </div>
          </div>

        </div>
      </main>

      <ModalMovimiento
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={loadMovimientos}
      />
    </div>
  );
}