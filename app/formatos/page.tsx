/**
 * @file app/formatos/page.tsx
 * @description Módulo de Formatos de Trabajo — Laboratorios Pier S.A. de C.V.
 *
 * CONCEPTO: "Expediente de Trabajo"
 *   Cada trabajo abre un expediente que agrupa automáticamente los
 *   formularios físicos que aplican según el tipo de trabajo:
 *
 *   SIEMPRE se generan:
 *     1. Solicitud de Trabajo   — lo llena el área que solicita el servicio
 *     2. Reporte de Servicio    — lo llena el técnico de Mantenimiento (Folio 0214)
 *
 *   SE GENERAN según el trabajo:
 *     3. Registro de Maquinaria de Producción — si el equipo es de producción
 *     4. Solicitud de Compra                  — si se requieren refacciones/material
 *     5. Registro Lab. Medicamentos / Prod.   — si el equipo es de lab. farmacéutico
 *
 * El reporte final del expediente muestra todos los formularios juntos.
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/client";
import Sidebar from "@/components/sidebar";
import {
  Plus, Search, ChevronLeft, ChevronRight, X, Save, Loader2,
  Camera, Upload, CheckCircle2, Clock, AlertCircle, XCircle,
  Wrench, ClipboardList, Package, FlaskConical, ShoppingCart,
  Eye, FileText, ChevronDown, ChevronUp,
} from "lucide-react";

// ─── Tipos ──────────────────────────────────────────────────────────────────
type EstadoTrabajo = "abierto" | "en_proceso" | "en_espera" | "completado" | "cancelado";
type TipoFormato   = "solicitud_trabajo" | "reporte_servicio" | "registro_maquinaria" | "solicitud_compra" | "registro_lab_produccion";

// ─── Estilos por estado del expediente ──────────────────────────────────────
const ESTADO_CONFIG: Record<EstadoTrabajo, { label: string; cls: string; Icon: any }> = {
  abierto:     { label: "Abierto",     cls: "bg-blue-50 text-blue-700 border-blue-100",       Icon: Clock },
  en_proceso:  { label: "En Proceso",  cls: "bg-amber-50 text-amber-700 border-amber-100",    Icon: AlertCircle },
  en_espera:   { label: "En Espera",   cls: "bg-purple-50 text-purple-700 border-purple-100", Icon: Clock },
  completado:  { label: "Completado",  cls: "bg-emerald-50 text-emerald-700 border-emerald-100", Icon: CheckCircle2 },
  cancelado:   { label: "Cancelado",   cls: "bg-slate-100 text-slate-500 border-slate-200",   Icon: XCircle },
};

// ─── Configuración visual de cada tipo de formulario ───────────────────────
const FORMATO_CONFIG: Record<TipoFormato, { label: string; color: string; bg: string; border: string; Icon: any }> = {
  solicitud_trabajo:      { label: "Solicitud de Trabajo",                  color: "text-blue-600",   bg: "bg-blue-50",    border: "border-blue-200",   Icon: ClipboardList },
  reporte_servicio:       { label: "Reporte de Servicio",                   color: "text-slate-700",  bg: "bg-slate-50",   border: "border-slate-200",  Icon: Wrench },
  registro_maquinaria:    { label: "Registro de Maquinaria de Producción",  color: "text-indigo-600", bg: "bg-indigo-50",  border: "border-indigo-200", Icon: Package },
  solicitud_compra:       { label: "Solicitud de Compra",                   color: "text-amber-600",  bg: "bg-amber-50",   border: "border-amber-200",  Icon: ShoppingCart },
  registro_lab_produccion:{ label: "Registro Lab. Medicamentos / Prod.",    color: "text-emerald-600",bg: "bg-emerald-50", border: "border-emerald-200",Icon: FlaskConical },
};

// ─── Campos de cada formulario físico (basados en los formatos reales) ──────
// Cada campo replica exactamente lo que aparece en el formato físico de papel.
const CAMPOS_FORMULARIO: Record<TipoFormato, { key: string; label: string; tipo: "text"|"textarea"|"date"|"select"|"checkboxes"; requerido?: boolean; opciones?: string[] }[]> = {

  // Formato físico: Solicitud de Trabajo (Folio 2813)
  // Campos visibles en imagen 3
  solicitud_trabajo: [
    { key: "area_destino",          label: "Solicitud de Trabajo para el Área de", tipo: "text",     requerido: true },
    { key: "descripcion_trabajo",   label: "Descripción del Trabajo Solicitado",   tipo: "textarea", requerido: true },
    { key: "material_para_trabajo", label: "Material para el Trabajo",             tipo: "textarea" },
    { key: "area_que_solicita",     label: "Área que Solicita",                    tipo: "text",     requerido: true },
    { key: "fecha",                 label: "Fecha",                                tipo: "date",     requerido: true },
    { key: "vobo",                  label: "Vo.Bo.",                               tipo: "text" },
    { key: "autorizo",              label: "Autorizó",                             tipo: "text" },
  ],

  // Formato físico: Reporte de Servicio / Orden Interna (Folio 0214)
  // Campos visibles en imagen 1
  reporte_servicio: [
    { key: "departamento",             label: "Departamento",                              tipo: "text",     requerido: true },
    { key: "nombre_reporta",           label: "Nombre de Quien Reporta",                  tipo: "text",     requerido: true },
    { key: "equipo",                   label: "Equipo",                                   tipo: "text",     requerido: true },
    { key: "prioridad",                label: "Prioridad",                                tipo: "select",   opciones: ["Alta", "Media", "Baja"] },
    { key: "tipo_mantenimiento",       label: "Tipo de Mantenimiento",                    tipo: "select",   requerido: true, opciones: ["Preventivo", "Correctivo"] },
    { key: "datos_equipo",             label: "Datos del Equipo (marca, modelo, estado)", tipo: "textarea", requerido: true },
    { key: "descripcion_falla",        label: "Descripción de la Falla",                  tipo: "textarea", requerido: true },
    { key: "acciones_realizadas",      label: "Acciones Realizadas",                      tipo: "textarea" },
    { key: "refacciones_requeridas",   label: "Refacciones Requeridas",                   tipo: "textarea" },
    { key: "personal_mantenimiento",   label: "Personal que Realizó el Mantenimiento",    tipo: "text" },
    { key: "observaciones",            label: "Observaciones y Datos Adicionales",        tipo: "textarea" },
    { key: "fecha_inicio",             label: "Fecha de Inicio",                          tipo: "date" },
    { key: "fecha_final",              label: "Fecha Final",                              tipo: "date" },
    { key: "fecha_solicitud",          label: "Fecha de Solicitud (Mant.)",               tipo: "date" },
    { key: "nombre_recibe_solicitud",  label: "Nombre de Quien Recibe Solicitud",         tipo: "text" },
    { key: "firma_inicio_servicio",    label: "Mantenimiento al Inicio de Servicio",      tipo: "text" },
    { key: "firma_termino_servicio",   label: "Solicitante al Término de Servicio",       tipo: "text" },
    { key: "vobo",                     label: "VoBo",                                     tipo: "text" },
  ],

  // Formato físico: Registro de Maquinaria de Producción
  // Campos visibles en imagen 2
  registro_maquinaria: [
    { key: "fecha",            label: "Fecha",                  tipo: "date",       requerido: true },
    { key: "maquina",          label: "Máquina",                tipo: "text",       requerido: true },
    { key: "marca",            label: "Marca",                  tipo: "text" },
    { key: "modelo",           label: "Modelo",                 tipo: "text" },
    { key: "serie",            label: "Serie",                  tipo: "text" },
    { key: "area_produccion",  label: "Área de Producción",     tipo: "text",       requerido: true },
    // Los checkboxes del formato físico se mapean como campo de tipo select
    // para indicar cuál(es) tipos de mantenimiento aplican
    { key: "tipos_mantenimiento", label: "Tipo de Mantenimiento (seleccionar los que apliquen)",
      tipo: "checkboxes", opciones: ["Correctivo", "Preventivo", "Mecánico", "Eléctrico", "Electrónico"] },
    { key: "descripcion_trabajo", label: "Descripción del Trabajo Realizado", tipo: "textarea", requerido: true },
    { key: "observaciones",       label: "Observaciones",                     tipo: "textarea" },
    { key: "efectuo",             label: "Efectuó",                           tipo: "text" },
    { key: "recibio",             label: "Recibió",                           tipo: "text" },
  ],

  // Formato de Solicitud de Compra (4° formato — cuando se requieren refacciones)
  solicitud_compra: [
    { key: "departamento_solicitante", label: "Departamento Solicitante",   tipo: "text",     requerido: true },
    { key: "solicitado_por",           label: "Solicitado Por",             tipo: "text",     requerido: true },
    { key: "fecha",                    label: "Fecha",                      tipo: "date",     requerido: true },
    { key: "trabajo_relacionado",      label: "Trabajo / Equipo Relacionado", tipo: "text" },
    { key: "articulos",                label: "Artículos / Refacciones a Comprar (incluir cantidad, descripción y especificaciones)", tipo: "textarea", requerido: true },
    { key: "proveedor_sugerido",       label: "Proveedor Sugerido",         tipo: "text" },
    { key: "precio_estimado",          label: "Precio Estimado Total ($)",  tipo: "text" },
    { key: "justificacion",            label: "Justificación",              tipo: "textarea", requerido: true },
    { key: "autorizo",                 label: "Autorizó",                   tipo: "text" },
  ],

  // Formato Lab. Medicamentos / Productos Terminados (5° formato)
  registro_lab_produccion: [
    { key: "fecha",              label: "Fecha",                             tipo: "date",     requerido: true },
    { key: "maquina",            label: "Máquina / Equipo",                  tipo: "text",     requerido: true },
    { key: "marca",              label: "Marca",                             tipo: "text" },
    { key: "modelo",             label: "Modelo",                            tipo: "text" },
    { key: "serie",              label: "Serie",                             tipo: "text" },
    { key: "area_produccion",    label: "Área de Producción",                tipo: "text",     requerido: true },
    { key: "tipo_mantenimiento", label: "Tipo de Mantenimiento",             tipo: "checkboxes",
      opciones: ["Correctivo", "Preventivo", "Mecánico", "Eléctrico", "Electrónico"] },
    { key: "descripcion_trabajo",label: "Descripción del Trabajo Realizado", tipo: "textarea", requerido: true },
    { key: "verificacion_post",  label: "Verificación Post-Mantenimiento",   tipo: "textarea" },
    { key: "observaciones",      label: "Observaciones",                     tipo: "textarea" },
    { key: "responsable_produccion",  label: "Responsable de Producción",   tipo: "text" },
    { key: "responsable_mant",        label: "Responsable de Mantenimiento", tipo: "text" },
    { key: "aprobo",                  label: "Aprobó",                       tipo: "text" },
  ],
};

const PER_PAGE = 20;

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
export default function FormatosPage() {
  const [trabajos, setTrabajos]       = useState<any[]>([]);
  const [totalCount, setTotalCount]   = useState(0);
  const [isLoading, setIsLoading]     = useState(true);
  const [page, setPage]               = useState(1);
  const [search, setSearch]           = useState("");
  const [estadoFilter, setEstadoFilter] = useState<EstadoTrabajo | "">("");
  const [modalNuevo, setModalNuevo]   = useState(false);
  const [trabajoActivo, setTrabajoActivo] = useState<any | null>(null); // Para ver el expediente

  const loadTrabajos = useCallback(async () => {
    setIsLoading(true);
    const supabase = createClient();
    try {
      let q = supabase
        .from("trabajos")
        .select(`
          *,
          creador:creado_por(nombre_completo),
          atiende:atendido_por(nombre_completo),
          departamento:departamento_id(nombre),
          registros_formato(id, tipo, completado, imagen_url)
        `, { count: "exact" })
        .order("fecha_apertura", { ascending: false })
        .range((page - 1) * PER_PAGE, page * PER_PAGE - 1);

      if (estadoFilter) q = q.eq("estado", estadoFilter);

      const { data, error, count } = await q;
      if (error) throw error;
      setTrabajos(data ?? []);
      setTotalCount(count ?? 0);
    } catch (err) {
      console.error("Error cargando trabajos:", err);
    } finally {
      setIsLoading(false);
    }
  }, [page, estadoFilter]);

  useEffect(() => { loadTrabajos(); }, [loadTrabajos]);

  const filtered = trabajos.filter(t => {
    const term = search.toLowerCase();
    return !term ||
      t.folio?.toLowerCase().includes(term) ||
      t.titulo?.toLowerCase().includes(term) ||
      t.area_solicitante?.toLowerCase().includes(term) ||
      t.creador?.nombre_completo?.toLowerCase().includes(term);
  });

  const rangoDesde   = totalCount === 0 ? 0 : (page - 1) * PER_PAGE + 1;
  const rangoHasta   = Math.min(page * PER_PAGE, totalCount);
  const totalPaginas = Math.ceil(totalCount / PER_PAGE);

  const fmtFecha = (f: string) =>
    new Date(f).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });

  // Conteo de formularios completados de un expediente
  const progreso = (registros: any[]) => {
    const total     = registros?.length ?? 0;
    const completos = registros?.filter(r => r.completado).length ?? 0;
    return { total, completos };
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 lg:ml-64 w-full">
        <div className="p-4 md:p-8 lg:p-10 pt-20 lg:pt-10 max-w-7xl mx-auto">

          {/* ── Encabezado ── */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Formatos de Trabajo</h1>
              <p className="text-slate-500 font-medium mt-1">
                Expedientes de mantenimiento con sus formularios físicos digitalizados
              </p>
            </div>
            <button
              onClick={() => setModalNuevo(true)}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5"
            >
              <Plus size={18} /> Abrir Expediente
            </button>
          </div>

          {/* ── Filtros ── */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por folio, título, área o técnico..."
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400" />
            </div>
            <select value={estadoFilter} onChange={e => { setEstadoFilter(e.target.value as any); setPage(1); }}
              className="py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600 font-medium outline-none cursor-pointer">
              <option value="">Todos los estados</option>
              {Object.entries(ESTADO_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>

          {/* ── Tabla de expedientes ── */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Folio</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Trabajo</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest hidden md:table-cell">Formularios</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest hidden lg:table-cell">Creado por</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest hidden lg:table-cell">Fecha</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Estado</th>
                    <th className="px-4 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {isLoading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i}><td colSpan={7} className="px-6 py-5">
                        <div className="h-5 bg-slate-100 rounded-lg animate-pulse" />
                      </td></tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={7} className="py-16 text-center text-slate-400 text-sm font-medium">
                      No hay expedientes registrados
                    </td></tr>
                  ) : filtered.map(t => {
                    const est = ESTADO_CONFIG[t.estado as EstadoTrabajo];
                    const EstIcon = est?.Icon;
                    const { total, completos } = progreso(t.registros_formato);
                    const pct = total > 0 ? Math.round((completos / total) * 100) : 0;
                    return (
                      <tr key={t.id} className="hover:bg-blue-50/30 transition-colors group">
                        {/* Folio */}
                        <td className="px-6 py-4">
                          <span className="font-mono text-xs font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                            {t.folio ?? `#${t.id}`}
                          </span>
                        </td>
                        {/* Título y área */}
                        <td className="px-6 py-4 max-w-[200px]">
                          <p className="text-sm font-bold text-slate-800 truncate">{t.titulo}</p>
                          <p className="text-[11px] text-slate-400 font-medium">{t.area_solicitante}</p>
                        </td>
                        {/* Progreso de formularios */}
                        <td className="px-6 py-4 hidden md:table-cell">
                          <div className="flex items-center gap-2">
                            <div className="flex -space-x-1">
                              {(t.registros_formato ?? []).map((r: any) => {
                                const cfg = FORMATO_CONFIG[r.tipo as TipoFormato];
                                const FIcon = cfg?.Icon;
                                return FIcon ? (
                                  <div key={r.id}
                                    title={`${cfg.label}${r.completado ? " ✓" : " (pendiente)"}`}
                                    className={`w-6 h-6 rounded-full border-2 border-white flex items-center justify-center ${r.completado ? "bg-emerald-100" : "bg-slate-100"}`}>
                                    <FIcon size={10} className={r.completado ? "text-emerald-600" : "text-slate-400"} />
                                  </div>
                                ) : null;
                              })}
                            </div>
                            <span className="text-[10px] font-bold text-slate-500">{completos}/{total}</span>
                            {/* Barra de progreso */}
                            <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div className={`h-full rounded-full transition-all ${pct === 100 ? "bg-emerald-500" : "bg-blue-500"}`}
                                style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        </td>
                        {/* Creado por */}
                        <td className="px-6 py-4 hidden lg:table-cell text-sm text-slate-600">
                          {t.creador?.nombre_completo ?? "—"}
                        </td>
                        {/* Fecha */}
                        <td className="px-6 py-4 hidden lg:table-cell text-xs text-slate-500">
                          {fmtFecha(t.fecha_apertura)}
                        </td>
                        {/* Estado */}
                        <td className="px-6 py-4 text-center">
                          {est && (
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold border ${est.cls}`}>
                              <EstIcon size={11} /> {est.label}
                            </span>
                          )}
                        </td>
                        {/* Ver expediente */}
                        <td className="px-4 py-4">
                          <button onClick={() => setTrabajoActivo(t)}
                            className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all opacity-0 group-hover:opacity-100"
                            title="Ver expediente">
                            <Eye size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* Paginación */}
            <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">
                {isLoading ? "Cargando..." : totalCount === 0 ? "Sin resultados" : (
                  <><span className="font-bold text-slate-900">{rangoDesde}–{rangoHasta}</span> de <span className="font-bold text-slate-900">{totalCount}</span></>
                )}
              </p>
              <div className="flex items-center gap-2">
                <button disabled={page === 1 || isLoading} onClick={() => setPage(p => p - 1)}
                  className="p-2 rounded-xl text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-all">
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm font-bold text-slate-600 min-w-[60px] text-center">{page} / {totalPaginas || 1}</span>
                <button disabled={page >= totalPaginas || isLoading} onClick={() => setPage(p => p + 1)}
                  className="p-2 rounded-xl text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-all">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Modal: Abrir nuevo expediente */}
      {modalNuevo && (
        <ModalNuevoTrabajo
          onClose={() => setModalNuevo(false)}
          onSaved={() => { loadTrabajos(); setModalNuevo(false); }}
        />
      )}

      {/* Panel lateral: Ver y llenar expediente */}
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

// ============================================================================
// MODAL: ABRIR NUEVO EXPEDIENTE
// ============================================================================
function ModalNuevoTrabajo({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [titulo,    setTitulo]    = useState("");
  const [area,      setArea]      = useState("");
  const [prioridad, setPrioridad] = useState("Normal");
  const [tipoTrab,  setTipoTrab]  = useState("Correctivo");
  // Flags para formularios opcionales
  const [conCompra,    setConCompra]    = useState(false);
  const [conMaquinaria,setConMaquinaria]= useState(false);
  const [conLab,       setConLab]       = useState(false);
  const [saving, setSaving] = useState(false);

  const handleGuardar = async () => {
    if (!titulo.trim() || !area.trim()) { alert("El título y el área son requeridos."); return; }
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from("trabajos").insert([{
      titulo:                       titulo.trim(),
      area_solicitante:             area.trim(),
      prioridad,
      tipo_trabajo:                 tipoTrab,
      requiere_compra:              conCompra,
      requiere_registro_maquinaria: conMaquinaria,
      requiere_registro_lab:        conLab,
      creado_por:                   user?.id ?? null,
    }]);

    if (error) { alert("Error: " + error.message); }
    else { onSaved(); }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <h2 className="text-base font-black text-slate-800">Abrir Nuevo Expediente</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400"><X size={18} /></button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-500 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
            Al crear el expediente se generan automáticamente los formularios
            <strong> Solicitud de Trabajo</strong> y <strong>Reporte de Servicio</strong>.
            Marca las casillas si el trabajo requiere formularios adicionales.
          </p>

          {/* Título */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Descripción del Trabajo *
            </label>
            <input value={titulo} onChange={e => setTitulo(e.target.value)}
              placeholder="Ej. Reparación de compresor, sala de producción 3..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100" />
          </div>

          {/* Área solicitante */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Área / Departamento Solicitante *
            </label>
            <input value={area} onChange={e => setArea(e.target.value)}
              placeholder="Ej. Producción, Almacén, Calidad..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100" />
          </div>

          {/* Prioridad y Tipo en fila */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Prioridad</label>
              <select value={prioridad} onChange={e => setPrioridad(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 outline-none">
                <option>Alta</option><option>Normal</option><option>Baja</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Tipo de Trabajo</label>
              <select value={tipoTrab} onChange={e => setTipoTrab(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 outline-none">
                <option>Correctivo</option><option>Preventivo</option>
                <option>Instalación</option><option>Otro</option>
              </select>
            </div>
          </div>

          {/* Formularios adicionales */}
          <div className="border-t border-slate-100 pt-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
              Formularios Adicionales Requeridos
            </p>
            <div className="space-y-2">
              {[
                { label: "Registro de Maquinaria de Producción", Icon: Package,      val: conMaquinaria, set: setConMaquinaria },
                { label: "Solicitud de Compra (refacciones/material)", Icon: ShoppingCart, val: conCompra, set: setConCompra },
                { label: "Registro Lab. Medicamentos / Prod. Terminados", Icon: FlaskConical, val: conLab, set: setConLab },
              ].map(({ label, Icon, val, set }) => (
                <button key={label} type="button" onClick={() => set(!val)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all text-sm font-semibold ${
                    val ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300"
                  }`}>
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${val ? "bg-blue-600 border-blue-600" : "border-slate-300"}`}>
                    {val && <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 12 12"><path d="M10 3L5 8.5 2 5.5" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Pie del modal */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 text-slate-500 font-bold text-sm hover:text-slate-700">
            Cancelar
          </button>
          <button onClick={handleGuardar} disabled={saving}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md disabled:opacity-60 transition-all">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {saving ? "Creando..." : "Crear Expediente"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// PANEL LATERAL: VER Y LLENAR EL EXPEDIENTE COMPLETO
// Muestra todos los formularios del expediente en acordeón
// ============================================================================
function PanelExpediente({
  trabajo, onClose, onUpdated,
}: {
  trabajo: any; onClose: () => void; onUpdated: () => void;
}) {
  const [formatos, setFormatos]   = useState<any[]>([]);
  const [estado, setEstado]       = useState<EstadoTrabajo>(trabajo.estado);
  const [abierto, setAbierto]     = useState<number | null>(null); // Acordeón: id del formato abierto
  const [saving, setSaving]       = useState(false);
  const [loadingFormatos, setLoadingFormatos] = useState(true);

  // Cargar los registros_formato de este trabajo
  useEffect(() => {
    const load = async () => {
      setLoadingFormatos(true);
      const supabase = createClient();
      const { data } = await supabase
        .from("registros_formato")
        .select("*")
        .eq("trabajo_id", trabajo.id)
        .order("id");
      setFormatos(data ?? []);
      setLoadingFormatos(false);
    };
    load();
  }, [trabajo.id]);

  // Actualizar estado del expediente
  const handleCambiarEstado = async () => {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("trabajos")
      .update({ estado, fecha_cierre: estado === "completado" ? new Date().toISOString() : null })
      .eq("id", trabajo.id);
    if (!error) onUpdated();
    setSaving(false);
  };

  const est = ESTADO_CONFIG[estado];
  const { completos, total } = { completos: formatos.filter(f => f.completado).length, total: formatos.length };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      {/* Panel desde la derecha */}
      <div className="ml-auto relative bg-white w-full max-w-2xl h-full flex flex-col shadow-2xl overflow-hidden">

        {/* Cabecera del expediente */}
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <span className="font-mono text-xs font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                {trabajo.folio}
              </span>
              <h2 className="text-lg font-black text-slate-800 mt-2 leading-tight">{trabajo.titulo}</h2>
              <p className="text-xs text-slate-500 font-medium mt-1">{trabajo.area_solicitante} · {trabajo.tipo_trabajo} · Prioridad: {trabajo.prioridad}</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-200 text-slate-400 flex-shrink-0">
              <X size={18} />
            </button>
          </div>

          {/* Barra de progreso del expediente */}
          <div className="mt-4">
            <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1.5">
              <span>Formularios completados</span>
              <span>{completos} de {total}</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${completos === total && total > 0 ? "bg-emerald-500" : "bg-blue-500"}`}
                style={{ width: total > 0 ? `${(completos / total) * 100}%` : "0%" }} />
            </div>
          </div>

          {/* Cambiar estado */}
          <div className="flex items-center gap-2 mt-4">
            <select value={estado} onChange={e => setEstado(e.target.value as EstadoTrabajo)}
              className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none">
              {Object.entries(ESTADO_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
            <button onClick={handleCambiarEstado} disabled={saving || estado === trabajo.estado}
              className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-50 transition-all">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Guardar
            </button>
          </div>
        </div>

        {/* Acordeón de formularios */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
          {loadingFormatos ? (
            <div className="p-8 space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />)}
            </div>
          ) : formatos.map(formato => (
            <FormularioAcordeon
              key={formato.id}
              formato={formato}
              abierto={abierto === formato.id}
              onToggle={() => setAbierto(abierto === formato.id ? null : formato.id)}
              onSaved={() => {
                // Recargar formatos al guardar
                const supabase = createClient();
                supabase.from("registros_formato").select("*").eq("trabajo_id", trabajo.id).order("id")
                  .then(({ data }) => { setFormatos(data ?? []); onUpdated(); });
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENTE: FORMULARIO EN ACORDEÓN
// Cada formulario se expande para mostrar sus campos y el adjunto de imagen
// ============================================================================
function FormularioAcordeon({
  formato, abierto, onToggle, onSaved,
}: {
  formato: any; abierto: boolean; onToggle: () => void; onSaved: () => void;
}) {
  const cfg     = FORMATO_CONFIG[formato.tipo as TipoFormato];
  const campos  = CAMPOS_FORMULARIO[formato.tipo as TipoFormato] ?? [];
  const Icon    = cfg?.Icon;

  const [datos,     setDatos]     = useState<Record<string, any>>(formato.datos_json ?? {});
  const [imageUrl,  setImageUrl]  = useState(formato.imagen_url ?? "");
  const [uploading, setUploading] = useState(false);
  const [saving,    setSaving]    = useState(false);

  // Subir imagen del formato físico firmado
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setUploading(true);
    const supabase = createClient();
    const file     = e.target.files[0];
    const fileName = `${formato.tipo}-${formato.id}-${Date.now()}.${file.name.split(".").pop()}`;
    const { error } = await supabase.storage.from("formatos").upload(fileName, file);
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from("formatos").getPublicUrl(fileName);
      setImageUrl(publicUrl);
    }
    setUploading(false);
  };

  // Guardar los datos del formulario
  const handleGuardar = async () => {
    // Validar campos requeridos
    const faltantes = campos.filter(c => c.requerido && !datos[c.key]?.toString().trim());
    if (faltantes.length > 0) {
      alert(`Campos requeridos: ${faltantes.map(f => f.label).join(", ")}`);
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("registros_formato").update({
      datos_json:     datos,
      imagen_url:     imageUrl || null,
      completado:     true,
      completado_por: user?.id,
      fecha_llenado:  new Date().toISOString(),
    }).eq("id", formato.id);
    if (error) { alert("Error: " + error.message); }
    else { onSaved(); }
    setSaving(false);
  };

  return (
    <div>
      {/* Botón cabecera del acordeón */}
      <button onClick={onToggle}
        className={`w-full flex items-center gap-4 px-6 py-4 text-left transition-colors hover:bg-slate-50 ${abierto ? "bg-slate-50" : ""}`}>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg?.bg} ${cfg?.border} border`}>
          {Icon && <Icon size={16} className={cfg?.color} />}
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-slate-800">{cfg?.label}</p>
          <p className="text-[10px] text-slate-400 font-medium mt-0.5">
            {formato.completado
              ? `Completado · ${new Date(formato.fecha_llenado).toLocaleDateString("es-MX")}`
              : "Pendiente de llenar"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {formato.completado && <CheckCircle2 size={16} className="text-emerald-500" />}
          {formato.imagen_url && <Camera size={14} className="text-blue-400" title="Tiene imagen adjunta" />}
          {abierto ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        </div>
      </button>

      {/* Contenido expandible del formulario */}
      {abierto && (
        <div className="px-6 pb-6 space-y-4 bg-slate-50/50 border-t border-slate-100">
          <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {campos.map(campo => (
              <div key={campo.key} className={campo.tipo === "textarea" || campo.tipo === "checkboxes" ? "sm:col-span-2" : ""}>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  {campo.label} {campo.requerido && <span className="text-red-400">*</span>}
                </label>

                {campo.tipo === "textarea" ? (
                  <textarea value={datos[campo.key] ?? ""} rows={3}
                    onChange={e => setDatos(d => ({ ...d, [campo.key]: e.target.value }))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 resize-none" />
                ) : campo.tipo === "select" ? (
                  <select value={datos[campo.key] ?? ""}
                    onChange={e => setDatos(d => ({ ...d, [campo.key]: e.target.value }))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 outline-none">
                    <option value="">Seleccionar...</option>
                    {campo.opciones?.map(op => <option key={op} value={op}>{op}</option>)}
                  </select>
                ) : campo.tipo === "checkboxes" ? (
                  // Checkboxes para tipo de mantenimiento (como en el formato físico real)
                  <div className="flex flex-wrap gap-2">
                    {campo.opciones?.map(op => {
                      const seleccionados: string[] = datos[campo.key] ?? [];
                      const marcado = seleccionados.includes(op);
                      return (
                        <button key={op} type="button"
                          onClick={() => {
                            const arr: string[] = datos[campo.key] ?? [];
                            setDatos(d => ({
                              ...d,
                              [campo.key]: marcado ? arr.filter(x => x !== op) : [...arr, op],
                            }));
                          }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                            marcado ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-slate-200 text-slate-500 hover:border-blue-300"
                          }`}>
                          <div className={`w-3 h-3 rounded border ${marcado ? "bg-white border-white" : "border-slate-300"} flex items-center justify-center`}>
                            {marcado && <svg width="8" height="8" fill="none" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                          </div>
                          {op}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <input type={campo.tipo} value={datos[campo.key] ?? ""}
                    onChange={e => setDatos(d => ({ ...d, [campo.key]: e.target.value }))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100" />
                )}
              </div>
            ))}
          </div>

          {/* Adjuntar imagen del formato físico */}
          <div className="border-t border-slate-200 pt-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
              Foto del Formato Físico Firmado
            </p>
            <div className="flex items-start gap-4">
              {/* Preview */}
              <div className="w-20 h-20 rounded-xl bg-white border-2 border-dashed border-slate-200 flex-shrink-0 overflow-hidden flex items-center justify-center">
                {imageUrl
                  ? <img src={imageUrl} alt="Formato" className="w-full h-full object-cover" />
                  : <Camera size={20} className="text-slate-300" />}
              </div>
              <div>
                <label className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${uploading ? "bg-slate-100 text-slate-400" : "bg-slate-800 hover:bg-slate-700 text-white"}`}>
                  {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                  {uploading ? "Subiendo..." : imageUrl ? "Cambiar foto" : "Adjuntar foto"}
                  <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
                </label>
                <p className="text-[10px] text-slate-400 mt-1.5">Foto o escaneo del formato físico firmado</p>
                {imageUrl && (
                  <a href={imageUrl} target="_blank" rel="noopener noreferrer"
                    className="text-[10px] text-blue-500 hover:underline font-bold">Ver adjunto →</a>
                )}
              </div>
            </div>
          </div>

          {/* Guardar formulario */}
          <div className="flex justify-end pt-2">
            <button onClick={handleGuardar} disabled={saving}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-blue-200 disabled:opacity-60 transition-all">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {saving ? "Guardando..." : formato.completado ? "Actualizar Formulario" : "Marcar como Completado"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}