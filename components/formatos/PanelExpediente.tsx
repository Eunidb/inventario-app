/**
 * @file components/formatos/PanelExpediente.tsx
 * @description Panel lateral deslizante del expediente.
 *
 * Muestra:
 *   - Cabecera: folio, título, máquina, área, estado (cambiable).
 *   - Datos generales: tipo, prioridad, departamento, creador.
 *   - Barra de progreso de formularios.
 *   - Lista de formularios: toca uno → renderiza su Form*.
 *   - Botón "Editar expediente" que dispara onEdit en page.tsx.
 *
 * Props:
 *   trabajo    → TrabajoExpediente con sus registros_formato
 *   onClose    → cierra el panel
 *   onUpdated  → refresca la tabla principal tras cualquier cambio
 *   onEdit     → abre el ModalNuevoTrabajo en modo edición
 */

"use client";

import { useState } from "react";
import { createClient } from "@/lib/client";
import {
  X, ChevronRight, CheckCircle2, Clock, ChevronDown, Pencil,
} from "lucide-react";
import {
  ESTADO_CONFIG, FORMATO_CONFIG,
  type EstadoTrabajo, type TipoFormato, type TrabajoExpediente,
} from "./types";
import FormSolicitudTrabajo  from "./FormSolicitudTrabajo";
import FormReporteServicio   from "./FormReporteServicio";
import FormRegistroMaquinaria from "./FormRegistroMaquinaria";
import FormSolicitudCompra   from "./FormSolicitudCompra";
import FormRegistroLab       from "./FormRegistroLab";

interface Props {
  trabajo:   TrabajoExpediente;
  onClose:   () => void;
  onUpdated: () => void;
  onEdit:    (t: TrabajoExpediente) => void;  // dispara modal edición en page.tsx
}

// Props que recibe cada componente Form*
export interface FormProps {
  registro:   any;
  trabajoId:  number;
  onSaved:    () => void;
}

// Mapa tipo → componente de formulario
const FORM_MAP: Record<TipoFormato, React.FC<FormProps>> = {
  solicitud_trabajo:       FormSolicitudTrabajo,
  reporte_servicio:        FormReporteServicio,
  registro_maquinaria:     FormRegistroMaquinaria,
  solicitud_compra:        FormSolicitudCompra,
  registro_lab_produccion: FormRegistroLab,
};

export default function PanelExpediente({ trabajo, onClose, onUpdated, onEdit }: Props) {
  const supabase = createClient();

  const [formularioActivo, setFormularioActivo] = useState<any | null>(null);
  const [registros, setRegistros]               = useState(trabajo.registros_formato ?? []);
  const [savingEstado, setSavingEstado]          = useState(false);
  const [showEstados, setShowEstados]            = useState(false);

  // Refresca registros_formato desde Supabase tras guardar un formulario
  const refreshRegistros = async () => {
    const { data } = await supabase
      .from("registros_formato")
      .select("*")
      .eq("trabajo_id", trabajo.id);
    setRegistros(data ?? []);
    onUpdated();
  };

  // Cambia el estado del expediente desde el panel
  const cambiarEstado = async (nuevoEstado: EstadoTrabajo) => {
    setSavingEstado(true);
    await supabase.from("trabajos").update({
      estado:       nuevoEstado,
      fecha_cierre: nuevoEstado === "completado" ? new Date().toISOString() : null,
    }).eq("id", trabajo.id);
    setSavingEstado(false);
    setShowEstados(false);
    onUpdated();
  };

  const estActual = ESTADO_CONFIG[trabajo.estado];
  const EstIcon   = estActual?.Icon;
  const total     = registros.length;
  const completos = registros.filter(r => r.completado).length;
  const pct       = total > 0 ? Math.round((completos / total) * 100) : 0;

  // ── Vista del formulario activo ───────────────────────────────────────────
  if (formularioActivo) {
    const FormComponent = FORM_MAP[formularioActivo.tipo as TipoFormato];
    return (
      <PanelShell onClose={onClose}>
        <button
          onClick={() => setFormularioActivo(null)}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-bold text-sm mb-6 transition-colors"
        >
          <ChevronRight size={16} className="rotate-180" /> Volver al expediente
        </button>
        {FormComponent && (
          <FormComponent
            registro={formularioActivo}
            trabajoId={trabajo.id}
            onSaved={async () => {
              await refreshRegistros();
              // Actualiza el registro activo con los datos frescos del servidor
              const { data } = await supabase
                .from("registros_formato")
                .select("*")
                .eq("id", formularioActivo.id)
                .single();
              if (data) setFormularioActivo(data);
            }}
          />
        )}
      </PanelShell>
    );
  }

  // ── Vista principal del panel ─────────────────────────────────────────────
  return (
    <PanelShell onClose={onClose}>

      {/* ── Cabecera del expediente ────────────────────────────────────────── */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <span className="font-mono text-xs font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
              {trabajo.folio ?? `#${trabajo.id}`}
            </span>
            <h2 className="text-lg font-black text-slate-800 mt-2 leading-tight truncate">
              {trabajo.titulo}
            </h2>
            {/* Máquina referenciada */}
            {trabajo.maquina && (
              <p className="text-xs font-mono text-blue-600 mt-0.5 truncate">{trabajo.maquina}</p>
            )}
            <p className="text-sm text-slate-400 font-medium mt-0.5">
              {trabajo.area_solicitante ?? "Sin área asignada"}
            </p>
          </div>
          {/* Botón editar expediente — delega al modal del page.tsx */}
          <button
            onClick={() => onEdit(trabajo)}
            className="p-2 rounded-xl text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-all flex-shrink-0"
            title="Editar datos del expediente"
          >
            <Pencil size={15} />
          </button>
        </div>

        {/* Selector de estado */}
        <div className="relative mt-4">
          <button
            onClick={() => setShowEstados(!showEstados)}
            disabled={savingEstado}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${estActual?.cls}`}
          >
            {EstIcon && <EstIcon size={12} />}
            {estActual?.label}
            <ChevronDown size={12} className={`transition-transform ${showEstados ? "rotate-180" : ""}`} />
          </button>
          {showEstados && (
            <div className="absolute left-0 top-full mt-1 z-10 bg-white rounded-2xl border border-slate-200 shadow-xl p-1 min-w-[180px]">
              {(Object.entries(ESTADO_CONFIG) as [EstadoTrabajo, any][]).map(([key, cfg]) => {
                const SIcon = cfg.Icon;
                return (
                  <button
                    key={key}
                    onClick={() => cambiarEstado(key)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-colors text-left ${
                      trabajo.estado === key ? cfg.cls : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <SIcon size={12} /> {cfg.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Barra de progreso general */}
        <div className="mt-4 space-y-1">
          <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <span>Progreso de formularios</span>
            <span>{completos}/{total}</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${pct === 100 ? "bg-emerald-500" : "bg-blue-500"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Datos generales del trabajo ───────────────────────────────────── */}
      <div className="bg-slate-50 rounded-2xl p-4 mb-6 grid grid-cols-2 gap-3 text-xs">
        <InfoItem label="Tipo"         value={trabajo.tipo_trabajo ?? "—"} />
        <InfoItem label="Prioridad"    value={trabajo.prioridad ?? "—"} />
        <InfoItem label="Departamento" value={(trabajo.departamento as any)?.nombre ?? "—"} />
        <InfoItem label="Creado por"   value={(trabajo.creador as any)?.nombre_completo ?? "—"} />
        {trabajo.observaciones && (
          <div className="col-span-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Observaciones</p>
            <p className="text-slate-600 leading-relaxed">{trabajo.observaciones}</p>
          </div>
        )}
      </div>

      {/* ── Lista de formularios ──────────────────────────────────────────── */}
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
          Formularios del expediente
        </p>
        <div className="space-y-2">
          {registros.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">Sin formularios generados</p>
          ) : (
            registros.map(r => {
              const cfg  = FORMATO_CONFIG[r.tipo as TipoFormato];
              const Icon = cfg?.Icon;
              return (
                <button
                  key={r.id}
                  onClick={() => setFormularioActivo(r)}
                  className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-slate-200
                             hover:border-blue-300 hover:bg-blue-50/30 transition-all group text-left"
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    r.completado ? "bg-emerald-100" : "bg-slate-100"
                  }`}>
                    {Icon && <Icon size={16} className={r.completado ? "text-emerald-600" : "text-slate-400"} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{cfg?.label ?? r.tipo}</p>
                    {r.fecha_llenado && (
                      <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                        <Clock size={9} />
                        {new Date(r.fecha_llenado).toLocaleDateString("es-MX", {
                          day: "2-digit", month: "short", year: "numeric",
                        })}
                      </p>
                    )}
                  </div>
                  {r.completado ? (
                    <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
                  ) : (
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-lg flex-shrink-0">
                      Pendiente
                    </span>
                  )}
                  <ChevronRight size={15} className="text-slate-300 group-hover:text-blue-500 transition-colors flex-shrink-0" />
                </button>
              );
            })
          )}
        </div>
      </div>
    </PanelShell>
  );
}

// ─── Shell del panel: overlay + contenedor deslizante ───────────────────────
function PanelShell({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md h-full shadow-2xl overflow-y-auto p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors"
        >
          <X size={18} />
        </button>
        {children}
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-slate-700 font-semibold mt-0.5">{value}</p>
    </div>
  );
}