/**
 * @file app/prestamos/page.tsx
 * @description Gestión de préstamos: listado responsivo optimizado en tonos corporativos (#014ba0, 
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

// Configuración visual formal por estado alineada a la paleta corporativa
const ESTADO_LABELS: Record<EstadoPrestamoEnum, { label: string; cls: string; activeCls: string }> = {
  activo:    { label: "Activos",    cls: "bg-blue-50 text-[#014ba0] border-blue-100 hover:bg-blue-100/50", activeCls: "bg-[#014ba0] text-white border-[#014ba0] shadow-md shadow-blue-950/10" },
  devuelto:  { label: "Devueltos",  cls: "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100/50", activeCls: "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-950/10" },
  atrasado:  { label: "Atrasados",  cls: "bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-100/50", activeCls: "bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-950/10" },
  cancelado: { label: "Cancelados", cls: "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200/70", activeCls: "bg-slate-700 text-white border-slate-700 shadow-md shadow-slate-950/10" },
};

const ESTADO_ICONS: Record<EstadoPrestamoEnum, React.ReactNode> = {
  activo:    <RefreshCw size={13} className="animate-spin-slow" />,
  devuelto:  <CheckCircle2 size={13} />,
  atrasado:  <AlertCircle size={13} />,
  cancelado: <XCircle size={13} />,
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
  
  const PER_PAGE = 10; // Número óptimo de registros por pantalla
  const [counts, setCounts] = useState({ todos: 0, activo: 0, atrasado: 0, devuelto: 0, cancelado: 0 });

  // Carga total inicial en memoria para habilitar búsquedas instantáneas y globales multidimensionales
  const loadPrestamos = useCallback(async () => {
    setIsLoading(true);
    const supabase = createClient();
    try {
      const { data, error } = await supabase
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
        .order("created_at", { ascending: false });

      if (error) throw error;
      const dataRows = data ?? [];
      setPrestamos(dataRows);

      // Recálculo dinámico optimizado de contadores en un solo recorrido de datos
      const baseCounts = { todos: dataRows.length, activo: 0, atrasado: 0, devuelto: 0, cancelado: 0 };
      dataRows.forEach((p: any) => {
        if (p.estado in baseCounts) baseCounts[p.estado as keyof typeof baseCounts]++;
      });
      setCounts(baseCounts);
    } catch (err) {
      console.error("Error cargando préstamos:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadPrestamos(); }, [loadPrestamos]);

  // Filtrado reactivo integral en memoria (Estado + Texto Multirrelacional)
  const filtered = prestamos.filter((p) => {
    if (estFilter && p.estado !== estFilter) return false;

    const term = search.toLowerCase().trim();
    if (!term) return true;

    const solicitante = p.solicitante?.nombre_completo?.toLowerCase() ?? "";
    const externo     = p.solicitante_externo?.toLowerCase() ?? "";
    const depto       = p.departamento?.nombre?.toLowerCase() ?? "";
    const articulos   = (p.detalle_prestamo ?? [])
      .map((d: any) => d.inventario?.nombre?.toLowerCase() ?? "")
      .join(" ");

    return solicitante.includes(term) || externo.includes(term) || depto.includes(term) || articulos.includes(term);
  });

  // Control estricto de límites de paginación reactiva
  const totalPages = Math.ceil(filtered.length / PER_PAGE) || 1;
  const activePage = page > totalPages ? 1 : page;

  // Ajustar la página actual si el filtro reduce el volumen total por debajo del índice actual
  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [search, estFilter, totalPages, page]);

  const paginatedPrestamos = filtered.slice((activePage - 1) * PER_PAGE, activePage * PER_PAGE);

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
      await loadPrestamos();
      setShowDeleteModal(false);
      setPrestamoToDelete(null);
    } catch (err: any) {
      alert("Error al intentar eliminar: " + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50/60 antialiased">
      <Sidebar />
      <main className="flex-1 lg:ml-64 w-full transition-all duration-300 ease-in-out">
        <div className="p-4 md:p-8 lg:p-10 pt-20 lg:pt-10 max-w-7xl mx-auto space-y-6">

          {/* Header principal */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Préstamos</h1>
              <p className="text-slate-500 font-medium mt-1 text-sm">Control y trazabilidad corporativa de equipos y herramientas</p>
            </div>
            <button
              onClick={() => { setSelectedPrestamo(null); setModalNuevo(true); }}
              className="inline-flex items-center justify-center gap-2 bg-[#014ba0] hover:bg-[#004091] text-white px-5 py-3 rounded-xl font-bold text-sm shadow-lg shadow-blue-900/10 hover:shadow-xl hover:shadow-blue-900/20 transform hover:-translate-y-0.5 transition-all duration-300 active:translate-y-0"
            >
              <Plus size={16} /> Nuevo Préstamo
            </button>
          </div>

          {/* Barra de Filtros e Inteligencia de Datos */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 space-y-4">
            <div className="relative w-full">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por solicitante, departamento o artículo..."
                className="w-full pl-11 pr-10 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-blue-50 focus:border-[#014ba0] placeholder:text-slate-400 transition-all font-medium text-slate-700"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors">
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Selector de Filtros de Estado en pestañas fluidas */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <div className="flex items-center text-slate-400 mr-1 flex-shrink-0 text-xs font-bold uppercase tracking-wider">
                <SlidersHorizontal size={13} className="mr-1.5" />
                <span>Filtros:</span>
              </div>

              <button
                onClick={() => setEstFilter("")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all duration-300 flex-shrink-0 ${
                  estFilter === "" 
                    ? "bg-[#004091] text-white border-[#004091] shadow-md shadow-blue-950/10" 
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <span>Todos</span>
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${estFilter === "" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"}`}>
                  {counts.todos}
                </span>
              </button>

              {Object.entries(ESTADO_LABELS).map(([key, value]) => {
                const isActive = estFilter === key;
                return (
                  <button
                    key={key}
                    onClick={() => setEstFilter(key)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all duration-300 flex-shrink-0 ${isActive ? value.activeCls : value.cls}`}
                  >
                    <span className="flex-shrink-0">{ESTADO_ICONS[key as EstadoPrestamoEnum]}</span>
                    <span>{value.label}</span>
                    <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${isActive ? "bg-white/20 text-white" : "bg-white border text-slate-700"}`}>
                      {counts[key as keyof typeof counts] ?? 0}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Contenedor Responsivo de Resultados */}
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-white border border-slate-200 rounded-2xl animate-pulse w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl py-16 text-center text-slate-400 text-sm font-medium shadow-sm">
              <Package size={36} className="mx-auto text-slate-300 mb-3" />
              No se encontraron registros de préstamos con los criterios seleccionados.
            </div>
          ) : (
            <>
              {/* VISTA DESKTOP: Tabla Estructurada Premium */}
              <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-300">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/70 border-b border-slate-200/80">
                        <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Solicitante</th>
                        <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Artículos Prestados</th>
                        <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest hidden lg:table-cell">Autorizó</th>
                        <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest hidden lg:table-cell">Salida</th>
                        <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest hidden xl:table-cell">Devolución</th>
                        <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Estado</th>
                        <th className="px-6 py-4 w-28 text-right text-[11px] font-bold text-slate-400 uppercase tracking-widest">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedPrestamos.map(p => (
                        <tr key={p.id} className="hover:bg-slate-50/50 transition-colors duration-200 text-sm group">
                          <td className="px-6 py-4">
                            <p className="font-bold text-slate-800">{p.solicitante?.nombre_completo ?? p.solicitante_externo ?? "—"}</p>
                            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                              {p.departamento?.nombre ?? "Sin depto."} · <span className="text-[#014ba0] font-mono font-bold">#{p.id}</span>
                            </p>
                          </td>
                          <td className="px-6 py-4 max-w-[260px]">
                            <div className="space-y-1.5">
                              {(p.detalle_prestamo ?? []).map((d: any) => (
                                <div key={d.id} className="flex items-center gap-2">
                                  <Package size={12} className="text-[#014ba0] shrink-0" />
                                  <span className="text-xs font-semibold text-slate-700 truncate">{d.inventario?.nombre ?? "—"}</span>
                                  <span className="text-[10px] bg-blue-50 text-[#014ba0] px-1.5 py-0.2 rounded font-bold">×{d.cantidad}</span>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 hidden lg:table-cell text-xs font-semibold text-slate-600">
                            {p.autorizador?.nombre_completo ? (
                              <span className="flex items-center gap-1.5"><ShieldCheck size={13} className="text-[#014ba0]" /> {p.autorizador.nombre_completo}</span>
                            ) : "—"}
                          </td>
                          <td className="px-6 py-4 hidden lg:table-cell text-xs font-medium text-slate-500">
                            {formatFecha(p.fecha_salida)}
                          </td>
                          <td className="px-6 py-4 hidden xl:table-cell">
                            {p.fecha_devolucion ? (
                              <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">{formatFecha(p.fecha_devolucion)}</span>
                            ) : (
                              <span className="text-xs text-[#014ba0] bg-blue-50 px-2 py-0.5 rounded-lg font-bold border border-blue-100">Pendiente</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xl text-[11px] font-bold border ${ESTADO_LABELS[p.estado as EstadoPrestamoEnum]?.cls}`}>
                              {ESTADO_ICONS[p.estado as EstadoPrestamoEnum]}
                              {ESTADO_LABELS[p.estado as EstadoPrestamoEnum]?.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => handleVer(p)} className="p-1.5 text-slate-500 hover:text-[#014ba0] hover:bg-blue-50 rounded-lg transition-all" title="Ver detalle">
                                <Eye size={15} />
                              </button>
                              {p.estado === "activo" && (
                                <button onClick={() => handleDevolver(p)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" title="Registrar devolución">
                                  <CornerDownLeft size={15} />
                                </button>
                              )}
                              <button onClick={() => triggerDeleteModal(p)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="Eliminar registro">
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* VISTA MÓVIL: Reestructuración limpia en Cards Fluidas */}
              <div className="block md:hidden space-y-4">
                {paginatedPrestamos.map(p => (
                  <div key={p.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4 hover:border-blue-200 transition-all duration-300">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-slate-800 text-base leading-snug">{p.solicitante?.nombre_completo ?? p.solicitante_externo ?? "—"}</p>
                        <p className="text-xs text-slate-400 font-semibold mt-0.5">
                          {p.departamento?.nombre ?? "Sin depto."} · <span className="text-[#014ba0] font-mono font-bold">#{p.id}</span>
                        </p>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xl text-[10px] font-bold border shrink-0 ${ESTADO_LABELS[p.estado as EstadoPrestamoEnum]?.cls}`}>
                        {ESTADO_ICONS[p.estado as EstadoPrestamoEnum]}
                        {ESTADO_LABELS[p.estado as EstadoPrestamoEnum]?.label}
                      </span>
                    </div>

                    <div className="bg-slate-50/80 rounded-xl p-3 space-y-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Artículos</p>
                      <div className="space-y-1.5">
                        {(p.detalle_prestamo ?? []).map((d: any) => (
                          <div key={d.id} className="flex items-center justify-between text-xs font-semibold text-slate-700">
                            <span className="truncate pr-2">{d.inventario?.nombre ?? "—"}</span>
                            <span className="text-[10px] bg-blue-50 text-[#014ba0] px-1.5 py-0.5 rounded font-bold shrink-0">×{d.cantidad}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs border-t border-slate-100 pt-3">
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Fecha Salida</p>
                        <p className="text-slate-600 font-semibold mt-0.5">{formatFecha(p.fecha_salida)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Devolución</p>
                        {p.fecha_devolucion ? (
                          <p className="text-emerald-700 font-bold mt-0.5">{formatFecha(p.fecha_devolucion)}</p>
                        ) : (
                          <p className="text-[#014ba0] font-bold mt-0.5">Pendiente</p>
                        )}
                      </div>
                    </div>

                    {p.autorizador?.nombre_completo && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50/50 px-3 py-2 rounded-xl border border-slate-100/80">
                        <ShieldCheck size={13} className="text-[#014ba0]" />
                        <span>Autorizó: <span className="font-semibold text-slate-700">{p.autorizador.nombre_completo}</span></span>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                      <button onClick={() => handleVer(p)} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all">
                        <Eye size={14} /> Detalle
                      </button>
                      {p.estado === "activo" && (
                        <button onClick={() => handleDevolver(p)} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-sm shadow-emerald-100">
                          <CornerDownLeft size={14} /> Devolución
                        </button>
                      )}
                      <button onClick={() => triggerDeleteModal(p)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all ml-auto">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Sección Controlada de Paginación */}
              <div className="px-6 py-4 bg-white border border-slate-200 shadow-sm rounded-2xl flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-500">
                  Mostrando <span className="text-slate-900 font-bold">{paginatedPrestamos.length}</span> de <span className="text-slate-900 font-bold">{filtered.length}</span> registros [Pág. {activePage}/{totalPages}]
                </p>
                <div className="flex gap-2">
                  <button 
                    disabled={activePage === 1} 
                    onClick={() => setPage(p => p - 1)} 
                    className="px-3 py-1.5 text-xs font-bold text-[#014ba0] bg-white border border-slate-200 rounded-xl hover:bg-blue-50/50 disabled:opacity-40 disabled:hover:bg-white transition-all flex items-center gap-1"
                  >
                    <ChevronLeft size={14} /> Anterior
                  </button>
                  <button 
                    disabled={activePage >= totalPages} 
                    onClick={() => setPage(p => p + 1)} 
                    className="px-3 py-1.5 text-xs font-bold text-white bg-[#014ba0] rounded-xl hover:bg-[#004091] disabled:opacity-40 transition-all flex items-center gap-1 shadow-sm shadow-blue-900/10"
                  >
                    Siguiente <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      <ModalPrestamo isOpen={modalNuevo} onClose={() => { setModalNuevo(false); setSelectedPrestamo(null); }} prestamo={selectedPrestamo} onSaved={loadPrestamos} />
      <ModalDevolucion isOpen={modalDevolucion} onClose={() => { setModalDevolucion(false); setSelectedPrestamo(null); }} prestamo={selectedPrestamo} onSaved={loadPrestamos} />

      {/* Modal Seguro de Borrado con Animaciones de Entrada */}
      {showDeleteModal && prestamoToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm transition-opacity duration-300" onClick={() => setShowDeleteModal(false)} />
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 relative z-10 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <AlertCircle size={18} className="text-rose-600" /> Confirmar Acción Excepcional
              </h2>
              <button onClick={() => setShowDeleteModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-4 flex gap-3 text-rose-950">
                <Info className="text-rose-600 shrink-0 mt-0.5" size={18} />
                <p className="text-xs font-medium leading-relaxed text-rose-800">
                  ¿Estás seguro de que deseas eliminar de forma definitiva el registro del préstamo <span className="font-bold">#{prestamoToDelete.id}</span>? Esta acción purgará el historial logístico de manera irreversible.
                </p>
              </div>
              <div className="flex justify-end gap-2 text-xs font-bold pt-2">
                <button onClick={() => setShowDeleteModal(false)} disabled={isDeleting} className="px-4 py-2.5 text-slate-600 border border-slate-200 hover:bg-slate-50 rounded-xl transition-all">
                  Cancelar
                </button>
                <button onClick={confirmDelete} disabled={isDeleting} className="px-5 py-2.5 text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-rose-100">
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