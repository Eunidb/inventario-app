/**
 * @file app/formatos/page.tsx
 * @description Módulo de Formatos de Trabajo.
 * Tabla principal paginada con filtros, búsqueda de texto,
 * acciones CRUD y acceso al panel de llenado de formularios.
 *
 * CORRECCIONES:
 * - Aplicación de color institucional (#004091).
 * - Animaciones formales (fade-in, slide-in) y transiciones en interacciones.
 * - Revisión ortográfica y mejora de responsividad.
 * - Lógica de componentes, estados y consultas a Supabase intacta.
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
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Camera,
} from "lucide-react";
import {
  ESTADO_CONFIG,
  FORMATO_CONFIG,
  type EstadoTrabajo,
  type TrabajoExpediente,
} from "@/components/formatos/types";

// ─── Constante: expedientes por página ──────────────────────────────────────
const PER_PAGE = 20;

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
export default function FormatosPage() {
  // ── Estados de datos de la tabla ─────────────────────────────────────────
  const [trabajos, setTrabajos] = useState<TrabajoExpediente[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [estadoFilter, setEstadoFilter] = useState<EstadoTrabajo | "">("");

  // ── Control de modales y panel lateral ───────────────────────────────────
  const [modalNuevo, setModalNuevo] = useState(false);
  const [trabajoEditar, setTrabajoEditar] = useState<TrabajoExpediente | null>(
    null,
  );
  const [trabajoActivo, setTrabajoActivo] = useState<TrabajoExpediente | null>(
    null,
  );

  // ── Permisos ──────────────────────────────────────────────────────────────
  const [isAdmin, setIsAdmin] = useState(false);

  // ── Verificar rol del usuario autenticado ─────────────────────────────────
  useEffect(() => {
    const checkRol = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data: perfil } = await supabase
        .from("usuarios")
        .select("rol")
        .eq("id", user.id)
        .maybeSingle();
      setIsAdmin(perfil?.rol === "admin");
    };
    checkRol();
  }, []);

  // ── Cargar expedientes desde Supabase ─────────────────────────────────────
  const loadTrabajos = useCallback(async () => {
    setIsLoading(true);
    const supabase = createClient();
    try {
      let q = supabase
        .from("trabajos")
        .select(
          `*,
          creador:creado_por(nombre_completo),
          departamento:departamento_id(nombre),
          registros_formato(id, tipo, completado, imagen_url)`,
          { count: "exact" },
        )
        .order("fecha_apertura", { ascending: false })
        .range((page - 1) * PER_PAGE, page * PER_PAGE - 1);

      if (estadoFilter) q = q.eq("estado", estadoFilter);

      const { data, error, count } = await q;
      if (error) throw error;

      setTrabajos((data as unknown as TrabajoExpediente[]) ?? []);
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

  // ── Filtro local por texto ────────────────────────────────────────────────
  const filtered = trabajos.filter((t) => {
    const term = search.toLowerCase().trim();
    return (
      !term ||
      t.folio?.toLowerCase().includes(term) ||
      t.titulo?.toLowerCase().includes(term) ||
      t.area_solicitante?.toLowerCase().includes(term) ||
      t.creador?.nombre_completo?.toLowerCase().includes(term) ||
      t.maquina?.toLowerCase().includes(term)
    );
  });

  // ── Paginación ────────────────────────────────────────────────────────────
  const rangoDesde = totalCount === 0 ? 0 : (page - 1) * PER_PAGE + 1;
  const rangoHasta = Math.min(page * PER_PAGE, totalCount);
  const totalPaginas = Math.ceil(totalCount / PER_PAGE);

  /** Fecha corta para la columna de la tabla */
  const fmtFecha = (f: string) =>
    new Date(f).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  /**
   * Calcula completos/total/% para la barra de progreso de formularios.
   * Se recibe el array registros_formato de cada expediente.
   */
  const calcularProgreso = (
    registros: TrabajoExpediente["registros_formato"],
  ) => {
    const total = registros?.length ?? 0;
    const completos = registros?.filter((r) => r.completado).length ?? 0;
    return {
      total,
      completos,
      pct: total > 0 ? Math.round((completos / total) * 100) : 0,
    };
  };

  /** Abre el modal en modo edición con los datos del trabajo seleccionado */
  const handleEditar = (t: TrabajoExpediente) => {
    setTrabajoEditar(t);
    setModalNuevo(true);
  };

  /** Elimina el expediente tras confirmación; solo visible para admin */
  const handleEliminar = async (t: TrabajoExpediente) => {
    if (
      !confirm(
        `¿Eliminar el expediente "${t.folio ?? "#" + t.id}" permanentemente?`,
      )
    )
      return;
    const supabase = createClient();
    const { error } = await supabase.from("trabajos").delete().eq("id", t.id);
    if (error) {
      alert("Error al eliminar: " + error.message);
      return;
    }
    loadTrabajos();
  };

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="flex-1 lg:ml-64 w-full">
        <div className="p-4 md:p-8 lg:p-10 pt-20 lg:pt-10 max-w-7xl mx-auto animate-in fade-in duration-700">
          {/* ── Encabezado ──────────────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Formatos de Trabajo
              </h1>
              <p className="text-slate-500 font-medium mt-1 text-sm">
                Expedientes de mantenimiento con formularios físicos digitalizados
              </p>
            </div>
            <button
              onClick={() => {
                setTrabajoEditar(null);
                setModalNuevo(true);
              }}
              className="inline-flex items-center justify-center gap-2 bg-[#004091] hover:bg-[#002f6c]
                         text-white px-5 py-2.5 rounded-xl font-semibold
                         shadow-lg shadow-[#004091]/20 transition-all duration-300 hover:-translate-y-0.5
                         self-start sm:self-auto"
            >
              <Plus size={18} /> Abrir Expediente
            </button>
          </div>

          {/* ── Filtros ─────────────────────────────────────────────────────── */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col sm:flex-row gap-3 transition-all duration-300 hover:shadow-md">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por folio, título, máquina, área o técnico..."
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200
                           rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#004091]/20
                           focus:border-[#004091]/50 transition-all duration-300"
              />
            </div>
            <select
              value={estadoFilter}
              onChange={(e) => {
                setEstadoFilter(e.target.value as EstadoTrabajo | "");
                setPage(1);
              }}
              className="py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-xl
                         text-sm text-slate-600 font-medium outline-none cursor-pointer
                         focus:ring-2 focus:ring-[#004091]/20 focus:border-[#004091]/50 transition-all duration-300"
            >
              <option value="">Todos los estados</option>
              {Object.entries(ESTADO_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>

          {/* ── Tabla principal ──────────────────────────────────────────── */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden transition-all duration-500">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-4 sm:px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                      Folio
                    </th>
                    <th className="px-4 sm:px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                      Trabajo
                    </th>
                    <th className="px-4 sm:px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest hidden md:table-cell">
                      Formularios
                    </th>
                    <th className="px-4 sm:px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest hidden lg:table-cell">
                      Creado por
                    </th>
                    <th className="px-4 sm:px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest hidden lg:table-cell">
                      Fecha
                    </th>
                    <th className="px-4 sm:px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">
                      Estado
                    </th>
                    <th className="px-3 sm:px-4 py-4 w-28" />
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-50">
                  {isLoading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i} className="animate-in fade-in duration-500">
                        <td colSpan={7} className="px-6 py-4">
                          <div className="h-6 bg-slate-100 rounded-lg animate-pulse" />
                        </td>
                      </tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr className="animate-in fade-in duration-500">
                      <td
                        colSpan={7}
                        className="py-16 text-center text-slate-400 text-sm font-medium"
                      >
                        No hay expedientes registrados
                      </td>
                    </tr>
                  ) : (
                    filtered.map((t, index) => {
                      const est = ESTADO_CONFIG[t.estado];
                      const EstIcon = est?.Icon;
                      const { total, completos, pct } = calcularProgreso(
                        t.registros_formato,
                      );

                      return (
                        <tr
                          key={t.id}
                          className="hover:bg-[#004091]/5 transition-colors duration-300 group animate-in fade-in slide-in-from-bottom-2"
                          style={{ animationFillMode: "both", animationDelay: `${index * 50}ms` }}
                        >
                          {/* ── Folio ── */}
                          <td className="px-4 sm:px-6 py-4">
                            <span className="font-mono text-xs font-black text-[#004091] bg-[#004091]/10 px-2 sm:px-2.5 py-1 rounded-lg whitespace-nowrap transition-colors duration-300">
                              {t.folio ?? `#${String(t.id).substring(0, 6)}`}
                            </span>
                          </td>

                          {/* ── Título, máquina y área ── */}
                          <td className="px-4 sm:px-6 py-4 max-w-[180px] sm:max-w-[220px]">
                            <p className="text-sm font-bold text-slate-800 truncate transition-colors duration-300 group-hover:text-[#004091]">
                              {t.titulo}
                            </p>
                            {t.maquina && (
                              <p className="text-[11px] text-[#004091]/80 font-mono truncate">
                                {t.maquina}
                              </p>
                            )}
                            <p className="text-[11px] text-slate-400 font-medium truncate">
                              {t.area_solicitante || "Sin área"}
                            </p>
                            {/* Barra de progreso en mobile */}
                            <div className="flex items-center gap-1.5 mt-1.5 md:hidden">
                              <span className="text-[10px] font-bold text-slate-400">
                                {completos}/{total}
                              </span>
                              <div className="w-14 bg-slate-100 rounded-full h-1 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ease-out ${pct === 100 ? "bg-emerald-500" : "bg-[#004091]"}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* ── Progreso de formularios (desktop) ── */}
                          <td className="px-4 sm:px-6 py-4 hidden md:table-cell">
                            <div className="flex items-center gap-2">
                              <div className="flex -space-x-1">
                                {(t.registros_formato ?? []).map((r) => {
                                  const cfg = FORMATO_CONFIG[r.tipo];
                                  const FIcon = cfg?.Icon;
                                  return FIcon ? (
                                    <div
                                      key={r.id}
                                      title={`${cfg.label}${r.completado ? " ✓" : " (pendiente)"}`}
                                      className={`w-6 h-6 rounded-full border-2 border-white
                                                  flex items-center justify-center transition-colors duration-300
                                                  ${r.completado ? "bg-emerald-100" : "bg-slate-100 group-hover:bg-[#004091]/10"}`}
                                    >
                                      <FIcon
                                        size={10}
                                        className={
                                          r.completado
                                            ? "text-emerald-600"
                                            : "text-slate-400 group-hover:text-[#004091]/60"
                                        }
                                      />
                                    </div>
                                  ) : null;
                                })}
                              </div>
                              <span className="text-[10px] font-bold text-slate-500 whitespace-nowrap">
                                {completos}/{total}
                              </span>
                              <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ease-out ${pct === 100 ? "bg-emerald-500" : "bg-[#004091]"}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              {(t.registros_formato ?? []).some(
                                (r) => r.imagen_url,
                              ) && (
                                <span
                                  title="Tiene fotos adjuntas"
                                  className="flex-shrink-0"
                                >
                                  <Camera size={12} className="text-[#004091]/60" />
                                </span>
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

                          {/* ── Badge de estado ── */}
                          <td className="px-4 sm:px-6 py-4 text-center">
                            {est && EstIcon && (
                              <span
                                className={`inline-flex items-center gap-1 px-2 sm:px-2.5 py-1
                                               rounded-xl text-[10px] font-bold border whitespace-nowrap
                                               transition-all duration-300 ${est.cls}`}
                              >
                                <EstIcon size={10} />
                                <span className="hidden sm:inline">
                                  {est.label}
                                </span>
                              </span>
                            )}
                          </td>

                          {/* ── Botones de acción ── */}
                          <td className="px-3 sm:px-4 py-4">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                              {/* Ver y llenar formularios */}
                              <button
                                onClick={() => setTrabajoActivo(t)}
                                className="p-2 rounded-lg text-slate-400 hover:text-[#004091] hover:bg-[#004091]/10 transition-all duration-300"
                                title="Ver y llenar expediente"
                              >
                                <Eye size={15} />
                              </button>

                              {/* Editar datos del expediente */}
                              <button
                                onClick={() => handleEditar(t)}
                                className="p-2 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-all duration-300"
                                title="Editar expediente"
                              >
                                <Pencil size={15} />
                              </button>

                              {/* Eliminar — solo admin */}
                              {isAdmin && (
                                <button
                                  onClick={() => handleEliminar(t)}
                                  className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all duration-300"
                                  title="Eliminar expediente permanentemente"
                                >
                                  <Trash2 size={15} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* ── Paginación ──────────────────────────────────────────────── */}
            <div className="px-4 sm:px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between transition-colors duration-300">
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
                             hover:bg-[#004091]/5 hover:text-[#004091] hover:border-[#004091]/20 
                             disabled:opacity-40 disabled:hover:bg-white disabled:hover:border-slate-200 disabled:hover:text-slate-500
                             transition-all duration-300"
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
                             hover:bg-[#004091]/5 hover:text-[#004091] hover:border-[#004091]/20 
                             disabled:opacity-40 disabled:hover:bg-white disabled:hover:border-slate-200 disabled:hover:text-slate-500
                             transition-all duration-300"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── Modal: crear o editar expediente ──────────────────────────────── */}
      {modalNuevo && (
        <ModalNuevoTrabajo
          trabajo={trabajoEditar}
          onClose={() => {
            setModalNuevo(false);
            setTrabajoEditar(null);
          }}
          onSaved={() => {
            loadTrabajos();
            setModalNuevo(false);
            setTrabajoEditar(null);
          }}
        />
      )}

      {/* ── Panel lateral: ver y llenar formularios del expediente ─────────── */}
      {trabajoActivo && (
        <PanelExpediente
          trabajo={trabajoActivo}
          onClose={() => setTrabajoActivo(null)}
          onUpdated={loadTrabajos}
          onEdit={handleEditar}
        />
      )}
    </div>
  );
}