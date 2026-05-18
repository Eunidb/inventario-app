/**
 * @file app/prestamos/page.tsx
 * @description Gestión de préstamos: listado completo con artículos, autorizador,
 *              fechas, filtros modernos y dinámicos, devolución y eliminación.
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
  Package, ShieldCheck, CalendarClock, CalendarCheck, X, SlidersHorizontal
} from "lucide-react";

const ESTADO_LABELS: Record<EstadoPrestamoEnum, { label: string; cls: string; activeCls: string }> = {
  activo:    { label: "Activos",    cls: "bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100/70", activeCls: "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100" },
  devuelto:  { label: "Devueltos",  cls: "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100/70", activeCls: "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-100" },
  atrasado:  { label: "Atrasados",  cls: "bg-red-50 text-red-700 border-red-100 hover:bg-red-100/70", activeCls: "bg-red-600 text-white border-red-600 shadow-md shadow-red-100" },
  cancelado: { label: "Cancelados", cls: "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200/70", activeCls: "bg-slate-700 text-white border-slate-700 shadow-md shadow-slate-200" },
};

const ESTADO_ICONS: Record<EstadoPrestamoEnum, React.ReactNode> = {
  activo:    <RefreshCw size={14} className="animate-spin-slow" />,
  devuelto:  <CheckCircle2 size={14} />,
  atrasado:  <AlertCircle size={14} />,
  cancelado: <XCircle size={14} />,
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

  // Contadores locales calculados en base a la consulta general para los badges de los filtros
  const [counts, setCounts] = useState({ todos: 0, activo: 0, atrasado: 0, devuelto: 0, cancelado: 0 });

  const loadPrestamos = useCallback(async () => {
    setIsLoading(true);
    const supabase = createClient();
    try {
      // 1. Cargamos el total de estados para mantener vivos los contadores dinámicos
      const { data: countData } = await supabase.from("prestamos").select("estado");
      if (countData) {
        const baseCounts = { todos: countData.length, activo: 0, atrasado: 0, devuelto: 0, cancelado: 0 };
        countData.forEach((p: any) => {
          if (p.estado in baseCounts) baseCounts[p.estado as keyof typeof baseCounts]++;
        });
        setCounts(baseCounts);
      }

      // 2. Consulta paginada y filtrada principal
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

  const filtered = prestamos.filter((p) => {
    const term = search.toLowerCase();
    if (!term) return true;
    const solicitante = p.solicitante?.nombre_completo?.toLowerCase() ?? "";
    const externo     = p.solicitante_externo?.toLowerCase() ?? "";
    const depto       = p.departamento?.nombre?.toLowerCase() ?? "";
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
    const { error } = await supabase.from("prestamos").delete().eq("id", id);
    if (error) { alert("Error al eliminar: " + error.message); }
    else { loadPrestamos(); }
    setDeletingId(null);
  };

  return (
    <div className="flex min-h-screen bg-slate-50/60 antialiased">
      <Sidebar />
      <main className="flex-1 lg:ml-64 w-full">
        <div className="p-4 md:p-8 lg:p-10 pt-20 lg:pt-10 max-w-7xl mx-auto space-y-6">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Préstamos</h1>
              <p className="text-slate-500 font-medium mt-1">Control y trazabilidad de equipos y herramientas</p>
            </div>
            <button
              onClick={() => { setSelectedPrestamo(null); setModalNuevo(true); }}
              className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-semibold shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              <Plus size={18} /> Nuevo Préstamo
            </button>
          </div>

          {/* Bloque Unificado de Búsqueda y Filtros */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 space-y-4">
            
            {/* Fila Superior: Input de Búsqueda */}
            <div className="relative w-full">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por solicitante, departamento, palabra clave o artículo..."
                className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 focus:bg-white placeholder:text-slate-400 transition-all font-medium text-slate-700"
              />
              {search && (
                <button 
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200/60 transition-colors"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Fila Inferior: Filtros de Estado en formato Tabs Dinámicos */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <div className="flex items-center text-slate-400 mr-1 flex-shrink-0">
                <SlidersHorizontal size={14} className="mr-1.5" />
                <span className="text-xs font-bold uppercase tracking-wider">Filtros:</span>
              </div>

              {/* Opción: Todos */}
              <button
                onClick={() => { setEstFilter(""); setPage(1); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all duration-200 flex-shrink-0 ${
                  estFilter === "" 
                    ? "bg-slate-900 text-white border-slate-900 shadow-md shadow-slate-200" 
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <span>Todos</span>
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${estFilter === "" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"}`}>
                  {counts.todos}
                </span>
              </button>

              {/* Mapeo de Estados Múltiples */}
              {Object.entries(ESTADO_LABELS).map(([key, value]) => {
                const isActive = estFilter === key;
                return (
                  <button
                    key={key}
                    onClick={() => { setEstFilter(key); setPage(1); }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all duration-200 flex-shrink-0 ${
                      isActive ? value.activeCls : value.cls
                    }`}
                  >
                    <span className="flex-shrink-0">{ESTADO_ICONS[key as EstadoPrestamoEnum]}</span>
                    <span>{value.label}</span>
                    <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                      isActive ? "bg-white/20 text-white" : "bg-white border shadow-sm font-black"
                    }`}>
                      {counts[key as keyof typeof counts] ?? 0}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tabla de Resultados */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200">
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Solicitante</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Artículos Prestados</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest hidden lg:table-cell">Autorizó</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest hidden md:table-cell">
                      <div className="flex items-center gap-1"><CalendarClock size={12} /> Salida</div>
                    </th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest hidden xl:table-cell">
                      <div className="flex items-center gap-1"><CalendarCheck size={12} /> Devolución</div>
                    </th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Estado</th>
                    <th className="px-6 py-4 w-28"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i}>
                        <td colSpan={7} className="px-6 py-5">
                          <div className="h-5 bg-slate-100 rounded-lg animate-pulse w-full" />
                        </td>
                      </tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-20 text-center text-slate-400 text-sm font-medium">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <SlidersHorizontal size={24} className="text-slate-300 stroke-[1.5]" />
                          <p>No se encontraron préstamos con los filtros aplicados</p>
                        </div>
                      </td>
                    </tr>
                  ) : filtered.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800 text-sm">
                          {p.solicitante?.nombre_completo ?? p.solicitante_externo ?? "—"}
                        </p>
                        <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                          {p.departamento?.nombre ?? "Sin depto."} · <span className="text-slate-500 font-mono">#{p.id}</span>
                        </p>
                      </td>

                      <td className="px-6 py-4 max-w-[240px]">
                        {(p.detalle_prestamo ?? []).length === 0 ? (
                          <span className="text-xs text-slate-400">Sin artículos</span>
                        ) : (
                          <div className="space-y-1.5">
                            {(p.detalle_prestamo as any[]).map((d: any) => (
                              <div key={d.id} className="flex items-center gap-2">
                                <Package size={12} className="text-blue-500 flex-shrink-0" />
                                <span className="text-xs font-semibold text-slate-700 truncate">
                                  {d.inventario?.nombre ?? "—"}
                                </span>
                                <span className="text-[10px] bg-slate-100 text-slate-600 px-1 py-0.5 rounded font-bold flex-shrink-0">
                                  ×{d.cantidad}
                                </span>
                                {d.cantidad_devuelta > 0 && (
                                  <span className="text-[10px] text-emerald-600 font-bold flex-shrink-0 bg-emerald-50 px-1 py-0.5 rounded">
                                    {d.cantidad_devuelta} dev.
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4 hidden lg:table-cell">
                        {p.autorizador?.nombre_completo ? (
                          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                            <ShieldCheck size={14} className="text-emerald-500" />
                            {p.autorizador.nombre_completo}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>

                      <td className="px-6 py-4 hidden md:table-cell text-xs font-medium text-slate-500">
                        {formatFecha(p.fecha_salida)}
                      </td>

                      <td className="px-6 py-4 hidden xl:table-cell">
                        {p.fecha_devolucion ? (
                          <span className="text-xs text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-lg">
                            {formatFecha(p.fecha_devolucion)}
                          </span>
                        ) : (
                          <span className="text-xs text-amber-600 bg-amber-50 border border-amber-100 px-2 py-1 rounded-lg font-medium">
                            Pendiente
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border ${ESTADO_LABELS[p.estado as EstadoPrestamoEnum]?.cls.split(' hover:')[0]}`}>
                          {ESTADO_ICONS[p.estado as EstadoPrestamoEnum]}
                          {ESTADO_LABELS[p.estado as EstadoPrestamoEnum]?.label}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                          <button
                            onClick={() => handleVer(p)}
                            className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                            title="Ver detalle"
                          >
                            <Eye size={15} />
                          </button>

                          {p.estado === "activo" && (
                            <button
                              onClick={() => handleDevolver(p)}
                              className="p-2 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
                              title="Registrar devolución"
                            >
                              <CornerDownLeft size={15} />
                            </button>
                          )}

                          <button
                            onClick={() => handleDelete(p.id)}
                            disabled={deletingId === p.id}
                            className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-40"
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

            {/* Paginación */}
            <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-200/60 flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-500">
                Mostrando <span className="text-slate-900 font-bold">{filtered.length}</span> préstamos en esta página
              </p>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 transition-all shadow-sm"
                >
                  Anterior
                </button>
                <button
                  disabled={prestamos.length < PER_PAGE}
                  onClick={() => setPage(p => p + 1)}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-40 transition-all shadow-sm shadow-blue-100"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </div>

        </div>
      </main>

      <ModalPrestamo
        isOpen={modalNuevo}
        onClose={() => { setModalNuevo(false); setSelectedPrestamo(null); }}
        prestamo={selectedPrestamo}
        onSaved={loadPrestamos}
      />

      <ModalDevolucion
        isOpen={modalDevolucion}
        onClose={() => { setModalDevolucion(false); setSelectedPrestamo(null); }}
        prestamo={selectedPrestamo}
        onSaved={loadPrestamos}
      />
    </div>
  );
}