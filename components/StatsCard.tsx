import React from "react";
import { ArrowUpRight, ArrowDownRight, Loader2 } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  /* Añadimos "emerald" y tu color hexadecimal exacto a las opciones permitidas */
  iconColor?: "blue" | "green" | "amber" | "red" | "purple" | "emerald" | "#004091";
  subtitle?: string;
  trend?: number;
  isLoading?: boolean;
}

const colorMap = {
  blue:      "bg-blue-50 text-blue-600 border-blue-100",
  green:     "bg-emerald-50 text-emerald-600 border-emerald-100", // Mantenemos compatibilidad si ya usabas green
  emerald:   "bg-emerald-50 text-emerald-600 border-emerald-100", // Añadido "emerald"
  amber:     "bg-amber-50 text-amber-600 border-amber-100",
  red:       "bg-red-50 text-red-600 border-red-100",
  purple:    "bg-purple-50 text-purple-600 border-purple-100",
  /* Añadimos tu azul personalizado usando clases arbitrarias de Tailwind */
  "#004091": "bg-[#004091]/10 text-[#004091] border-[#004091]/20", 
};

export default function StatsCard({
  title,
  value,
  icon,
  iconColor = "blue",
  subtitle,
  trend,
  isLoading = false,
}: StatsCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-all duration-200 group relative">
      <div className="flex items-start justify-between">
        <div className={`w-12 h-12 flex items-center justify-center rounded-xl border transition-transform group-hover:scale-105 duration-300 ${colorMap[iconColor]}`}>
          {/* CORRECCIÓN AQUÍ: Cast a any para permitir la prop 'size' */}
          {React.isValidElement(icon) 
            ? React.cloneElement(icon as React.ReactElement<any>, { size: 24 }) 
            : icon
          }
        </div>

        {trend !== undefined && !isLoading && (
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
              trend >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
            }`}>
            {trend >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>

      <div className="mt-5">
        {isLoading ? (
          <div className="space-y-3">
            <div className="h-8 w-24 bg-slate-100 rounded-lg animate-pulse" />
            <div className="h-4 w-32 bg-slate-50 rounded-md animate-pulse" />
          </div>
        ) : (
          <>
            <h3 className="text-3xl font-extrabold text-slate-800 tracking-tight">{value}</h3>
            <p className="text-sm font-semibold text-slate-500 mt-1 uppercase tracking-wider">{title}</p>
            {subtitle && (
              <div className="mt-3 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                <p className="text-xs font-medium text-slate-400">{subtitle}</p>
              </div>
            )}
          </>
        )}
      </div>

      {isLoading && (
        <div className="absolute top-4 right-4">
          <Loader2 className="w-4 h-4 text-slate-300 animate-spin" />
        </div>
      )}
    </div>
  );
}