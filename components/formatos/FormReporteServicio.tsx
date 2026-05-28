"use client";

/**
 * @file components/formatos/FormReporteServicio.tsx
 *
 * CORRECCIONES:
 * 1. Se añade div de backdrop absoluto con onClick={onClose} para cerrar
 *    al hacer clic fuera del formulario.
 * 2. El botón X siempre aparece cuando se provee onClose.
 * 3. z-index elevado a z-[60] para quedar sobre PanelExpediente (z-50).
 */

import { useState, useEffect } from "react";
import { createClient } from "@/lib/client";
import { type FormProps } from "./PanelExpediente";
import { Wrench, X } from "lucide-react";
import { FormHeader, Field, FotoFormato, SaveButton, inputCls } from "./FormSolicitudTrabajo";

export default function FormReporteServicio({
  registro, trabajoId, onSaved, onClose,
}: FormProps & { onClose?: () => void }) {
  const supabase = createClient();

  const [departamento,        setDepartamento]        = useState("");
  const [fechaSolicitud,      setFechaSolicitud]      = useState(new Date().toISOString().split("T")[0]);
  const [quienReporta,        setQuienReporta]        = useState("");
  const [quienRecibe,         setQuienRecibe]         = useState("");
  const [equipo,              setEquipo]              = useState("");
  const [fechaInicio,         setFechaInicio]         = useState("");
  const [fechaFinal,          setFechaFinal]          = useState("");
  const [prioridad,           setPrioridad]           = useState("Normal");
  const [tipoMant,            setTipoMant]            = useState("Correctivo");
  const [marca,               setMarca]               = useState("");
  const [modelo,              setModelo]              = useState("");
  const [estadoEquipo,        setEstadoEquipo]        = useState("");
  const [descripcionFalla,    setDescripcionFalla]    = useState("");
  const [accionesRealizadas,  setAccionesRealizadas]  = useState("");
  const [refacciones,         setRefacciones]         = useState("");
  const [personal,            setPersonal]            = useState("");
  const [observaciones,       setObservaciones]       = useState("");
  const [firmaMantenimiento,  setFirmaMantenimiento]  = useState("");
  const [firmaSolicitante,    setFirmaSolicitante]    = useState("");
  const [firmaVobo,           setFirmaVobo]           = useState("");
  const [imagenUrl,           setImagenUrl]           = useState<string | null>(null);
  const [uploading,           setUploading]           = useState(false);
  const [loading,             setLoading]             = useState(false);

  useEffect(() => {
    const d = registro?.datos_json ?? {};
    setDepartamento(d.departamento ?? "");
    setFechaSolicitud(d.fechaSolicitud ?? new Date().toISOString().split("T")[0]);
    setQuienReporta(d.quienReporta ?? "");
    setQuienRecibe(d.quienRecibe ?? "");
    setEquipo(d.equipo ?? "");
    setFechaInicio(d.fechaInicio ?? "");
    setFechaFinal(d.fechaFinal ?? "");
    setPrioridad(d.prioridad ?? "Normal");
    setTipoMant(d.tipoMant ?? "Correctivo");
    setMarca(d.marca ?? "");
    setModelo(d.modelo ?? "");
    setEstadoEquipo(d.estadoEquipo ?? "");
    setDescripcionFalla(d.descripcionFalla ?? "");
    setAccionesRealizadas(d.accionesRealizadas ?? "");
    setRefacciones(d.refacciones ?? "");
    setPersonal(d.personal ?? "");
    setObservaciones(d.observaciones ?? "");
    setFirmaMantenimiento(d.firmaMantenimiento ?? "");
    setFirmaSolicitante(d.firmaSolicitante ?? "");
    setFirmaVobo(d.firmaVobo ?? "");
    setImagenUrl(registro?.imagen_url ?? null);
  }, [registro]);

  const uploadFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setUploading(true);
    const file = e.target.files[0];
    const path = `trabajos/${trabajoId}/reporte-${Date.now()}.${file.name.split(".").pop()}`;
    const { error } = await supabase.storage.from("formatos").upload(path, file, { upsert: true });
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from("formatos").getPublicUrl(path);
      setImagenUrl(publicUrl);
    }
    setUploading(false);
  };

  const handleSave = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("registros_formato").update({
      datos_json: {
        departamento, fechaSolicitud, quienReporta, quienRecibe, equipo,
        fechaInicio, fechaFinal, prioridad, tipoMant, marca, modelo,
        estadoEquipo, descripcionFalla, accionesRealizadas, refacciones,
        personal, observaciones, firmaMantenimiento, firmaSolicitante, firmaVobo,
      },
      imagen_url:     imagenUrl,
      completado:     true,
      completado_por: user?.id ?? null,
      fecha_llenado:  new Date().toISOString(),
    }).eq("id", registro.id);
    setLoading(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop con cierre al clic */}
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative flex flex-col w-full max-w-3xl bg-white h-[92vh] sm:h-auto sm:max-h-[90vh] rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-100 overflow-hidden text-slate-800">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white shrink-0">
          <div className="flex-1 min-w-0">
            <FormHeader
              titulo="Reporte de Servicio"
              subtitulo="Formato 1 · Mantenimiento"
              Icon={Wrench}
              color="purple"
              completado={registro?.completado}
            />
          </div>
          {onClose && (
            <button onClick={onClose} className="p-2 ml-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors" aria-label="Cerrar">
              <X size={20} />
            </button>
          )}
        </div>

        {/* Cuerpo */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 bg-slate-50/50">
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Información de la Solicitud</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Departamento"><input value={departamento}   onChange={e => setDepartamento(e.target.value)}   className={inputCls} /></Field>
              <Field label="Fecha de solicitud"><input type="date" value={fechaSolicitud} onChange={e => setFechaSolicitud(e.target.value)} className={inputCls} /></Field>
              <Field label="Quien reporta"><input value={quienReporta}  onChange={e => setQuienReporta(e.target.value)}  className={inputCls} /></Field>
              <Field label="Quien recibe"><input value={quienRecibe}   onChange={e => setQuienRecibe(e.target.value)}   className={inputCls} /></Field>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Control y Categorización</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Prioridad">
                <select value={prioridad} onChange={e => setPrioridad(e.target.value)} className={inputCls}>
                  <option>Alta</option><option>Normal</option><option>Baja</option>
                </select>
              </Field>
              <Field label="Tipo Mant.">
                <select value={tipoMant} onChange={e => setTipoMant(e.target.value)} className={inputCls}>
                  <option>Preventivo</option><option>Correctivo</option><option>Instalación</option>
                </select>
              </Field>
              <Field label="Equipo"><input value={equipo} onChange={e => setEquipo(e.target.value)} className={inputCls} /></Field>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Bitácora de Intervención</p>
            <Field label="Descripción de la falla">
              <textarea value={descripcionFalla} onChange={e => setDescripcionFalla(e.target.value)} rows={2} className={`${inputCls} resize-none`} />
            </Field>
            <Field label="Acciones realizadas">
              <textarea value={accionesRealizadas} onChange={e => setAccionesRealizadas(e.target.value)} rows={2} className={`${inputCls} resize-none`} />
            </Field>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
            <FotoFormato imagenUrl={imagenUrl} uploading={uploading} onUpload={uploadFoto} onDelete={() => setImagenUrl(null)} color="purple" />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-white shrink-0 flex justify-end">
          <SaveButton loading={loading} onSave={handleSave} completado={registro?.completado} color="purple" />
        </div>
      </div>
    </div>
  );
}