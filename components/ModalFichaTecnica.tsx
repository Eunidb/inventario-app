/**
 * @file components/ModalFichaTecnica.tsx
 * @description Modal interactivo de Ficha Técnica detallada de un artículo, centrado, responsivo y en tonos azules.
 */

"use client";

import React, { useState, useRef } from "react";
import { X, Package, BarChart3, Hash, Tag, Info, Calendar, MapPin, Maximize2, Minimize2 } from "lucide-react";
import type { InventarioItem, EstadoInventarioEnum } from "@/lib/supabase";

// Estilos locales mapeados por estado para consistencia visual
const ESTADO_LABELS: Record<EstadoInventarioEnum, { label: string; cls: string; dot: string }> = {
  activo:        { label: "Activo",        cls: "bg-emerald-50 text-emerald-700 border-emerald-100", dot: "bg-emerald-500" },
  inactivo:      { label: "Inactivo",      cls: "bg-slate-100 text-slate-600 border-slate-200",      dot: "bg-slate-400" },
  en_reparacion: { label: "En reparación", cls: "bg-amber-50 text-amber-700 border-amber-100",       dot: "bg-amber-500" },
  mantenimiento: { label: "Mantenimiento", cls: "bg-blue-50 text-blue-700 border-blue-100",          dot: "bg-blue-500" },
  dado_de_baja:  { label: "Baja",          cls: "bg-rose-50 text-rose-700 border-rose-100",          dot: "bg-rose-500" },
};

interface ModalFichaTecnicaProps {
  item: InventarioItem;
  onClose: () => void;
  onEditar: () => void;
}

export default function ModalFichaTecnica({ item, onClose, onEditar }: ModalFichaTecnicaProps) {
  const est = ESTADO_LABELS[item.estado];
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomTransform, setZoomTransform] = useState("translate(0px, 0px) scale(1)");
  const containerRef = useRef<HTMLDivElement>(null);

  const fmtFecha = (f?: string) =>
    f ? new Date(f).toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" }) : "—";

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomTransform(`scale(1.4) translate(${(50 - x) * 0.3}%, ${(50 - y) * 0.3}%)`);
  };

  const handleMouseLeave = () => {
    setZoomTransform("translate(0px, 0px) scale(1)");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Overlay con blur */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      {/* Contenedor del Modal: Centrado, responsivo y con animaciones escaladas */}
      <div className="relative bg-white w-full max-w-2xl h-full max-h-[90vh] sm:h-auto flex flex-col rounded-2xl shadow-2xl overflow-hidden border border-blue-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Botones flotantes superiores */}
        <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
          <span className="font-mono text-xs font-black text-blue-100 bg-blue-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg pointer-events-auto shadow-md border border-blue-800/50">
            {item.clave}
          </span>
          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              onClick={onEditar}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-all active:scale-95 shadow-md shadow-blue-900/20"
            >
              Editar
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-blue-950/70 hover:bg-blue-950/90 text-white backdrop-blur-md transition-all active:scale-95 shadow-md border border-blue-800/30"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Contenido scrolleable internamente si desborda */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          
          {/* Vista de Imagen Interactiva con degradado azul profundo */}
          <div 
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="w-full bg-gradient-to-b from-blue-950 to-slate-950 relative aspect-[4/3] sm:aspect-video flex items-center justify-center overflow-hidden border-b border-blue-900/20 group select-none"
          >
            {item.imagen_url ? (
              <>
                <img 
                  src={item.imagen_url} 
                  alt={item.nombre} 
                  style={{ transform: zoomTransform }}
                  className={`w-full h-full transition-transform duration-75 ease-out cursor-zoom-in ${
                    isFullscreen ? "object-cover" : "object-contain"
                  } max-h-[350px]`} 
                />
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="absolute bottom-4 right-4 p-2 rounded-xl bg-blue-950/60 hover:bg-blue-950/80 text-white/90 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg border border-blue-700/30"
                >
                  {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 text-blue-400 py-12">
                <div className="p-4 rounded-full bg-blue-900/30 border border-blue-800/50">
                  <Package size={40} className="text-blue-400" />
                </div>
                <span className="text-xs font-semibold text-blue-300 tracking-wide">Sin imagen disponible</span>
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-blue-950/50 to-transparent pointer-events-none" />
          </div>

          {/* Header de Datos Principales en Tonos Azules */}
          <div className="bg-gradient-to-br from-blue-900 via-blue-950 to-slate-950 p-6 text-white border-b border-blue-900">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-black text-white leading-tight tracking-tight">{item.nombre}</h2>
              {item.marca && (
                <p className="text-sm text-blue-300 font-medium mt-2 flex items-center gap-1.5">
                  <span className="text-blue-400">■</span> {item.marca}{item.modelo ? ` · ${item.modelo}` : ""}
                </p>
              )}
              <div className="mt-4">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-bold border backdrop-blur-sm ${est?.cls}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${est?.dot} animate-pulse`} />
                  {est?.label}
                </span>
              </div>
            </div>
          </div>

          {/* Secciones de Información con acentos Azules */}
          <div className="p-6 space-y-6 bg-slate-50/50">
            <Section icon={<BarChart3 size={15} />} titulo="Control de Stock">
              <div className="grid grid-cols-3 gap-3">
                <StockCard label="Disponible" value={item.stock_disponible} highlight={item.stock_disponible <= item.stock_minimo} />
                <StockCard label="Total" value={item.stock_total} />
                <StockCard label="Mínimo" value={item.stock_minimo} dimmed />
              </div>
              {item.unidad_medida && <Campo label="Unidad de medida" valor={item.unidad_medida} />}
            </Section>

            <Section icon={<Hash size={15} />} titulo="Identificación">
              <Campo label="Clave" valor={item.clave} mono />
              {item.marca && <Campo label="Marca" valor={item.marca} />}
              {item.modelo && <Campo label="Modelo" valor={item.modelo} />}
              {item.numero_serie && <Campo label="Número de serie" valor={item.numero_serie} mono />}
            </Section>

            <Section icon={<Tag size={15} />} titulo="Clasificación">
              <Campo label="Categoría" valor={(item.categorias as any)?.nombre ?? "Sin categoría"} />
              <Campo label="Departamento" valor={(item.departamentos as any)?.nombre ?? "Sin departamento"} />
              {item.ubicacion && <Campo label="Ubicación" valor={item.ubicacion} icon={<MapPin size={12} />} />}
            </Section>

            {item.descripcion && (
              <Section icon={<Info size={15} />} titulo="Descripción">
                <p className="text-sm text-slate-600 leading-relaxed">{item.descripcion}</p>
              </Section>
            )}

            <Section icon={<Calendar size={15} />} titulo="Registro">
              <Campo label="Fecha de alta" valor={fmtFecha(item.fecha_creacion)} />
              <Campo label="Última actualización" valor={fmtFecha(item.updated_at)} />
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-componentes Atómicos Locales (Actualizados con bordes y acentos azulados discretos)
function Section({ icon, titulo, children }: { icon: React.ReactNode; titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-blue-600">{icon}</span>
        <p className="text-[10px] font-black text-blue-500/80 uppercase tracking-widest">{titulo}</p>
      </div>
      <div className="bg-white rounded-2xl border border-blue-100/60 p-4 space-y-3 shadow-sm">{children}</div>
    </div>
  );
}

function Campo({ label, valor, mono = false, icon }: { label: string; valor: string | number; mono?: boolean; icon?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide flex-shrink-0">{label}</p>
      <p className={`text-sm font-semibold text-slate-700 text-right flex items-center gap-1 ${mono ? "font-mono text-blue-700" : ""}`}>
        {icon && <span className="text-blue-500">{icon}</span>}
        {valor}
      </p>
    </div>
  );
}

function StockCard({ label, value, highlight = false, dimmed = false }: { label: string; value: number; highlight?: boolean; dimmed?: boolean }) {
  return (
    <div className={`rounded-xl p-3 text-center border transition-all ${
      highlight 
        ? "bg-red-50 border-red-200 shadow-sm shadow-red-100" 
        : "bg-blue-50/30 border-blue-100/70 hover:border-blue-200"
    }`}>
      <p className={`text-2xl font-black leading-none ${highlight ? "text-red-600" : dimmed ? "text-slate-400" : "text-blue-900"}`}>{value}</p>
      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mt-1.5">{label}</p>
    </div>
  );
}