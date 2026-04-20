import React from 'react';

interface Props {
  title: string;
  count: number;
  icon: React.ReactNode;
  className?: string;
  color?: string; // Añadimos esto para que coincida con el Dashboard
}

export default function StatsCard({ title, count, icon, className = "", color = "bg-slate-50" }: Props) {
  return (
    <div className={`bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-5 transition-all duration-300 hover:shadow-md relative overflow-hidden group ${className}`}>
      
      {/* Contenedor del Icono Principal */}
      {/* He cambiado el bg-slate-50 por la prop {color} para mayor dinamismo */}
      <div className={`flex-shrink-0 w-14 h-14 flex items-center justify-center ${color} rounded-2xl text-slate-600 transition-all duration-300 group-hover:bg-blue-600 group-hover:text-white z-10`}>
        {icon}
      </div>

      {/* Información */}
      <div className="flex flex-col z-10">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">
          {title}
        </span>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-black text-slate-900 tabular-nums">
            {count}
          </span>
        </div>
      </div>

      {/* Decoración sutil de fondo */}
      <div className="absolute -right-2 -bottom-2 opacity-[0.05] text-slate-900 pointer-events-none group-hover:scale-110 transition-transform duration-500">
        {React.isValidElement(icon) ? 
          React.cloneElement(icon as React.ReactElement<any>, { 
            size: 80,
            strokeWidth: 2 
          }) 
          : null
        }
      </div>
    </div>
  );
}