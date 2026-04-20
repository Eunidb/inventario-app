"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { InventarioItem, Categoria, Departamento, EstadoInventarioEnum } from "@/lib/supabase";

// ---------------------------------------------------------------------------
// Props del componente
// ---------------------------------------------------------------------------
interface ModalGestionProps {
  /** Indica si el modal está abierto */
  isOpen: boolean;
  /** Callback para cerrar el modal */
  onClose: () => void;
  /** Artículo a editar (null = modo creación) */
  item?: InventarioItem | null;
  /** Callback al guardar exitosamente */
  onSaved: () => void;
}

// ---------------------------------------------------------------------------
// Valores iniciales del formulario
// ---------------------------------------------------------------------------
const FORM_INITIAL = {
  clave: "",
  nombre: "",
  descripcion: "",
  marca: "",
  modelo: "",
  numero_serie: "",
  stock_total: 0,
  stock_disponible: 0,
  stock_minimo: 1,
  unidad_medida: "pieza",
  ubicacion: "",
  estado: "activo" as EstadoInventarioEnum,
  imagen_url: "",
  categoria_id: 0,
  departamento_id: undefined as number | undefined,
};

// ---------------------------------------------------------------------------
// Componente ModalGestion
// ---------------------------------------------------------------------------
export default function ModalGestion({ isOpen, onClose, item, onSaved }: ModalGestionProps) {
  const [form, setForm]           = useState(FORM_INITIAL);
  const [categorias, setCategorias]     = useState<Categoria[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // -------------------------------------------------------------------------
  // Carga catálogos al abrir el modal
  // -------------------------------------------------------------------------
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

  // -------------------------------------------------------------------------
  // Rellenar formulario al editar un artículo existente
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (item) {
      setForm({
        clave:           item.clave,
        nombre:          item.nombre,
        descripcion:     item.descripcion ?? "",
        marca:           item.marca ?? "",
        modelo:          item.modelo ?? "",
        numero_serie:    item.numero_serie ?? "",
        stock_total:     item.stock_total,
        stock_disponible: item.stock_disponible,
        stock_minimo:    item.stock_minimo,
        unidad_medida:   item.unidad_medida ?? "pieza",
        ubicacion:       item.ubicacion ?? "",
        estado:          item.estado,
        imagen_url:      item.imagen_url ?? "",
        categoria_id:    item.categoria_id,
        departamento_id: item.departamento_id,
      });
      setImagePreview(item.imagen_url ?? null);
    } else {
      setForm(FORM_INITIAL);
      setImagePreview(null);
    }
    setError(null);
  }, [item, isOpen]);

  // -------------------------------------------------------------------------
  // Manejador genérico de cambios en el formulario
  // -------------------------------------------------------------------------
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  // -------------------------------------------------------------------------
  // Manejo de selección de imagen
  // -------------------------------------------------------------------------
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  // -------------------------------------------------------------------------
  // Subir imagen a Supabase Storage
  // -------------------------------------------------------------------------
  const uploadImage = async (file: File): Promise<string | null> => {
    const ext      = file.name.split(".").pop();
    const fileName = `inventario/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("uploads")
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      console.error("Error al subir imagen:", uploadError.message);
      return null;
    }

    const { data } = supabase.storage.from("uploads").getPublicUrl(fileName);
    return data.publicUrl;
  };

  // -------------------------------------------------------------------------
  // Guardar (crear o actualizar) el artículo
  // -------------------------------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Validaciones básicas
      if (!form.clave.trim() || !form.nombre.trim()) {
        throw new Error("La clave y el nombre son obligatorios.");
      }
      if (!form.categoria_id) {
        throw new Error("Debes seleccionar una categoría.");
      }

      // Subir imagen si se seleccionó una nueva
      let imagenUrl = form.imagen_url;
      if (imageFile) {
        const uploaded = await uploadImage(imageFile);
        if (uploaded) imagenUrl = uploaded;
      }

      const payload = { ...form, imagen_url: imagenUrl };

      if (item) {
        // --- Actualizar artículo existente ---
        const { error: updateError } = await supabase
          .from("inventario")
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq("id", item.id);

        if (updateError) throw new Error(updateError.message);
      } else {
        // --- Crear nuevo artículo ---
        const { error: insertError } = await supabase
          .from("inventario")
          .insert(payload);

        if (insertError) throw new Error(insertError.message);
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message ?? "Ocurrió un error inesperado.");
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // Si el modal está cerrado, no renderizar nada
  // -------------------------------------------------------------------------
  if (!isOpen) return null;

  return (
    /* Overlay */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Panel del modal */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Encabezado */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            {item ? "Editar artículo" : "Nuevo artículo"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* Mensaje de error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          {/* Fila: Clave + Nombre */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Clave <span className="text-red-500">*</span>
              </label>
              <input
                name="clave"
                value={form.clave}
                onChange={handleChange}
                placeholder="Ej: HERR-001"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                placeholder="Ej: Llave de torsión 1/2"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Descripción</label>
            <textarea
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              rows={2}
              placeholder="Descripción opcional del artículo..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Fila: Marca + Modelo + Número de serie */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Marca</label>
              <input
                name="marca"
                value={form.marca}
                onChange={handleChange}
                placeholder="Ej: Stanley"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Modelo</label>
              <input
                name="modelo"
                value={form.modelo}
                onChange={handleChange}
                placeholder="Ej: XL-500"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">N° Serie</label>
              <input
                name="numero_serie"
                value={form.numero_serie}
                onChange={handleChange}
                placeholder="Ej: SN-123456"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Fila: Stocks */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Stock total</label>
              <input
                type="number"
                name="stock_total"
                value={form.stock_total}
                onChange={handleChange}
                min={0}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Stock disponible</label>
              <input
                type="number"
                name="stock_disponible"
                value={form.stock_disponible}
                onChange={handleChange}
                min={0}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Stock mínimo</label>
              <input
                type="number"
                name="stock_minimo"
                value={form.stock_minimo}
                onChange={handleChange}
                min={0}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Fila: Unidad + Ubicación + Estado */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Unidad medida</label>
              <input
                name="unidad_medida"
                value={form.unidad_medida}
                onChange={handleChange}
                placeholder="pieza, litro, caja..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Ubicación</label>
              <input
                name="ubicacion"
                value={form.ubicacion}
                onChange={handleChange}
                placeholder="Ej: Taller A / Estante 3"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Estado</label>
              <select
                name="estado"
                value={form.estado}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
                <option value="en_reparacion">En reparación</option>
                <option value="mantenimiento">Mantenimiento</option>
                <option value="dado_de_baja">Dado de baja</option>
              </select>
            </div>
          </div>

          {/* Fila: Categoría + Departamento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Categoría <span className="text-red-500">*</span>
              </label>
              <select
                name="categoria_id"
                value={form.categoria_id}
                onChange={handleChange}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value={0} disabled>Selecciona una categoría</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Departamento</label>
              <select
                name="departamento_id"
                value={form.departamento_id ?? ""}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Sin asignar</option>
                {departamentos.map((d) => (
                  <option key={d.id} value={d.id}>{d.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Imagen */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Imagen del artículo</label>
            <div className="flex items-center gap-4">
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Vista previa"
                  className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                />
              )}
              <label className="cursor-pointer flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 border border-blue-200 hover:border-blue-300 rounded-lg px-4 py-2 transition-colors">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {imagePreview ? "Cambiar imagen" : "Subir imagen"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading && (
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {isLoading ? "Guardando..." : item ? "Guardar cambios" : "Crear artículo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}