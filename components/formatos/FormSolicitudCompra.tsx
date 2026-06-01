"use client";

/**
 * @file components/formatos/FormSolicitudCompra.tsx
 */

import { useState, useEffect } from "react";
import { createClient } from "@/lib/client";
import { type FormProps } from "./PanelExpediente";
import { ShoppingCart, Plus, Trash2, X } from "lucide-react";
import { FormHeader, Field, FotoFormato, SaveButton, inputCls } from "./FormSolicitudTrabajo";

interface ArticuloCompra {
  descripcion: string;
  cantidad: string;
  unidad: string;
  justificacion: string;
}

// Convertimos onClose en un parámetro requerido para evitar fallos silenciosos del componente padre
export default function FormSolicitudCompra({
  registro, 
  trabajoId, 
  onSaved, 
  onClose,
}: FormProps & { onClose: () => void }) { // <-- Removido el signo "?" para consistencia estructural
  const supabase = createClient();

  const [fecha,         setFecha]         = useState(new Date().toISOString().split("T")[0]);
  const [solicitante,   setSolicitante]   = useState("");
  const [departamento,  setDepartamento]  = useState("");
  const [urgencia,      setUrgencia]      = useState("Normal");
  const [articulos,     setArticulos]     = useState<ArticuloCompra[]>([
    { descripcion: "", cantidad: "", unidad: "pz", justificacion: "" },
  ]);
  const [autorizado,    setAutorizado]    = useState("");
  const [vobo,          setVobo]          = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [imagenUrl,     setImagenUrl]     = useState<string | null>(null);
  const [uploading,     setUploading]     = useState(false);
  const [loading,       setLoading]       = useState(false);

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
    await supabase.from("registros_formato").update({
      datos_json:     { fecha, solicitante, departamento, urgencia, articulos, autorizado, vobo, observaciones },
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
      {/* Backdrop — Cierra el modal de forma segura al hacer clic fuera de la tarjeta */}
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative flex flex-col w-full max-w-3xl bg-white h-[92vh] sm:h-auto sm:max-h-[90vh] rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-100 overflow-hidden text-slate-800">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white shrink-0">
          <div className="flex-1 min-w-0">
            <FormHeader
              titulo="Solicitud de Compra"
              subtitulo="Formato 4 · Adquisición de materiales"
              Icon={ShoppingCart}
              color="teal"
              completado={registro?.completado}
            />
          </div>
          {/* Botón X — Siempre visible y renderizado */}
          <button 
            onClick={onClose} 
            className="p-2 ml-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors" 
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 bg-slate-50/50">

          {/* Datos generales */}
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Datos Generales</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Fecha">
                <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className={inputCls} />
              </Field>
              <Field label="Urgencia">
                <select value={urgencia} onChange={e => setUrgencia(e.target.value)} className={inputCls}>
                  <option>Alta</option><option>Normal</option><option>Baja</option>
                </select>
              </Field>
              <Field label="Solicitante">
                <input value={solicitante} onChange={e => setSolicitante(e.target.value)} className={inputCls} />
              </Field>
              <Field label="Departamento">
                <input value={departamento} onChange={e => setDepartamento(e.target.value)} className={inputCls} />
              </Field>
            </div>
          </div>

          {/* Lista de artículos */}
          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Artículos a comprar</p>
              <button
                type="button"
                onClick={addArticulo}
                className="flex items-center gap-1 text-xs font-bold text-teal-600 bg-teal-50 px-3 py-1.5 rounded-lg hover:bg-teal-100 transition-colors"
              >
                <Plus size={14} /> Agregar
              </button>
            </div>
            {articulos.map((art, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase text-slate-400">Artículo #{i + 1}</span>
                  {articulos.length > 1 && (
                    <button onClick={() => removeArticulo(i)} className="text-red-400 hover:text-red-600 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <Field label="Descripción">
                  <input value={art.descripcion} onChange={e => updateArticulo(i, "descripcion", e.target.value)} className={inputCls} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Cantidad">
                    <input value={art.cantidad} onChange={e => updateArticulo(i, "cantidad", e.target.value)} className={inputCls} />
                  </Field>
                  <Field label="Unidad">
                    <select value={art.unidad} onChange={e => updateArticulo(i, "unidad", e.target.value)} className={inputCls}>
                      <option>pz</option><option>kg</option><option>lt</option><option>caja</option>
                    </select>
                  </Field>
                </div>
              </div>
            ))}
          </div>

          {/* Firmas */}
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Validación y Firmas</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Autorizado por">
                <input value={autorizado} onChange={e => setAutorizado(e.target.value)} className={inputCls} />
              </Field>
              <Field label="Vo.Bo.">
                <input value={vobo} onChange={e => setVobo(e.target.value)} className={inputCls} />
              </Field>
            </div>
            <Field label="Observaciones">
              <textarea value={observaciones} onChange={e => setObservaciones(e.target.value)} rows={2} className={`${inputCls} resize-none`} />
            </Field>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
            <FotoFormato imagenUrl={imagenUrl} uploading={uploading} onUpload={uploadFoto} onDelete={() => setImagenUrl(null)} color="teal" />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-white shrink-0 flex justify-end items-center gap-3">
          {/* Botón Cancelar Explícito */}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <SaveButton loading={loading} onSave={handleSave} completado={registro?.completado} color="teal" />
        </div>
      </div>
    </div>
  );
}