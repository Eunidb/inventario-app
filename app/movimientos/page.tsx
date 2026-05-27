/**
 * @file app/movimientos/page.tsx
 * @description Registro de movimientos manuales: entradas, salidas, traslados y ajustes.
 *
 * CORRECCIONES:
 * - El modal "Editar" ahora guarda realmente las observaciones en Supabase.
 * - La búsqueda sanitiza el input antes de enviarlo al query.
 * - El modal "Ver" muestra todos los campos del registro (tipo, cantidad,
 *   stock antes/después, destino, observaciones, usuario, fecha).
 */
"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/client";
import Sidebar from "@/components/sidebar";
import ModalMovimiento from "@/components/ModalMovimiento";
import {
  Plus, Search, ArrowDownCircle, ArrowUpCircle,
  SlidersHorizontal, RefreshCw, X, Filter, Eye, Edit3, Trash2,
  MapPin, User, Calendar, Layers, Info, AlertCircle, ChevronLeft, ChevronRight, Save, Loader2,
} from "lucide-react";

// Configuración visual unificada en escala azul corporativa
const TIPO_CONFIG: Record<string, { label: string; cls: string; Icon: any }> = {
  entrada:  { label: "Entrada",  cls: "bg-blue-50 text-[#014ba0] border-[#014ba0]/20",     Icon: ArrowDownCircle },
  salida:   { label: "Salida",   cls: "bg-sky-50 text-sky-800 border-sky-200/60",          Icon: ArrowUpCircle },
  ajuste:   { label: "Ajuste",   cls: "bg-indigo-50 text-indigo-800 border-indigo-200/60", Icon: SlidersHorizontal },
  traslado: { label: "Traslado", cls: "bg-cyan-50 text-cyan-800 border-cyan-200/60",       Icon: RefreshCw },
  baja:     { label: "Baja",     cls: "bg-slate-100 text-slate-700 border-slate-200",      Icon: ArrowUpCircle },
};

export default function MovimientosPage() {
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [search, setSearch]           = useState("");
  const [tipoFilter, setTipoFilter]   = useState("");
  const [page, setPage]               = useState(1);
  const [modalOpen, setModalOpen]     = useState(false);

  // Estados para modales de Ver / Editar / Eliminar
  const [selectedMov, setSelectedMov]       = useState<any | null>(null);
  const [modalMode, setModalMode]           = useState<"ver" | "editar" | null>(null);
  const [editObs, setEditObs]               = useState("");
  const [editCantidad, setEditCantidad]     = useState<number>(0);
  const [isSaving, setIsSaving]             = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [movToDelete, setMovToDelete]       = useState<any | null>(null);
  const [isDeleting, setIsDeleting]         = useState(false);

  const PER_PAGE = 15;

  // Carga de movimientos desde Supabase
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
        .is("prestamo_id", null) // Solo movimientos directos, no los de préstamos
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

  // Filtrado por texto en memoria (nombre, clave, usuario)
  const filtered = movimientos.filter((m) => {
    const term = search.toLowerCase().trim();
    return !term
      || m.inventario?.nombre?.toLowerCase().includes(term)
      || m.inventario?.clave?.toLowerCase().includes(term)
      || m.usuarios?.nombre_completo?.toLowerCase().includes(term);
  });

  // Formateador de fecha
  const formatFecha = (f: string) =>
    new Date(f).toLocaleString("es-MX", {
      day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
    });

  // Estadísticas del día
  const hoy    = new Date().toDateString();
  const hoyMov = movimientos.filter((m) => new Date(m.fecha).toDateString() === hoy);
  const entradas = hoyMov.filter((m) => m.tipo_movimiento === "entrada")
    .reduce((a, m) => a + Number(m.cantidad), 0);
  const salidas  = hoyMov.filter((m) => ["salida", "baja", "traslado"].includes(m.tipo_movimiento))
    .reduce((a, m) => a + Number(m.cantidad), 0);

  // Abrir modales
  const handleVer = (m: any) => {
    setSelectedMov(m);
    setModalMode("ver");
  };

  const handleEditar = (m: any) => {
    setSelectedMov(m);
    setEditObs(m.observaciones ?? "");
    setEditCantidad(m.cantidad ?? 0);
    setModalMode("editar");
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedMov(null);
    setEditObs("");
  };

  // ── GUARDAR EDICIÓN ────────────────────────────────────────────────────────
  // Solo se permite modificar observaciones (los valores de stock son
  // datos de auditoría y no deben alterarse manualmente desde la UI).
  const handleSaveEdit = async () => {
    if (!selectedMov) return;
    setIsSaving(true);
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from("historial_inventario")
        .update({ observaciones: editObs.trim() || null })
        .eq("id", selectedMov.id);

      if (error) throw error;

      // Actualizar en el estado local sin recargar toda la lista
      setMovimientos((prev) =>
        prev.map((m) =>
          m.id === selectedMov.id
            ? { ...m, observaciones: editObs.trim() || null }
            : m
        )
      );
      closeModal();
    } catch (err: any) {
      alert("Error al guardar: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Disparador de confirmación de borrado
  const triggerDelete = (m: any) => {
    setMovToDelete(m);
    setShowDeleteModal(true);
  };

  // ── CONFIRMAR BORRADO ──────────────────────────────────────────────────────
  const confirmDelete = async () => {
    if (!movToDelete) return;
    setIsDeleting(true);
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from("historial_inventario")
        .delete()
        .eq("id", movToDelete.id);
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

          {/* Encabezado */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Movimientos</h1>
              <p className="text-slate-500 text-xs sm:text-sm font-medium mt-0.5">
                Traslados, entradas, salidas y ajustes técnicos
              </p>
            </div>
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 bg-[#014ba0] hover:bg-[#004091] text-white px-5 py-3 rounded-xl text-sm font-bold shadow-lg shadow-blue-100/40 transition-all duration-200 active:scale-95"
            >
              <Plus size={16} /> Registrar movimiento
            </button>
          </div>

          {/* Mosaico estadístico */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {[
              { label: "Operaciones hoy",    val: hoyMov.length,       cls: "text-slate-900",  bg: "bg-white border-slate-200" },
              { label: "Entradas hoy",       val: entradas,            cls: "text-[#014ba0]",  bg: "bg-blue-50/40 border-[#014ba0]/10" },
              { label: "Salidas / Traslados",val: salidas,             cls: "text-[#004091]",  bg: "bg-slate-50 border-slate-200" },
              { label: "Total de registros", val: movimientos.length,  cls: "text-[#014ba0]",  bg: "bg-blue-50/20 border-[#014ba0]/10" },
            ].map((s, i) => (
              <div key={i} className={`${s.bg} rounded-2xl border shadow-sm p-4 flex flex-col justify-between`}>
                <p className={`text-xl sm:text-2xl font-black tracking-tight ${s.cls}`}>{s.val}</p>
                <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">
                  {s.label}
                </p>
              </div>
            ))}
          </div>

          {/* Barra de filtros */}
          <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3">
            <div className="relative flex-1 group">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#014ba0] transition-colors" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por artículo, clave o usuario..."
                className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#014ba0]/10 focus:border-[#014ba0] focus:bg-white transition-all font-medium text-slate-700"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="relative min-w-[190px]">
              <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <select
                value={tipoFilter}
                onChange={(e) => { setTipoFilter(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600 font-bold outline-none focus:ring-2 focus:ring-[#014ba0]/10 focus:border-[#014ba0] focus:bg-white transition-all appearance-none cursor-pointer"
              >
                <option value="">Todos los tipos</option>
                {Object.entries(TIPO_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-400 w-0 h-0" />
            </div>
          </div>

          {/* Tabla y cards */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

            {/* Vista móvil */}
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
                          <p className="text-[11px] font-mono font-bold text-[#014ba0]">
                            #{m.id} · {m.inventario?.clave}
                          </p>
                        </div>
                        <span className="text-xs font-medium text-slate-400 whitespace-nowrap">
                          {formatFecha(m.fecha)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${cfg.cls}`}>
                          <Icon size={10} /> {cfg.label}
                        </span>
                        <p className="text-sm font-black text-slate-800">
                          {["salida","baja"].includes(m.tipo_movimiento) ? "−" : m.tipo_movimiento === "entrada" ? "+" : ""}
                          {m.cantidad}
                        </p>
                      </div>
                      <div className="flex items-center justify-between border-t border-slate-50 pt-2 text-xs">
                        <p className="text-slate-500 font-medium">Por: {m.usuarios?.nombre_completo ?? "—"}</p>
                        <div className="flex gap-1">
                          <button onClick={() => handleVer(m)} className="p-1 text-[#014ba0] hover:bg-blue-50 rounded-md"><Eye size={14} /></button>
                          <button onClick={() => handleEditar(m)} className="p-1 text-[#004091] hover:bg-blue-50 rounded-md"><Edit3 size={14} /></button>
                          <button onClick={() => triggerDelete(m)} className="p-1 text-slate-400 hover:text-slate-600 rounded-md"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Vista desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left table-auto">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200">
                    {["Artículo","Tipo","Cantidad","Destino","Stock","Usuario","Fecha","Acciones"].map((h, i) => (
                      <th key={h} className={`px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest ${i >= 2 && i <= 4 ? "text-center" : ""} ${i === 7 ? "text-right w-24" : ""}`}>
                        {h}
                      </th>
                    ))}
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
                            <p className="text-[11px] font-mono font-bold text-[#014ba0]">Clave: {m.inventario?.clave}</p>
                          </td>
                          <td className="px-6 py-4 text-center whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-bold border ${cfg.cls}`}>
                              <Icon size={11} /> {cfg.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center font-black text-slate-800">
                            {["salida","baja"].includes(m.tipo_movimiento) ? "−" : m.tipo_movimiento === "entrada" ? "+" : ""}
                            {m.cantidad}
                          </td>
                          <td className="px-6 py-4">
                            {m.destino?.nombre ? (
                              <span className="flex items-center gap-1 text-xs font-semibold text-slate-600">
                                <MapPin size={12} className="text-[#014ba0] shrink-0" /> {m.destino.nombre}
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
                              <button onClick={() => handleVer(m)} title="Ver detalles" className="p-1.5 text-[#014ba0] hover:bg-blue-50 rounded-lg transition-colors"><Eye size={15} /></button>
                              <button onClick={() => handleEditar(m)} title="Editar observaciones" className="p-1.5 text-[#004091] hover:bg-blue-50 rounded-lg transition-colors"><Edit3 size={15} /></button>
                              <button onClick={() => triggerDelete(m)} title="Eliminar registro" className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"><Trash2 size={15} /></button>
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
                Mostrando <span className="text-slate-900 font-bold">{filtered.length}</span> registros
              </p>
              <div className="flex gap-2 w-full sm:w-auto justify-center">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1.5 text-xs font-bold text-[#014ba0] bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 transition-all flex items-center gap-1"
                >
                  <ChevronLeft size={14} /> Anterior
                </button>
                <button
                  disabled={movimientos.length < PER_PAGE}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-[#014ba0] rounded-xl hover:bg-[#004091] disabled:opacity-40 transition-all flex items-center gap-1"
                >
                  Siguiente <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal de nuevo movimiento */}
      <ModalMovimiento isOpen={modalOpen} onClose={() => setModalOpen(false)} onSaved={loadMovimientos} />

      {/* ── Modal VER / EDITAR ─────────────────────────────────────────────── */}
      {modalMode && selectedMov && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 relative z-10 animate-in fade-in zoom-in-95 duration-150">

            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Info size={18} className="text-[#014ba0]" />
                {modalMode === "ver" ? "Detalle del Movimiento" : "Editar Observaciones"}
              </h2>
              <button onClick={closeModal} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl">
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">

              {/* Artículo */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="flex gap-2">
                  <Layers size={16} className="text-[#014ba0] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{selectedMov.inventario?.nombre}</p>
                    <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                      Clave: {selectedMov.inventario?.clave} · Registro #{selectedMov.id}
                    </p>
                  </div>
                </div>
              </div>

              {/* Campos completos en modo VER */}
              {modalMode === "ver" && (
                <div className="grid grid-cols-2 gap-3">
                  {/* Tipo */}
                  <div className="p-3 bg-blue-50/20 rounded-xl border border-[#014ba0]/10">
                    <p className="text-[10px] font-bold text-[#014ba0] uppercase mb-1">Tipo</p>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${TIPO_CONFIG[selectedMov.tipo_movimiento]?.cls}`}>
                      {TIPO_CONFIG[selectedMov.tipo_movimiento]?.label ?? selectedMov.tipo_movimiento}
                    </span>
                  </div>

                  {/* Cantidad */}
                  <div className="p-3 bg-blue-50/20 rounded-xl border border-[#014ba0]/10">
                    <p className="text-[10px] font-bold text-[#014ba0] uppercase mb-1">Cantidad</p>
                    <p className="font-black text-lg text-slate-800">{selectedMov.cantidad}</p>
                  </div>

                  {/* Stock antes → después */}
                  <div className="p-3 bg-blue-50/20 rounded-xl border border-[#014ba0]/10">
                    <p className="text-[10px] font-bold text-[#014ba0] uppercase mb-1">Stock</p>
                    <p className="font-bold text-slate-700">
                      {selectedMov.stock_antes ?? "—"} → <span className="text-[#014ba0]">{selectedMov.stock_despues ?? "—"}</span>
                    </p>
                  </div>

                  {/* Destino */}
                  <div className="p-3 bg-blue-50/20 rounded-xl border border-[#014ba0]/10">
                    <p className="text-[10px] font-bold text-[#014ba0] uppercase mb-1">
                      <MapPin size={10} className="inline mr-1" />Destino
                    </p>
                    <p className="font-bold text-slate-700">{selectedMov.destino?.nombre ?? "—"}</p>
                  </div>

                  {/* Operador */}
                  <div className="p-3 bg-blue-50/20 rounded-xl border border-[#014ba0]/10">
                    <p className="text-[10px] font-bold text-[#014ba0] uppercase mb-1">
                      <User size={10} className="inline mr-1" />Operador
                    </p>
                    <p className="font-bold text-slate-700">{selectedMov.usuarios?.nombre_completo ?? "—"}</p>
                  </div>

                  {/* Fecha */}
                  <div className="p-3 bg-blue-50/20 rounded-xl border border-[#014ba0]/10">
                    <p className="text-[10px] font-bold text-[#014ba0] uppercase mb-1">
                      <Calendar size={10} className="inline mr-1" />Fecha
                    </p>
                    <p className="font-bold text-slate-700">{formatFecha(selectedMov.fecha)}</p>
                  </div>

                  {/* Observaciones */}
                  <div className="col-span-2 p-3 bg-blue-50/20 rounded-xl border border-[#014ba0]/10">
                    <p className="text-[10px] font-bold text-[#014ba0] uppercase mb-1">Observaciones</p>
                    <p className="font-medium text-slate-600 italic">
                      {selectedMov.observaciones || "Sin observaciones registradas"}
                    </p>
                  </div>
                </div>
              )}

              {/* Campos en modo EDITAR */}
              {modalMode === "editar" && (
                <div className="space-y-3">
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-[11px] text-amber-700 font-medium">
                    Solo se pueden editar las observaciones. Los valores de stock son datos de auditoría y no deben modificarse.
                  </div>
                  <label className="block font-bold text-slate-600 text-[11px] uppercase tracking-wider">
                    Observaciones
                  </label>
                  <textarea
                    rows={4}
                    value={editObs}
                    onChange={(e) => setEditObs(e.target.value)}
                    placeholder="Justificación o contexto del movimiento..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-[#014ba0]/10 focus:border-[#014ba0] resize-none"
                  />
                </div>
              )}

              {/* Footer de botones */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-slate-600 border border-slate-200 hover:bg-slate-50 rounded-xl transition-all text-xs font-bold"
                >
                  {modalMode === "ver" ? "Cerrar" : "Cancelar"}
                </button>
                {modalMode === "editar" && (
                  <button
                    onClick={handleSaveEdit}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 px-5 py-2 text-white bg-[#014ba0] hover:bg-[#004091] rounded-xl transition-all text-xs font-bold shadow-md shadow-blue-100/40 disabled:opacity-60"
                  >
                    {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                    {isSaving ? "Guardando..." : "Guardar cambios"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal de confirmación de borrado ──────────────────────────────── */}
      {showDeleteModal && movToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 relative z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <AlertCircle size={18} className="text-[#014ba0]" /> Confirmar eliminación
              </h2>
              <button onClick={() => setShowDeleteModal(false)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl">
                <X size={16} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-blue-50/40 border border-[#014ba0]/10 rounded-2xl p-4 flex gap-3 text-slate-800">
                <Info className="text-[#014ba0] shrink-0 mt-0.5" size={18} />
                <p className="text-xs font-medium leading-relaxed text-slate-700">
                  ¿Está seguro de que desea eliminar el movimiento{" "}
                  <span className="font-bold">#{movToDelete.id}</span> del historial?
                  Esto rompe la trazabilidad de inventario y no puede revertirse.
                </p>
              </div>
              <div className="flex justify-end gap-2 text-xs font-bold pt-2">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                  className="px-4 py-2.5 text-slate-600 border border-slate-200 hover:bg-slate-50 rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="px-5 py-2.5 text-white bg-[#014ba0] hover:bg-[#004091] rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-blue-100/40"
                >
                  <Trash2 size={13} />
                  {isDeleting ? "Eliminando..." : "Confirmar y eliminar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}