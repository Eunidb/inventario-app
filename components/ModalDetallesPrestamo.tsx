"use client";

import { X, Calendar, User, ShieldCheck, Box, Clock, FileText, ArrowUpRight } from "lucide-react";
import { useRouter } from "next/navigation";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  prestamo: any;
}

export default function ModalDetallesPrestamo({ isOpen, onClose, prestamo }: Props) {
  const router = useRouter();

  if (!isOpen || !prestamo) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        
        {/* Header Dinámico */}
        <div className={`p-8 flex justify-between items-center ${prestamo.estado === 'activo' ? 'bg-amber-50' : 'bg-emerald-50'}`}>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Vista Rápida</h2>
              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${prestamo.estado === 'activo' ? 'bg-amber-200 text-amber-800' : 'bg-emerald-200 text-emerald-800'}`}>
                {prestamo.estado}
              </span>
            </div>
            <p className="text-[10px] font-bold tracking-widest text-slate-400">FOLIO #PR-{prestamo.id.toString().padStart(5, '0')}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors text-slate-400"><X /></button>
        </div>

        <div className="p-8 space-y-6 overflow-y-auto max-h-[70vh]">
          {/* Solicitante y Autorizador */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Solicitante</span>
              <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <User size={14} className="text-blue-500" />
                {prestamo.solicitante_externo || prestamo.usuario?.nombre_completo}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Autorizó</span>
              <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <ShieldCheck size={14} className="text-emerald-500" />
                {prestamo.autorizador?.nombre_completo}
              </p>
            </div>
          </div>

          {/* Lista de Artículos */}
          <div className="space-y-3">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Material en préstamo</span>
            <div className="bg-slate-50 rounded-2xl border border-slate-100 divide-y divide-slate-200">
              {prestamo.detalle_prestamo?.map((det: any, i: number) => (
                <div key={i} className="p-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Box size={16} className="text-blue-500" />
                    <span className="text-sm font-bold text-slate-600">{det.inventario?.nombre}</span>
                  </div>
                  <span className="bg-white px-3 py-1 rounded-lg border border-slate-200 text-xs font-black text-blue-600">
                    x{det.cantidad}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Tiempos */}
          <div className="bg-slate-50 p-5 rounded-3xl space-y-3 border border-slate-100">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-400 uppercase tracking-tighter flex items-center gap-1"><Clock size={12}/> Salida</span>
              <span className="text-slate-600">{new Date(prestamo.created_at).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-400 uppercase tracking-tighter flex items-center gap-1"><Calendar size={12}/> Retorno</span>
              <span className="text-slate-600">{prestamo.fecha_devolucion ? new Date(prestamo.fecha_devolucion).toLocaleDateString() : 'No definida'}</span>
            </div>
          </div>
        </div>

        {/* Footer con enlace a la página de detalle completa */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
          <button 
            onClick={() => router.push(`/prestamos/${prestamo.id}`)}
            className="flex-1 flex items-center justify-center gap-2 bg-slate-800 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-700 transition-all shadow-lg shadow-slate-200"
          >
            <FileText size={14} /> Ver Reporte Completo
          </button>
          <button 
            onClick={onClose}
            className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}