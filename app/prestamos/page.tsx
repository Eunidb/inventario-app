/**
 * @file app/prestamos/page.tsx
 * @description Gestión de préstamos: listado completo en tonos azul con iconos vectoriales,
 * filtros dinámicos, flujos interactivos de devolución y eliminación segura.
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
  Package, ShieldCheck, X, SlidersHorizontal,
  Info, ChevronLeft, ChevronRight
} from "lucide-react";

const ESTADO_LABELS: Record<EstadoPrestamoEnum, { label: string; cls: string; activeCls: string }> = {
  activo:    { label: "Activos",    cls: "bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100/70", activeCls: "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100" },
  devuelto:  { label: "Devueltos",  cls: "bg-sky-50 text-sky-700 border-sky-100 hover:bg-sky-100/70", activeCls: "bg-sky-600 text-white border-sky-600 shadow-md shadow-sky-100" },
  atrasado:  { label: "Atrasados",  cls: "bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100/70", activeCls: "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100" },
  cancelado: { label: "Cancelados", cls: "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200/70", activeCls: "bg-slate-700 text-white border-slate-700 shadow-md shadow-slate-200" },
};

const ESTADO_ICONS: Record<EstadoPrestamoEnum, React.ReactNode> = {
  activo:    <RefreshCw size={14} />,
  devuelto:  <CheckCircle2 size={14} />,
  atrasado:  <AlertCircle size={14} />,
  cancelado: <XCircle size={14} />,
};

export default function PrestamosPage() {
  const [prestamos, setPrestamos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [estFilter, setEstFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [modalNuevo, setModalNuevo] = useState(false);
  const [selectedPrestamo, setSelectedPrestamo] = useState<any | null>(null);
  const [modalDevolucion, setModalDevolucion] = useState(false);
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [prestamoToDelete, setPrestamoToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const PER_PAGE = 12;
  const [counts, setCounts] = useState({ todos: 0, activo: 0, atrasado: 0, devuelto: 0, cancelado: 0 });

  const loadPrestamos = useCallback(async () => {
    setIsLoading(true);
    const supabase = createClient();
    try {
      const { data: countData } = await supabase.from("prestamos").select("estado");
      if (countData) {
        const baseCounts = { todos: countData.length, activo: 0, atrasado: 0, devuelto: 0, cancelado: 0 };
        countData.forEach((p: any) => {
          if (p.estado in baseCounts) baseCounts[p.estado as keyof typeof baseCounts]++;
        });
        setCounts(baseCounts);
      }

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
    return solicitante.includes(term) || externo.includes(term) || depto.includes(term) || articulos.includes(term);
  });

  const formatFecha = (f?: string) => {
    if (!f) return "—";
    return new Date(f).toLocaleDateString("es-MX", {
      day: "2-digit", month: "short", year: "numeric",
    });
  };

  const handleDevolver = (p: any) => { setSelectedPrestamo(p); setModalDevolucion(true); };
  const handleVer      = (p: any) => { setSelectedPrestamo(p); setModalNuevo(true); };

  const triggerDeleteModal = (p: any) => {
    setPrestamoToDelete(p);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!prestamoToDelete) return;
    setIsDeleting(true);
    const supabase = createClient();
    try {
      const { error } = await supabase.from("prestamos").delete().eq("id", prestamoToDelete.id);
      if (error) throw error;
      loadPrestamos();
      setShowDeleteModal(false);
      setPrestamoToDelete(null);
    } catch (err: any) {
      alert("Error al intentar eliminar: " + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 antialiased">
      <Sidebar />
      <main className="flex-1 lg:ml-64 w-full">
        <div className="p-4 md:p-8 lg:p-10 pt-20 lg:pt-10 max-w-7xl mx-auto space-y-6">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Préstamos</h1>
              <p className="text-slate-500 font-medium mt-1">Control y trazabilidad de equipos y herramientas</p>
            </div>
            <button
              onClick={() => { setSelectedPrestamo(null); setModalNuevo(true); }}
              className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-bold text-sm shadow-lg shadow-blue-100 transition-all"
            >
              <Plus size={16} /> Nuevo Préstamo
            </button>
          </div>

          {/* Filtros */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
            <div className="relative w-full">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por solicitante, departamento o artículo..."
                className="w-full pl-11 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 placeholder:text-slate-400 transition-all font-medium text-slate-700"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1">
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <div className="flex items-center text-slate-400 mr-1 flex-shrink-0 text-xs font-bold uppercase tracking-wider">
                <SlidersHorizontal size={13} className="mr-1.5" />
                <span>Filtros:</span>
              </div>

              <button
                onClick={() => { setEstFilter(""); setPage(1); }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex-shrink-0 ${
                  estFilter === "" ? "bg-blue-900 text-white border-blue-900 shadow-md" : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <span>Todos</span>
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${estFilter === "" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"}`}>
                  {counts.todos}
                </span>
              </button>

              {Object.entries(ESTADO_LABELS).map(([key, value]) => {
                const isActive = estFilter === key;
                return (
                  <button
                    key={key}
                    onClick={() => { setEstFilter(key); setPage(1); }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex-shrink-0 ${isActive ? value.activeCls : value.cls}`}
                  >
                    <span className="flex-shrink-0 text-blue-500">{ESTADO_ICONS[key as EstadoPrestamoEnum]}</span>
                    <span>{value.label}</span>
                    <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${isActive ? "bg-white/20 text-white" : "bg-white border font-bold text-slate-700"}`}>
                      {counts[key as keyof typeof counts] ?? 0}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tabla de Datos */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Solicitante</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Artículos Prestados</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest hidden lg:table-cell">Autorizó</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest hidden md:table-cell">Salida</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest hidden xl:table-cell">Devolución</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Estado</th>
                    <th className="px-6 py-4 w-28 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    [...Array(4)].map((_, i) => (
                      <tr key={i}><td colSpan={7} className="px-6 py-5">
                        <div className="h-5 bg-slate-100 rounded-lg animate-pulse w-full" />
                      </td></tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={7} className="py-16 text-center text-slate-400 text-sm font-medium">
                      No se encontraron préstamos con los criterios seleccionados.
                    </td></tr>
                  ) : filtered.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors text-sm">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800">{p.solicitante?.nombre_completo ?? p.solicitante_externo ?? "—"}</p>
                        <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                          {p.departamento?.nombre ?? "Sin depto."} · <span className="text-blue-600 font-mono font-bold">#{p.id}</span>
                        </p>
                      </td>
                      <td className="px-6 py-4 max-w-[240px]">
                        <div className="space-y-1">
                          {(p.detalle_prestamo ?? []).map((d: any) => (
                            <div key={d.id} className="flex items-center gap-2">
                              <Package size={12} className="text-blue-500 shrink-0" />
                              <span className="text-xs font-semibold text-slate-700 truncate">{d.inventario?.nombre ?? "—"}</span>
                              <span className="text-[10px] bg-blue-50 text-blue-700 px-1 py-0.2 rounded font-bold">×{d.cantidad}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell text-xs font-semibold text-slate-600">
                        {p.autorizador?.nombre_completo ? (
                          <span className="flex items-center gap-1"><ShieldCheck size={13} className="text-blue-500" /> {p.autorizador.nombre_completo}</span>
                        ) : "—"}
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell text-xs font-medium text-slate-500">
                        {formatFecha(p.fecha_salida)}
                      </td>
                      <td className="px-6 py-4 hidden xl:table-cell">
                        {p.fecha_devolucion ? (
                          <span className="text-xs text-sky-700 font-bold bg-sky-50 px-2 py-0.5 rounded-lg border border-sky-100">{formatFecha(p.fecha_devolucion)}</span>
                        ) : (
                          <span className="text-xs text-blue-800 bg-blue-50 px-2 py-0.5 rounded-lg font-bold border border-blue-100">Pendiente</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-xl text-[11px] font-bold border ${ESTADO_LABELS[p.estado as EstadoPrestamoEnum]?.cls}`}>
                          {ESTADO_ICONS[p.estado as EstadoPrestamoEnum]}
                          {ESTADO_LABELS[p.estado as EstadoPrestamoEnum]?.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleVer(p)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Ver detalle">
                            <Eye size={15} />
                          </button>
                          {p.estado === "activo" && (
                            <button onClick={() => handleDevolver(p)} className="p-1.5 text-sky-600 hover:bg-sky-50 rounded-lg transition-colors" title="Registrar devolución">
                              <CornerDownLeft size={15} />
                            </button>
                          )}
                          <button onClick={() => triggerDeleteModal(p)} className="p-1.5 text-blue-900 hover:bg-blue-100 rounded-lg transition-colors" title="Eliminar registro">
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
                Mostrando <span className="text-slate-900 font-bold">{filtered.length}</span> registros
              </p>
              <div className="flex gap-2">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 text-xs font-bold text-blue-700 bg-white border border-slate-200 rounded-xl hover:bg-blue-50 disabled:opacity-40 transition-all flex items-center gap-1">
                  <ChevronLeft size={14} /> Anterior
                </button>
                <button disabled={prestamos.length < PER_PAGE} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-40 transition-all flex items-center gap-1">
                  Siguiente <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <ModalPrestamo isOpen={modalNuevo} onClose={() => { setModalNuevo(false); setSelectedPrestamo(null); }} prestamo={selectedPrestamo} onSaved={loadPrestamos} />
      <ModalDevolucion isOpen={modalDevolucion} onClose={() => { setModalDevolucion(false); setSelectedPrestamo(null); }} prestamo={selectedPrestamo} onSaved={loadPrestamos} />

      {/* Modal de Borrado */}
      {showDeleteModal && prestamoToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-blue-950/40 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-blue-100 relative z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-blue-50 flex items-center justify-between bg-blue-50/70">
              <h2 className="text-base font-black text-blue-900 flex items-center gap-2">
                <AlertCircle size={18} className="text-blue-700" /> Confirmar Eliminación
              </h2>
              <button onClick={() => setShowDeleteModal(false)} className="p-1.5 text-blue-400 hover:text-blue-700 rounded-xl">
                <X size={16} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex gap-3 text-blue-950">
                <Info className="text-blue-700 shrink-0 mt-0.5" size={18} />
                <p className="text-xs font-medium leading-relaxed text-blue-800">
                  ¿Estás seguro de que deseas eliminar el registro de préstamo <span className="font-bold">#{prestamoToDelete.id}</span>? Esta acción purga el historial logístico de forma permanente.
                </p>
              </div>
              <div className="flex justify-end gap-2 text-xs font-bold pt-2">
                <button onClick={() => setShowDeleteModal(false)} disabled={isDeleting} className="px-4 py-2.5 text-blue-700 border border-blue-200 hover:bg-blue-50 rounded-xl transition-all">
                  Cancelar
                </button>
                <button onClick={confirmDelete} disabled={isDeleting} className="px-5 py-2.5 text-white bg-blue-900 hover:bg-blue-950 rounded-xl transition-all flex items-center gap-1.5 shadow-md">
                  <Trash2 size={13} /> {isDeleting ? "Eliminando..." : "Confirmar y Eliminar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}