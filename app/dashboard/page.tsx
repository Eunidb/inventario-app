interface Props {
  title: string;
  count: number;
  icon: React.ReactNode;
  className?: string; // Permitimos estilos extra como bordes de colores
}

export default function StatsCard({ title, count, icon, className = "" }: Props) {
  return (
    <div className={`bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5 transition-all duration-300 hover:shadow-md ${className}`}>
      
  
      <div className="flex-shrink-0 w-14 h-14 flex items-center justify-center bg-slate-50 rounded-2xl text-gray-600 transition-colors group-hover:bg-white">
        {icon}
      </div>

      {/* Información */}
      <div className="flex flex-col">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] mb-1">
          {title}
        </span>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-black text-gray-900 tabular-nums">
            {count}
          </span>
          {/* Opcional: podrías añadir un pequeño "unidades" o "registros" aquí */}
        </div>
      </div>

      {/* Decoración sutil de fondo (opcional) */}
      <div className="absolute right-0 bottom-0 opacity-[0.03] pointer-events-none">
        {icon}
      </div>
    </div>
  )
}