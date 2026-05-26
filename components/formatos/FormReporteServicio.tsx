"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/client";
import { type FormProps } from "./PanelExpediente";
import { Wrench, X } from "lucide-react"; // Añadido X para control opcional de cierre
import {
  FormHeader, Field, FotoFormato, SaveButton, inputCls,
} from "./FormSolicitudTrabajo";

export default function FormReporteServicio({ registro, trabajoId, onSaved, onClose }: FormProps & { onClose?: () => void }) {
  const supabase = createClient();

  // ── Campos del formulario ─────────────────────────────────────────────────
  const [departamento, setDepartamento] = useState("");
  const [fechaSolicitud, setFechaSolicitud] = useState(new Date().toISOString().split("T")[0]);
  const [quienReporta, setQuienReporta] = useState("");
  const [quienRecibe, setQuienRecibe] = useState("");
  const [equipo, setEquipo] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFinal, setFechaFinal] = useState("");
  const [prioridad, setPrioridad] = useState("Normal");
  const [tipoMant, setTipoMant] = useState("Correctivo");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [estadoEquipo, setEstadoEquipo] = useState("");
  const [descripcionFalla, setDescripcionFalla] = useState("");
  const [accionesRealizadas, setAccionesRealizadas] = useState("");
  const [refacciones, setRefacciones] = useState("");
  const [personal, setPersonal] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [firmaMantenimiento, setFirmaMantenimiento] = useState("");
  const [firmaSolicitante, setFirmaSolicitante] = useState("");
  const [firmaVobo, setFirmaVobo] = useState("");

  const [imagenUrl, setImagenUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

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
    await supabase
      .from("registros_formato")
      .update({
        datos_json: {
          departamento, fechaSolicitud, quienReporta, quienRecibe,
          equipo, fechaInicio, fechaFinal, prioridad, tipoMant,
          marca, modelo, estadoEquipo,
          descripcionFalla, accionesRealizadas, refacciones,
          personal, observaciones,
          firmaMantenimiento, firmaSolicitante, firmaVobo,
        },
        imagen_url: imagenUrl,
        completado: true,
        completado_por: user?.id ?? null,
        fecha_llenado: new Date().toISOString(),
      })
      .eq("id", registro.id);
    setLoading(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 backdrop-blur-sm sm:items-center p-0 sm:p-4 transition-opacity">
      
      {/* Contenedor Principal del Modal */}
      <div className="relative flex flex-col w-full max-w-3xl bg-white h-[92vh] sm:h-auto sm:max-h-[90vh] rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-100 overflow-hidden text-slate-800">
        
        {/* Pestaña táctil superior (Solo Mobile) */}
        <div className="flex justify-center py-2 sm:hidden bg-slate-50 border-b border-slate-100">
          <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
        </div>

        {/* 1. Encabezado Fijo */}
        <div className="relative p-5 sm:p-6 border-b border-slate-100 bg-white z-10 flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <FormHeader
              titulo="Reporte de Servicio"
              subtitulo="Formato 1 · Departamento de Mantenimiento · Folio 0214"
              Icon={Wrench}
              color="purple"
              completado={registro?.completado}
            />
          </div>
          {onClose && (
            <button 
              onClick={onClose}
              className="ml-4 p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
              type="button"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* 2. Cuerpo con Scroll Inteligente y Contenedores Aislados */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-5 sm:p-6 space-y-5 bg-slate-50/50 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          
          {/* Tarjeta: Datos de la Solicitud */}
          <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-100 shadow-sm space-y-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Información de la Solicitud
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Departamento">
                <input value={departamento} onChange={e => setDepartamento(e.target.value)}
                  placeholder="Ej. Producción" className={inputCls} />
              </Field>
              <Field label="Fecha de solicitud">
                <input type="date" value={fechaSolicitud} onChange={e => setFechaSolicitud(e.target.value)} className={inputCls} />
              </Field>
              <Field label="Nombre de quien reporta">
                <input value={quienReporta} onChange={e => setQuienReporta(e.target.value)}
                  placeholder="Nombre completo" className={inputCls} />
              </Field>
              <Field label="Nombre de quien recibe la solicitud">
                <input value={quienRecibe} onChange={e => setQuienRecibe(e.target.value)}
                  placeholder="Técnico de mantenimiento" className={inputCls} />
              </Field>
            </div>
          </div>

          {/* Tarjeta: Control de Tiempos y Clasificación */}
          <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-100 shadow-sm space-y-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Control y Categorización
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Prioridad">
                  <select value={prioridad} onChange={e => setPrioridad(e.target.value)} className={inputCls}>
                    <option>Alta</option>
                    <option>Normal</option>
                    <option>Baja</option>
                  </select>
                </Field>
                <Field label="Tipo de mantenimiento">
                  <select value={tipoMant} onChange={e => setTipoMant(e.target.value)} className={inputCls}>
                    <option>Preventivo</option>
                    <option>Correctivo</option>
                    <option>Eléctrico</option>
                    <option>Electrónico</option>
                    <option>Instalación</option>
                  </select>
                </Field>
              </div>
              <Field label="Equipo afectado">
                <input value={equipo} onChange={e => setEquipo(e.target.value)}
                  placeholder="Nombre o ID" className={inputCls} />
              </Field>
              <Field label="Fecha de inicio">
                <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} className={inputCls} />
              </Field>
              <Field label="Fecha final">
                <input type="date" value={fechaFinal} onChange={e => setFechaFinal(e.target.value)} className={inputCls} />
              </Field>
            </div>
          </div>

          {/* Tarjeta: Datos Técnicos del Equipo */}
          <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-100 shadow-sm space-y-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Datos técnicos del equipo
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Marca">
                <input value={marca} onChange={e => setMarca(e.target.value)} placeholder="Ej. Grundfos" className={inputCls} />
              </Field>
              <Field label="Modelo">
                <input value={modelo} onChange={e => setModelo(e.target.value)} placeholder="Ej. CM5-6" className={inputCls} />
              </Field>
              <Field label="Estado del equipo">
                <input value={estadoEquipo} onChange={e => setEstadoEquipo(e.target.value)}
                  placeholder="Ej. Operativo parcial" className={inputCls} />
              </Field>
            </div>
          </div>

          {/* Tarjeta: Bloque Operativo (Campos de Texto Grande) */}
          <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-100 shadow-sm space-y-5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Bitácora de Intervención
            </p>
            
            <Field label="Descripción de la falla">
              <textarea value={descripcionFalla} onChange={e => setDescripcionFalla(e.target.value)}
                rows={3} placeholder="Describa la falla o situación detectada..."
                className={`${inputCls} resize-none`} />
            </Field>

            <Field label="Acciones realizadas">
              <textarea value={accionesRealizadas} onChange={e => setAccionesRealizadas(e.target.value)}
                rows={3} placeholder="Detalle las acciones de mantenimiento ejecutadas..."
                className={`${inputCls} resize-none`} />
            </Field>

            <Field label="Refacciones requeridas">
              <textarea value={refacciones} onChange={e => setRefacciones(e.target.value)}
                rows={2} placeholder="Refacciones, materiales o piezas utilizadas o solicitadas..."
                className={`${inputCls} resize-none`} />
            </Field>

            <Field label="Personal que realizó el mantenimiento">
              <input value={personal} onChange={e => setPersonal(e.target.value)}
                placeholder="Nombres de los técnicos" className={inputCls} />
            </Field>

            <Field label="Observaciones adicionales">
              <textarea value={observaciones} onChange={e => setObservaciones(e.target.value)}
                rows={2} placeholder="Comentarios, pendientes o recomendaciones..."
                className={`${inputCls} resize-none`} />
            </Field>
          </div>

          {/* Tarjeta: Firmas de Cierre */}
          <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-100 shadow-sm space-y-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Firmas de conformidad
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Mantenimiento (Inicio)">
                <input value={firmaMantenimiento} onChange={e => setFirmaMantenimiento(e.target.value)}
                  placeholder="Nombre / firma" className={inputCls} />
              </Field>
              <Field label="Solicitante (Término)">
                <input value={firmaSolicitante} onChange={e => setFirmaSolicitante(e.target.value)}
                  placeholder="Nombre / firma" className={inputCls} />
              </Field>
              <Field label="Vo.Bo.">
                <input value={firmaVobo} onChange={e => setFirmaVobo(e.target.value)}
                  placeholder="Nombre / firma" className={inputCls} />
              </Field>
            </div>
          </div>

          {/* Evidencia Fotográfica */}
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
            <FotoFormato
              imagenUrl={imagenUrl}
              uploading={uploading}
              onUpload={uploadFoto}
              onDelete={() => setImagenUrl(null)}
            />
          </div>
        </div>

        {/* 3. Footer Fijo con Sombra Invertida */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-white z-10 flex justify-end shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
          <div className="w-full sm:w-auto min-w-[150px]">
            <SaveButton loading={loading} onSave={handleSave} completado={registro?.completado} />
          </div>
        </div>

      </div>
    </div>
  );
}