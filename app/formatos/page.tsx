/**
 * @file app/formatos/page.tsx
 * @description Módulo de formatos optimizado y completamente responsivo.
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

const PER_PAGE = 20;

export default function FormatosPage() {
  const [trabajos, setTrabajos] = useState<TrabajoExpediente[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [estadoFilter, setEstadoFilter] = useState<EstadoTrabajo | "">("");
  const [modalNuevo, setModalNuevo] = useState(false);
  const [trabajoEditar, setTrabajoEditar] = useState<TrabajoExpediente | null>(null);
  const [trabajoActivo, setTrabajoActivo] = useState<TrabajoExpediente | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

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
          { count: "exact" }
        )
        .order("fecha_apertura", {
          ascending: false,
        })
        .range(
          (page - 1) * PER_PAGE,
          (page * PER_PAGE) - 1 // <--- CORRECCIÓN AQUÍ: Se resta 1 para incluir exactamente 20 registros
        );

      if (estadoFilter) {
        q = q.eq("estado", estadoFilter);
      }

      const { data, error, count } = await q;

      if (error) throw error;

      setTrabajos((data as unknown as TrabajoExpediente[]) ?? []);
      setTotalCount(count ?? 0);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [page, estadoFilter]);

  useEffect(() => {
    loadTrabajos();
  }, [loadTrabajos]);

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

  const rangoDesde = totalCount === 0 ? 0 : (page - 1) * PER_PAGE + 1;
  const rangoHasta = Math.min(page * PER_PAGE, totalCount);
  const totalPaginas = Math.ceil(totalCount / PER_PAGE);

  const fmtFecha = (f: string) =>
    new Date(f).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const calcularProgreso = (registros: TrabajoExpediente["registros_formato"]) => {
    const total = registros?.length ?? 0;
    const completos = registros?.filter((r) => r.completado).length ?? 0;

    return {
      total,
      completos,
      pct: total > 0 ? Math.round((completos / total) * 100) : 0,
    };
  };

  const handleEditar = (t: TrabajoExpediente) => {
    setTrabajoEditar(t);
    setModalNuevo(true);
  };

  const handleEliminar = async (t: TrabajoExpediente) => {
    if (!confirm(`¿Eliminar el expediente "${t.folio ?? "#" + t.id}" permanentemente?`)) {
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.from("trabajos").delete().eq("id", t.id);

    if (error) {
      alert("Ocurrió un error al eliminar el expediente.");
      return;
    }

    loadTrabajos();
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />

      <main className="flex-1 w-full lg:pl-64 overflow-hidden">
        <div className="w-full max-w-[1700px] mx-auto px-3 sm:px-5 md:px-8 lg:px-10 pt-24 lg:pt-10 pb-8">
          {/* HEADER */}
          <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-5 mb-7">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
                Formatos de Trabajo
              </h1>
              <p className="text-slate-500 font-medium mt-2 text-sm">
                Expedientes digitales de mantenimiento con formularios administrativos y técnicos.
              </p>
            </div>

            <button
              onClick={() => {
                setTrabajoEditar(null);
                setModalNuevo(true);
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#014ba0] hover:bg-[#013b82] text-white px-5 py-3 rounded-2xl font-bold shadow-lg shadow-[#014ba0]/20 transition-all duration-300 hover:-translate-y-0.5"
            >
              <Plus size={18} />
              Abrir Expediente
            </button>
          </div>

          {/* FILTROS */}
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm mb-6 transition-all duration-300">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar folio, título, área, máquina o técnico..."
                  className="w-full min-h-[50px] pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium outline-none transition-all duration-300 focus:ring-4 focus:ring-[#014ba0]/10 focus:border-[#014ba0]"
                />
              </div>

              <select
                value={estadoFilter}
                onChange={(e) => {
                  setEstadoFilter(e.target.value as EstadoTrabajo | "");
                  setPage(1);
                }}
                className="min-h-[50px] px-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-700 outline-none transition-all duration-300 focus:ring-4 focus:ring-[#014ba0]/10 focus:border-[#014ba0]"
              >
                <option value="">Todos los estados</option>
                {Object.entries(ESTADO_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* TABLA */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="w-full overflow-x-auto">
              <table className="min-w-[1200px] w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-[#014ba0] to-[#004091]">
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-white">Folio</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-white">Trabajo</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-white">Formularios</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-white">Responsable</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-white">Fecha</th>
                    <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-white">Estado</th>
                    <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-white">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i}>
                        <td colSpan={7} className="px-6 py-5">
                          <div className="h-5 bg-slate-100 rounded-xl animate-pulse" />
                        </td>
                      </tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-20 text-center text-slate-400 font-semibold">
                        No existen expedientes registrados.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((t, index) => {
                      const est = ESTADO_CONFIG[t.estado];
                      const EstIcon = est?.Icon;
                      const { total, completos, pct } = calcularProgreso(t.registros_formato);

                      return (
                        <tr
                          key={t.id}
                          className="hover:bg-[#014ba0]/5 transition-all duration-300 even:bg-slate-50/40 group animate-in fade-in"
                          style={{ animationDelay: `${index * 40}ms` }}
                        >
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-3 py-1 rounded-xl bg-[#014ba0]/10 text-[#014ba0] text-xs font-black font-mono whitespace-nowrap">
                              {t.folio ?? `#${String(t.id).substring(0, 6)}`}
                            </span>
                          </td>
                          <td className="px-6 py-4 max-w-[300px]">
                            <p className="text-sm font-bold text-slate-800 truncate group-hover:text-[#014ba0] transition-colors duration-300">
                              {t.titulo}
                            </p>
                            {t.maquina && (
                              <p className="text-xs text-[#014ba0] font-mono truncate mt-1">{t.maquina}</p>
                            )}
                            <p className="text-xs text-slate-400 truncate mt-1">
                              {t.area_solicitante || "Sin área asignada"}
                            </p>
                            <div className="flex items-center gap-2 mt-2 md:hidden">
                              <span className="text-[10px] font-bold text-slate-500">
                                {completos}/{total}
                              </span>
                              <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    pct === 100 ? "bg-emerald-500" : "bg-[#014ba0]"
                                  }`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex -space-x-1">
                                {(t.registros_formato ?? []).map((r) => {
                                  const cfg = FORMATO_CONFIG[r.tipo];
                                  const FIcon = cfg?.Icon;
                                  return FIcon ? (
                                    <div
                                      key={r.id}
                                      className={`w-7 h-7 rounded-full border-2 border-white flex items-center justify-center transition-all duration-300 ${
                                        r.completado ? "bg-emerald-100" : "bg-slate-100"
                                      }`}
                                    >
                                      <FIcon
                                        size={11}
                                        className={r.completado ? "text-emerald-600" : "text-slate-400"}
                                      />
                                    </div>
                                  ) : null;
                                })}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-500 whitespace-nowrap">
                                  {completos}/{total}
                                </span>
                                <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      pct === 100 ? "bg-emerald-500" : "bg-[#014ba0]"
                                    }`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                {(t.registros_formato ?? []).some((r) => r.imagen_url) && (
                                  <Camera size={14} className="text-[#014ba0]/70" />
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600 font-medium whitespace-nowrap">
                            {t.creador?.nombre_completo ?? "—"}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                            {fmtFecha(t.fecha_apertura)}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {est && EstIcon && (
                              <span
                                className={`inline-flex items-center gap-1 px-3 py-1 rounded-xl text-[11px] font-bold border whitespace-nowrap transition-all duration-300 ${est.cls}`}
                              >
                                <EstIcon size={12} />
                                {est.label}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => setTrabajoActivo(t)}
                                className="p-2 rounded-xl text-[#014ba0] hover:bg-[#014ba0]/10 transition-all duration-300"
                                title="Ver expediente"
                              >
                                <Eye size={17} />
                              </button>
                              <button
                                onClick={() => handleEditar(t)}
                                className="p-2 rounded-xl text-amber-600 hover:bg-amber-50 transition-all duration-300"
                                title="Editar expediente"
                              >
                                <Pencil size={17} />
                              </button>
                              {isAdmin && (
                                <button
                                  onClick={() => handleEliminar(t)}
                                  className="p-2 rounded-xl text-red-600 hover:bg-red-50 transition-all duration-300"
                                  title="Eliminar expediente"
                                >
                                  <Trash2 size={17} />
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

            {/* PAGINACIÓN */}
            <div className="px-4 sm:px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
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

              <div className="flex items-center gap-3">
                <button
                  disabled={page === 1 || isLoading}
                  onClick={() => setPage((p) => p - 1)}
                  className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-[#014ba0]/5 hover:text-[#014ba0] transition-all duration-300 disabled:opacity-40"
                >
                  <ChevronLeft size={18} />
                </button>

                <span className="text-sm font-bold text-slate-700 min-w-[70px] text-center">
                  {page} / {totalPaginas || 1}
                </span>

                <button
                  disabled={page >= totalPaginas || isLoading}
                  onClick={() => setPage((p) => p + 1)}
                  className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-[#014ba0]/5 hover:text-[#014ba0] transition-all duration-300 disabled:opacity-40"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* MODAL */}
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

      {/* PANEL */}
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