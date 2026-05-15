/**
 * @file app/formatos/page.tsx
 * @description Página principal del módulo de Formatos de Trabajo.
 *
 * Muestra la tabla de expedientes de mantenimiento con paginación,
 * filtros por estado y búsqueda por texto.
 *
 * COMPONENTES IMPORTADOS:
 *   - ModalNuevoTrabajo  → Modal para crear un nuevo expediente
 *   - PanelExpediente    → Panel lateral para ver y llenar los formularios
 *   (ambos en /components/formatos/)
 *
 * RESPONSIVE:
 *   - La tabla oculta columnas progresivamente en pantallas pequeñas.
 *   - Los modales y el panel se adaptan a mobile y desktop.
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/client";
import Sidebar from "@/components/sidebar";
import ModalNuevoTrabajo from "@/components/formatos/ModalNuevoTrabajo";
import PanelExpediente from "@/components/formatos/PanelExpediente";
import {
  Plus,
  Search,
  Eye,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Camera,
} from "lucide-react";
import {
  ESTADO_CONFIG,
  FORMATO_CONFIG,
  type EstadoTrabajo,
  type TipoFormato,
} from "@/components/formatos/types";

// ─── Constante: expedientes por página ──────────────────────────────────────
const PER_PAGE = 20;

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
export default function FormatosPage() {
  // ── Estado de la tabla ────────────────────────────────────────────────────
  const [trabajos, setTrabajos] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [estadoFilter, setEstadoFilter] = useState<EstadoTrabajo | "">("");

  // ── Control de modales ────────────────────────────────────────────────────
  const [modalNuevo, setModalNuevo] = useState(false);
  const [trabajoActivo, setTrabajoActivo] = useState<any | null>(null);

  // ── Cargar expedientes desde Supabase ─────────────────────────────────────
  const loadTrabajos = useCallback(async () => {
    setIsLoading(true);
    const supabase = createClient();
    try {
      let q = supabase
        .from("trabajos")
        .select(
          `
          *,
          creador:creado_por(nombre_completo),
          departamento:departamento_id(nombre),
          registros_formato(id, tipo, completado, imagen_url)
        `,
          { count: "exact" },
        )
        .order("fecha_apertura", { ascending: false })
        .range((page - 1) * PER_PAGE, page * PER_PAGE - 1);

      if (estadoFilter) q = q.eq("estado", estadoFilter);

      const { data, error, count } = await q;
      if (error) throw error;
      setTrabajos(data ?? []);
      setTotalCount(count ?? 0);
    } catch (err) {
      console.error("Error cargando expedientes:", err);
    } finally {
      setIsLoading(false);
    }
  }, [page, estadoFilter]);

  useEffect(() => {
    loadTrabajos();
  }, [loadTrabajos]);

  // ── Filtro local por texto (folio, título, área, creador) ─────────────────
  const filtered = trabajos.filter((t) => {
    const term = search.toLowerCase();
    return (
      !term ||
      t.folio?.toLowerCase().includes(term) ||
      t.titulo?.toLowerCase().includes(term) ||
      t.area_solicitante?.toLowerCase().includes(term) ||
      t.creador?.nombre_completo?.toLowerCase().includes(term)
    );
  });

  // ── Cálculos de paginación ────────────────────────────────────────────────
  const rangoDesde = totalCount === 0 ? 0 : (page - 1) * PER_PAGE + 1;
  const rangoHasta = Math.min(page * PER_PAGE, totalCount);
  const totalPaginas = Math.ceil(totalCount / PER_PAGE);

  /** Formato de fecha corto para la columna de fecha */
  const fmtFecha = (f: string) =>
    new Date(f).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  /**
   * Calcula el progreso de formularios de un expediente.
   * @returns { total, completos } para la barra y el contador.
   */
  const progreso = (registros: any[]) => ({
    total: registros?.length ?? 0,
    completos: registros?.filter((r) => r.completado).length ?? 0,
  });

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="flex-1 lg:ml-64 w-full">
        <div className="p-4 md:p-8 lg:p-10 pt-20 lg:pt-10 max-w-7xl mx-auto">
          {/* ── Encabezado de la página ── */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Formatos de Trabajo
              </h1>
              <p className="text-slate-500 font-medium mt-1 text-sm">
                Expedientes de mantenimiento con formularios físicos
                digitalizados
              </p>
            </div>
            <button
              onClick={() => setModalNuevo(true)}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700
                         text-white px-5 py-2.5 rounded-xl font-semibold
                         shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5
                         self-start sm:self-auto"
            >
              <Plus size={18} /> Abrir Expediente
            </button>
          </div>

          {/* ── Filtros: búsqueda de texto + selector de estado ── */}
          <div
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6
                          flex flex-col sm:flex-row gap-3"
          >
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por folio, título, área o técnico..."
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200
                           rounded-xl text-sm outline-none
                           focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              />
            </div>
            <select
              value={estadoFilter}
              onChange={(e) => {
                setEstadoFilter(e.target.value as any);
                setPage(1);
              }}
              className="py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-xl
                         text-sm text-slate-600 font-medium outline-none cursor-pointer"
            >
              <option value="">Todos los estados</option>
              {Object.entries(ESTADO_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>

          {/* ── Tabla de expedientes ── */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {/* Folio — siempre visible */}
                    <th className="px-4 sm:px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                      Folio
                    </th>
                    {/* Trabajo (título + área) — siempre visible */}
                    <th className="px-4 sm:px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                      Trabajo
                    </th>
                    {/* Formularios (progreso) — desde md */}
                    <th className="px-4 sm:px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest hidden md:table-cell">
                      Formularios
                    </th>
                    {/* Creado por — desde lg */}
                    <th className="px-4 sm:px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest hidden lg:table-cell">
                      Creado por
                    </th>
                    {/* Fecha — desde lg */}
                    <th className="px-4 sm:px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest hidden lg:table-cell">
                      Fecha
                    </th>
                    {/* Estado — siempre visible */}
                    <th className="px-4 sm:px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">
                      Estado
                    </th>
                    {/* Acciones */}
                    <th className="px-3 sm:px-4 py-4 w-12" />
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-50">
                  {isLoading ? (
                    // Esqueleto de carga
                    [...Array(5)].map((_, i) => (
                      <tr key={i}>
                        <td colSpan={7} className="px-6 py-4">
                          <div className="h-6 bg-slate-100 rounded-lg animate-pulse" />
                        </td>
                      </tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-16 text-center text-slate-400 text-sm font-medium"
                      >
                        No hay expedientes registrados
                      </td>
                    </tr>
                  ) : (
                    filtered.map((t) => {
                      const est = ESTADO_CONFIG[t.estado as EstadoTrabajo];
                      const EstIcon = est?.Icon;
                      const { total, completos } = progreso(
                        t.registros_formato,
                      );
                      const pct =
                        total > 0 ? Math.round((completos / total) * 100) : 0;

                      return (
                        <tr
                          key={t.id}
                          className="hover:bg-blue-50/30 transition-colors group"
                        >
                          {/* ── Folio ── */}
                          <td className="px-4 sm:px-6 py-4">
                            <span
                              className="font-mono text-xs font-black text-blue-600
                                           bg-blue-50 px-2 sm:px-2.5 py-1 rounded-lg whitespace-nowrap"
                            >
                              {t.folio ?? `#${t.id}`}
                            </span>
                          </td>

                          {/* ── Título y área solicitante ── */}
                          <td className="px-4 sm:px-6 py-4 max-w-[160px] sm:max-w-[200px]">
                            <p className="text-sm font-bold text-slate-800 truncate">
                              {t.titulo}
                            </p>
                            <p className="text-[11px] text-slate-400 font-medium truncate">
                              {t.area_solicitante}
                            </p>
                            {/* En mobile muestra el progreso aquí */}
                            <div className="flex items-center gap-1.5 mt-1 md:hidden">
                              <span className="text-[10px] font-bold text-slate-400">
                                {completos}/{total}
                              </span>
                              <div className="w-12 bg-slate-100 rounded-full h-1 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${pct === 100 ? "bg-emerald-500" : "bg-blue-500"}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* ── Progreso de formularios ── */}
                          <td className="px-4 sm:px-6 py-4 hidden md:table-cell">
                            <div className="flex items-center gap-2">
                              {/* Ícono de cada formulario (apilados) */}
                              <div className="flex -space-x-1">
                                {(t.registros_formato ?? []).map((r: any) => {
                                  const cfg =
                                    FORMATO_CONFIG[r.tipo as TipoFormato];
                                  const FIcon = cfg?.Icon;
                                  return FIcon ? (
                                    <div
                                      key={r.id}
                                      title={`${cfg.label}${r.completado ? " ✓" : " (pendiente)"}`}
                                      className={`w-6 h-6 rounded-full border-2 border-white
                                                flex items-center justify-center
                                                ${r.completado ? "bg-emerald-100" : "bg-slate-100"}`}
                                    >
                                      <FIcon
                                        size={10}
                                        className={
                                          r.completado
                                            ? "text-emerald-600"
                                            : "text-slate-400"
                                        }
                                      />
                                    </div>
                                  ) : null;
                                })}
                              </div>
                              {/* Contador y barra */}
                              <span className="text-[10px] font-bold text-slate-500 whitespace-nowrap">
                                {completos}/{total}
                              </span>
                              <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all
                                            ${pct === 100 ? "bg-emerald-500" : "bg-blue-500"}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              {/* Ícono de imagen si algún formulario tiene foto adjunta */}
                              {(t.registros_formato ?? []).some(
                                (r: any) => r.imagen_url,
                              ) && (
                                <Camera size={12} className="text-blue-400">
                                  <title>Tiene imágenes adjuntas</title>
                                </Camera>
                              )}
                            </div>
                          </td>

                          {/* ── Creado por ── */}
                          <td className="px-4 sm:px-6 py-4 hidden lg:table-cell text-sm text-slate-600">
                            {t.creador?.nombre_completo ?? "—"}
                          </td>

                          {/* ── Fecha de apertura ── */}
                          <td className="px-4 sm:px-6 py-4 hidden lg:table-cell text-xs text-slate-500 whitespace-nowrap">
                            {fmtFecha(t.fecha_apertura)}
                          </td>

                          {/* ── Estado del expediente ── */}
                          <td className="px-4 sm:px-6 py-4 text-center">
                            {est && (
                              <span
                                className={`inline-flex items-center gap-1 px-2 sm:px-2.5 py-1
                                             rounded-xl text-[10px] font-bold border whitespace-nowrap
                                             ${est.cls}`}
                              >
                                <EstIcon size={10} />
                                <span className="hidden sm:inline">
                                  {est.label}
                                </span>
                              </span>
                            )}
                          </td>

                          {/* ── Acción: ver expediente ── */}
                          <td className="px-3 sm:px-4 py-4">
                            <button
                              onClick={() => setTrabajoActivo(t)}
                              className="p-2 rounded-lg text-slate-400 hover:text-blue-600
                                       hover:bg-blue-50 transition-all
                                       opacity-0 group-hover:opacity-100"
                              title="Ver y llenar expediente"
                            >
                              <Eye size={15} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* ── Paginación "1–20 de 45" ── */}
            <div
              className="px-4 sm:px-6 py-4 bg-slate-50/50 border-t border-slate-100
                            flex items-center justify-between"
            >
              <p className="text-sm font-medium text-slate-500">
                {isLoading ? (
                  "Cargando..."
                ) : totalCount === 0 ? (
                  "Sin resultados"
                ) : (
                  <>
                    <span className="font-bold text-slate-900">
                      {rangoDesde}–{rangoHasta}
                    </span>{" "}
                    de{" "}
                    <span className="font-bold text-slate-900">
                      {totalCount}
                    </span>
                  </>
                )}
              </p>
              <div className="flex items-center gap-2">
                <button
                  disabled={page === 1 || isLoading}
                  onClick={() => setPage((p) => p - 1)}
                  className="p-2 rounded-xl text-slate-500 bg-white border border-slate-200
                             hover:bg-slate-50 disabled:opacity-40 transition-all"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm font-bold text-slate-600 min-w-[60px] text-center">
                  {page} / {totalPaginas || 1}
                </span>
                <button
                  disabled={page >= totalPaginas || isLoading}
                  onClick={() => setPage((p) => p + 1)}
                  className="p-2 rounded-xl text-slate-500 bg-white border border-slate-200
                             hover:bg-slate-50 disabled:opacity-40 transition-all"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── Modal: crear nuevo expediente ── */}
      {modalNuevo && (
        <ModalNuevoTrabajo
          onClose={() => setModalNuevo(false)}
          onSaved={() => {
            loadTrabajos();
            setModalNuevo(false);
          }}
        />
      )}

      {/* ── Panel lateral: ver y llenar expediente ── */}
      {trabajoActivo && (
        <PanelExpediente
          trabajo={trabajoActivo}
          onClose={() => setTrabajoActivo(null)}
          onUpdated={loadTrabajos}
        />
      )}
    </div>
  );
}
