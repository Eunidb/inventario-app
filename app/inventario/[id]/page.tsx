'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import { Save, ArrowLeft, Hash, Info, MapPin, Tag, Box, Layers } from 'lucide-react'
import { Camera, Loader2 } from 'lucide-react'

export default function InventarioForm() {
  const router = useRouter()
  const { id } = useParams()
  const isEdit = id !== 'nuevo'

  const [loading, setLoading] = useState(false)
  const [categorias, setCategorias] = useState<any[]>([])
  const [departamentos, setDepartamentos] = useState<any[]>([])
  
  const [formData, setFormData] = useState({
    clave: '',
    nombre: '',
    descripcion: '',
    marca: '',
    modelo: '',
    numero_serie: '',
    stock_total: 0,
    stock_minimo: 0,
    stock_disponible: 0, // <-- Agregado para que no marque error
    unidad_medida: 'pz',
    ubicacion: '',
    categoria_id: '',
    departamento_id: '',
    estado: 'activo',
    imagen_url: ''
  })

  const [uploading, setUploading] = useState(false)

async function uploadImagen(e: React.ChangeEvent<HTMLInputElement>) {
  try {
    setUploading(true)
    if (!e.target.files || e.target.files.length === 0) return

    const file = e.target.files[0]
    const fileExt = file.name.split('.').pop()
    const fileName = `${formData.clave || 'prod'}-${Math.random()}.${fileExt}`
    const filePath = `${fileName}`

    // 1. Subir a Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('imagenes_inventario')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    // 2. Obtener la URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('imagenes_inventario')
      .getPublicUrl(filePath)

    // 3. Actualizar el estado del formulario con la nueva URL
    setFormData({ ...formData, imagen_url: publicUrl })
    
  } catch (error: any) {
    alert('Error subiendo imagen: ' + error.message)
  } finally {
    setUploading(false)
  }
}
  useEffect(() => {
    async function loadData() {
      const { data: cats } = await supabase.from('categorias').select('*')
      const { data: deptos } = await supabase.from('departamentos').select('*')
      setCategorias(cats || [])
      setDepartamentos(deptos || [])

      if (isEdit) {
        const { data } = await supabase.from('inventario').select('*').eq('id', id).single()
        if (data) setFormData(data)
      }
    }
    loadData()
  }, [id, isEdit])

  // Cambiado a React.FormEvent para mayor compatibilidad
  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault()
    setLoading(true)

    const payload: any = {
      ...formData,
      categoria_id: formData.categoria_id || null,
      departamento_id: formData.departamento_id || null,
      // Si es nuevo, el disponible es igual al total inicial
      stock_disponible: isEdit ? formData.stock_disponible : formData.stock_total,
      updated_at: new Date()
    }

    let error;
    if (isEdit) {
      const { error: err } = await supabase.from('inventario').update(payload).eq('id', id)
      error = err
    } else {
      const { error: err } = await supabase.from('inventario').insert([payload])
      error = err
    }

    if (error) {
      alert("Error guardando: " + error.message)
    } else {
      router.push('/inventario')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="p-10 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-400 hover:text-blue-600 transition-all">
          <ArrowLeft size={20} /> Volver al inventario
        </button>
        <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
          {isEdit ? `Editando: ${formData.clave}` : 'Registrar Nuevo Artículo'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-[2rem] shadow-2xl shadow-blue-900/5 border border-gray-100 overflow-hidden">
        <div className="h-3 bg-gradient-to-r from-[#00aaff] to-[#34aadc]"></div>
        
        <div className="p-10 grid grid-cols-1 md:grid-cols-3 gap-10">
          
          {/* SECCIÓN 1: IDENTIFICACIÓN */}
          <div className="space-y-6">
            <h3 className="flex items-center gap-2 font-bold text-[#34aadc] uppercase text-xs tracking-widest pb-2 border-b border-blue-50">
              <Hash size={16} /> Identificación
            </h3>
            
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Clave de Inventario</label>
              <input required value={formData.clave} onChange={e => setFormData({...formData, clave: e.target.value.toUpperCase()})}
                className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-blue-100 outline-none font-mono text-blue-600 font-bold" placeholder="MANT-001" />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Nombre del Activo</label>
              <input required value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})}
                className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-blue-100 outline-none" placeholder="Ej. Multímetro Fluke" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Marca</label>
                <input value={formData.marca} onChange={e => setFormData({...formData, marca: e.target.value})}
                  className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-blue-100 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Modelo</label>
                <input value={formData.modelo} onChange={e => setFormData({...formData, modelo: e.target.value})}
                  className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-blue-100 outline-none" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Número de Serie</label>
              <input value={formData.numero_serie} onChange={e => setFormData({...formData, numero_serie: e.target.value})}
                className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-blue-100 outline-none" placeholder="S/N: 12345ABC" />
            </div>
          </div>

          {/* SECCIÓN 2: CONTROL DE STOCK */}
          <div className="space-y-6">
            <h3 className="flex items-center gap-2 font-bold text-[#34aadc] uppercase text-xs tracking-widest pb-2 border-b border-blue-50">
              <Layers size={16} /> Control y Categoría
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Categoría</label>
                <select required value={formData.categoria_id} onChange={e => setFormData({...formData, categoria_id: e.target.value})}
                  className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-blue-100 outline-none">
                  <option value="">Seleccionar...</option>
                  {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Unidad Medida</label>
                <select value={formData.unidad_medida} onChange={e => setFormData({...formData, unidad_medida: e.target.value})}
                  className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-blue-100 outline-none">
                  <option value="pz">Pieza (pz)</option>
                  <option value="lt">Litro (lt)</option>
                  <option value="kg">Kilo (kg)</option>
                  <option value="mt">Metro (mt)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Stock Total</label>
                <input type="number" value={formData.stock_total} onChange={e => setFormData({...formData, stock_total: parseInt(e.target.value) || 0})}
                  className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-blue-100 outline-none font-bold text-gray-700" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Stock Mínimo</label>
                <input type="number" value={formData.stock_minimo} onChange={e => setFormData({...formData, stock_minimo: parseInt(e.target.value) || 0})}
                  className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-blue-100 outline-none font-bold text-red-400" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Departamento Destino</label>
              <select value={formData.departamento_id} onChange={e => setFormData({...formData, departamento_id: e.target.value})}
                className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-blue-100 outline-none">
                <option value="">Ninguno / Almacén</option>
                {departamentos.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
              </select>
            </div>
          </div>

          {/* SECCIÓN 3: LOGÍSTICA */}
          <div className="space-y-6">
            <h3 className="flex items-center gap-2 font-bold text-[#34aadc] uppercase text-xs tracking-widest pb-2 border-b border-blue-50">
              <MapPin size={16} /> Logística
            </h3>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Ubicación Física</label>
              <input value={formData.ubicacion} onChange={e => setFormData({...formData, ubicacion: e.target.value})}
                className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-blue-100 outline-none" placeholder="Estante, Fila..." />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Estado del Activo</label>
              <select value={formData.estado} onChange={e => setFormData({...formData, estado: e.target.value})}
                className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-blue-100 outline-none">
                <option value="activo">Activo</option>
                <option value="mantenimiento">En Mantenimiento</option>
                <option value="dado_de_baja">Dado de Baja</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Descripción / Notas</label>
              <textarea rows={4} value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})}
                className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-blue-100 outline-none resize-none" placeholder="Observaciones..." />
            </div>
          </div>
        </div>

        <div className="md:col-span-3 bg-blue-50/50 p-6 rounded-3xl border-2 border-dashed border-blue-100 flex flex-col items-center justify-center gap-4">
  <div className="relative w-32 h-32 bg-white rounded-2xl shadow-lg overflow-hidden border-4 border-white">
    {formData.imagen_url ? (
      <img src={formData.imagen_url} className="w-full h-full object-contain" alt="Preview" />
    ) : (
      <div className="w-full h-full flex items-center justify-center text-gray-300">
        <Camera size={40} />
      </div>
    )}
    {uploading && (
      <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white">
        <Loader2 className="animate-spin" />
      </div>
    )}
  </div>
  
  <div className="text-center">
    <label className="cursor-pointer bg-white px-6 py-2 rounded-xl shadow-sm border border-gray-100 text-sm font-bold text-blue-600 hover:bg-blue-50 transition-all">
      {uploading ? 'Subiendo...' : 'Cambiar Fotografía'}
      <input 
        type="file" 
        accept="image/*" 
        className="hidden" 
        onChange={uploadImagen} 
        disabled={uploading}
      />
    </label>
    <p className="text-[10px] text-gray-400 mt-2 uppercase font-black tracking-widest">Formatos: JPG, PNG. Máx 2MB</p>
  </div>
</div>

        <div className="bg-gray-50/50 p-10 flex justify-end gap-6 border-t border-gray-100">
          <button type="button" onClick={() => router.back()} className="px-8 py-4 text-gray-400 font-bold hover:text-gray-600 transition-colors">
            Cancelar
          </button>
          <button disabled={loading} type="submit" className="flex items-center gap-3 bg-[#00aaff] text-white px-12 py-4 rounded-2xl font-bold shadow-xl shadow-blue-200 hover:bg-[#34aadc] transition-all active:scale-95 disabled:bg-gray-300">
            {loading ? 'Procesando...' : <><Save size={22} /> {isEdit ? 'Guardar Cambios' : 'Finalizar Registro'}</>}
          </button>
        </div>
      </form>
    </div>
  )
}