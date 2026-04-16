'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { 
  Search, Plus, FileUp, MoreVertical, 
  Edit2, Trash2, MapPin, Tag, User, Box, ImageOff 
} from 'lucide-react'

// Imagen genérica de alta calidad para cuando no hay foto
const DEFAULT_IMG = "https://img.icons8.com/fluency/240/null/image-placeholder.png";

export default function InventarioPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [openActionId, setOpenActionId] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchInventario()
  }, [])

  async function fetchInventario() {
    setLoading(true)
    const { data, error } = await supabase
      .from('inventario')
      .select(`
        *,
        categorias(nombre),
        departamentos(nombre, responsable)
      `)
      .order('clave', { ascending: true })

    if (!error) setItems(data || [])
    setLoading(false)
  }

  async function handleBaja(id: number) {
    if (confirm('¿Estás seguro de dar de baja este artículo?')) {
      const { error } = await supabase
        .from('inventario')
        .update({ estado: 'dado_de_baja', stock_disponible: 0 })
        .eq('id', id)

      if (error) alert("Error: " + error.message)
      else {
        setOpenActionId(null)
        fetchInventario()
      }
    }
  }

  const filteredItems = items.filter(item => 
    item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.clave.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-10 bg-gray-50 min-h-screen">
      {/* HEADER - Sin cambios significativos para mantener estructura */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Inventario Maestro</h1>
          <p className="text-gray-500 font-medium">Control visual de activos y herramientas</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Buscar por nombre o clave..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border-2 border-gray-100 rounded-2xl pl-12 pr-4 py-3.5 shadow-sm focus:border-blue-400 focus:ring-4 focus:ring-blue-50 outline-none transition-all" 
            />
          </div>
          
          <Link href="/inventario/nuevo" className="flex items-center gap-2 px-8 py-3.5 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all hover:-translate-y-1 active:translate-y-0">
            <Plus size={22} /> Nuevo Registro
          </Link>
        </div>
      </div>

      {/* TABLA MEJORADA */}
      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-blue-900/5 border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#1f2937] text-white uppercase text-[11px] font-bold tracking-[0.2em]">
              <tr>
                <th className="px-8 py-7">Clave</th>
                <th className="px-6 py-7">Detalle del Producto</th>
                <th className="px-6 py-7">Categoría</th>
                <th className="px-6 py-7 text-center">Disponibilidad</th>
                <th className="px-6 py-7">Ubicación</th>
                <th className="px-6 py-7 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredItems.map((item) => (
                <tr key={item.id} className="group hover:bg-blue-50/40 transition-all">
                  {/* CLAVE */}
                  <td className="px-8 py-6">
                    <span className="font-mono font-black text-blue-600 bg-blue-50 border border-blue-100 px-4 py-2 rounded-xl text-xs">
                      {item.clave}
                    </span>
                  </td>
                  
                  {/* INFO DEL PRODUCTO CON IMAGEN GRANDE */}
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-6">
                      {/* CONTENEDOR DE IMAGEN AGRANDADO */}
                      <div className="w-28 h-28 rounded-[1.5rem] bg-white border-2 border-gray-50 shadow-sm flex-shrink-0 overflow-hidden flex items-center justify-center p-2 group-hover:border-blue-200 transition-colors">
                        {item.imagen_url ? (
                          <img 
                            src={item.imagen_url} 
                            className="max-w-full max-h-full object-contain transition-transform duration-500 group-hover:scale-110" 
                            alt={item.nombre} 
                          />
                        ) : (
                          <ImageOff size={32} className="text-gray-200" />
                        )}
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-gray-900 font-extrabold text-lg leading-tight group-hover:text-blue-600 transition-colors">
                          {item.nombre}
                        </span>
                        <div className="flex items-center gap-4 text-xs font-bold text-gray-400">
                          <span className="flex items-center gap-1.5 bg-gray-100 px-2 py-1 rounded-md">
                            <Tag size={14}/> {item.marca || 'GENÉRICO'}
                          </span>
                          {item.departamentos && (
                            <span className="flex items-center gap-1.5 text-blue-500">
                              <User size={14}/> {item.departamentos.responsable}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* CATEGORÍA */}
                  <td className="px-6 py-6 text-center">
                    <div className="inline-flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
                      <Box size={16} className="text-blue-400" />
                      <span className="font-bold text-[10px] text-gray-600 uppercase tracking-wider">
                        {item.categorias?.nombre || 'General'}
                      </span>
                    </div>
                  </td>

                  {/* STOCK DISPONIBLE */}
                  <td className="px-6 py-6 text-center">
                    <div className="flex flex-col items-center">
                      <div className="flex items-baseline gap-1">
                        <span className={`text-2xl font-black ${item.stock_disponible <= item.stock_minimo ? 'text-red-500' : 'text-gray-800'}`}>
                          {item.stock_disponible}
                        </span>
                        <span className="text-xs font-bold text-gray-400 uppercase">{item.unidad_medida}</span>
                      </div>
                      {/* BARRA DE PROGRESO VISUAL */}
                      <div className="w-20 h-2 bg-gray-100 rounded-full mt-2 overflow-hidden shadow-inner">
                        <div 
                          className={`h-full transition-all duration-700 ${item.stock_disponible <= item.stock_minimo ? 'bg-red-500' : 'bg-green-500'}`}
                          style={{ width: `${Math.min((item.stock_disponible / (item.stock_total || 1)) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>

                  {/* UBICACIÓN */}
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-2 text-gray-500">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <MapPin size={16} className="text-blue-500" />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-tight italic">
                        {item.ubicacion || 'Sin asignar'}
                      </span>
                    </div>
                  </td>

                  {/* ACCIONES */}
                  <td className="px-6 py-6 text-center relative">
                    <button 
                      onClick={() => setOpenActionId(openActionId === item.id ? null : item.id)}
                      className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all"
                    >
                      <MoreVertical size={24} />
                    </button>

                    {openActionId === item.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setOpenActionId(null)}></div>
                        <div className="absolute right-12 top-20 w-56 bg-white border border-gray-100 rounded-[1.5rem] shadow-2xl z-20 p-3 overflow-hidden animate-in fade-in zoom-in duration-200">
                          <Link href={`/inventario/${item.id}`} className="flex items-center gap-3 px-4 py-4 text-sm font-bold text-gray-700 hover:bg-blue-600 hover:text-white rounded-2xl transition-all group">
                            <Edit2 size={18} className="group-hover:text-white" /> Editar Activo
                          </Link>
                          <button 
                            onClick={() => handleBaja(item.id)}
                            className="flex w-full items-center gap-3 px-4 py-4 text-sm font-bold text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                          >
                            <Trash2 size={18} /> Dar de baja
                          </button>
                        </div>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* FOOTER */}
        <div className="p-10 bg-gray-50/40 border-t border-gray-100 flex justify-between items-center text-xs">
          <p className="text-gray-400 font-bold">
            Mostrando <span className="text-blue-600">{filteredItems.length}</span> registros en el sistema.
          </p>
        </div>
      </div>
    </div>
  )
}