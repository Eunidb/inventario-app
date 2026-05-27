"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/client";
import { type FormProps } from "./PanelExpediente";
import { Cog, X } from "lucide-react";
import {
  FormHeader, Field, FotoFormato, SaveButton, inputCls,
} from "./FormSolicitudTrabajo";

export default function FormRegistroMaquinaria({ registro, trabajoId, onSaved, onClose }: FormProps & { onClose?: () => void }) {
  const supabase = createClient();

  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [maquina, setMaquina] = useState("");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [serie, setSerie] = useState("");
  const [areaProduccion, setAreaProduccion] = useState("");
  const [tipos, setTipos] = useState<string[]>([]);
  const [observaciones, setObservaciones] = useState("");
  const [efectuo, setEfectuo] = useState("");
  const [recibio, setRecibio] = useState("");
  const [aprobo, setAprobo] = useState("");

  const [imagenUrl, setImagenUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const d = registro?.datos_json ?? {};
    setFecha(d.fecha ?? new Date().toISOString().split("T")[0]);
    setMaquina(d.maquina ?? "");
    setMarca(d.marca ?? "");
    setModelo(d.modelo ?? "");
    setSerie(d.serie ?? "");
    setAreaProduccion(d.areaProduccion ?? "");
    setTipos(d.tipos ?? []);
    setObservaciones(d.observaciones ?? "");
    setEfectuo(d.efectuo ?? "");
    setRecibio(d.recibio ?? "");
    setAprobo(d.aprobo ?? "");
    setImagenUrl(registro?.imagen_url ?? null);
  }, [registro]);

  const toggleTipo = (tipo: string) => {
    setTipos(prev => prev.includes(tipo) ? prev.filter(t => t !== tipo) : [...prev, tipo]);
  };

  const uploadFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setUploading(true);
    const file = e.target.files[0];
    const path = `trabajos/${trabajoId}/maquinaria-${Date.now()}.${file.name.split(".").pop()}`;
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
        datos_json: { fecha, maquina, marca, modelo, serie, areaProduccion, tipos, observaciones, efectuo, recibio, aprobo },
        imagen_url: imagenUrl,
        completado: true,
        completado_por: user?.id ?? null,
        fecha_llenado: new Date().toISOString(),
      })
      .eq("id", registro.id);
    setLoading(false);
    onSaved();
  };

  const TIPOS_MANTENIMIENTO = ["Correctivo", "Preventivo", "Eléctrico", "Electrónico"];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/40 backdrop-blur-sm p-0 sm:p-4 transition-opacity">
      <div className="relative flex flex-col w-full max-w-3xl bg-white h-[92vh] sm:h-auto sm:max-h-[90vh] rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-100 overflow-hidden text-slate-800">
        
        {/* Encabezado */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white">
          <div className="flex-1 min-w-0">
            <FormHeader titulo="Registro de Maquinaria" subtitulo="Formato 2 · Mantenimiento Industrial" Icon={Cog} color="orange" completado={registro?.completado} />
          </div>
          {onClose && <button onClick={onClose} className="p-2 ml-2 text-slate-400 hover:bg-slate-50 rounded-xl"><X size={20} /></button>}
        </div>

        {/* Cuerpo */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 bg-slate-50/50">
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Datos de la máquina</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Máquina"><input value={maquina} onChange={e => setMaquina(e.target.value)} className={inputCls} /></Field>
              <Field label="Marca"><input value={marca} onChange={e => setMarca(e.target.value)} className={inputCls} /></Field>
              <Field label="Modelo"><input value={modelo} onChange={e => setModelo(e.target.value)} className={inputCls} /></Field>
              <Field label="Serie"><input value={serie} onChange={e => setSerie(e.target.value)} className={inputCls} /></Field>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Tipo de mantenimiento</p>
            <div className="grid grid-cols-2 gap-2">
              {TIPOS_MANTENIMIENTO.map(tipo => (
                <label key={tipo} className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer ${tipos.includes(tipo) ? "bg-orange-50 border-orange-200 text-orange-700" : "bg-slate-50 border-slate-200"}`}>
                  <input type="checkbox" checked={tipos.includes(tipo)} onChange={() => toggleTipo(tipo)} className="accent-orange-600" />
                  <span className="text-sm font-semibold">{tipo}</span>
                </label>
              ))}
            </div>
          </div>

          <FotoFormato imagenUrl={imagenUrl} uploading={uploading} onUpload={uploadFoto} onDelete={() => setImagenUrl(null)} color="orange" />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-white flex justify-end">
          <SaveButton loading={loading} onSave={handleSave} completado={registro?.completado} color="orange" />
        </div>
      </div>
    </div>
  );
}