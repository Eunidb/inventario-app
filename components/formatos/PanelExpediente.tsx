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

export interface FormProps {
  registro:   any;
  trabajoId:  number;
  onSaved:    () => void;
}

const FORM_MAP: Record<TipoFormato, React.FC<FormProps>> = {
  solicitud_trabajo:     FormSolicitudTrabajo,
  reporte_servicio:      FormReporteServicio,
  registro_maquinaria:   FormRegistroMaquinaria,
  solicitud_compra:      FormSolicitudCompra,
  registro_lab_produccion: FormRegistroLab,
};

export default function PanelExpediente({ trabajo, onClose, onUpdated, onEdit }: Props) {
  const supabase = createClient();

  const [formularioActivo, setFormularioActivo] = useState<any | null>(null);
  const [registros, setRegistros]               = useState(trabajo.registros_formato ?? []);
  const [savingEstado, setSavingEstado]          = useState(false);
  const [showEstados, setShowEstados]            = useState(false);

  const refreshRegistros = async () => {
    const { data } = await supabase
      .from("registros_formato")
      .select("*")
      .eq("trabajo_id", trabajo.id);
    setRegistros(data ?? []);
    onUpdated();
  };

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
      <PanelShell onClose={onClose} titulo="Formulario Técnico">
        <div className="mb-4">
          <button
            onClick={() => setFormularioActivo(null)}
            className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-bold text-xs bg-blue-50 hover:bg-blue-100/80 px-3 py-2 rounded-xl transition-all"
          >
            <ChevronRight size={14} className="rotate-180" /> Volver al expediente
          </button>
        </div>
        {FormComponent && (
          <FormComponent
            registro={formularioActivo}
            trabajoId={trabajo.id}
            onSaved={async () => {
              await refreshRegistros();
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
    <PanelShell onClose={onClose} titulo={`Expediente: ${trabajo.folio ?? `#${trabajo.id}`}`}>

      {/* ── Cabecera del expediente ────────────────────────────────────────── */}
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-sm mb-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <span className="font-mono text-[10px] font-black text-blue-600 bg-blue-100/60 px-2 py-0.5 rounded-md">
              {trabajo.folio ?? `#${trabajo.id}`}
            </span>
            <h2 className="text-base font-black text-slate-800 mt-2 leading-tight chunk-title">
              {trabajo.titulo}
            </h2>
            {trabajo.maquina && (
              <p className="text-xs font-mono font-bold text-slate-500 mt-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> {trabajo.maquina}
              </p>
            )}
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              {trabajo.area_solicitante ?? "Sin área asignada"}
            </p>
          </div>
          
          <button
            onClick={() => onEdit(trabajo)}
            className="p-2 rounded-xl text-slate-400 hover:text-amber-600 hover:bg-amber-50 border border-transparent hover:border-amber-100 transition-all flex-shrink-0 bg-white shadow-sm"
            title="Editar datos del expediente"
          >
            <Pencil size={14} />
          </button>
        </div>

        {/* Selector de estado */}
        <div className="relative mt-4 pt-4 border-t border-slate-200/60 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Estado de Orden</p>
            <button
              onClick={() => setShowEstados(!showEstados)}
              disabled={savingEstado}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border shadow-sm transition-all ${estActual?.cls}`}
            >
              {EstIcon && <EstIcon size={12} />}
              <span>{estActual?.label}</span>
              <ChevronDown size={12} className={`transition-transform duration-200 ${showEstados ? "rotate-180" : ""}`} />
            </button>
          </div>

          {showEstados && (
            <div className="absolute left-0 top-full mt-1.5 z-30 bg-white rounded-2xl border border-slate-200 shadow-xl p-1 min-w-[190px] animate-in fade-in slide-in-from-top-1 duration-150">
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
        <div className="mt-4 pt-3 border-t border-slate-200/60 space-y-1.5">
          <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <span>Progreso de documentación</span>
            <span className="font-mono text-slate-600 bg-slate-200/50 px-1.5 py-0.5 rounded-md">{completos}/{total}</span>
          </div>
          <div className="h-2 bg-slate-200/60 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${pct === 100 ? "bg-emerald-500" : "bg-blue-500"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Datos generales del trabajo ───────────────────────────────────── */}
      <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-4 mb-5 grid grid-cols-2 gap-x-4 gap-y-3.5 text-xs">
        <InfoItem label="Tipo Mant."    value={trabajo.tipo_trabajo ?? "—"} />
        <InfoItem label="Prioridad"    value={trabajo.prioridad ?? "—"} />
        <InfoItem label="Departamento" value={(trabajo.departamento as any)?.nombre ?? "—"} />
        <InfoItem label="Creado por"   value={(trabajo.creador as any)?.nombre_completo ?? "—"} />
        {trabajo.observaciones && (
          <div className="col-span-2 pt-2 border-t border-slate-50">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Observaciones Iniciales</p>
            <p className="text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">{trabajo.observaciones}</p>
          </div>
        )}
      </div>

      {/* ── Lista de formularios ──────────────────────────────────────────── */}
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">
          Formularios vinculados al folio
        </p>
        <div className="space-y-2">
          {registros.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8 bg-white rounded-2xl border border-dashed border-slate-200">Sin formularios generados</p>
          ) : (
            registros.map(r => {
              const cfg  = FORMATO_CONFIG[r.tipo as TipoFormato];
              const Icon = cfg?.Icon;
              return (
                <button
                  key={r.id}
                  onClick={() => setFormularioActivo(r)}
                  className="w-full flex items-center gap-3.5 p-3 bg-white rounded-xl border border-slate-200/70
                             hover:border-blue-400 hover:bg-blue-50/10 transition-all group text-left shadow-sm active:scale-[0.99]"
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm transition-colors ${
                    r.completado ? "bg-emerald-50 border border-emerald-100" : "bg-slate-50 border border-slate-100"
                  }`}>
                    {Icon && <Icon size={16} className={r.completado ? "text-emerald-600" : "text-slate-400 group-hover:text-blue-500"} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-slate-700 group-hover:text-blue-900 transition-colors truncate">{cfg?.label ?? r.tipo}</p>
                    {r.fecha_llenado && (
                      <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                        <Clock size={10} className="text-slate-300" />
                        {new Date(r.fecha_llenado).toLocaleDateString("es-MX", {
                          day: "2-digit", month: "short", year: "numeric",
                        })}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {r.completado ? (
                      <CheckCircle2 size={15} className="text-emerald-500" />
                    ) : (
                      <span className="text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-md">
                        Pendiente
                      </span>
                    )}
                    <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </PanelShell>
  );
}

// ─── Shell del panel: overlay + contenedor deslizante/centrado responsivo ───
function PanelShell({ children, onClose, titulo }: { children: React.ReactNode; onClose: () => void; titulo?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/30 backdrop-blur-sm transition-opacity">
      {/* Click en fondo cierra */}
      <div className="absolute inset-0" onClick={onClose} />
      
      {/* Contenedor adaptativo: Pantalla completa en mobile, Panel lateral deslizable en Escritorio */}
      <div className="relative bg-white w-full sm:max-w-md h-full shadow-2xl flex flex-col text-slate-800 border-l border-slate-100 animate-in slide-in-from-right duration-200">
        
        {/* Cabecera interna del Shell para contener el botón de cierre de forma limpia */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider truncate mr-4">
            {titulo ?? "Panel de Control"}
          </span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-50 text-slate-400 hover:text-slate-600 border border-transparent hover:border-slate-100 transition-all flex-shrink-0"
            type="button"
          >
            <X size={16} />
          </button>
        </div>

        {/* Zona scrolleable interna */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-5 bg-slate-50/30 scrollbar-thin scrollbar-thumb-slate-200">
          {children}
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider truncate">{label}</p>
      <p className="text-slate-700 font-bold mt-0.5 truncate text-[12px]">{value}</p>
    </div>
  );
}