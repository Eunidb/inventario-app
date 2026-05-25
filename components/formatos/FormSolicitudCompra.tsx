/**
 * @file components/formatos/FormSolicitudCompra.tsx
 * @description Digitalización del formato "Solicitud de Compra" (Formato 4).
 *
 * Se genera únicamente cuando `requiere_compra = true` en el trabajo.
 * Permite registrar los materiales o refacciones que deben adquirirse.
 *
 * Campos:
 *   - Fecha, Solicitante, Departamento
 *   - Tabla de artículos: descripción, cantidad, unidad, justificación
 *   - Autorizado por, Vo.Bo.
 *   - Foto del formato físico
 */

"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/client";
import { type FormProps } from "./PanelExpediente";
import { ShoppingCart, Plus, Trash2 } from "lucide-react";
import {
  FormHeader, Field, FotoFormato, SaveButton, inputCls,
} from "./FormSolicitudTrabajo";

interface ArticuloCompra {
  descripcion: string;
  cantidad: string;
  unidad: string;
  justificacion: string;
}

export default function FormSolicitudCompra({ registro, trabajoId, onSaved }: FormProps) {
  const supabase = createClient();

  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [solicitante, setSolicitante] = useState("");
  const [departamento, setDepartamento] = useState("");
  const [urgencia, setUrgencia] = useState("Normal");
  // Tabla de artículos a comprar
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

  // Agrega una fila vacía al listado de artículos
  const addArticulo = () =>
    setArticulos(prev => [...prev, { descripcion: "", cantidad: "", unidad: "pz", justificacion: "" }]);

  // Actualiza un campo específico de una fila
  const updateArticulo = (i: number, key: keyof ArticuloCompra, val: string) =>
    setArticulos(prev => prev.map((a, idx) => idx === i ? { ...a, [key]: val } : a));

  // Elimina una fila
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
    <div className="space-y-6">
      <FormHeader
        titulo="Solicitud de Compra"
        subtitulo="Formato 4 · Adquisición de refacciones y materiales"
        Icon={ShoppingCart}
        color="teal"
        completado={registro?.completado}
      />

      {/* Encabezado */}
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

      {/* Tabla de artículos — filas dinámicas */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Artículos a comprar
          </p>
          <button
            onClick={addArticulo}
            className="flex items-center gap-1 text-xs font-bold text-teal-600 hover:text-teal-800 transition-colors"
          >
            <Plus size={14} /> Agregar artículo
          </button>
        </div>
        <div className="space-y-3">
          {articulos.map((art, i) => (
            <div key={i} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Artículo #{i + 1}</p>
                {/* Solo permite eliminar si hay más de una fila */}
                {articulos.length > 1 && (
                  <button onClick={() => removeArticulo(i)}
                    className="text-red-400 hover:text-red-600 transition-colors">
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
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

      <Field label="Observaciones">
        <textarea value={observaciones} onChange={e => setObservaciones(e.target.value)}
          rows={3} placeholder="Comentarios adicionales de la solicitud..."
          className={`${inputCls} resize-none`} />
      </Field>

      {/* Firmas */}
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
