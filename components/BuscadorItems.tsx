/**
 * @file components/BuscadorItems.tsx
 * @description Buscador responsivo en tonos azules con botón dinámico de limpieza rápida (X).
 */

"use client";

import React from "react";
import { Search, X } from "lucide-react";

interface BuscadorItemsProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export default function BuscadorItems({
  value,
  onChange,
  placeholder = "Buscar artículos por nombre, clave o marca..."
}: BuscadorItemsProps) {
  
  const handleClear = () => {
    onChange("");
  };

  return (
    <div className="w-full max-w-xl mx-auto p-2">
      <div className="relative flex items-center group">
        {/* Icono de Lupa Decorativo */}
        <div className="absolute left-4 text-blue-500/70 group-focus-within:text-blue-600 transition-colors pointer-events-none">
          <Search size={18} strokeWidth={2.5} />
        </div>

        {/* Input con enfoque y bordes azulados */}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-11 pr-11 py-3 bg-white text-slate-800 placeholder-slate-400 font-medium text-sm rounded-2xl border border-blue-100 shadow-sm shadow-blue-100/30 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200"
        />

        {/* Botón dinámico X para borrar todo de una vez */}
        {value.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 p-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-400 hover:text-blue-600 border border-transparent hover:border-blue-100 transition-all duration-150 active:scale-90"
            title="Borrar búsqueda"
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        )}
      </div>
    </div>
  );
}