import React from "react";

// ---------------------------------------------------------------------------
// Tipos de props
// ---------------------------------------------------------------------------
interface StatsCardProps {
  /** Título descriptivo de la métrica */
  title: string;
  /** Valor principal a mostrar (número o texto) */
  value: string | number;
  /** Ícono SVG como elemento React */
  icon: React.ReactNode;
  /** Color de fondo del ícono: 'blue' | 'green' | 'amber' | 'red' */
  iconColor?: "blue" | "green" | "amber" | "red" | "purple";
  /** Texto adicional (ej: "3 artículos bajo mínimo") */
  subtitle?: string;
  /** Cambio porcentual para mostrar tendencia */
  trend?: number;
  /** Indica si se está cargando la información */
  isLoading?: boolean;
}

// ---------------------------------------------------------------------------
// Mapa de colores para el ícono
// ---------------------------------------------------------------------------
const colorMap = {
  blue:   "bg-blue-100 text-blue-600",
  green:  "bg-emerald-100 text-emerald-600",
  amber:  "bg-amber-100 text-amber-600",
  red:    "bg-red-100 text-red-600",
  purple: "bg-purple-100 text-purple-600",
};

// ---------------------------------------------------------------------------
// Componente StatsCard
// ---------------------------------------------------------------------------
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
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        {/* Ícono */}
        <div className={`p-2.5 rounded-lg ${colorMap[iconColor]}`}>
          {icon}
        </div>

        {/* Tendencia (opcional) */}
        {trend !== undefined && !isLoading && (
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              trend >= 0
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {trend >= 0 ? "+" : ""}{trend}%
          </span>
        )}
      </div>

      {/* Contenido */}
      <div className="mt-4">
        {isLoading ? (
          /* Esqueleto de carga */
          <>
            <div className="h-8 w-20 bg-gray-100 rounded animate-pulse mb-2" />
            <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
          </>
        ) : (
          <>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{title}</p>
            {subtitle && (
              <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}