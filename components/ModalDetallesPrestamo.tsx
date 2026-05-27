/**
 * @file components/ModalDetallesPrestamo.tsx
 * @description Vista rápida detallada de un préstamo con diseño unificado.
 */

"use client";

import { X, Calendar, User, ShieldCheck, Box, Clock, FileText } from "lucide-react";
import { useRouter } from "next/navigation";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  prestamo: any;
}

export default function ModalDetallesPrestamo({ isOpen, onClose, prestamo }: Props) {
  const router = useRouter();

  if (!isOpen || !prestamo) return null;

  const ESTADO_LABELS: Record<string, { label: string; cls: string }> = {
    activo:    { label: "Activo",    cls: "bg-blue-50 text-blue-700 border-blue-200" },
    devuelto:  { label: "Devuelto",  cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    atrasado:  { label: "Atrasado",  cls: "bg-rose-50 text-rose-700 border-rose-200" },
    cancelado: { label: "Cancelado", cls: "bg-slate-100 text-slate-500 border-slate-200" },
  };

  const currentEstado = ESTADO_LABELS[prestamo.estado] || { label: prestamo.estado, cls: "bg-blue-50 text-blue-700 border-blue-200" };

  return (
    <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Contenedor del Modal */}
      <div className="bg-white w-full max-w-lg rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh] animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 sm:p-7 flex justify-between items-center bg-blue-50/40 border-b border-blue-100">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-black text-slate-800 tracking-tight">Vista Rápida</h2>
              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase border ${currentEstado.cls}`}>
                {currentEstado.label}
              </span>
            </div>
            <p className="text-[10px] font-bold tracking-widest text-slate-400 mt-0.5">
              FOLIO #PR-{prestamo.id?.toString().padStart(5, '0')}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-colors text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        {/* Cuerpo del modal con scroll interno */}
        <div className="p-5 sm:p-7 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
          {/* Solicitante y Autorizador */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Solicitante</span>
              <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <User size={14} className="text-blue-600 flex-shrink-0" />
                <span className="truncate">{prestamo.solicitante_externo || prestamo.usuarios?.nombre_completo || "N/A"}</span>
              </p>
            </div>
            <div className="space-y-1 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Autorizó</span>
              <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <ShieldCheck size={14} className="text-blue-600 flex-shrink-0" />
                <span className="truncate">{prestamo.autorizador?.nombre_completo || "Sistema"}</span>
              </p>
            </div>
          </div>

          {/* Lista de Artículos */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Material en préstamo</span>
            <div className="bg-slate-50 rounded-2xl border border-slate-200 divide-y divide-slate-200 overflow-hidden">
              {prestamo.detalle_prestamo?.map((det: any, i: number) => (
                <div key={i} className="p-3.5 flex justify-between items-center gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Box size={15} className="text-blue-600 flex-shrink-0" />
                    <span className="text-sm font-bold text-slate-600 truncate">{det.inventario?.nombre}</span>
                  </div>
                  <span className="bg-white px-2.5 py-0.5 rounded-lg border border-slate-200 text-xs font-black text-blue-600 flex-shrink-0">
                    x{det.cantidad}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Tiempos */}
          <div className="bg-blue-50/40 p-4 sm:p-5 rounded-2xl space-y-2.5 border border-blue-100/60">
            <div className="flex justify-between items-center text-xs font-bold gap-2">
              <span className="text-slate-400 uppercase tracking-tight flex items-center gap-1 flex-shrink-0">
                <Clock size={12} className="text-blue-500"/> Salida
              </span>
              <span className="text-slate-600 text-right">
                {new Date(prestamo.created_at).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" })}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs font-bold gap-2">
              <span className="text-slate-400 uppercase tracking-tight flex items-center gap-1 flex-shrink-0">
                <Calendar size={12} className="text-blue-500"/> Retorno
              </span>
              <span className={`${prestamo.fecha_devolucion ? 'text-slate-600' : 'text-blue-600 italic'} text-right`}>
                {prestamo.fecha_devolucion ? new Date(prestamo.fecha_devolucion).toLocaleDateString("es-MX", { dateStyle: "short" }) : 'Pendiente'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex flex-col-reverse sm:flex-row gap-2.5">
          <button 
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider hover:text-slate-700 transition-colors rounded-xl hover:bg-slate-200/50 text-center"
          >
            Cerrar
          </button>
          <button 
            onClick={() => router.push(`/prestamos/${prestamo.id}`)}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-blue-100"
          >
            <FileText size={14} /> Ver Reporte Completo
          </button>
        </div>
      </div>
    </div>
  );
}