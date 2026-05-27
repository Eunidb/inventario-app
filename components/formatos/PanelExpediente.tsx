"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/client";
import { X, ChevronRight, CheckCircle2, ChevronDown, Pencil } from "lucide-react";
import { ESTADO_CONFIG, FORMATO_CONFIG, type EstadoTrabajo, type TipoFormato, type TrabajoExpediente } from "./types";
import FormSolicitudTrabajo from "./FormSolicitudTrabajo";
import FormReporteServicio from "./FormReporteServicio";
import FormRegistroMaquinaria from "./FormRegistroMaquinaria";
import FormSolicitudCompra from "./FormSolicitudCompra";
import FormRegistroLab from "./FormRegistroLab";

interface Props {
  trabajo: TrabajoExpediente;
  onClose: () => void;
  onUpdated: () => void;
  onEdit: (t: TrabajoExpediente) => void;
}

export interface FormProps {
  registro: any;
  trabajoId: number;
  onSaved: () => void;
}

const FORM_MAP: Record<TipoFormato, React.FC<FormProps>> = {
  solicitud_trabajo: FormSolicitudTrabajo,
  reporte_servicio: FormReporteServicio,
  registro_maquinaria: FormRegistroMaquinaria,
  solicitud_compra: FormSolicitudCompra,
  registro_lab_produccion: FormRegistroLab,
};

export default function PanelExpediente({ trabajo, onClose, onUpdated, onEdit }: Props) {
  const supabase = createClient();
  const [formularioActivo, setFormularioActivo] = useState<any | null>(null);
  const [registros, setRegistros] = useState(trabajo.registros_formato ?? []);
  const [showEstados, setShowEstados] = useState(false);

  useEffect(() => { setRegistros(trabajo.registros_formato ?? []); }, [trabajo]);

  const refreshRegistros = async () => {
    const { data } = await supabase.from("registros_formato").select("*").eq("trabajo_id", trabajo.id);
    setRegistros(data ?? []);
    onUpdated();
  };

  const cambiarEstado = async (nuevoEstado: EstadoTrabajo) => {
    await supabase.from("trabajos").update({
      estado: nuevoEstado,
      fecha_cierre: nuevoEstado === "completado" ? new Date().toISOString() : null,
    }).eq("id", trabajo.id);
    setShowEstados(false);
    onUpdated();
  };

  const estActual = ESTADO_CONFIG[trabajo.estado];
  const EstIcon = estActual?.Icon;
  const total = registros.length;
  const completos = registros.filter(r => r.completado).length;
  const pct = total > 0 ? Math.round((completos / total) * 100) : 0;

  if (formularioActivo) {
    const FormComponent = FORM_MAP[formularioActivo.tipo as TipoFormato];
    return (
      <PanelShell onClose={onClose} titulo="Formulario Técnico">
        <button onClick={() => setFormularioActivo(null)} className="mb-4 inline-flex items-center gap-1 text-blue-600 font-bold text-xs bg-blue-50 px-3 py-2 rounded-xl">
          <ChevronRight size={14} className="rotate-180" /> Volver al expediente
        </button>
        {FormComponent && (
          <FormComponent
            registro={formularioActivo}
            trabajoId={trabajo.id}
            onSaved={async () => {
              await refreshRegistros();
              const { data } = await supabase.from("registros_formato").select("*").eq("id", formularioActivo.id).single();
              if (data) setFormularioActivo(data);
            }}
          />
        )}
      </PanelShell>
    );
  }

  return (
    <PanelShell onClose={onClose} titulo={`Expediente: ${trabajo.folio ?? `#${trabajo.id}`}`}>
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm mb-5">
        <div className="flex justify-between items-start">
          <div>
            <span className="font-mono text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{trabajo.folio ?? `#${trabajo.id}`}</span>
            <h2 className="text-base font-black text-slate-800 mt-2">{trabajo.titulo}</h2>
          </div>
          <button onClick={() => onEdit(trabajo)} className="p-2 text-slate-400 hover:text-amber-600"><Pencil size={14} /></button>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100">
          <button onClick={() => setShowEstados(!showEstados)} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border ${estActual?.cls}`}>
            {EstIcon && <EstIcon size={12} />} {estActual?.label} <ChevronDown size={12} />
          </button>
          {showEstados && (
            <div className="mt-2 bg-white rounded-xl border border-slate-200 shadow-lg p-1">
              {(Object.entries(ESTADO_CONFIG) as [EstadoTrabajo, any][]).map(([key, cfg]) => (
                <button key={key} onClick={() => cambiarEstado(key)} className="w-full text-left px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">{cfg.label}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {registros.map(r => {
          const cfg = FORMATO_CONFIG[r.tipo as TipoFormato];
          const Icon = cfg?.Icon;
          return (
            <button key={r.id} onClick={() => setFormularioActivo(r)} className="w-full flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 hover:border-blue-300 transition-all">
              <div className={`p-2 rounded-lg ${r.completado ? "bg-emerald-50" : "bg-slate-50"}`}>
                {Icon && <Icon size={16} className={r.completado ? "text-emerald-600" : "text-slate-400"} />}
              </div>
              <span className="flex-1 text-xs font-bold text-slate-700 text-left">{cfg?.label}</span>
              {r.completado ? <CheckCircle2 size={16} className="text-emerald-500" /> : <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">PENDIENTE</span>}
            </button>
          );
        })}
      </div>
    </PanelShell>
  );
}

function PanelShell({ children, onClose, titulo }: { children: React.ReactNode; onClose: () => void; titulo?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-lg max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider truncate">{titulo}</span>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 bg-slate-50/50">{children}</div>
      </div>
    </div>
  );
}