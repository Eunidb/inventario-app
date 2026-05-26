"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/client";
import { type FormProps } from "./PanelExpediente";
import { Cog, X } from "lucide-react"; // Añadido X para el botón opcional de cerrar
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
    setTipos(prev =>
      prev.includes(tipo) ? prev.filter(t => t !== tipo) : [...prev, tipo]
    );
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
        datos_json: {
          fecha, maquina, marca, modelo, serie, areaProduccion,
          tipos, observaciones, efectuo, recibio, aprobo,
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

  const TIPOS_MANTENIMIENTO = ["Correctivo", "Preventivo", "Eléctrico", "Electrónico"];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 backdrop-blur-sm sm:items-center p-0 sm:p-4 transition-opacity">
      
      {/* Contenedor Principal del Modal */}
      <div className="relative flex flex-col w-full max-w-3xl bg-white h-[92vh] sm:h-auto sm:max-h-[90vh] rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-100 overflow-hidden text-slate-800">
        
        {/* Barra de arrastre visual para dispositivos móviles */}
        <div className="flex justify-center py-2 sm:hidden bg-slate-50 border-b border-slate-100">
          <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
        </div>

        {/* 1. Encabezado Fijo */}
        <div className="relative p-5 sm:p-6 border-b border-slate-100 bg-white z-10 flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <FormHeader
              titulo="Registro de Maquinaria de Producción"
              subtitulo="Formato 2 · Laboratorios de medicamentos y productos terminados"
              Icon={Cog}
              color="orange"
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

        {/* 2. Cuerpo con Scroll Aislado e Intuitivo */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-5 sm:p-6 space-y-6 bg-slate-50/50 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          
          {/* Sección: Fecha */}
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
            <Field label="Fecha">
              <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className={inputCls} />
            </Field>
          </div>

          {/* Sección: Datos de la máquina */}
          <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-100 shadow-sm space-y-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Datos de la máquina
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Máquina">
                <input value={maquina} onChange={e => setMaquina(e.target.value)}
                  placeholder="Ej. Fermentador, Tableteadora" className={inputCls} />
              </Field>
              <Field label="Marca">
                <input value={marca} onChange={e => setMarca(e.target.value)}
                  placeholder="Ej. Bosch" className={inputCls} />
              </Field>
              <Field label="Modelo">
                <input value={modelo} onChange={e => setModelo(e.target.value)}
                  placeholder="Número de modelo" className={inputCls} />
              </Field>
              <Field label="Número de serie">
                <input value={serie} onChange={e => setSerie(e.target.value)}
                  placeholder="Serie del fabricante" className={inputCls} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Área de producción">
                  <input value={areaProduccion} onChange={e => setAreaProduccion(e.target.value)}
                    placeholder="Ej. Sala de tabletas, Cuarto estéril" className={inputCls} />
                </Field>
              </div>
            </div>
          </div>

          {/* Sección: Tipo de mantenimiento */}
          <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-100 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
              Tipo de mantenimiento
            </p>
            <div className="grid grid-cols-2 gap-2">
              {TIPOS_MANTENIMIENTO.map(tipo => (
                <label
                  key={tipo}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                    tipos.includes(tipo)
                      ? "bg-orange-50 border-orange-200 text-orange-700 shadow-sm"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={tipos.includes(tipo)}
                    onChange={() => toggleTipo(tipo)}
                    className="rounded accent-orange-600 w-4 h-4"
                  />
                  <span className="text-sm font-semibold">{tipo}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Sección: Observaciones */}
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
            <Field label="Observaciones">
              <textarea value={observaciones} onChange={e => setObservaciones(e.target.value)}
                rows={3} placeholder="Observaciones del mantenimiento realizado..."
                className={`${inputCls} resize-none`} />
            </Field>
          </div>

          {/* Sección: Firmas de cierre */}
          <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-100 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
              Firmas de cierre
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Efectuó">
                <input value={efectuo} onChange={e => setEfectuo(e.target.value)}
                  placeholder="Nombre del técnico" className={inputCls} />
              </Field>
              <Field label="Recibió">
                <input value={recibio} onChange={e => setRecibio(e.target.value)}
                  placeholder="Nombre de quien recibe" className={inputCls} />
              </Field>
              <Field label="Aprobó">
                <input value={aprobo} onChange={e => setAprobo(e.target.value)}
                  placeholder="Nombre del supervisor" className={inputCls} />
              </Field>
            </div>
          </div>

          {/* Sección: Foto */}
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