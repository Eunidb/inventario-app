/**
 * @file components/ModalConfirmar.tsx
 * @description Modal interactivo de confirmación, centrado, responsivo y adaptado para flujos de eliminación e información.
 */

"use client";

import React from "react";

import { AlertTriangle, Info, Trash2 } from "lucide-react";

interface ModalConfirmarProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  titulo: string;
  mensaje: string;
  tipo?: "danger" | "info" | "delete";
}

export default function ModalConfirmar({ 
  isOpen, onClose, onConfirm, titulo, mensaje, tipo = "danger" 
}: ModalConfirmarProps) {
  if (!isOpen) return null;

  // Mapeo dinámico de estilos e iconos según el tipo de acción
  const getEstilosTipo = () => {
    switch (tipo) {
      case "delete":
        return {
          containerCls: "bg-rose-50 text-rose-600 border-rose-100",
          btnCls: "bg-rose-600 hover:bg-rose-500 shadow-rose-900/10",
          icon: <Trash2 size={22} strokeWidth={2.5} />
        };
      case "info":
        return {
          containerCls: "bg-blue-50 text-blue-600 border-blue-100",
          btnCls: "bg-blue-600 hover:bg-blue-500 shadow-blue-900/10",
          icon: <Info size={22} strokeWidth={2.5} />
        };
      case "danger":
      default:
        return {
          containerCls: "bg-amber-50 text-amber-600 border-amber-100",
          btnCls: "bg-amber-600 hover:bg-amber-500 shadow-amber-900/10",
          icon: <AlertTriangle size={22} strokeWidth={2.5} />
        };
    }
  };

  const estilos = getEstilosTipo();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay con desenfoque de fondo */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      {/* Tarjeta del Modal centrada y responsiva */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-blue-100/80 animate-in fade-in zoom-in-95 duration-200">
        
        <div className="p-6">
          {/* Contenedor del Icono Dinámico */}
          <div className={`w-12 h-12 rounded-xl mb-4 flex items-center justify-center border transition-colors ${estilos.containerCls}`}>
            {estilos.icon}
          </div>

          {/* Textos Informativos */}
          <h3 className="text-lg font-black text-slate-900 tracking-tight">{titulo}</h3>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">{mensaje}</p>
        </div>
        
        {/* Footer del Modal adaptable a dispositivos móviles */}
        <div className="bg-slate-50/80 border-t border-blue-50/40 px-6 py-4 flex flex-col sm:flex-row-reverse gap-2">
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className={`px-4 py-2 text-sm font-bold rounded-xl text-white transition-all active:scale-95 shadow-md ${estilos.btnCls}`}
          >
            Confirmar
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200/70 hover:text-slate-800 rounded-xl transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}