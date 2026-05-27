/**
 * @file app/inventario/[id]/page.tsx
 * @description Formulario de alta y edición de artículos del inventario con diseño formal y restrictivo por rol.
 *
 * CAMBIOS APLICADOS:
 * - Eliminados emojis del selector de estado (reemplazados por indicadores CSS y Lucide Icons)[cite: 285].
 * - Consistencia Cromática Fiel utilizando la paleta #014ba0 y #004091.
 * - Microinteracciones fluidas con transiciones controladas de 300ms.
 * - Verificación en tiempo real del rol del usuario desde la base de datos (bloqueo preventivo si es "lector").
 * - Completada la interfaz para todos los campos del formData (Descripción, No. de Serie, Unidad y Departamento).
 * - Sanitización y validación estricta de entradas pre-flight antes de enviar a Supabase.
 */

"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/client";
import { useRouter, useParams } from "next/navigation";
import {
  Save, ArrowLeft, Hash, MapPin, Tag, Box,
  Layers, Camera, Loader2, Info, Package, Trash2,
  CheckCircle, AlertCircle, XCircle, Wrench, ShieldAlert,
  FileText, Percent
} from "lucide-react";

/* Configuración visual de estados semánticos sin emojis */
const ESTADO_OPTS = [
  { value: "activo",        label: "Activo / Funcional",   Icon: CheckCircle, cls: "text-emerald-600" },
  { value: "mantenimiento", label: "En Mantenimiento",     Icon: Wrench,      cls: "text-amber-600"  },
  { value: "dado_de_baja",  label: "Dado de Baja",         Icon: XCircle,      cls: "text-red-600"    },
  { value: "inactivo",      label: "Inactivo",             Icon: AlertCircle,  cls: "text-slate-500"  },
  { value: "en_reparacion", label: "En Reparación",        Icon: Wrench,       cls: "text-orange-600" },
];

export default function InventarioForm() {
  const router = useRouter();
  const { id } = useParams();
  const isEdit = id !== "nuevo";

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [departamentos, setDepartamentos] = useState<any[]>([]);
  
  // Estados de control de roles y sesión
  const [userRole, setUserRole] = useState<string | null>(null);
  const [checkingRole, setCheckingRole] = useState(true);

  const supabase = createClient();

  const [formData, setFormData] = useState({
    clave:            "",
    nombre:           "",
    descripcion:      "",
    marca:            "",
    modelo:           "",
    numero_serie:     "",
    stock_total:      0,
    stock_minimo:     0,
    stock_disponible: 0,
    unidad_medida:    "pz",
    ubicacion:        "",
    categoria_id:     "",
    departamento_id:  "",
    estado:           "activo",
    imagen_url:       "",
  });

  /* 1. Carga de datos iniciales y validación de rol desde DB */
  useEffect(() => {
    async function loadData() {
      try {
        // Validar usuario y obtener rol real desde la tabla 'perfiles'
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from("perfiles")
            .select("rol")
            .eq("id", user.id)
            .single();
          
          const role = profile?.rol || user.user_metadata?.rol || "lector";
          setUserRole(role);
        } else {
          router.push("/login");
          return;
        }

        // Carga de catálogos concurrentes
        const [catsResponse, deptsResponse] = await Promise.all([
          supabase.from("categorias").select("*").order("nombre"),
          supabase.from("departamentos").select("*").order("nombre")
        ]);

        setCategorias(catsResponse.data || []);
        setDepartamentos(deptsResponse.data || []);

        // Si es edición, cargar el artículo correspondiente
        if (isEdit) {
          const { data, error } = await supabase
            .from("inventario")
            .select("*")
            .eq("id", id)
            .single();
          if (data) setFormData(data);
          if (error) console.error("Error al cargar artículo:", error);
        }
      } catch (err) {
        console.error("Error en la carga de datos:", err);
      } finally {
        setCheckingRole(false);
      }
    }
    loadData();
  }, [id, isEdit, router]);

  // Permisos: Solo administradores, encargados o coordinadores pueden escribir/eliminar
  const canModify = userRole === "admin" || userRole === "encargado" || userRole === "coordinador";

  /* 2. Subida controlada de imágenes al Bucket de Supabase Storage */
  async function uploadImagen(e: React.ChangeEvent<HTMLInputElement>) {
    try {
      if (!canModify) {
        alert("No posees permisos de escritura para alterar las imágenes del sistema.");
        return;
      }
      setUploading(true);
      if (!e.target.files?.length) return;

      const file = e.target.files[0];
      const ext = file.name.split(".").pop();
      // Sanitización del nombre del archivo para evitar path traversal e inconsistencias de caracteres
      const fileName = `${(formData.clave || "item").replace(/[^a-zA-Z0-9-_]/g, "")}-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("inventario")
        .upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("inventario")
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, imagen_url: publicUrl }));
    } catch (err: any) {
      alert("Error al subir imagen: " + err.message);
    } finally {
      setUploading(false);
    }
  }

  /* 3. Validación estricta Pre-Flight antes de impactar Supabase */
  function validarFormulario(): string | null {
    if (!formData.clave.trim())   return "La clave única del activo es obligatoria.";
    if (!formData.nombre.trim())  return "El nombre descriptivo del activo es requerido.";
    if (!formData.categoria_id)   return "Debe asignar una categoría válida.";
    if (formData.stock_total < 0) return "El stock de existencias no puede ser un valor negativo.";
    if (formData.stock_minimo < 0) return "El umbral de stock mínimo no puede ser negativo.";
    return null;
  }

  /* 4. Guardado / Actualización */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canModify) {
      alert("Acceso denegado: Tu rol de usuario no cuenta con privilegios de modificación.");
      return;
    }

    const error = validarFormulario();
    if (error) { alert(error); return; }

    setLoading(true);

    const payload = {
      ...formData,
      // Sanitización estricta de cadenas de texto clave
      clave:            formData.clave.trim().toUpperCase().replace(/[^A-Z0-9-_]/g, ""),
      nombre:           formData.nombre.trim(),
      marca:            formData.marca.trim(),
      modelo:           formData.modelo.trim(),
      numero_serie:     formData.numero_serie.trim(),
      descripcion:      formData.descripcion.trim(),
      categoria_id:     formData.categoria_id || null,
      departamento_id:  formData.departamento_id || null,
      // Lógica de existencias
      stock_disponible: isEdit ? formData.stock_disponible : formData.stock_total,
      updated_at:       new Date(),
    };

    const { error: dbError } = isEdit
      ? await supabase.from("inventario").update(payload).eq("id", id)
      : await supabase.from("inventario").insert([payload]);

    if (dbError) {
      alert("Error al guardar en el sistema: " + dbError.message);
    } else {
      router.push("/inventario");
      router.refresh();
    }
    setLoading(false);
  };

  /* 5. Eliminación Física del Activo */
  async function handleDelete() {
    if (!canModify) {
      alert("Acceso denegado: No cuentas con privilegios para eliminar registros.");
      return;
    }
    if (!confirm("¿Eliminar este artículo de forma permanente? Esta acción no se puede revertir.")) return;
    
    setLoading(true);
    const { error } = await supabase.from("inventario").delete().eq("id", id);
    if (error) {
      alert("Error en eliminación: " + error.message);
      setLoading(false);
    } else {
      router.push("/inventario");
      router.refresh();
    }
  }

  if (checkingRole) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-[#014ba0]" size={40} />
        <p className="text-slate-500 font-medium text-xs tracking-wider uppercase">Verificando Credenciales corporativas...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-10 transition-all duration-300 ease-in-out">
      <div className="max-w-5xl mx-auto">

        {/* Alerta Visual de Solo Lectura si no tiene permisos */}
        {!canModify && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl shadow-sm">
            <ShieldAlert size={20} className="text-amber-600 flex-shrink-0" />
            <div className="text-sm font-medium">
              <span className="font-bold">Modo de consulta (Solo Lectura):</span> Su nivel de usuario actual (<span className="underline font-bold">{userRole}</span>) no dispone de permisos para modificar o eliminar el inventario de la institución.
            </div>
          </div>
        )}

        {/* Barra de navegación superior */}
        <div className="flex justify-between items-center mb-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-400 hover:text-[#014ba0] font-bold text-xs uppercase tracking-widest transition-all duration-300 ease-in-out"
          >
            <ArrowLeft size={16} /> Volver al Inventario
          </button>

          {isEdit && canModify && (
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center gap-2 text-red-400 hover:text-red-600 font-bold text-xs uppercase tracking-widest transition-all duration-300 ease-in-out"
            >
              <Trash2 size={16} /> Eliminar Activo
            </button>
          )}
        </div>

        {/* Formulario Principal */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl shadow-xl border border-[#004091]/5 overflow-hidden transition-all duration-300 ease-in-out"
        >
          {/* Cabecera Corporativa */}
          <div className="bg-white border-b border-slate-100 p-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#004091] rounded-2xl text-white shadow-lg shadow-[#004091]/20">
                <Package size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-800 tracking-tight">
                  {isEdit ? "Editar Activo Fijo" : "Nuevo Registro de Inventario"}
                </h1>
                <p className="text-slate-400 text-sm font-medium">
                  Gestione la ficha técnica, ubicación y existencias operacionales del equipo.
                </p>
              </div>
            </div>
          </div>

          <div className="p-8 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-10">

            {/* ── COLUMNA IZQUIERDA: Multimedia y Estatus ── */}
            <div className="lg:col-span-4 space-y-8">
              
              {/* Contenedor Fotográfico */}
              <div className="flex flex-col items-center p-6 bg-slate-50 rounded-3xl border-2 border-dashed border-[#014ba0]/10 hover:border-[#014ba0]/30 transition-all duration-300">
                <div className="relative w-full aspect-square bg-white rounded-2xl shadow-inner overflow-hidden border-4 border-white">
                  {formData.imagen_url ? (
                    <img
                      src={formData.imagen_url}
                      className="w-full h-full object-contain p-2"
                      alt="Vista previa del artículo"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                      <Camera size={44} strokeWidth={1.5} />
                      <span className="text-[10px] font-bold uppercase mt-2 tracking-wider text-slate-400">Sin fotografía</span>
                    </div>
                  )}
                  {uploading && (
                    <div className="absolute inset-0 bg-[#004091]/20 backdrop-blur-sm flex items-center justify-center">
                      <Loader2 className="animate-spin text-[#014ba0]" size={32} />
                    </div>
                  )}
                </div>
                {canModify && (
                  <label className="mt-4 w-full text-center cursor-pointer bg-[#014ba0] hover:bg-[#004091] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ease-in-out shadow-md shadow-[#014ba0]/10">
                    {uploading ? "Subiendo archivo..." : "Cargar Imagen"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={uploadImagen}
                      disabled={uploading}
                    />
                  </label>
                )}
              </div>

              {/* Selector de Estado Técnico - Sin Emojis */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-[#004091]/50 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Info size={14} /> Estatus Operativo [cite: 285]
                </h3>
                <div className="space-y-2">
                  {ESTADO_OPTS.map(({ value, label, Icon, cls }) => {
                    const isChecked = formData.estado === value;
                    return (
                      <label
                        key={value}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-300 ${
                          isChecked
                            ? "border-[#014ba0] bg-[#014ba0]/5 text-[#014ba0]"
                            : "border-slate-200 bg-slate-50 hover:border-slate-300"
                        } ${!canModify ? "pointer-events-none opacity-80" : ""}`}
                      >
                        <input
                          type="radio"
                          name="estado"
                          value={value}
                          checked={isChecked}
                          disabled={!canModify}
                          onChange={() => setFormData(prev => ({ ...prev, estado: value }))}
                          className="sr-only"
                        />
                        <Icon size={16} className={cls} />
                        <span className="text-sm font-semibold text-slate-700">{label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── COLUMNA DERECHA: Especificaciones Técnicas y Stock ── */}
            <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="md:col-span-2">
                <h3 className="text-[10px] font-black text-[#004091]/50 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Hash size={14} /> Ficha Técnica e Identificadores
                </h3>
              </div>

              {/* Clave Única */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Clave Única (ID)</label>
                <input
                  required
                  type="text"
                  disabled={!canModify || isEdit} // Bloquear clave en edición para mantener consistencia relacional
                  value={formData.clave}
                  onChange={e => setFormData(prev => ({ ...prev, clave: e.target.value.toUpperCase() }))}
                  maxLength={50}
                  placeholder="Ej: LAP-CORP-001"
                  pattern="[A-Z0-9\-_]+"
                  title="Solo letras mayúsculas, números y guiones"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono font-bold text-[#014ba0] outline-none focus:ring-2 focus:ring-[#014ba0]/20 transition-all disabled:bg-slate-100 disabled:text-slate-400"
                />
              </div>

              {/* Nombre del Activo */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nombre del Activo</label>
                <input
                  required
                  type="text"
                  disabled={!canModify}
                  value={formData.nombre}
                  onChange={e => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                  maxLength={100}
                  placeholder="Ej: Laptop Dell Latitude 5420"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#014ba0]/20 transition-all disabled:bg-slate-100"
                />
              </div>

              {/* Marca */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Marca</label>
                <input
                  type="text"
                  disabled={!canModify}
                  value={formData.marca}
                  onChange={e => setFormData(prev => ({ ...prev, marca: e.target.value }))}
                  maxLength={50}
                  placeholder="Dell, HP, Cisco, etc."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#014ba0]/20 transition-all disabled:bg-slate-100"
                />
              </div>

              {/* Modelo */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Modelo</label>
                <input
                  type="text"
                  disabled={!canModify}
                  value={formData.modelo}
                  onChange={e => setFormData(prev => ({ ...prev, modelo: e.target.value }))}
                  maxLength={50}
                  placeholder="Latitude 5420"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#014ba0]/20 transition-all disabled:bg-slate-100"
                />
              </div>

              {/* Número de Serie */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Número de Serie</label>
                <input
  type="text"
  disabled={!canModify}
  value={formData.numero_serie}
  onChange={e => setFormData(prev => ({ ...prev, numero_serie: e.target.value }))}
  maxLength={50 /* Corrección de tipo */}
  placeholder="S/N: 234X-DFG3-9981"
  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#014ba0]/20 transition-all disabled:bg-slate-100"
/>
              </div>

              {/* Unidad de Medida */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Unidad de Medida</label>
                <select
                  disabled={!canModify}
                  value={formData.unidad_medida}
                  onChange={e => setFormData(prev => ({ ...prev, unidad_medida: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#014ba0]/20 transition-all disabled:bg-slate-100"
                >
                  <option value="pz">Pieza (pz)</option>
                  <option value="caja">Caja</option>
                  <option value="kit">Kit / Juego</option>
                  <option value="m">Metros (m)</option>
                  <option value="kg">Kilogramos (kg)</option>
                </select>
              </div>

              {/* Descripción Completa */}
              <div className="md:col-span-2 space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Descripción del Activo</label>
                <textarea
                  disabled={!canModify}
                  value={formData.descripcion}
                  onChange={e => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                  maxLength={500}
                  rows={3}
                  placeholder="Detalles adicionales, especificaciones de hardware o notas técnicas..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#014ba0]/20 transition-all resize-none disabled:bg-slate-100"
                />
              </div>

              <div className="md:col-span-2 pt-4">
                <h3 className="text-[10px] font-black text-[#004091]/50 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Layers size={14} /> Logística, Ubicación y Stock
                </h3>
              </div>

              {/* Categoría */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Categoría</label>
                <select
                  required
                  disabled={!canModify}
                  value={formData.categoria_id}
                  onChange={e => setFormData(prev => ({ ...prev, categoria_id: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#014ba0]/20 transition-all disabled:bg-slate-100"
                >
                  <option value="">Seleccionar Categoría...</option>
                  {categorias.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Departamento Asignado */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Departamento Responsable</label>
                <select
                  disabled={!canModify}
                  value={formData.departamento_id}
                  onChange={e => setFormData(prev => ({ ...prev, departamento_id: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#014ba0]/20 transition-all disabled:bg-slate-100"
                >
                  <option value="">Ninguno / Stock General</option>
                  {departamentos.map(d => (
                    <option key={d.id} value={d.id}>{d.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Ubicación Física */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Ubicación Física</label>
                <input
                  type="text"
                  disabled={!canModify}
                  value={formData.ubicacion}
                  onChange={e => setFormData(prev => ({ ...prev, ubicacion: e.target.value }))}
                  maxLength={100}
                  placeholder="Estante B / Pasillo 4"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#014ba0]/20 transition-all disabled:bg-slate-100"
                />
              </div>

              {/* Existencia Total */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Existencia Total</label>
                <input
                  type="number"
                  min={0}
                  disabled={!canModify}
                  value={formData.stock_total}
                  onChange={e => setFormData(prev => ({ ...prev, stock_total: Math.max(0, parseInt(e.target.value) || 0) }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-black text-slate-700 outline-none focus:ring-2 focus:ring-[#014ba0]/20 transition-all disabled:bg-slate-100"
                />
              </div>

              {/* Stock Mínimo */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-red-400 uppercase ml-1">Umbral Mínimo (Alerta)</label>
                <input
                  type="number"
                  min={0}
                  disabled={!canModify}
                  value={formData.stock_minimo}
                  onChange={e => setFormData(prev => ({ ...prev, stock_minimo: Math.max(0, parseInt(e.target.value) || 0) }))}
                  className="w-full bg-red-50/30 border border-red-100 rounded-xl px-4 py-3 text-sm font-black text-red-600 outline-none focus:ring-2 focus:ring-red-100 transition-all disabled:bg-slate-100 disabled:text-slate-400"
                />
              </div>

              {/* Stock Disponible (Informativo en Edición) */}
              {isEdit && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-emerald-600 uppercase ml-1">Disponible Actual</label>
                  <div className="w-full bg-emerald-50/40 border border-emerald-100 text-emerald-700 rounded-xl px-4 py-3 text-sm font-black cursor-not-allowed">
                    {formData.stock_disponible} {formData.unidad_medida}
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Pie de Formulario / Acciones */}
          <div className="bg-slate-50 p-8 flex justify-end gap-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-slate-600 transition-all duration-300"
            >
              Cancelar
            </button>
            
            {canModify && (
              <button
                disabled={loading}
                type="submit"
                className="flex items-center gap-3 bg-[#014ba0] text-white px-10 py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-[#014ba0]/10 hover:bg-[#004091] active:scale-[0.98] transition-all duration-300 disabled:bg-slate-300 disabled:scale-100"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                {isEdit ? "Guardar Cambios" : "Registrar Activo"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}