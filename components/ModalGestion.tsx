"use client";

/**
 * @file components/ModalGestion.tsx
 * @description Modal de alta y edición de artículos del inventario.
 */

import { useState, useEffect } from "react";
import { createClient } from "@/lib/client";
import {
  X, Package, Loader2, Camera, Trash2,
  CheckCircle, AlertCircle, XCircle, Wrench, Info,
} from "lucide-react";
import type {
  InventarioItem, Categoria, Departamento, EstadoInventarioEnum,
} from "@/lib/supabase";
import { validateImage, safeFileName } from "@/lib/imageValidator";

// ─── Opciones de estado con ícono y color ────────────────────────────────────
const ESTADO_OPTS: {
  value: EstadoInventarioEnum;
  label: string;
  Icon: React.ElementType;
  cls: string;
}[] = [
  { value: "activo",        label: "Activo / Funcional", Icon: CheckCircle, cls: "text-emerald-600" },
  { value: "mantenimiento", label: "En Mantenimiento",   Icon: Wrench,      cls: "text-amber-600"  },
  { value: "en_reparacion", label: "En Reparación",      Icon: Wrench,      cls: "text-orange-600" },
  { value: "inactivo",      label: "Inactivo",           Icon: AlertCircle, cls: "text-slate-500"  },
  { value: "dado_de_baja",  label: "Dado de Baja",       Icon: XCircle,     cls: "text-red-600"    },
];

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface ModalGestionProps {
  isOpen:   boolean;
  onClose:  () => void;
  item?:    InventarioItem | null;
  onSaved:  () => void;
}

const FORM_INITIAL = {
  clave:            "",
  nombre:           "",
  descripcion:      "",
  marca:            "",
  modelo:           "",
  numero_serie:     "",
  stock_total:      0,
  stock_disponible: 0,
  stock_minimo:     1,
  unidad_medida:    "pz",
  ubicacion:        "",
  estado:           "activo" as EstadoInventarioEnum,
  imagen_url:       "",
  categoria_id:     0,
  departamento_id:  undefined as number | undefined,
};

// ─── Componente ───────────────────────────────────────────────────────────────
export default function ModalGestion({ isOpen, onClose, item, onSaved }: ModalGestionProps) {
  const supabase = createClient();

  const [form, setForm]               = useState(FORM_INITIAL);
  const [categorias, setCategorias]   = useState<Categoria[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [isLoading, setIsLoading]     = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [imageFile, setImageFile]     = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Carga de catálogos al abrir el modal
  useEffect(() => {
    if (!isOpen) return;
    const loadCatalogs = async () => {
      const [{ data: cats }, { data: deps }] = await Promise.all([
        supabase.from("categorias").select("*").order("nombre"),
        supabase.from("departamentos").select("*").order("nombre"),
      ]);
      setCategorias(cats ?? []);
      setDepartamentos(deps ?? []);
    };
    loadCatalogs();
  }, [isOpen]);

  // Precarga de datos al editar
  useEffect(() => {
    if (!isOpen) return;
    if (item) {
      setForm({
        clave:            item.clave,
        nombre:           item.nombre,
        descripcion:      item.descripcion ?? "",
        marca:            item.marca ?? "",
        modelo:           item.modelo ?? "",
        numero_serie:     item.numero_serie ?? "",
        stock_total:      item.stock_total,
        stock_disponible: item.stock_disponible,
        stock_minimo:     item.stock_minimo,
        unidad_medida:    item.unidad_medida ?? "pz",
        ubicacion:        item.ubicacion ?? "",
        estado:           item.estado,
        imagen_url:       item.imagen_url ?? "",
        categoria_id:     item.categoria_id,
        departamento_id:  item.departamento_id,
      });
      setImagePreview(item.imagen_url ?? null);
    } else {
      setForm(FORM_INITIAL);
      setImagePreview(null);
      setImageFile(null);
    }
    setError(null);
  }, [item, isOpen]);

  // ── Cambio genérico de campos ────────────────────────────────────────────
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "number" ? Math.max(0, Number(value)) : value,
    }));
  };

  // ── Validación y carga de imagen ─────────────────────────────────────────
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validación completa: tamaño + MIME + magic bytes
    const validationError = await validateImage(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setForm((prev) => ({ ...prev, imagen_url: "" }));
  };

  // ── Guardado ─────────────────────────────────────────────────────────────
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Validación de campos obligatorios
      if (!form.clave.trim())  throw new Error("La clave del artículo es obligatoria.");
      if (!form.nombre.trim()) throw new Error("El nombre del artículo es obligatorio.");
      if (!form.categoria_id)  throw new Error("Debe seleccionar una categoría.");

      // Subida de imagen si hay archivo nuevo
      let imagenUrl = form.imagen_url;
      if (imageFile) {
        setUploadingImage(true);
        const fileName = safeFileName(imageFile.type);
        const { error: uploadError } = await supabase.storage
          .from("inventario")
          .upload(fileName, imageFile, { cacheControl: "3600" });
        if (uploadError) throw new Error("Error al subir la imagen: " + uploadError.message);
        imagenUrl = supabase.storage.from("inventario").getPublicUrl(fileName).data.publicUrl;
        setUploadingImage(false);
      }

      // Payload saneado — nunca se pasan strings sin trim
      const payload = {
        // Clave en mayúsculas, solo alfanumérico y guiones
        clave:            form.clave.trim().toUpperCase().replace(/[^A-Z0-9\-_]/g, ""),
        nombre:           form.nombre.trim(),
        descripcion:      form.descripcion.trim() || null,
        marca:            form.marca.trim() || null,
        modelo:           form.modelo.trim() || null,
        numero_serie:     form.numero_serie.trim() || null,
        stock_total:      Math.max(0, form.stock_total),
        stock_disponible: Math.max(0, item ? form.stock_disponible : form.stock_total),
        stock_minimo:     Math.max(0, form.stock_minimo),
        unidad_medida:    form.unidad_medida,
        ubicacion:        form.ubicacion.trim() || null,
        estado:           form.estado,
        imagen_url:       imagenUrl || null,
        categoria_id:     Number(form.categoria_id),
        departamento_id:  form.departamento_id ? Number(form.departamento_id) : null,
        updated_at:       new Date().toISOString(),
      };

      const { error: dbError } = item
        ? await supabase.from("inventario").update(payload).eq("id", item.id)
        : await supabase.from("inventario").insert([payload]);

      if (dbError) throw new Error(dbError.message);

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
      setUploadingImage(false);
    }
  };

  if (!isOpen) return null;

  // ── Helpers de UI ─────────────────────────────────────────────────────────
  const inputCls =
    "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm " +
    "text-slate-700 outline-none focus:ring-2 focus:ring-[#014ba0]/10 focus:border-[#014ba0] " +
    "transition-all disabled:bg-slate-100 disabled:text-slate-400";

  const labelCls = "text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">

        {/* ── Header ── */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#014ba0]/10 flex items-center justify-center text-[#014ba0]">
              <Package size={22} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800">
                {item ? "Editar Artículo" : "Nuevo Artículo"}
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                Gestión de Inventario
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Body ── */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Alerta de error */}
          {error && (
            <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r-xl font-medium">
              {error}
            </div>
          )}

          {/* Sección: Identificación */}
          <div>
            <p className="text-[10px] font-black text-[#014ba0]/60 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Info size={12} /> Identificación del Artículo
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Clave Única *</label>
                <input
                  name="clave"
                  value={form.clave}
                  onChange={handleChange}
                  required
                  placeholder="Ej. MANT-001"
                  disabled={!!item} // La clave no cambia en edición
                  className={inputCls + " font-mono font-bold text-[#014ba0]"}
                  maxLength={50}
                />
              </div>
              <div>
                <label className={labelCls}>Nombre del Artículo *</label>
                <input
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  required
                  placeholder="Ej. Laptop Dell Latitude"
                  className={inputCls}
                  maxLength={100}
                />
              </div>
              <div>
                <label className={labelCls}>Marca</label>
                <input
                  name="marca"
                  value={form.marca}
                  onChange={handleChange}
                  placeholder="Dell, HP, Cisco..."
                  className={inputCls}
                  maxLength={50}
                />
              </div>
              <div>
                <label className={labelCls}>Modelo</label>
                <input
                  name="modelo"
                  value={form.modelo}
                  onChange={handleChange}
                  placeholder="Latitude 5420"
                  className={inputCls}
                  maxLength={50}
                />
              </div>
              <div>
                <label className={labelCls}>Número de Serie</label>
                <input
                  name="numero_serie"
                  value={form.numero_serie}
                  onChange={handleChange}
                  placeholder="S/N: 234X-DFG3-9981"
                  className={inputCls}
                  maxLength={50}
                />
              </div>
              <div>
                <label className={labelCls}>Unidad de Medida</label>
                <select name="unidad_medida" value={form.unidad_medida} onChange={handleChange} className={inputCls}>
                  <option value="pz">Pieza (pz)</option>
                  <option value="caja">Caja</option>
                  <option value="kit">Kit / Juego</option>
                  <option value="m">Metros (m)</option>
                  <option value="kg">Kilogramos (kg)</option>
                  <option value="lt">Litros (lt)</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className={labelCls}>Descripción</label>
                <textarea
                  name="descripcion"
                  value={form.descripcion}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Especificaciones técnicas o notas adicionales..."
                  className={inputCls + " resize-none"}
                  maxLength={500}
                />
              </div>
            </div>
          </div>

          {/* Sección: Logística */}
          <div>
            <p className="text-[10px] font-black text-[#014ba0]/60 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Info size={12} /> Logística y Clasificación
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Categoría *</label>
                <select
                  name="categoria_id"
                  value={form.categoria_id}
                  onChange={handleChange}
                  required
                  className={inputCls}
                >
                  <option value="">Seleccionar categoría...</option>
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Departamento Responsable</label>
                <select
                  name="departamento_id"
                  value={form.departamento_id ?? ""}
                  onChange={handleChange}
                  className={inputCls}
                >
                  <option value="">Ninguno / Stock General</option>
                  {departamentos.map((d) => (
                    <option key={d.id} value={d.id}>{d.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Ubicación Física</label>
                <input
                  name="ubicacion"
                  value={form.ubicacion}
                  onChange={handleChange}
                  placeholder="Estante B / Pasillo 4"
                  className={inputCls}
                  maxLength={100}
                />
              </div>
            </div>
          </div>

          {/* Sección: Stock */}
          <div>
            <p className="text-[10px] font-black text-[#014ba0]/60 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Info size={12} /> Control de Existencias
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div>
                <label className={labelCls}>Stock Total</label>
                <input
                  type="number"
                  name="stock_total"
                  value={form.stock_total}
                  onChange={handleChange}
                  min={0}
                  className={inputCls + " text-center font-black text-slate-800"}
                />
              </div>
              {/* Stock disponible solo editable al modificar; en alta es igual al total */}
              {item && (
                <div>
                  <label className={labelCls + " text-emerald-600"}>Disponible Actual</label>
                  <input
                    type="number"
                    name="stock_disponible"
                    value={form.stock_disponible}
                    onChange={handleChange}
                    min={0}
                    className={inputCls + " text-center font-black text-emerald-700 bg-emerald-50/40 border-emerald-200"}
                  />
                </div>
              )}
              <div>
                <label className={labelCls + " text-red-400"}>Umbral Mínimo (Alerta)</label>
                <input
                  type="number"
                  name="stock_minimo"
                  value={form.stock_minimo}
                  onChange={handleChange}
                  min={0}
                  className={inputCls + " text-center font-black text-red-600 bg-red-50/30 border-red-100"}
                />
              </div>
            </div>
          </div>

          {/* Sección: Estado */}
          <div>
            <p className="text-[10px] font-black text-[#014ba0]/60 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Info size={12} /> Estado Operativo
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {ESTADO_OPTS.map(({ value, label, Icon, cls }) => {
                const checked = form.estado === value;
                return (
                  <label
                    key={value}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                      checked
                        ? "border-[#014ba0] bg-[#014ba0]/5"
                        : "border-slate-200 bg-slate-50 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="estado"
                      value={value}
                      checked={checked}
                      onChange={() => setForm((prev) => ({ ...prev, estado: value }))}
                      className="sr-only"
                    />
                    <Icon size={16} className={cls} />
                    <span className="text-sm font-semibold text-slate-700">{label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Sección: Imagen */}
          <div>
            <p className="text-[10px] font-black text-[#014ba0]/60 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Camera size={12} /> Fotografía del Artículo
            </p>
            {imagePreview ? (
              <div className="relative w-full max-w-xs">
                <img
                  src={imagePreview}
                  alt="Vista previa"
                  className="w-full h-40 object-contain rounded-2xl border border-slate-200 bg-slate-50 p-2"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-lg"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-2 w-full max-w-xs h-32 border-2 border-dashed border-[#014ba0]/20 rounded-2xl cursor-pointer hover:border-[#014ba0]/40 hover:bg-[#014ba0]/5 transition-all">
                <Camera size={24} className="text-slate-300" />
                <span className="text-xs font-bold text-slate-400">Seleccionar imagen</span>
                <span className="text-[10px] text-slate-300">JPG, PNG, WebP, GIF — máx. 5 MB</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </label>
            )}
          </div>
        </form>

        {/* ── Footer ── */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 font-bold text-slate-500 hover:text-slate-700 transition-colors text-sm"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={isLoading || uploadingImage}
            className="flex items-center gap-2 px-8 py-2.5 bg-[#014ba0] hover:bg-[#004091] text-white rounded-xl font-bold text-sm shadow-md shadow-[#014ba0]/20 disabled:opacity-60 transition-all"
          >
            {(isLoading || uploadingImage) && (
              <Loader2 size={16} className="animate-spin" />
            )}
            {item ? "Guardar Cambios" : "Registrar Artículo"}
          </button>
        </div>
      </div>
    </div>
  );
}