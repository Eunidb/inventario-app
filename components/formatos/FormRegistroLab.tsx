/**
 * @file components/formatos/FormRegistroLab.tsx
 * @description Digitalización del formato "Registro de Laboratorio de
 *   Medicamentos y Productos Terminados" (Formato 5).
 *
 * Se genera únicamente cuando `requiere_registro_lab = true` en el trabajo.
 * Aplica para equipos de laboratorio farmacéutico bajo normas GMP/COFEPRIS.
 *
 * Campos:
 *   - Fecha
 *   - Identificación del equipo de laboratorio
 *   - Área del laboratorio
 *   - Tipo de mantenimiento
 *   - Descripción del servicio realizado
 *   - Parámetros verificados (calibración, limpieza, funcional)
 *   - Observaciones y resultado (aprobado / condicional / rechazado)
 *   - Firmas: ejecutó, revisó, liberó
 *   - Foto del formato físico
 */

"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/client";
import { type FormProps } from "./PanelExpediente";
import { FlaskConical } from "lucide-react";
import {
  FormHeader, Field, FotoFormato, SaveButton, inputCls,
} from "./FormSolicitudTrabajo";

export default function FormRegistroLab({ registro, trabajoId, onSaved }: FormProps) {
  const supabase = createClient();

  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  // Identificación del equipo de laboratorio
  const [nombreEquipo, setNombreEquipo] = useState("");
  const [codigoEquipo, setCodigoEquipo] = useState("");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [serie, setSerie] = useState("");
  const [areaLab, setAreaLab] = useState("");
  const [tipoMant, setTipoMant] = useState("Preventivo");
  // Detalle del servicio
  const [descripcionServicio, setDescripcionServicio] = useState("");
  // Parámetros verificados — checkboxes
  const [parametros, setParametros] = useState<string[]>([]);
  // Resultado final del servicio
  const [resultado, setResultado] = useState("Aprobado");
  const [observaciones, setObservaciones] = useState("");
  // Firmas GMP
  const [ejecuto, setEjecuto] = useState("");
  const [reviso, setReviso] = useState("");
  const [libero, setLibero] = useState("");

  const [imagenUrl, setImagenUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const d = registro?.datos_json ?? {};
    setFecha(d.fecha ?? new Date().toISOString().split("T")[0]);
    setNombreEquipo(d.nombreEquipo ?? "");
    setCodigoEquipo(d.codigoEquipo ?? "");
    setMarca(d.marca ?? "");
    setModelo(d.modelo ?? "");
    setSerie(d.serie ?? "");
    setAreaLab(d.areaLab ?? "");
    setTipoMant(d.tipoMant ?? "Preventivo");
    setDescripcionServicio(d.descripcionServicio ?? "");
    setParametros(d.parametros ?? []);
    setResultado(d.resultado ?? "Aprobado");
    setObservaciones(d.observaciones ?? "");
    setEjecuto(d.ejecuto ?? "");
    setReviso(d.reviso ?? "");
    setLibero(d.libero ?? "");
    setImagenUrl(registro?.imagen_url ?? null);
  }, [registro]);

  // Alterna un parámetro verificado en el array
  const toggleParametro = (p: string) =>
    setParametros(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);

  const uploadFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setUploading(true);
    const file = e.target.files[0];
    const path = `trabajos/${trabajoId}/lab-${Date.now()}.${file.name.split(".").pop()}`;
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
          fecha, nombreEquipo, codigoEquipo, marca, modelo, serie,
          areaLab, tipoMant, descripcionServicio,
          parametros, resultado, observaciones,
          ejecuto, reviso, libero,
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

  // Parámetros verificados propios de laboratorio farmacéutico
  const PARAMETROS = [
    "Calibración",
    "Limpieza y sanitización",
    "Verificación funcional",
    "Registro de temperatura",
    "Verificación eléctrica",
    "Revisión de alarmas",
    "Lubricación",
  ];

  // Resultado del servicio con color asociado
  const RESULTADO_CLS: Record<string, string> = {
    "Aprobado":    "bg-emerald-50 border-emerald-200 text-emerald-700",
    "Condicional": "bg-amber-50 border-amber-200 text-amber-700",
    "Rechazado":   "bg-red-50 border-red-200 text-red-700",
  };

  return (
    <div className="space-y-6">
      <FormHeader
        titulo="Registro de Lab. de Producción"
        subtitulo="Formato 5 · Equipos de laboratorio farmacéutico"
        Icon={FlaskConical}
        color="rose"
        completado={registro?.completado}
      />

      <Field label="Fecha">
        <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className={inputCls} />
      </Field>

      {/* Identificación del equipo */}
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
          Identificación del equipo
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nombre del equipo">
            <input value={nombreEquipo} onChange={e => setNombreEquipo(e.target.value)}
              placeholder="Ej. Estufa de secado, Autoclave" className={inputCls} />
          </Field>
          <Field label="Código de equipo">
            <input value={codigoEquipo} onChange={e => setCodigoEquipo(e.target.value)}
              placeholder="Código interno del equipo" className={inputCls} />
          </Field>
          <Field label="Marca">
            <input value={marca} onChange={e => setMarca(e.target.value)}
              placeholder="Ej. Memmert" className={inputCls} />
          </Field>
          <Field label="Modelo">
            <input value={modelo} onChange={e => setModelo(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Número de serie">
            <input value={serie} onChange={e => setSerie(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Área del laboratorio">
            <input value={areaLab} onChange={e => setAreaLab(e.target.value)}
              placeholder="Ej. Control de calidad, Producción" className={inputCls} />
          </Field>
        </div>
      </div>

      <Field label="Tipo de mantenimiento">
        <select value={tipoMant} onChange={e => setTipoMant(e.target.value)} className={inputCls}>
          <option>Preventivo</option>
          <option>Correctivo</option>
          <option>Calibración</option>
          <option>Calificación</option>
          <option>Eléctrico</option>
        </select>
      </Field>

      <Field label="Descripción del servicio realizado">
        <textarea value={descripcionServicio} onChange={e => setDescripcionServicio(e.target.value)}
          rows={4} placeholder="Detalle del mantenimiento o calibración realizada..."
          className={`${inputCls} resize-none`} />
      </Field>

      {/* Parámetros verificados — checkboxes específicos de GMP */}
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
          Parámetros verificados
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {PARAMETROS.map(param => (
            <label
              key={param}
              className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                parametros.includes(param)
                  ? "bg-rose-50 border-rose-200 text-rose-700"
                  : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              <input
                type="checkbox"
                checked={parametros.includes(param)}
                onChange={() => toggleParametro(param)}
                className="rounded accent-rose-600 w-4 h-4"
              />
              <span className="text-sm font-semibold">{param}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Resultado del servicio — selector visual de 3 opciones */}
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
          Resultado del servicio
        </p>
        <div className="grid grid-cols-3 gap-2">
          {Object.keys(RESULTADO_CLS).map(r => (
            <button
              key={r}
              type="button"
              onClick={() => setResultado(r)}
              className={`py-3 rounded-xl border text-sm font-bold transition-all ${
                resultado === r ? RESULTADO_CLS[r] : "bg-slate-50 border-slate-200 text-slate-500"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <Field label="Observaciones">
        <textarea value={observaciones} onChange={e => setObservaciones(e.target.value)}
          rows={3} placeholder="Observaciones finales, pendientes o restricciones de uso..."
          className={`${inputCls} resize-none`} />
      </Field>

      {/* Firmas GMP: ejecutó / revisó / liberó */}
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
          Firmas de cierre (GMP)
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Ejecutó">
            <input value={ejecuto} onChange={e => setEjecuto(e.target.value)}
              placeholder="Técnico de mantenimiento" className={inputCls} />
          </Field>
          <Field label="Revisó">
            <input value={reviso} onChange={e => setReviso(e.target.value)}
              placeholder="Supervisor de calidad" className={inputCls} />
          </Field>
          <Field label="Liberó">
            <input value={libero} onChange={e => setLibero(e.target.value)}
              placeholder="Responsable de liberación" className={inputCls} />
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
