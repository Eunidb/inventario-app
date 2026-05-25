/**
 * @file components/formatos/FormReporteServicio.tsx
 * @description Digitalización del formato físico "Reporte de Servicio"
 *   (Formato 1 / Folio 0214).
 *
 * Campos del formato original:
 *   - Departamento, Fecha de solicitud
 *   - Nombre de quien reporta / recibe la solicitud
 *   - Equipo, Fecha inicio y final
 *   - Prioridad y tipo de mantenimiento (preventivo/correctivo)
 *   - Datos del equipo (marca, modelo, estado)
 *   - Descripción de la falla
 *   - Acciones realizadas
 *   - Refacciones requeridas
 *   - Personal que realizó el mantenimiento
 *   - Observaciones adicionales
 *   - Firmas: mantenimiento al inicio / solicitante al término / Vo.Bo.
 *   - Foto del formato físico firmado (evidencia)
 */

"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/client";
import { type FormProps } from "./PanelExpediente";
import { Wrench } from "lucide-react";
import {
  FormHeader, Field, FotoFormato, SaveButton, inputCls,
} from "./FormSolicitudTrabajo";

export default function FormReporteServicio({ registro, trabajoId, onSaved }: FormProps) {
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
  // Datos del equipo
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [estadoEquipo, setEstadoEquipo] = useState("");
  // Textos largos
  const [descripcionFalla, setDescripcionFalla] = useState("");
  const [accionesRealizadas, setAccionesRealizadas] = useState("");
  const [refacciones, setRefacciones] = useState("");
  const [personal, setPersonal] = useState("");
  const [observaciones, setObservaciones] = useState("");
  // Firmas
  const [firmaMantenimiento, setFirmaMantenimiento] = useState("");
  const [firmaSolicitante, setFirmaSolicitante] = useState("");
  const [firmaVobo, setFirmaVobo] = useState("");

  const [imagenUrl, setImagenUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  // Carga los valores previamente guardados
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
    <div className="space-y-6">
      <FormHeader
        titulo="Reporte de Servicio"
        subtitulo="Formato 1 · Departamento de Mantenimiento"
        Icon={Wrench}
        color="purple"
        completado={registro?.completado}
      />

      {/* Encabezado general */}
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

      {/* Equipo y fechas de atención */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Field label="Equipo">
          <input value={equipo} onChange={e => setEquipo(e.target.value)}
            placeholder="Nombre o ID del equipo" className={inputCls} />
        </Field>
        <Field label="Fecha de inicio">
          <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Fecha final">
          <input type="date" value={fechaFinal} onChange={e => setFechaFinal(e.target.value)} className={inputCls} />
        </Field>
      </div>

      {/* Prioridad y tipo de mantenimiento */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

      {/* Datos del equipo */}
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
          Datos del equipo
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

      {/* Textos de la atención */}
      <Field label="Descripción de la falla">
        <textarea value={descripcionFalla} onChange={e => setDescripcionFalla(e.target.value)}
          rows={4} placeholder="Describa la falla o situación detectada..."
          className={`${inputCls} resize-none`} />
      </Field>

      <Field label="Acciones realizadas">
        <textarea value={accionesRealizadas} onChange={e => setAccionesRealizadas(e.target.value)}
          rows={4} placeholder="Detalle las acciones de mantenimiento ejecutadas..."
          className={`${inputCls} resize-none`} />
      </Field>

      <Field label="Refacciones requeridas">
        <textarea value={refacciones} onChange={e => setRefacciones(e.target.value)}
          rows={3} placeholder="Refacciones, materiales o piezas utilizadas o solicitadas..."
          className={`${inputCls} resize-none`} />
      </Field>

      <Field label="Personal que realizó el mantenimiento">
        <input value={personal} onChange={e => setPersonal(e.target.value)}
          placeholder="Nombres de los técnicos" className={inputCls} />
      </Field>

      <Field label="Observaciones adicionales">
        <textarea value={observaciones} onChange={e => setObservaciones(e.target.value)}
          rows={3} placeholder="Comentarios, pendientes o recomendaciones..."
          className={`${inputCls} resize-none`} />
      </Field>

      {/* Firmas de cierre */}
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
          Firmas de cierre
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Mantenimiento al inicio del servicio">
            <input value={firmaMantenimiento} onChange={e => setFirmaMantenimiento(e.target.value)}
              placeholder="Nombre / firma" className={inputCls} />
          </Field>
          <Field label="Solicitante al término del servicio">
            <input value={firmaSolicitante} onChange={e => setFirmaSolicitante(e.target.value)}
              placeholder="Nombre / firma" className={inputCls} />
          </Field>
          <Field label="Vo.Bo.">
            <input value={firmaVobo} onChange={e => setFirmaVobo(e.target.value)}
              placeholder="Nombre / firma" className={inputCls} />
          </Field>
        </div>
      </div>

      <FotoFormato
        imagenUrl={imagenUrl}
        uploading={uploading}
        onUpload={uploadFoto}
        onDelete={() => setImagenUrl(null)}
      />

      <SaveButton loading={loading} onSave={handleSave} completado={registro?.completado} />
    </div>
  );
}
