"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/client";
import { type FormProps } from "./PanelExpediente";
import { FlaskConical, X } from "lucide-react";
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
        datos_json: { fecha, nombreEquipo, codigoEquipo, marca, modelo, serie, areaLab, tipoMant, descripcionServicio, parametros, resultado, observaciones, ejecuto, reviso, libero },
        imagen_url: imagenUrl,
        completado: true,
        completado_por: user?.id ?? null,
        fecha_llenado: new Date().toISOString(),
      })
      .eq("id", registro.id);
    setLoading(false);
    onSaved();
  };

  const PARAMETROS = ["Calibración", "Limpieza y sanitización", "Verificación funcional", "Registro de temperatura", "Verificación eléctrica", "Revisión de alarmas", "Lubricación"];
  const RESULTADO_CLS: Record<string, string> = { "Aprobado": "bg-emerald-50 border-emerald-200 text-emerald-700", "Condicional": "bg-amber-50 border-amber-200 text-amber-700", "Rechazado": "bg-red-50 border-red-200 text-red-700" };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/40 backdrop-blur-sm p-0 sm:p-4 transition-opacity">
      <div className="relative flex flex-col w-full max-w-3xl bg-white h-[92vh] sm:h-auto sm:max-h-[90vh] rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-100 overflow-hidden text-slate-800">
        
        {/* Encabezado */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white">
          <div className="flex-1 min-w-0">
            <FormHeader titulo="Registro de Laboratorio" subtitulo="Formato 5 · Equipos de Laboratorio" Icon={FlaskConical} color="rose" completado={registro?.completado} />
          </div>
          {onClose && <button onClick={onClose} className="p-2 ml-2 text-slate-400 hover:bg-slate-50 rounded-xl"><X size={20} /></button>}
        </div>

        {/* Cuerpo */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 bg-slate-50/50">
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Identificación del Equipo</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Nombre"><input value={nombreEquipo} onChange={e => setNombreEquipo(e.target.value)} className={inputCls} /></Field>
              <Field label="Código"><input value={codigoEquipo} onChange={e => setCodigoEquipo(e.target.value)} className={inputCls} /></Field>
              <Field label="Marca"><input value={marca} onChange={e => setMarca(e.target.value)} className={inputCls} /></Field>
              <Field label="Modelo"><input value={modelo} onChange={e => setModelo(e.target.value)} className={inputCls} /></Field>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-3">Parámetros Verificados</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PARAMETROS.map(param => (
                <label key={param} className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer ${parametros.includes(param) ? "bg-rose-50 border-rose-200 text-rose-700" : "bg-slate-50 border-slate-200"}`}>
                  <input type="checkbox" checked={parametros.includes(param)} onChange={() => toggleParametro(param)} className="accent-rose-600" />
                  <span className="text-sm font-semibold">{param}</span>
                </label>
              ))}
            </div>
          </div>

          <FotoFormato imagenUrl={imagenUrl} uploading={uploading} onUpload={uploadFoto} onDelete={() => setImagenUrl(null)} color="rose" />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-white flex justify-end">
          <SaveButton loading={loading} onSave={handleSave} completado={registro?.completado} color="rose" />
        </div>
      </div>
    </div>
  );
}