"use client";

/**
 * @file components/formatos/PanelExpediente.tsx
 *
 * Panel lateral del expediente de trabajo.
 */

import { useState, useEffect } from "react";
import { createClient } from "@/lib/client";
import {
  X, ChevronRight, CheckCircle2, ChevronDown,
  Pencil, Plus, Loader2,
} from "lucide-react";
import {
  ESTADO_CONFIG,
  FORMATO_CONFIG,
  type EstadoTrabajo,
  type TipoFormato,
  type TrabajoExpediente,
} from "./types";
import FormSolicitudTrabajo from "./FormSolicitudTrabajo";
import FormReporteServicio from "./FormReporteServicio";
import FormRegistroMaquinaria from "./FormRegistroMaquinaria";
import FormSolicitudCompra from "./FormSolicitudCompra";
import FormRegistroLab from "./FormRegistroLab";

// ─── Interfaces ───────────────────────────────────────────────────────────────

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
  onClose: () => void;
}

// ─── Mapa de tipo → componente de formulario ─────────────────────────────────
const FORM_MAP: Record<TipoFormato, React.FC<FormProps>> = {
  solicitud_trabajo:      FormSolicitudTrabajo,
  reporte_servicio:       FormReporteServicio,
  registro_maquinaria:    FormRegistroMaquinaria,
  solicitud_compra:       FormSolicitudCompra,
  registro_lab_produccion: FormRegistroLab,
};

// ─── Componente principal ─────────────────────────────────────────────────────
export default function PanelExpediente({ trabajo, onClose, onUpdated, onEdit }: Props) {
  const supabase = createClient();

  const [formularioActivo,    setFormularioActivo]    = useState<any | null>(null);
  const [registros,           setRegistros]           = useState(trabajo.registros_formato ?? []);
  const [showEstados,         setShowEstados]         = useState(false);
  const [showAgregarFormato,  setShowAgregarFormato]  = useState(false);
  const [agregando,           setAgregando]           = useState(false);

  // Sincroniza los registros si el expediente padre cambia (ej. al guardar)
  useEffect(() => { setRegistros(trabajo.registros_formato ?? []); }, [trabajo]);

  // ─── Refresca la lista de registros desde Supabase ─────────────────────
  const refreshRegistros = async () => {
    const { data } = await supabase
      .from("registros_formato")
      .select("*")
      .eq("trabajo_id", trabajo.id);
    setRegistros(data ?? []);
    onUpdated();
  };

  // ─── Cambia el estado del expediente ───────────────────────────────────
  const cambiarEstado = async (nuevoEstado: EstadoTrabajo) => {
    await supabase
      .from("trabajos")
      .update({
        estado:       nuevoEstado,
        fecha_cierre: nuevoEstado === "completado" ? new Date().toISOString() : null,
      })
      .eq("id", trabajo.id);
    setShowEstados(false);
    onUpdated();
  };

  // ─── Añade un formato que aún no existe en el expediente ───────────────
  const agregarFormato = async (tipo: TipoFormato) => {
    setAgregando(true);
    const { error } = await supabase
      .from("registros_formato")
      .insert({ trabajo_id: trabajo.id, tipo, completado: false });

    if (error) {
      alert("Error al agregar el formato: " + error.message);
    } else {
      setShowAgregarFormato(false);
      await refreshRegistros();
    }
    setAgregando(false);
  };

  // ─── Derivados ─────────────────────────────────────────────────────────
  const estActual    = ESTADO_CONFIG[trabajo.estado];
  const EstIcon      = estActual?.Icon;
  const total        = registros.length;
  const completos    = registros.filter(r => r.completado).length;
  const pct          = total > 0 ? Math.round((completos / total) * 100) : 0;

  // Tipos de formato que aún NO están en el expediente (para el selector)
  const tiposExistentes  = registros.map(r => r.tipo as TipoFormato);
  const tiposDisponibles = (Object.keys(FORMATO_CONFIG) as TipoFormato[])
    .filter(t => !tiposExistentes.includes(t));

  // ─── Si hay un formulario abierto, renderizarlo directamente (fuera de
  //     PanelShell para evitar que transform rompa position:fixed) ──────
  if (formularioActivo) {
    const FormComponent = FORM_MAP[formularioActivo.tipo as TipoFormato];

    // Vuelve a la lista de formatos del expediente
    const handleBackToMenu = () => setFormularioActivo(null);

    return (
      <>
        {/* Overlay oscuro detrás del formulario */}
        <div
          className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-sm"
          onClick={handleBackToMenu}
        />

        {/* El formulario crea su propio fixed overlay (z-[60]) */}
        {FormComponent && (
          <FormComponent
            registro={formularioActivo}
            trabajoId={trabajo.id}
            onClose={handleBackToMenu}
            onSaved={async () => {
              await refreshRegistros();
              // Actualiza el estado local del formulario activo tras guardar
              const { data } = await supabase
                .from("registros_formato")
                .select("*")
                .eq("id", formularioActivo.id)
                .single();
              if (data) setFormularioActivo(data);
            }}
          />
        )}
      </>
    );
  }

  // ─── Vista principal del panel ─────────────────────────────────────────
  return (
    <PanelShell onClose={onClose} titulo={`Expediente: ${trabajo.folio ?? `#${trabajo.id}`}`}>

      {/* ── Datos del expediente ──────────────────────────────────────── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm mb-5">
        <div className="flex justify-between items-start">
          <div>
            <span className="font-mono text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
              {trabajo.folio ?? `#${trabajo.id}`}
            </span>
            <h2 className="text-base font-black text-slate-800 mt-2">{trabajo.titulo}</h2>
            {trabajo.maquina && (
              <p className="text-xs text-slate-400 font-mono mt-0.5">{trabajo.maquina}</p>
            )}
          </div>
          <button
            onClick={() => onEdit(trabajo)}
            className="p-2 text-slate-400 hover:text-amber-600 transition-colors"
            title="Editar expediente"
          >
            <Pencil size={14} />
          </button>
        </div>

        {/* Barra de progreso */}
        <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
          <div className="flex justify-between text-[11px] font-bold text-slate-400">
            <span>Progreso del Expediente</span>
            <span>{completos}/{total} ({pct}%)</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Selector de estado */}
        <div className="mt-4 pt-4 border-t border-slate-100 relative">
          <button
            onClick={() => setShowEstados(!showEstados)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${estActual?.cls}`}
          >
            {EstIcon && <EstIcon size={12} />}
            {estActual?.label}
            <ChevronDown
              size={12}
              className={`transition-transform duration-200 ${showEstados ? "rotate-180" : ""}`}
            />
          </button>

          {showEstados && (
            <div className="absolute left-0 mt-2 z-20 bg-white rounded-xl border border-slate-200 shadow-xl p-1 w-44 animate-in fade-in slide-in-from-top-2 duration-150">
              {(Object.entries(ESTADO_CONFIG) as [EstadoTrabajo, any][]).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => cambiarEstado(key)}
                  className={`w-full text-left px-3 py-2 text-xs font-bold rounded-lg transition-colors ${
                    trabajo.estado === key
                      ? "bg-slate-50 text-blue-600"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {cfg.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Lista de formatos asociados ───────────────────────────────── */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
          Formatos del expediente
        </p>

        {registros.length === 0 && (
          <p className="text-xs text-slate-400 italic px-1 py-2">
            Sin formatos registrados aún.
          </p>
        )}

        {registros.map(r => {
          const cfg  = FORMATO_CONFIG[r.tipo as TipoFormato];
          const Icon = cfg?.Icon;
          return (
            <button
              key={r.id}
              onClick={() => setFormularioActivo(r)}
              className="w-full flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 hover:border-blue-300 shadow-sm hover:shadow transition-all text-left"
            >
              <div className={`p-2 rounded-lg ${r.completado ? "bg-emerald-50" : "bg-slate-50"}`}>
                {Icon && (
                  <Icon
                    size={16}
                    className={r.completado ? "text-emerald-600" : "text-slate-400"}
                  />
                )}
              </div>
              <span className="flex-1 text-xs font-bold text-slate-700">
                {cfg?.label}
              </span>
              {r.completado ? (
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
              ) : (
                <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md shrink-0">
                  PENDIENTE
                </span>
              )}
            </button>
          );
        })}

        {/* ── Sección para agregar formatos adicionales ─────────────── */}
        {tiposDisponibles.length > 0 && (
          <div className="mt-3">
            {/* Botón principal para desplegar la lista */}
            <button
              onClick={() => setShowAgregarFormato(!showAgregarFormato)}
              className="w-full flex items-center justify-center gap-2 p-2.5 border-2 border-dashed border-slate-200 rounded-xl text-xs font-bold text-slate-400 hover:border-[#014ba0] hover:text-[#014ba0] transition-all duration-200"
            >
              <Plus size={14} />
              Añadir Formato al Expediente
            </button>

            {/* Lista desplegable de formatos disponibles */}
            {showAgregarFormato && (
              <div className="mt-2 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1 pb-1">
                  Selecciona el formato a agregar:
                </p>
                {tiposDisponibles.map(tipo => {
                  const cfg  = FORMATO_CONFIG[tipo];
                  const Icon = cfg?.Icon;
                  return (
                    <button
                      key={tipo}
                      onClick={() => agregarFormato(tipo)}
                      disabled={agregando}
                      className="w-full flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-[#014ba0]/40 hover:bg-[#014ba0]/5 transition-all text-left disabled:opacity-50"
                    >
                      <div className="p-1.5 rounded-lg bg-white border border-slate-200">
                        {Icon && <Icon size={14} className={cfg?.color ?? "text-slate-400"} />}
                      </div>
                      <span className="flex-1 text-xs font-bold text-slate-600">
                        {cfg?.label}
                      </span>
                      {agregando
                        ? <Loader2 size={13} className="text-slate-300 animate-spin" />
                        : <Plus size={13} className="text-slate-300" />
                      }
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Mensaje cuando todos los formatos ya están agregados */}
        {tiposDisponibles.length === 0 && registros.length > 0 && (
          <p className="text-[10px] text-slate-400 italic text-center pt-2">
            Todos los formatos disponibles ya están en el expediente.
          </p>
        )}
      </div>
    </PanelShell>
  );
}

// ─── Shell del panel (contenedor visual) ──────────────────────────────────────
/**
 * Contenedor sin transforms CSS para no romper position:fixed de los
 * formularios hijos (que crean su propio overlay de pantalla completa).
 */
function PanelShell({
  children,
  onClose,
  titulo,
}: {
  children: React.ReactNode;
  onClose: () => void;
  titulo?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      {/* Cierre al hacer clic en el backdrop */}
      <div className="absolute inset-0 z-0" onClick={onClose} />

      {/* Contenedor del panel */}
      <div className="relative z-10 bg-white w-full sm:max-w-lg max-h-[90vh] rounded-2xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white shrink-0">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider truncate mr-4">
            {titulo}
          </span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            type="button"
            aria-label="Cerrar panel"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 bg-slate-50/50">
          {children}
        </div>
      </div>
    </div>
  );
}