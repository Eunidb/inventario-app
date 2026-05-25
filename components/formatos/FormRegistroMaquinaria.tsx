/**
 * @file components/formatos/FormRegistroMaquinaria.tsx
 * @description Digitalización del formato físico "Registro de Maquinaria
 *   de Producción" (Formato 2).
 *
 * Campos del formato original:
 *   - Fecha
 *   - Máquina, Marca, Modelo, Serie
 *   - Área de producción
 *   - Tipo de mantenimiento (correctivo, preventivo, eléctrico, electrónico)
 *   - Observaciones
 *   - Efectuó / Recibió / Aprobó (firmas)
 *   - Foto del formato físico firmado
 *
 * Solo se genera si `requiere_registro_maquinaria = true` en el trabajo.
 */

"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/client";
import { type FormProps } from "./PanelExpediente";
import { Cog } from "lucide-react";
import {
  FormHeader, Field, FotoFormato, SaveButton, inputCls,
} from "./FormSolicitudTrabajo";

export default function FormRegistroMaquinaria({ registro, trabajoId, onSaved }: FormProps) {
  const supabase = createClient();

  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [maquina, setMaquina] = useState("");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [serie, setSerie] = useState("");
  const [areaProduccion, setAreaProduccion] = useState("");
  // Tipo de mantenimiento: múltiple selección con checkboxes
  const [tipos, setTipos] = useState<string[]>([]);
  const [observaciones, setObservaciones] = useState("");
  // Firmas
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

  // Alterna un tipo de mantenimiento en el array
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

  // Opciones de tipo de mantenimiento del formato físico
  const TIPOS_MANTENIMIENTO = ["Correctivo", "Preventivo", "Eléctrico", "Electrónico"];

  return (
    <div className="space-y-6">
      <FormHeader
        titulo="Registro de Maquinaria de Producción"
        subtitulo="Formato 2 · Laboratorios de medicamentos y productos terminados"
        Icon={Cog}
        color="orange"
        completado={registro?.completado}
      />

      {/* Fecha */}
      <Field label="Fecha">
        <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className={inputCls} />
      </Field>

      {/* Datos de la máquina */}
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
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

      {/* Tipo de mantenimiento — checkboxes múltiples como en el formato físico */}
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
          Tipo de mantenimiento
        </p>
        <div className="grid grid-cols-2 gap-2">
          {TIPOS_MANTENIMIENTO.map(tipo => (
            <label
              key={tipo}
              className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                tipos.includes(tipo)
                  ? "bg-orange-50 border-orange-200 text-orange-700"
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

      <Field label="Observaciones">
        <textarea value={observaciones} onChange={e => setObservaciones(e.target.value)}
          rows={4} placeholder="Observaciones del mantenimiento realizado..."
          className={`${inputCls} resize-none`} />
      </Field>

      {/* Firmas del formato físico */}
      <div>
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
