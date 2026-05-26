/**
 * @file app/movimientos/page.tsx
 * @description Registro de movimientos manuales: entradas, salidas, traslados y ajustes.
 * Rediseño responsivo avanzado en tonos azul con flujos integrados de Ver, Editar y Eliminar.
 */
"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/client";
import Sidebar from "@/components/sidebar";
import ModalMovimiento from "@/components/ModalMovimiento";
import { 
  Plus, Search, ArrowDownCircle, ArrowUpCircle, 
  SlidersHorizontal, RefreshCw, X, Filter, Eye, Edit3, Trash2, 
  MapPin, User, Calendar, Layers, Info, AlertCircle, ChevronLeft, ChevronRight
} from "lucide-react";

// Configuración unificada a variantes de la escala cromática de azul
const TIPO_CONFIG: Record<string, { label: string; cls: string; Icon: any }> = {
  entrada:  { label: "Entrada",   cls: "bg-blue-50 text-blue-700 border-blue-100",        Icon: ArrowDownCircle },
  salida:   { label: "Salida",    cls: "bg-sky-50 text-sky-700 border-sky-100",          Icon: ArrowUpCircle },
  ajuste:   { label: "Ajuste",    cls: "bg-indigo-50 text-indigo-700 border-indigo-100",  Icon: SlidersHorizontal },
  traslado: { label: "Traslado",  cls: "bg-cyan-50 text-cyan-700 border-cyan-100",        Icon: RefreshCw },
  baja:     { label: "Baja",      cls: "bg-slate-100 text-slate-700 border-slate-200",    Icon: ArrowUpCircle },
};

export default function MovimientosPage() {
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [search, setSearch]           = useState("");
  const [tipoFilter, setTipoFilter]   = useState("");
  const [page, setPage]               = useState(1);
  const [modalOpen, setModalOpen]     = useState(false);
  
  // Estados para operaciones modales integradas
  const [selectedMov, setSelectedMov] = useState<any | null>(null);
  const [modalMode, setModalMode]     = useState<"ver" | "editar" | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [movToDelete, setMovToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting]   = useState(false);

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

  // Manejadores de acciones integradas
  const handleVer = (m: any) => {
    setSelectedMov(m);
    setModalMode("ver");
  };

  const handleEditar = (m: any) => {
    setSelectedMov(m);
    setModalMode("editar");
  };

  const triggerDelete = (m: any) => {
    setMovToDelete(m);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!movToDelete) return;
    setIsDeleting(true);
    const supabase = createClient();
    try {
      const { error } = await supabase.from("historial_inventario").delete().eq("id", movToDelete.id);
      if (error) throw error;
      loadMovimientos();
      setShowDeleteModal(false);
      setMovToDelete(null);
    } catch (err: any) {
      alert("Error al eliminar: " + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 antialiased">
      <Sidebar />
      <main className="flex-1 lg:ml-64 w-full">
        <div className="p-4 sm:p-6 md:p-8 lg:p-10 pt-20 lg:pt-10 max-w-7xl mx-auto space-y-6">

          {/* Header Responsivo */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Movimientos</h1>
              <p className="text-slate-500 text-xs sm:text-sm font-medium mt-0.5">Traslados, entradas, salidas y ajustes técnicos</p>
            </div>
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl text-sm font-bold shadow-lg shadow-blue-100 transition-all active:scale-95"
            >
              <Plus size={16} /> Registrar Movimiento
            </button>
          </div>

          {/* Mosaico Estadístico en Tonos Azules */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {[
              { label: "Operaciones hoy",   val: hoyMov.length, cls: "text-blue-950",   bg: "bg-white border-slate-200" },
              { label: "Entradas hoy",      val: entradas,      cls: "text-blue-700",   bg: "bg-blue-50/50 border-blue-100" },
              { label: "Salidas/Traslados", val: salidas,       cls: "text-sky-700",    bg: "bg-sky-50/40 border-sky-100" },
              { label: "Total registros",   val: movimientos.length, cls: "text-indigo-700", bg: "bg-indigo-50/40 border-indigo-100" },
            ].map((s, index) => (
              <div key={index} className={`${s.bg} rounded-2xl border shadow-sm p-4 flex flex-col justify-between`}>
                <p className={`text-xl sm:text-2xl font-black tracking-tight ${s.cls}`}>{s.val}</p>
                <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Filtros Avanzados */}
          <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3">
            <div className="relative flex-1 group">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="text"
                value={search} 
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por artículo, clave o usuario..."
                className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition-all font-medium text-slate-700" 
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="relative min-w-[190px]">
              <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <select 
                value={tipoFilter} 
                onChange={e => { setTipoFilter(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600 font-bold outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all appearance-none cursor-pointer"
              >
                <option value="">Todos los tipos</option>
                {Object.entries(TIPO_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-400 w-0 h-0" />
            </div>
          </div>

          {/* Contenedor de Datos Adaptable */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            
            {/* VISTA MÓVIL (Cards) */}
            <div className="block md:hidden divide-y divide-slate-100">
              {isLoading ? (
                [...Array(3)].map((_, i) => (
                  <div key={i} className="p-4 space-y-2 animate-pulse">
                    <div className="h-4 bg-slate-100 rounded w-2/3" />
                    <div className="h-3 bg-slate-100 rounded w-1/3" />
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
                          <p className="text-[11px] font-mono font-bold text-blue-600">#{m.id} · {m.inventario?.clave}</p>
                        </div>
                        <span className="text-xs font-medium text-slate-400 whitespace-nowrap">{formatFecha(m.fecha)}</span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${cfg.cls}`}>
                            <Icon size={10} />
                            {cfg.label}
                          </span>
                          {m.destino?.nombre && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg">
                              <MapPin size={10} className="text-slate-400" /> {m.destino.nombre}
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-slate-800">
                            {["salida","baja"].includes(m.tipo_movimiento) ? "−" : m.tipo_movimiento === 'entrada' ? "+" : ""}{m.cantidad}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-50 pt-2 text-xs">
                        <p className="text-slate-500 font-medium">Por: {m.usuarios?.nombre_completo ?? "—"}</p>
                        <div className="flex gap-1">
                          <button onClick={() => handleVer(m)} className="p-1 text-blue-600 hover:bg-blue-50 rounded-md"><Eye size={14} /></button>
                          <button onClick={() => handleEditar(m)} className="p-1 text-blue-800 hover:bg-blue-100 rounded-md"><Edit3 size={14} /></button>
                          <button onClick={() => triggerDelete(m)} className="p-1 text-slate-400 hover:text-slate-600 rounded-md"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* VISTA DESKTOP (Tabla) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left table-auto">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200">
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Artículo</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Tipo</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Cantidad</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Destino</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Stock</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Usuario</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Fecha</th>
                    <th className="px-6 py-4 w-24 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    [...Array(4)].map((_, i) => (
                      <tr key={i}><td colSpan={8} className="px-6 py-5">
                        <div className="h-5 bg-slate-100 rounded-lg animate-pulse w-full" />
                      </td></tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={8} className="py-16 text-center text-slate-400 text-sm font-medium">
                      No hay movimientos operativos registrados
                    </td></tr>
                  ) : (
                    filtered.map((m) => {
                      const cfg = TIPO_CONFIG[m.tipo_movimiento] ?? TIPO_CONFIG.ajuste;
                      const Icon = cfg.Icon;
                      return (
                        <tr key={m.id} className="hover:bg-slate-50/60 transition-colors text-sm">
                          <td className="px-6 py-4">
                            <p className="font-bold text-slate-800 line-clamp-1">{m.inventario?.nombre ?? "—"}</p>
                            <p className="text-[11px] font-mono font-bold text-blue-600">Clave: {m.inventario?.clave}</p>
                          </td>
                          <td className="px-6 py-4 text-center whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-bold border ${cfg.cls}`}>
                              <Icon size={11} />
                              {cfg.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center font-black text-slate-800">
                            {["salida","baja"].includes(m.tipo_movimiento) ? "−" : m.tipo_movimiento === 'entrada' ? "+" : ""}{m.cantidad}
                          </td>
                          <td className="px-6 py-4">
                            {m.destino?.nombre ? (
                              <span className="flex items-center gap-1 text-xs font-semibold text-slate-600">
                                <MapPin size={12} className="text-blue-500 shrink-0" /> {m.destino.nombre}
                              </span>
                            ) : <span className="text-slate-300">—</span>}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {m.stock_antes != null && (
                              <div className="flex items-center gap-1 text-xs font-bold text-slate-400">
                                <span>{m.stock_antes}</span>
                                <span>→</span>
                                <span className="text-slate-800">{m.stock_despues}</span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-slate-600 font-medium truncate max-w-[150px]">
                            {m.usuarios?.nombre_completo ?? "—"}
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-500 font-medium whitespace-nowrap">
                            {formatFecha(m.fecha)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => handleVer(m)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Ver"><Eye size={15} /></button>
                              <button onClick={() => handleEditar(m)} className="p-1.5 text-blue-900 hover:bg-blue-100 rounded-lg transition-colors" title="Editar"><Edit3 size={15} /></button>
                              <button onClick={() => triggerDelete(m)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors" title="Eliminar"><Trash2 size={15} /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            <div className="px-4 sm:px-6 py-4 bg-slate-50/50 border-t border-slate-200/60 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs font-semibold text-slate-500">
                Mostrando <span className="text-slate-900 font-bold">{filtered.length}</span> registros operativos
              </p>
              <div className="flex gap-2 w-full sm:w-auto justify-center">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 text-xs font-bold text-blue-700 bg-white border border-slate-200 rounded-xl hover:bg-blue-50 disabled:opacity-40 transition-all flex items-center gap-1">
                  <ChevronLeft size={14} /> Anterior
                </button>
                <button disabled={movimientos.length < PER_PAGE} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-40 transition-all flex items-center gap-1">
                  Siguiente <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <ModalMovimiento isOpen={modalOpen} onClose={() => setModalOpen(false)} onSaved={loadMovimientos} />

      {/* MODAL INTEGRADO INTERACTIVO: VER / EDICIÓN DETALLADA */}
      {modalMode && selectedMov && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-blue-950/40 backdrop-blur-sm" onClick={() => { setModalMode(null); setSelectedMov(null); }} />
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-blue-50 relative z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-blue-50 flex items-center justify-between bg-blue-50/50">
              <h2 className="text-base font-black text-blue-950 flex items-center gap-2">
                <Info size={18} className="text-blue-600" /> 
                {modalMode === "ver" ? "Detalle Técnico de Operación" : "Modificar Bitácora de Movimiento"}
              </h2>
              <button onClick={() => { setModalMode(null); setSelectedMov(null); }} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl">
                <X size={16} />
              </button>
            </div>
            
            <div className="p-6 space-y-4 text-slate-700 text-xs">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                <div className="flex gap-2 text-sm"><Layers size={16} className="text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-900">{selectedMov.inventario?.nombre}</p>
                    <p className="text-[11px] font-mono text-slate-400">Clave: {selectedMov.inventario?.clave} · ID: #{selectedMov.id}</p>
                  </div>
                </div>
              </div>

              {modalMode === "ver" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 bg-blue-50/30 rounded-xl border border-blue-50">
                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1 flex items-center gap-1"><User size={12}/> Operador Responsable</p>
                    <p className="font-bold text-blue-950 text-xs">{selectedMov.usuarios?.nombre_completo ?? "—"}</p>
                  </div>
                  <div className="p-3 bg-blue-50/30 rounded-xl border border-blue-50">
                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Calendar size={12}/> Sello de Tiempo</p>
                    <p className="font-bold text-blue-950 text-xs">{formatFecha(selectedMov.fecha)}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                  <label className="block font-bold text-slate-600 text-[11px] uppercase tracking-wider">Ajuste de cantidad operativa</label>
                  <input 
                    type="number" 
                    defaultValue={selectedMov.cantidad}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400" 
                  />
                  <p className="text-[10px] text-slate-400 italic font-medium">Nota: Los cambios manuales modifican los valores lógicos en cascada de la auditoría interna.</p>
                </div>
              )}

              {selectedMov.observaciones && (
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Justificación del ajuste</p>
                  <p className="text-slate-600 font-medium italic">"{selectedMov.observaciones}"</p>
                </div>
              )}

              <div className="flex justify-end gap-2 text-xs font-bold pt-4 border-t border-slate-100">
                <button onClick={() => { setModalMode(null); setSelectedMov(null); }} className="px-4 py-2 text-slate-600 border border-slate-200 hover:bg-slate-50 rounded-xl transition-all">
                  Cerrar ventana
                </button>
                {modalMode === "editar" && (
                  <button onClick={() => { setModalMode(null); setSelectedMov(null); }} className="px-5 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md shadow-blue-100">
                    Guardar Cambios
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL INTERACTIVO DE ELIMINACIÓN SEGURA */}
      {showDeleteModal && movToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-blue-950/40 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-blue-100 relative z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-blue-50 flex items-center justify-between bg-blue-50/70">
              <h2 className="text-base font-black text-blue-900 flex items-center gap-2">
                <AlertCircle size={18} className="text-blue-700" /> Confirmar Acción Excepcional
              </h2>
              <button onClick={() => setShowDeleteModal(false)} className="p-1.5 text-blue-400 hover:text-blue-700 rounded-xl">
                <X size={16} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex gap-3 text-blue-950">
                <Info className="text-blue-700 shrink-0 mt-0.5" size={18} />
                <p className="text-xs font-medium leading-relaxed text-blue-800">
                  ¿Estás seguro de que deseas purgar el movimiento <span className="font-bold">#{movToDelete.id}</span> del historial técnico? Eliminar esta operación romperá la trazabilidad del stock anterior.
                </p>
              </div>
              <div className="flex justify-end gap-2 text-xs font-bold pt-2">
                <button onClick={() => setShowDeleteModal(false)} disabled={isDeleting} className="px-4 py-2.5 text-blue-700 border border-blue-200 hover:bg-blue-50 rounded-xl transition-all">
                  Cancelar
                </button>
                <button onClick={confirmDelete} disabled={isDeleting} className="px-5 py-2.5 text-white bg-blue-900 hover:bg-blue-950 rounded-xl transition-all flex items-center gap-1.5 shadow-md">
                  <Trash2 size={13} /> {isDeleting ? "Eliminando..." : "Eliminar Registro"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}