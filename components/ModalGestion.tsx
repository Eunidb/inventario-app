'use client'
import React from 'react'
import { X, RotateCcw, Package, User, Hash } from 'lucide-react'

interface ModalGestionProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  loading: boolean
  data: {
    nombre: string
    cantidad: number
    responsable: string
    clave: string
  } | null
}

export default function ModalGestion({ isOpen, onClose, onConfirm, loading, data }: ModalGestionProps) {
  if (!isOpen || !data) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay con desenfoque */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* Contenedor del Modal */}
      <div className="relative bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <RotateCcw size={24} />
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
              <X size={24} />
            </button>
          </div>

          <h3 className="text-2xl font-black text-slate-800 mb-2">Gestionar Devolución</h3>
          <p className="text-slate-500 text-sm mb-6">Confirmar el reingreso del equipo al inventario principal.</p>

          {/* Detalles del Préstamo */}
          <div className="bg-slate-50 rounded-3xl p-5 mb-8 space-y-4 border border-slate-100">
            <div className="flex items-center gap-3">
              <Package size={16} className="text-blue-500" />
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase">Artículo</span>
                <span className="text-sm font-bold text-slate-700">{data.nombre}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Hash size={16} className="text-blue-500" />
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase">Cantidad a devolver</span>
                <span className="text-sm font-bold text-slate-700">{data.cantidad} unidades</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <User size={16} className="text-blue-500" />
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase">Responsable</span>
                <span className="text-sm font-bold text-slate-700">{data.responsable}</span>
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex flex-col gap-3">
            <button
              onClick={onConfirm}
              disabled={loading}
              className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-lg shadow-blue-500/30 hover:bg-blue-700 hover:translate-y-[-2px] transition-all disabled:opacity-50 disabled:translate-y-0"
            >
              {loading ? "PROCESANDO..." : "CONFIRMAR DEVOLUCIÓN"}
            </button>
            <button
              onClick={onClose}
              className="w-full py-4 text-slate-400 font-bold hover:text-slate-600 transition-colors text-sm"
            >
              CANCELAR
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}