"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/client";
import { type FormProps } from "./PanelExpediente";
import { FlaskConical, X } from "lucide-react"; // Añadido X para el botón de cerrar opcional
import {
  FormHeader, Field, FotoFormato, SaveButton, inputCls,
} from "./FormSolicitudTrabajo";

export default function FormRegistroLab({ registro, trabajoId, onSaved, onClose }: FormProps & { onClose?: () => void }) {
  const supabase = createClient();

  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [nombreEquipo, setNombreEquipo] = useState("");
  const [codigoEquipo, setCodigoEquipo] = useState("");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [serie, setSerie] = useState("");
  const [areaLab, setAreaLab] = useState("");
  const [tipoMant, setTipoMant] = useState("Preventivo");
  const [descripcionServicio, setDescripcionServicio] = useState("");
  const [parametros, setParametros] = useState<string[]>([]);
  const [resultado, setResultado] = useState("Aprobado");
  const [observaciones, setObservaciones] = useState("");
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

  const PARAMETROS = [
    "Calibración",
    "Limpieza y sanitización",
    "Verificación funcional",
    "Registro de temperatura",
    "Verificación eléctrica",
    "Revisión de alarmas",
    "Lubricación",
  ];

  const RESULTADO_CLS: Record<string, string> = {
    "Aprobado":    "bg-emerald-50 border-emerald-200 text-emerald-700",
    "Condicional": "bg-amber-50 border-amber-200 text-amber-700",
    "Rechazado":   "bg-red-50 border-red-200 text-red-700",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 backdrop-blur-sm sm:items-center p-0 sm:p-4 transition-opacity">
      
      {/* Contenedor Principal del Modal */}
      <div className="relative flex flex-col w-full max-w-3xl bg-white h-[92vh] sm:h-auto sm:max-h-[90vh] rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-100 overflow-hidden text-slate-800">
        
        {/* Indicador visual de arrastre (solo móvil) */}
        <div className="flex justify-center py-2 sm:hidden bg-slate-50 border-b border-slate-100">
          <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
        </div>

        {/* 1. Encabezado Fijo */}
        <div className="relative p-5 sm:p-6 border-b border-slate-100 bg-white z-10 flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <FormHeader
              titulo="Registro de Lab. de Producción"
              subtitulo="Formato 5 · Equipos de laboratorio farmacéutico"
              Icon={FlaskConical}
              color="rose"
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

        {/* 2. Cuerpo con Scroll Intuitivo */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-5 sm:p-6 space-y-6 bg-slate-50/50 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          
          {/* Fecha */}
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
            <Field label="Fecha">
              <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className={inputCls} />
            </Field>
          </div>

          {/* Identificación del equipo */}
          <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-100 shadow-sm space-y-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
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

          {/* Tipo de Mantenimiento y Descripción */}
          <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-100 shadow-sm space-y-4">
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
                rows={3} placeholder="Detalle del mantenimiento o calibración realizada..."
                className={`${inputCls} resize-none`} />
            </Field>
          </div>

          {/* Parámetros verificados */}
          <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-100 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
              Parámetros verificados
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PARAMETROS.map(param => (
                <label
                  key={param}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                    parametros.includes(param)
                      ? "bg-rose-50 border-rose-200 text-rose-700 shadow-sm"
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

          {/* Resultado del servicio y Observaciones */}
          <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-100 shadow-sm space-y-4">
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
                    className={`py-2.5 rounded-xl border text-xs sm:text-sm font-bold transition-all ${
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
                rows={2} placeholder="Observaciones finales o restricciones de uso..."
                className={`${inputCls} resize-none`} />
            </Field>
          </div>

          {/* Firmas GMP */}
          <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-100 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
              Firmas de cierre (GMP)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Ejecutó">
                <input value={ejecuto} onChange={e => setEjecuto(e.target.value)}
                  placeholder="Técnico" className={inputCls} />
              </Field>
              <Field label="Revisó">
                <input value={reviso} onChange={e => setReviso(e.target.value)}
                  placeholder="Supervisor" className={inputCls} />
              </Field>
              <Field label="Liberó">
                <input value={libero} onChange={e => setLibero(e.target.value)}
                  placeholder="Responsable" className={inputCls} />
              </Field>
            </div>
          </div>

          {/* Adjunto de Foto */}
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
            <FotoFormato
              imagenUrl={imagenUrl}
              uploading={uploading}
              onUpload={uploadFoto}
              onDelete={() => setImagenUrl(null)}
            />
          </div>
        </div>

        {/* 3. Footer Fijo */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-white z-10 flex justify-end shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
          <div className="w-full sm:w-auto min-w-[150px]">
            <SaveButton loading={loading} onSave={handleSave} completado={registro?.completado} />
          </div>
        </div>

      </div>
    </div>
  );
}