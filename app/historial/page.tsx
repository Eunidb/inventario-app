/**
 * @file app/historial/page.tsx
 * @description Vista de auditoría completa con acciones interactivas y modales responsivos en tonos azul farmacéutico (#004091).
 */
"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/client";
import Sidebar from "@/components/sidebar";
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Pencil, 
  Trash2, 
  X, 
  AlertTriangle, 
  Calendar, 
  User, 
  Tag, 
  Layers, 
  FileText,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Info,
  CalendarDays
} from "lucide-react";

// Paleta corporativa unificada basada en el azul farmacéutico #004091 (Sin Emojis)
const TIPO_CONFIG: Record<string, { label: string; cls: string; signo: string }> = {
  entrada:    { label: "Entrada",    cls: "bg-[#004091] text-white border border-[#003375]", signo: "+" },
  salida:     { label: "Salida",     cls: "bg-sky-600 text-white border border-sky-700",   signo: "−" },
  prestamo:   { label: "Préstamo",   cls: "bg-indigo-600 text-white border border-indigo-700", signo: "−" },
  devolucion: { label: "Devolución", cls: "bg-cyan-600 text-white border border-cyan-700",   signo: "+" },
  ajuste:     { label: "Ajuste",     cls: "bg-slate-600 text-white border border-slate-700",   signo: "~" },
  baja:       { label: "Baja",       cls: "bg-slate-900 text-white border border-slate-950",    signo: "−" },
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

  const [selectedMovimiento, setSelectedMovimiento] = useState<any | null>(null);
  const [modalType, setModalType] = useState<"ver" | "editar" | "eliminar" | null>(null);
  const [editObservaciones, setEditObservaciones] = useState("");
  const [isActionLoading, setIsActionLoading] = useState(false);

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

  const handleUpdateObservaciones = async () => {
    if (!selectedMovimiento) return;
    setIsActionLoading(true);
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from("historial_inventario")
        .update({ observaciones: editObservaciones })
        .eq("id", selectedMovimiento.id);

      if (error) throw error;
      
      setHistorial(prev => prev.map(m => m.id === selectedMovimiento.id ? { ...m, observaciones: editObservaciones } : m));
      closeModal();
    } catch (err) {
      console.error(err);
      alert("No se pudo actualizar el registro.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteRegistro = async () => {
    if (!selectedMovimiento) return;
    setIsActionLoading(true);
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from("historial_inventario")
        .delete()
        .eq("id", selectedMovimiento.id);

      if (error) throw error;

      setHistorial(prev => prev.filter(m => m.id !== selectedMovimiento.id));
      closeModal();
    } catch (err) {
      console.error(err);
      alert("Hubo un error al intentar eliminar el movimiento.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const openModal = (movimiento: any, type: "ver" | "editar" | "eliminar") => {
    setSelectedMovimiento(movimiento);
    setModalType(type);
    if (type === "editar") {
      setEditObservaciones(movimiento.observaciones ?? "");
    }
  };

  const closeModal = () => {
    setSelectedMovimiento(null);
    setModalType(null);
    setEditObservaciones("");
  };

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
    <div className="flex min-h-screen bg-slate-50/50">
      <Sidebar />
      
      {/* Contenedor principal alineado simétricamente con el sidebar (ml-0 móvil, ml-64 escritorio) */}
      <main className="flex-1 lg:pl-64 w-full transition-all duration-300 ease-in-out">
        <div className="p-4 md:p-8 lg:p-10 pt-24 lg:pt-10 max-w-7xl mx-auto w-full flex flex-col justify-center">

          {/* Header Responsivo */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                Historial de Operaciones
              </h1>
              <p className="text-slate-500 font-medium text-xs md:text-sm mt-1">
                Auditoría completa e integrada de movimientos del almacén farmacéutico
              </p>
            </div>
            
            {/* Botones de acción con microinteracciones */}
            <div className="flex flex-wrap sm:flex-nowrap gap-2.5">
              <button 
                onClick={() => setShowFilters(f => !f)}
                className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs border transition-all duration-200 transform active:scale-95 ${
                  showFilters 
                    ? "bg-[#004091] text-white border-[#004091] shadow-md shadow-[#004091]/10" 
                    : "bg-white text-slate-600 border-slate-200 hover:border-[#004091] hover:text-[#004091] hover:shadow-sm"
                }`}
              >
                <Filter size={14} /> Filtros de Auditoría
              </button>
              <button 
                onClick={exportarCSV}
                className="inline-flex items-center justify-center gap-2 bg-white text-slate-600 border border-slate-200 px-4 py-2.5 rounded-xl font-bold text-xs hover:border-[#004091] hover:text-[#004091] hover:shadow-sm transition-all duration-200 transform active:scale-95"
              >
                <Download size={14} /> Exportar CSV
              </button>
            </div>
          </div>

          {/* Filtros Avanzados con Transición Fluida de Altura */}
          <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm transition-all duration-300 ease-in-out overflow-hidden ${
            showFilters ? "max-h-[500px] p-5 mb-6 opacity-100" : "max-h-0 p-0 mb-0 opacity-0 border-none"
          }`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative sm:col-span-2">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  value={search} 
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar por artículo, clave o ID de usuario..."
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-4 focus:ring-[#004091]/5 focus:border-[#004091] focus:bg-white transition-all duration-200" 
                />
              </div>
              <div className="relative">
                <select 
                  value={tipoFilter} 
                  onChange={e => { setTipoFilter(e.target.value); setPage(1); }}
                  className="w-full py-2.5 pl-3 pr-8 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 font-bold outline-none focus:ring-4 focus:ring-[#004091]/5 focus:border-[#004091] cursor-pointer appearance-none transition-all duration-200"
                >
                  <option value="">Todos los tipos</option>
                  {Object.entries(TIPO_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-400 w-0 h-0" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input 
                  type="date" 
                  value={fechaDesde} 
                  onChange={e => { setFechaDesde(e.target.value); setPage(1); }}
                  className="w-full py-2.5 px-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 outline-none focus:ring-4 focus:ring-[#004091]/5 focus:border-[#004091] transition-all duration-200" 
                />
                <input 
                  type="date" 
                  value={fechaHasta} 
                  onChange={e => { setFechaHasta(e.target.value); setPage(1); }}
                  className="w-full py-2.5 px-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 outline-none focus:ring-4 focus:ring-[#004091]/5 focus:border-[#004091] transition-all duration-200" 
                />
              </div>
            </div>
          </div>

          {/* Barra Simple (Solo visible si los filtros están ocultos) con transición limpia */}
          <div className={`bg-white p-4 rounded-2xl border border-slate-200 shadow-sm transition-all duration-300 ${
            showFilters ? "opacity-0 max-h-0 p-0 mb-0 pointer-events-none border-none" : "opacity-100 max-h-[100px] mb-6"
          }`}>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                value={search} 
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por artículo, clave o usuario..."
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-4 focus:ring-[#004091]/5 focus:border-[#004091] focus:bg-white transition-all duration-200" 
              />
            </div>
          </div>

          {/* Tabla de Auditoría (Estructura original protegida) */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xl shadow-slate-100/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left table-auto">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Artículo / Componente</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Tipo</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Cantidad</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest hidden md:table-cell">Trazabilidad Stock</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest hidden lg:table-cell">Usuario</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest hidden sm:table-cell">Fecha / Hora</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest hidden xl:table-cell">Notas de Bitácora</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    [...Array(6)].map((_, i) => (
                      <tr key={i}>
                        <td colSpan={8} className="px-6 py-5">
                          <div className="h-4 bg-slate-100 rounded-lg animate-pulse w-full" />
                        </td>
                      </tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-center text-slate-400 text-xs font-bold uppercase tracking-wider">
                        Ningún registro coincide con los parámetros de búsqueda actuales.
                      </td>
                    </tr>
                  ) : filtered.map((m) => {
                    const cfg = TIPO_CONFIG[m.tipo_movimiento] ?? TIPO_CONFIG.ajuste;
                    return (
                      <tr key={m.id} className="hover:bg-[#004091]/5 transition-colors duration-150 text-xs">
                        <td className="px-6 py-3.5">
                          <p className="font-bold text-slate-800 line-clamp-1">{m.inventario?.nombre ?? "—"}</p>
                          <p className="text-[10px] font-mono font-bold text-[#004091] mt-0.5">{m.inventario?.clave}</p>
                        </td>
                        <td className="px-6 py-3.5 text-center">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold inline-block whitespace-nowrap uppercase tracking-wide ${cfg.cls}`}>
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-center font-black text-slate-700 text-sm">
                          {cfg.signo}{m.cantidad}
                        </td>
                        <td className="px-6 py-3.5 hidden md:table-cell whitespace-nowrap">
                          {m.stock_antes != null && (
                            <span className="text-xs text-slate-500 font-medium">
                              {m.stock_antes} <span className="text-slate-300 font-normal">→</span> <span className="font-bold text-[#004091]">{m.stock_despues}</span>
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-3.5 hidden lg:table-cell text-slate-600 font-semibold truncate max-w-[140px]">
                          {m.usuarios?.nombre_completo ?? "—"}
                        </td>
                        <td className="px-6 py-3.5 text-[11px] text-slate-500 font-medium hidden sm:table-cell whitespace-nowrap">
                          {formatFecha(m.fecha)}
                        </td>
                        <td className="px-6 py-3.5 hidden xl:table-cell text-[11px] text-slate-400 font-medium max-w-xs truncate italic">
                          {m.observaciones ? `"${m.observaciones}"` : "—"}
                        </td>
                        <td className="px-6 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => openModal(m, "ver")} 
                              title="Ver Detalle"
                              className="p-1.5 text-[#004091] hover:bg-[#004091]/10 rounded-xl transition-colors duration-150">
                              <Eye size={15} />
                            </button>
                            <button onClick={() => openModal(m, "editar")}
                              title="Editar Notas"
                              className="p-1.5 text-sky-600 hover:bg-sky-50 rounded-xl transition-colors duration-150">
                              <Pencil size={15} />
                            </button>
                            <button onClick={() => openModal(m, "eliminar")}
                              title="Eliminar Registro"
                              className="p-1.5 text-slate-700 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors duration-150">
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-3 items-center justify-between">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider text-center sm:text-left">
                Mapeando <span className="text-slate-900">{filtered.length}</span> registros en este bloque
              </p>
              <div className="flex gap-2 w-full sm:w-auto justify-center">
                <button 
                  disabled={page === 1} 
                  onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1.5 text-xs font-bold text-[#004091] bg-white border border-slate-200 rounded-xl hover:bg-[#004091]/5 disabled:opacity-40 transition-all flex items-center gap-1"
                >
                  <ChevronLeft size={14} /> Anterior
                </button>
                <button 
                  disabled={historial.length < PER_PAGE} 
                  onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-[#004091] border border-[#003375] rounded-xl hover:bg-[#003375] disabled:opacity-40 transition-all flex items-center gap-1"
                >
                  Siguiente <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ─── MODALES CON TEMÁTICA CLÍNICA Y CONTROL DE ESCALA ─── */}
      {modalType && selectedMovimiento && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          {/* Fondo de desenfoque farmacéutico de alta gama */}
          <div className="fixed inset-0 bg-[#001f47]/40 backdrop-blur-sm transition-opacity duration-300" onClick={closeModal} />
          
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 relative z-10 animate-in fade-in zoom-in-95 duration-200 my-auto">
            
            {/* Cabecera Técnica */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h2 className="text-xs sm:text-sm font-black text-[#004091] uppercase tracking-wider flex items-center gap-2">
                {modalType === "ver" && <><Info size={16} className="text-[#004091] shrink-0" /> Detalles de Auditoría Técnica</>}
                {modalType === "editar" && <><Pencil size={16} className="text-[#004091] shrink-0" /> Actualizar Glosa de Bitácora</>}
                {modalType === "eliminar" && <><AlertTriangle size={16} className="text-red-600 shrink-0" /> Confirmar Remoción de Historial</>}
              </h2>
              <button onClick={closeModal} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all">
                <X size={16} />
              </button>
            </div>

            {/* MODAL: VER DETALLE */}
            {modalType === "ver" && (
              <div className="p-5 sm:p-6 space-y-4">
                <div className="bg-[#004091]/5 border border-[#004091]/10 rounded-xl p-4 flex gap-3">
                  <FileText className="text-[#004091] shrink-0 mt-0.5" size={18} />
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-slate-900">{selectedMovimiento.inventario?.nombre ?? "—"}</h3>
                    <p className="text-[10px] font-mono font-bold text-[#004091] mt-0.5">ID Control: {selectedMovimiento.inventario?.clave ?? "—"}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="font-bold text-slate-400 uppercase tracking-wider text-[9px] flex items-center gap-1">
                      <Tag size={10} className="text-[#004091]" /> Tipo Operación
                    </p>
                    <span className={`inline-block px-2 py-0.5 font-bold text-[10px] rounded-md mt-1.5 uppercase tracking-wide ${TIPO_CONFIG[selectedMovimiento.tipo_movimiento]?.cls}`}>
                      {TIPO_CONFIG[selectedMovimiento.tipo_movimiento]?.label ?? "Ajuste"}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="font-bold text-slate-400 uppercase tracking-wider text-[9px] flex items-center gap-1">
                      <Layers size={10} className="text-[#004091]" /> Delta Unidades
                    </p>
                    <p className="text-sm font-black text-slate-800 mt-1">
                      {TIPO_CONFIG[selectedMovimiento.tipo_movimiento]?.signo}{selectedMovimiento.cantidad}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="font-bold text-slate-400 uppercase tracking-wider text-[9px] flex items-center gap-1">
                      <Layers size={10} className="text-[#004091]" /> Flujo de Existencias
                    </p>
                    <p className="font-semibold text-slate-700 mt-1 text-[11px]">
                      Inicial: <span className="font-bold text-slate-900">{selectedMovimiento.stock_antes ?? "—"}</span>
                    </p>
                    <p className="font-semibold text-slate-700 text-[11px]">
                      Final: <span className="font-bold text-[#004091]">{selectedMovimiento.stock_despues ?? "—"}</span>
                    </p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="font-bold text-slate-400 uppercase tracking-wider text-[9px] flex items-center gap-1">
                      <CalendarDays size={10} className="text-[#004091]" /> Estampa de Tiempo
                    </p>
                    <p className="font-bold text-slate-800 mt-1 text-[11px] leading-tight">{formatFecha(selectedMovimiento.fecha)}</p>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                  <p className="font-bold text-slate-400 uppercase tracking-wider text-[9px] flex items-center gap-1">
                    <User size={10} className="text-[#004091]" /> Operador de Sistema Autenticado
                  </p>
                  <p className="font-bold text-slate-800 mt-1">{selectedMovimiento.usuarios?.nombre_completo ?? "—"}</p>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                  <p className="font-bold text-slate-400 uppercase tracking-wider text-[9px] flex items-center gap-1">
                    <FileText size={10} className="text-[#004091]" /> Justificación Detallada
                  </p>
                  <p className="text-slate-700 mt-1 italic whitespace-pre-wrap font-medium">
                    {selectedMovimiento.observaciones ? `"${selectedMovimiento.observaciones}"` : "Sin comentarios de respaldo en la bitácora."}
                  </p>
                </div>
                
                <div className="pt-2">
                  <button onClick={closeModal} className="w-full bg-[#004091] hover:bg-[#003375] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md shadow-[#004091]/10 transform active:scale-95">
                    <CheckCircle2 size={14} /> Concluir Revisión
                  </button>
                </div>
              </div>
            )}

            {/* MODAL: EDITAR OBSERVACIONES */}
            {modalType === "editar" && (
              <div className="p-5 sm:p-6 space-y-4">
                <div className="text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-slate-400 font-bold uppercase text-[9px] tracking-wider flex items-center gap-1">
                    <FileText size={10} /> Componente Seleccionado
                  </p>
                  <p className="font-black text-slate-800 text-xs sm:text-sm mt-1">{selectedMovimiento.inventario?.nombre}</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Notas e Incidencias del Ajuste Manual</label>
                  <textarea
                    value={editObservaciones}
                    onChange={(e) => setEditObservaciones(e.target.value)}
                    rows={4}
                    placeholder="Escriba los motivos del ajuste o comentarios corporativos..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-4 focus:ring-[#004091]/5 focus:border-[#004091] focus:bg-white resize-none transition-all text-slate-800 font-semibold"
                  />
                </div>

                <div className="pt-2 flex flex-col-reverse sm:flex-row justify-end gap-2">
                  <button onClick={closeModal} disabled={isActionLoading}
                    className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all disabled:opacity-50">
                    Cancelar
                  </button>
                  <button onClick={handleUpdateObservaciones} disabled={isActionLoading}
                    className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-white bg-[#004091] hover:bg-[#003375] rounded-xl shadow-md shadow-[#004091]/10 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 transform active:scale-95">
                    <CheckCircle2 size={14} /> {isActionLoading ? "Procesando..." : "Guardar Cambios"}
                  </button>
                </div>
              </div>
            )}

            {/* MODAL: ELIMINAR REGISTRO */}
            {modalType === "eliminar" && (
              <div className="p-5 sm:p-6 space-y-4">
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex gap-3 text-slate-900">
                  <AlertTriangle className="text-red-600 shrink-0 mt-0.5" size={18} />
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-red-950">Advertencia de Trazabilidad Logística</h4>
                    <p className="text-xs font-semibold mt-1 leading-relaxed text-slate-600">
                      Suprimir este movimiento impactará exclusivamente los reportes analíticos e históricos. El stock físico real del inventario actual **no sufrirá ninguna alteración numérica**.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs font-semibold text-slate-600">
                  <p className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Entrada de Bitácora a Remover:</p>
                  <p className="font-black text-slate-800 mt-1 text-xs">{selectedMovimiento.inventario?.nombre}</p>
                  <p className="text-[#004091] mt-0.5">
                    Operación clasificada como <span className="font-bold">({TIPO_CONFIG[selectedMovimiento.tipo_movimiento]?.label})</span> por {selectedMovimiento.cantidad} uds.
                  </p>
                </div>

                <div className="pt-2 flex flex-col-reverse sm:flex-row justify-end gap-2">
                  <button onClick={closeModal} disabled={isActionLoading}
                    className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all disabled:opacity-50">
                    Conservar Registro
                  </button>
                  <button onClick={handleDeleteRegistro} disabled={isActionLoading}
                    className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-md shadow-red-100 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 transform active:scale-95">
                    <Trash2 size={14} /> {isActionLoading ? "Borrando..." : "Confirmar Remoción"}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}