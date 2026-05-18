/**
 * @file app/movimientos/page.tsx
 * @description Registro de movimientos manuales: entradas, salidas, traslados y ajustes.
 * Rediseño responsivo avanzado (Cards para móvil, Tabla para Desktop).
 */
"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/client";
import Sidebar from "@/components/sidebar";
import ModalMovimiento from "@/components/ModalMovimiento";
import { 
  Plus, Search, ArrowDownCircle, ArrowUpCircle, 
  SlidersHorizontal, RefreshCw, X, Loader2, Filter 
} from "lucide-react";

const TIPO_CONFIG: Record<string, { label: string; cls: string; Icon: any }> = {
  entrada:  { label: "Entrada",   cls: "bg-emerald-50 text-emerald-700 border-emerald-100", Icon: ArrowDownCircle },
  salida:   { label: "Salida",    cls: "bg-orange-50 text-orange-700 border-orange-100",   Icon: ArrowUpCircle },
  ajuste:   { label: "Ajuste",    cls: "bg-purple-50 text-purple-700 border-purple-100",   Icon: SlidersHorizontal },
  traslado: { label: "Traslado",  cls: "bg-blue-50 text-blue-700 border-blue-100",        Icon: RefreshCw },
  baja:     { label: "Baja",      cls: "bg-red-50 text-red-700 border-red-100",           Icon: ArrowUpCircle },
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
        usuarios(nombre_completo),
        destino:departamento_destino(nombre)
      `)
      .is("prestamo_id", null)
      .order("fecha", { ascending: false })
      .range((page - 1) * PER_PAGE, page * PER_PAGE - 1);

    if (tipoFilter) q = q.eq("tipo_movimiento", tipoFilter);

    const { data, error } = await q;
    if (error) throw error;
    setMovimientos(data ?? []);
  } catch (err) {
    // Un solo bloque catch que maneja cualquier tipo de excepción
    console.error("Error al cargar movimientos:", err);
  } finally {
    setIsLoading(false);
  }
}, [tipoFilter, page]);
  useEffect(() => { loadMovimientos(); }, [loadMovimientos]);

  const filtered = movimientos.filter(m => {
    const term = search.toLowerCase().trim();
    return !term ||
      m.inventario?.nombre?.toLowerCase().includes(term) ||
      m.inventario?.clave?.toLowerCase().includes(term) ||
      m.usuarios?.nombre_completo?.toLowerCase().includes(term);
  });

  const formatFecha = (f: string) =>
    new Date(f).toLocaleString("es-MX", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

  const hoy = new Date().toDateString();
  const hoyMov = movimientos.filter(m => new Date(m.fecha).toDateString() === hoy);
  const entradas = hoyMov.filter(m => m.tipo_movimiento === "entrada").reduce((a, m) => a + Number(m.cantidad), 0);
  const salidas  = hoyMov.filter(m => ["salida", "baja", "traslado"].includes(m.tipo_movimiento)).reduce((a, m) => a + Number(m.cantidad), 0);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 lg:ml-64 w-full">
        <div className="p-4 sm:p-6 md:p-8 lg:p-10 pt-20 lg:pt-10 max-w-7xl mx-auto">

          {/* Header Responsivo */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Movimientos</h1>
              <p className="text-slate-500 text-xs sm:text-sm font-medium mt-0.5">Traslados, entradas, salidas y ajustes técnicos</p>
            </div>
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 sm:py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-blue-100 transition-all active:scale-95"
            >
              <Plus size={18} /> Registrar Movimiento
            </button>
          </div>

          {/* Mosaico Estadístico Adaptable */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
            {[
              { label: "Operaciones hoy",   val: hoyMov.length, cls: "text-slate-700",   bg: "bg-white" },
              { label: "Entradas hoy",      val: entradas,      cls: "text-emerald-600", bg: "bg-emerald-50" },
              { label: "Salidas/Traslados", val: salidas,       cls: "text-orange-600",  bg: "bg-orange-50" },
              { label: "Total registros",   val: movimientos.length, cls: "text-blue-600", bg: "bg-blue-50" },
            ].map((s, index) => (
              <div key={index} className={`${s.bg} rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col justify-between`}>
                <p className={`text-xl sm:text-2xl font-black ${s.cls}`}>{s.val}</p>
                <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Filtros Avanzados y Buscador Inteligente */}
          <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row gap-3">
            {/* Buscador Con Botón de Borrado */}
            <div className="relative flex-1 group">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="text"
                value={search} 
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por artículo, clave o usuario..."
                className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition-all" 
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
                  title="Limpiar búsqueda"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Selector de Tipo Estilizado */}
            <div className="relative min-w-[180px]">
              <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <select 
                value={tipoFilter} 
                onChange={e => { setTipoFilter(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600 font-semibold outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all appearance-none cursor-pointer"
              >
                <option value="">Todos los tipos</option>
                {Object.entries(TIPO_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-400 w-0 h-0" />
            </div>
          </div>

          {/* Contenedor Adaptable de Datos */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            
            {/* VISTA MÓVIL (Cards - Oculta en md:) */}
            <div className="block md:hidden divide-y divide-slate-100">
              {isLoading ? (
                [...Array(4)].map((_, i) => (
                  <div key={i} className="p-4 space-y-2 animate-pulse">
                    <div className="h-4 bg-slate-100 rounded w-2/3" />
                    <div className="h-3 bg-slate-100 rounded w-1/3" />
                    <div className="h-6 bg-slate-100 rounded-xl w-24" />
                  </div>
                ))
              ) : filtered.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm font-medium">
                  No hay movimientos operativos registrados
                </div>
              ) : (
                filtered.map((m) => {
                  const cfg = TIPO_CONFIG[m.tipo_movimiento] ?? TIPO_CONFIG.ajuste;
                  const Icon = cfg.Icon;
                  return (
                    <div key={m.id} className="p-4 space-y-3 hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-bold text-slate-800">{m.inventario?.nombre ?? "—"}</p>
                          <p className="text-[11px] font-mono text-slate-400">{m.inventario?.clave}</p>
                        </div>
                        <span className="text-xs font-mono text-slate-400 whitespace-nowrap">{formatFecha(m.fecha)}</span>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${cfg.cls}`}>
                            <Icon size={10} />
                            {cfg.label}
                          </span>
                          {m.destino?.nombre && (
                            <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg">
                              📍 {m.destino.nombre}
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-slate-800">
                            {["salida","baja"].includes(m.tipo_movimiento) ? "−" : m.tipo_movimiento === 'entrada' ? "+" : ""}{m.cantidad}
                          </p>
                          {m.stock_antes != null && (
                            <p className="text-[10px] font-bold text-slate-400">
                              {m.stock_antes} → {m.stock_despues}
                            </p>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 font-medium">Por: {m.usuarios?.nombre_completo ?? "—"}</p>
                    </div>
                  );
                })
              )}
            </div>

            {/* VISTA DESKTOP (Tabla - Oculta en pantallas chicas) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left table-auto">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100">
                    <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Artículo</th>
                    <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Tipo</th>
                    <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Cantidad</th>
                    <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Destino</th>
                    <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Stock</th>
                    <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest lg:table-cell">Usuario</th>
                    <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    [...Array(6)].map((_, i) => (
                      <tr key={i}>
                        <td colSpan={7} className="px-6 py-5">
                          <div className="h-5 bg-slate-100 rounded-lg animate-pulse w-full" />
                        </td>
                      </tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-slate-400 text-sm font-medium">
                        No hay movimientos operativos registrados
                      </td>
                    </tr>
                  ) : (
                    filtered.map((m) => {
                      const cfg = TIPO_CONFIG[m.tipo_movimiento] ?? TIPO_CONFIG.ajuste;
                      const Icon = cfg.Icon;
                      return (
                        <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-6 py-4">
                            <p className="text-sm font-bold text-slate-800 line-clamp-1">{m.inventario?.nombre ?? "—"}</p>
                            <p className="text-[11px] font-mono text-slate-400">{m.inventario?.clave}</p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-bold border ${cfg.cls}`}>
                              <Icon size={11} />
                              {cfg.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center whitespace-nowrap">
                            <span className="text-sm font-black text-slate-800">
                              {["salida","baja"].includes(m.tipo_movimiento) ? "−" : m.tipo_movimiento === 'entrada' ? "+" : ""}{m.cantidad}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs font-semibold text-slate-600 truncate block max-w-[150px]">
                              {m.destino?.nombre ?? <span className="text-slate-300">—</span>}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {m.stock_antes != null && (
                              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                <span>{m.stock_antes}</span>
                                <span className="text-slate-300">→</span>
                                <span className="text-slate-800">{m.stock_despues}</span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600 truncate max-w-[180px]">
                            {m.usuarios?.nombre_completo ?? "—"}
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-500 font-medium whitespace-nowrap">
                            {formatFecha(m.fecha)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            <div className="px-4 sm:px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs sm:text-sm font-medium text-slate-500 text-center sm:text-left">
                Mostrando <span className="text-slate-900 font-bold">{filtered.length}</span> registros operativos
              </p>
              <div className="flex gap-2 w-full sm:w-auto justify-center">
                <button 
                  disabled={page === 1} 
                  onClick={() => setPage(p => p - 1)}
                  className="flex-1 sm:flex-none px-4 py-2 text-xs sm:text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 transition-all"
                >
                  Anterior
                </button>
                <button 
                  disabled={movimientos.length < PER_PAGE} 
                  onClick={() => setPage(p => p + 1)}
                  className="flex-1 sm:flex-none px-4 py-2 text-xs sm:text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-40 transition-all"
                >
                  Siguiente
                </button>
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