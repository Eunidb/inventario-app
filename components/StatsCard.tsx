import React from "react";
import { ArrowUpRight, ArrowDownRight, Loader2 } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconColor?: "blue" | "green" | "amber" | "red" | "purple" | "emerald" | "#004091";
  subtitle?: string;
  trend?: number;
  isLoading?: boolean;
}

const colorMap = {
  blue:      "bg-blue-50 text-blue-600 border-blue-100",
  green:     "bg-emerald-50 text-emerald-600 border-emerald-100",
  emerald:   "bg-emerald-50 text-emerald-600 border-emerald-100",
  amber:     "bg-amber-50 text-amber-600 border-amber-100",
  red:       "bg-red-50 text-red-600 border-red-100",
  purple:    "bg-purple-50 text-purple-600 border-purple-100",
  /* Tu azul personalizado con transiciones fluidas */
  "#004091": "bg-[#014ba0]/10 text-[#014ba0] border-[#014ba0]/20 shadow-[0_4px_12px_-4px_rgba(1,75,160,0.2)]", 
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
    <div className="bg-white rounded-[1.5rem] border border-slate-100 p-6 shadow-sm hover:shadow-[0_8px_24px_-8px_rgba(1,75,160,0.15)] hover:-translate-y-1 transition-all duration-300 ease-out group relative overflow-hidden">
      {/* Detalle visual sutil de fondo */}
      <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-slate-50 to-transparent rounded-full opacity-50 transition-transform group-hover:scale-150 duration-500 ease-out" />

      <div className="flex items-start justify-between relative z-10">
        <div className={`w-14 h-14 flex items-center justify-center rounded-2xl border transition-all group-hover:scale-110 group-hover:rotate-3 duration-300 ease-out ${colorMap[iconColor]}`}>
          {React.isValidElement(icon) 
            ? React.cloneElement(icon as React.ReactElement<any>, { size: 26 }) 
            : icon
          }
        </div>

        {trend !== undefined && !isLoading && (
          <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm transition-all duration-300 ${
              trend >= 0 ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-red-50 text-red-600 border border-red-100"
            }`}>
            {trend >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>

      <div className="mt-6 relative z-10">
        {isLoading ? (
          <div className="space-y-3">
            <div className="h-9 w-28 bg-slate-100 rounded-xl animate-pulse" />
            <div className="h-4 w-36 bg-slate-50 rounded-lg animate-pulse" />
          </div>
        ) : (
          <>
            <h3 className="text-3xl font-black text-slate-800 tracking-tight">{value}</h3>
            <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">{title}</p>
            {subtitle && (
              <div className="mt-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#014ba0]/40"></span>
                <p className="text-xs font-semibold text-slate-400">{subtitle}</p>
              </div>
            )}
          </>
        )}
      </div>

      {isLoading && (
        <div className="absolute top-5 right-5">
          <Loader2 className="w-5 h-5 text-slate-300 animate-spin" />
        </div>
      )}
    </div>
  );
}