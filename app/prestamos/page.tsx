/**
 * @file app/prestamos/page.tsx
 * @description Gestión de préstamos: listado completo con artículos, autorizador,
 *              fechas, filtros, devolución y eliminación.
 */
"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/client";
import Sidebar from "@/components/sidebar";
import ModalPrestamo from "@/components/ModalPrestamo";
import ModalDevolucion from "@/components/ModalDevolucion";
import type { EstadoPrestamoEnum } from "@/lib/supabase";
import {
  RefreshCw, Plus, Search, Eye, CornerDownLeft,
  CheckCircle2, XCircle, AlertCircle, Trash2,
  Package, ShieldCheck, CalendarClock, CalendarCheck,
} from "lucide-react";

const ESTADO_LABELS: Record<EstadoPrestamoEnum, { label: string; cls: string }> = {
  activo:    { label: "Activo",    cls: "bg-blue-50 text-blue-700 border-blue-100" },
  devuelto:  { label: "Devuelto",  cls: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  atrasado:  { label: "Atrasado",  cls: "bg-red-50 text-red-700 border-red-100" },
  cancelado: { label: "Cancelado", cls: "bg-slate-100 text-slate-500 border-slate-200" },
};

const ESTADO_ICONS: Record<EstadoPrestamoEnum, React.ReactNode> = {
  activo:    <RefreshCw size={11} />,
  devuelto:  <CheckCircle2 size={11} />,
  atrasado:  <AlertCircle size={11} />,
  cancelado: <XCircle size={11} />,
};

export default function PrestamosPage() {
  const [prestamos, setPrestamos]           = useState<any[]>([]);
  const [isLoading, setIsLoading]           = useState(true);
  const [search, setSearch]                 = useState("");
  const [estFilter, setEstFilter]           = useState<string>("");
  const [page, setPage]                     = useState(1);
  const [modalNuevo, setModalNuevo]         = useState(false);
  const [selectedPrestamo, setSelectedPrestamo] = useState<any | null>(null);
  const [modalDevolucion, setModalDevolucion]   = useState(false);
  const [deletingId, setDeletingId]         = useState<number | null>(null);
  const PER_PAGE = 12;

  const loadPrestamos = useCallback(async () => {
    setIsLoading(true);
    const supabase = createClient();
    try {
      //  FIX 1: Query sin FK hints problemáticos — Supabase resuelve por nombre de columna
      // Para múltiples FK a la misma tabla usamos alias con la sintaxis correcta
      let query = supabase
        .from("prestamos")
        .select(`
          id,
          fecha_salida,
          fecha_devolucion,
          estado,
          observaciones,
          solicitante_externo,
          created_at,
          solicitante:usuario_id ( id, nombre_completo ),
          departamento:departamento_id ( nombre ),
          autorizador:autorizado_por ( nombre_completo ),
          detalle_prestamo (
            id,
            cantidad,
            cantidad_devuelta,
            estado,
            inventario:inventario_id ( id, nombre, clave )
          )
        `)
        .order("created_at", { ascending: false })
        .range((page - 1) * PER_PAGE, page * PER_PAGE - 1);

      if (estFilter) query = query.eq("estado", estFilter);

      const { data, error } = await query;
      if (error) throw error;
      setPrestamos(data ?? []);
    } catch (err) {
      console.error("Error cargando préstamos:", err);
    } finally {
      setIsLoading(false);
    }
  }, [estFilter, page]);

  useEffect(() => { loadPrestamos(); }, [loadPrestamos]);

  // Filtro local por búsqueda de texto
  const filtered = prestamos.filter((p) => {
    const term = search.toLowerCase();
    if (!term) return true;
    const solicitante = p.solicitante?.nombre_completo?.toLowerCase() ?? "";
    const externo     = p.solicitante_externo?.toLowerCase() ?? "";
    const depto       = p.departamento?.nombre?.toLowerCase() ?? "";
    //  FIX 2: también busca por nombre de artículo prestado
    const articulos   = (p.detalle_prestamo ?? [])
      .map((d: any) => d.inventario?.nombre?.toLowerCase() ?? "")
      .join(" ");
    return solicitante.includes(term) || externo.includes(term) ||
           depto.includes(term) || articulos.includes(term);
  });

  const formatFecha = (f?: string) => {
    if (!f) return "—";
    return new Date(f).toLocaleDateString("es-MX", {
      day: "2-digit", month: "short", year: "numeric",
    });
  };

  const handleDevolver = (p: any) => { setSelectedPrestamo(p); setModalDevolucion(true); };
  const handleVer      = (p: any) => { setSelectedPrestamo(p); setModalNuevo(true); };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar este préstamo? Esta acción no se puede deshacer.")) return;
    setDeletingId(id);
    const supabase = createClient();
    // detalle_prestamo tiene ON DELETE CASCADE, se borra solo
    const { error } = await supabase.from("prestamos").delete().eq("id", id);
    if (error) { alert("Error al eliminar: " + error.message); }
    else { loadPrestamos(); }
    setDeletingId(null);
  };

  // Stats del lote actual
  const activos   = prestamos.filter(p => p.estado === "activo").length;
  const atrasados = prestamos.filter(p => p.estado === "atrasado").length;
  const devueltos = prestamos.filter(p => p.estado === "devuelto").length;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 lg:ml-64 w-full">
        <div className="p-4 md:p-8 lg:p-10 pt-20 lg:pt-10 max-w-7xl mx-auto">

          {/* ── Header ── */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Préstamos</h1>
              <p className="text-slate-500 font-medium mt-1">Control de equipos y herramientas prestadas</p>
            </div>
            <button
              onClick={() => { setSelectedPrestamo(null); setModalNuevo(true); }}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5"
            >
              <Plus size={18} /> Nuevo Préstamo
            </button>
          </div>

          {/* ── Stats ── */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: "Activos",   val: activos,   color: "text-blue-600",    bg: "bg-blue-50",    border: "border-blue-100" },
              { label: "Atrasados", val: atrasados, color: "text-red-600",     bg: "bg-red-50",     border: "border-red-100" },
              { label: "Devueltos", val: devueltos, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
            ].map(s => (
              <div key={s.label} className={`${s.bg} rounded-2xl border ${s.border} shadow-sm p-4 flex flex-col items-center`}>
                <span className={`text-2xl font-black ${s.color}`}>{s.val}</span>
                <span className="text-xs font-bold text-slate-400 uppercase mt-1">{s.label}</span>
              </div>
            ))}
          </div>

          {/* ── Filtros ── */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por solicitante, departamento o artículo..."
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              />
            </div>
            <select
              value={estFilter}
              onChange={e => { setEstFilter(e.target.value); setPage(1); }}
              className="py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600 font-medium outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer"
            >
              <option value="">Todos los estados</option>
              {Object.entries(ESTADO_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>

          {/* ── Tabla ── */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-5 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                      Solicitante
                    </th>
                    {/* ✅ FIX 3: columna de artículos prestados con nombres reales */}
                    <th className="px-5 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                      Artículos Prestados
                    </th>
                    <th className="px-5 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest hidden lg:table-cell">
                      Autorizó
                    </th>
                    <th className="px-5 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest hidden md:table-cell">
                      <div className="flex items-center gap-1"><CalendarClock size={12} /> Salida</div>
                    </th>
                    <th className="px-5 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest hidden xl:table-cell">
                      <div className="flex items-center gap-1"><CalendarCheck size={12} /> Devolución</div>
                    </th>
                    <th className="px-5 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">
                      Estado
                    </th>
                    <th className="px-5 py-4 w-28"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {isLoading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i}>
                        <td colSpan={7} className="px-5 py-5">
                          <div className="h-5 bg-slate-100 rounded-lg animate-pulse w-full" />
                        </td>
                      </tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-slate-400 text-sm font-medium">
                        No hay préstamos registrados
                      </td>
                    </tr>
                  ) : filtered.map(p => (
                    <tr key={p.id} className="hover:bg-blue-50/30 transition-colors group">

                      {/* Solicitante */}
                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-800 text-sm">
                          {p.solicitante?.nombre_completo ?? p.solicitante_externo ?? "—"}
                        </p>
                        <p className="text-[11px] text-slate-400 font-medium">
                          {p.departamento?.nombre ?? "Sin depto."} · #{p.id}
                        </p>
                      </td>

                      {/* ✅ Artículos con nombre, clave y cantidad real */}
                      <td className="px-5 py-4 max-w-[220px]">
                        {(p.detalle_prestamo ?? []).length === 0 ? (
                          <span className="text-xs text-slate-400">Sin artículos</span>
                        ) : (
                          <div className="space-y-1">
                            {(p.detalle_prestamo as any[]).map((d: any) => (
                              <div key={d.id} className="flex items-center gap-2">
                                <Package size={11} className="text-blue-400 flex-shrink-0" />
                                <span className="text-xs font-bold text-slate-700 truncate">
                                  {d.inventario?.nombre ?? "—"}
                                </span>
                                <span className="text-[10px] text-slate-400 flex-shrink-0">
                                  ×{d.cantidad}
                                </span>
                                {/* progreso de devolución */}
                                {d.cantidad_devuelta > 0 && (
                                  <span className="text-[10px] text-emerald-600 font-bold flex-shrink-0">
                                    ({d.cantidad_devuelta} dev.)
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Autorizó */}
                      <td className="px-5 py-4 hidden lg:table-cell">
                        {p.autorizador?.nombre_completo ? (
                          <div className="flex items-center gap-1.5 text-sm text-slate-600">
                            <ShieldCheck size={13} className="text-blue-400" />
                            {p.autorizador.nombre_completo}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>

                      {/* Fecha salida */}
                      <td className="px-5 py-4 hidden md:table-cell text-sm text-slate-500">
                        {formatFecha(p.fecha_salida)}
                      </td>

                      {/* Fecha devolución */}
                      <td className="px-5 py-4 hidden xl:table-cell">
                        {p.fecha_devolucion ? (
                          <span className="text-sm text-emerald-600 font-medium">
                            {formatFecha(p.fecha_devolucion)}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Pendiente</span>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="px-5 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold border ${ESTADO_LABELS[p.estado as EstadoPrestamoEnum]?.cls}`}>
                          {ESTADO_ICONS[p.estado as EstadoPrestamoEnum]}
                          {ESTADO_LABELS[p.estado as EstadoPrestamoEnum]?.label}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {/* Ver detalle */}
                          <button
                            onClick={() => handleVer(p)}
                            className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                            title="Ver detalle"
                          >
                            <Eye size={15} />
                          </button>

                          {/* Registrar devolución — solo si activo */}
                          {p.estado === "activo" && (
                            <button
                              onClick={() => handleDevolver(p)}
                              className="p-2 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
                              title="Registrar devolución"
                            >
                              <CornerDownLeft size={15} />
                            </button>
                          )}

                          {/* ✅ FIX 4: Eliminar */}
                          <button
                            onClick={() => handleDelete(p.id)}
                            disabled={deletingId === p.id}
                            className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-40"
                            title="Eliminar préstamo"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Paginación ── */}
            <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">
                Mostrando <span className="text-slate-900 font-bold">{filtered.length}</span> préstamos
              </p>
              <div className="flex gap-2">
                {/* ✅ FIX 5: Anterior decrementaba mal — corregido */}
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 transition-all"
                >
                  Anterior
                </button>
                <button
                  disabled={prestamos.length < PER_PAGE}
                  onClick={() => setPage(p => p + 1)}
                  className="px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-40 transition-all"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Modal nuevo / ver detalle */}
      <ModalPrestamo
        isOpen={modalNuevo}
        onClose={() => { setModalNuevo(false); setSelectedPrestamo(null); }}
        prestamo={selectedPrestamo}
        onSaved={loadPrestamos}
      />

      {/* Modal devolución */}
      <ModalDevolucion
        isOpen={modalDevolucion}
        onClose={() => { setModalDevolucion(false); setSelectedPrestamo(null); }}
        prestamo={selectedPrestamo}
        onSaved={loadPrestamos}
      />
    </div>
  );
}