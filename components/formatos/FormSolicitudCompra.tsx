"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/client";
import { type FormProps } from "./PanelExpediente";
import { ShoppingCart, Plus, Trash2, X } from "lucide-react"; // Añadido X para el botón de cierre
import {
  FormHeader, Field, FotoFormato, SaveButton, inputCls,
} from "./FormSolicitudTrabajo";

interface ArticuloCompra {
  descripcion: string;
  cantidad: string;
  unidad: string;
  justificacion: string;
}

export default function FormSolicitudCompra({ registro, trabajoId, onSaved, onClose }: FormProps & { onClose?: () => void }) {
  const supabase = createClient();

  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [solicitante, setSolicitante] = useState("");
  const [departamento, setDepartamento] = useState("");
  const [urgencia, setUrgencia] = useState("Normal");
  const [articulos, setArticulos] = useState<ArticuloCompra[]>([
    { descripcion: "", cantidad: "", unidad: "pz", justificacion: "" },
  ]);
  const [autorizado, setAutorizado] = useState("");
  const [vobo, setVobo] = useState("");
  const [observaciones, setObservaciones] = useState("");

  const [imagenUrl, setImagenUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const d = registro?.datos_json ?? {};
    setFecha(d.fecha ?? new Date().toISOString().split("T")[0]);
    setSolicitante(d.solicitante ?? "");
    setDepartamento(d.departamento ?? "");
    setUrgencia(d.urgencia ?? "Normal");
    setArticulos(d.articulos ?? [{ descripcion: "", cantidad: "", unidad: "pz", justificacion: "" }]);
    setAutorizado(d.autorizado ?? "");
    setVobo(d.vobo ?? "");
    setObservaciones(d.observaciones ?? "");
    setImagenUrl(registro?.imagen_url ?? null);
  }, [registro]);

  const addArticulo = () =>
    setArticulos(prev => [...prev, { descripcion: "", cantidad: "", unidad: "pz", justificacion: "" }]);

  const updateArticulo = (i: number, key: keyof ArticuloCompra, val: string) =>
    setArticulos(prev => prev.map((a, idx) => idx === i ? { ...a, [key]: val } : a));

  const removeArticulo = (i: number) =>
    setArticulos(prev => prev.filter((_, idx) => idx !== i));

  const uploadFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setUploading(true);
    const file = e.target.files[0];
    const path = `trabajos/${trabajoId}/compra-${Date.now()}.${file.name.split(".").pop()}`;
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
          fecha, solicitante, departamento, urgencia,
          articulos, autorizado, vobo, observaciones,
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
      
      {/* Contenedor Principal del Modal Centrado */}
      <div className="relative flex flex-col w-full max-w-3xl bg-white h-[92vh] sm:h-auto sm:max-h-[90vh] rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-100 overflow-hidden text-slate-800">
        
        {/* Pestaña de arrastre táctil (Solo Mobile) */}
        <div className="flex justify-center py-2 sm:hidden bg-slate-50 border-b border-slate-100">
          <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
        </div>

        {/* 1. Encabezado Fijo */}
        <div className="relative p-5 sm:p-6 border-b border-slate-100 bg-white z-10 flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <FormHeader
              titulo="Solicitud de Compra"
              subtitulo="Formato 4 · Adquisición de refacciones y materiales"
              Icon={ShoppingCart}
              color="teal"
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

        {/* 2. Cuerpo con Scroll Independiente e Intuitivo */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-5 sm:p-6 space-y-5 bg-slate-50/50 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          
          {/* Tarjeta: Datos Generales */}
          <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-100 shadow-sm space-y-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Información General de la Solicitud
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Fecha">
                <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className={inputCls} />
              </Field>
              <Field label="Urgencia">
                <select value={urgencia} onChange={e => setUrgencia(e.target.value)} className={inputCls}>
                  <option>Alta</option>
                  <option>Normal</option>
                  <option>Baja</option>
                </select>
              </Field>
              <Field label="Solicitante">
                <input value={solicitante} onChange={e => setSolicitante(e.target.value)}
                  placeholder="Nombre del solicitante" className={inputCls} />
              </Field>
              <Field label="Departamento">
                <input value={departamento} onChange={e => setDepartamento(e.target.value)}
                  placeholder="Área que solicita la compra" className={inputCls} />
              </Field>
            </div>
          </div>

          {/* Bloque Dinámico: Artículos a comprar */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Artículos a comprar
              </p>
              <button
                type="button"
                onClick={addArticulo}
                className="flex items-center gap-1.5 text-xs font-bold text-teal-600 hover:text-teal-800 bg-teal-50 hover:bg-teal-100/80 px-3 py-1.5 rounded-lg transition-all"
              >
                <Plus size={14} /> Agregar artículo
              </button>
            </div>

            <div className="space-y-4">
              {articulos.map((art, i) => (
                <div key={i} className="bg-white border border-slate-200/80 rounded-xl p-4 sm:p-5 shadow-sm space-y-4 relative transition-all hover:border-slate-300">
                  
                  {/* Fila de control superior interna */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="inline-flex items-center justify-center bg-slate-100 text-slate-700 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      Artículo #{i + 1}
                    </span>
                    {articulos.length > 1 && (
                      <button 
                        type="button"
                        onClick={() => removeArticulo(i)}
                        className="text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar artículo"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>

                  {/* Inputs internos distribuidos responsivamente */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <Field label="Descripción / artículo">
                        <input value={art.descripcion}
                          onChange={e => updateArticulo(i, "descripcion", e.target.value)}
                          placeholder="Nombre o descripción del artículo" className={inputCls} />
                      </Field>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Field label="Cantidad">
                        <input value={art.cantidad} type="number" min="1"
                          onChange={e => updateArticulo(i, "cantidad", e.target.value)}
                          placeholder="0" className={inputCls} />
                      </Field>
                      <Field label="Unidad">
                        <select value={art.unidad}
                          onChange={e => updateArticulo(i, "unidad", e.target.value)}
                          className={inputCls}>
                          <option value="pz">pz</option>
                          <option value="kg">kg</option>
                          <option value="lt">lt</option>
                          <option value="mts">mts</option>
                          <option value="caja">caja</option>
                          <option value="rollo">rollo</option>
                        </select>
                      </Field>
                    </div>
                  </div>

                  <Field label="Justificación / uso">
                    <input value={art.justificacion}
                      onChange={e => updateArticulo(i, "justificacion", e.target.value)}
                      placeholder="¿Para qué se usará?" className={inputCls} />
                  </Field>
                </div>
              ))}
            </div>
          </div>

          {/* Tarjeta: Observaciones */}
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
            <Field label="Observaciones">
              <textarea value={observaciones} onChange={e => setObservaciones(e.target.value)}
                rows={2} placeholder="Comentarios adicionales de la solicitud..."
                className={`${inputCls} resize-none`} />
            </Field>
          </div>

          {/* Tarjeta: Firmas */}
          <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-100 shadow-sm space-y-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Firmas de Autorización
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Autorizado por">
                <input value={autorizado} onChange={e => setAutorizado(e.target.value)}
                  placeholder="Nombre del autorizador" className={inputCls} />
              </Field>
              <Field label="Vo.Bo.">
                <input value={vobo} onChange={e => setVobo(e.target.value)}
                  placeholder="Nombre / firma de visto bueno" className={inputCls} />
              </Field>
            </div>
          </div>

          {/* Tarjeta: Evidencia Fotográfica */}
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