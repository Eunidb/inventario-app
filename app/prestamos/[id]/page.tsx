/**
 * @file app/prestamos/[id]/page.tsx
 * @description Detalle extendido de préstamos individuales adaptado a la línea gráfica azul institucional.
 */
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/client";
import Sidebar from "@/components/sidebar";
import { 
  ArrowLeft, 
  Printer, 
  ShieldCheck,
  Package,
  FileText,
  User,
  Layers,
  Hash,
  Tag,
  Calendar
} from "lucide-react";

// Mapeo corporativo de estados del préstamo para mantener la consistencia premium
const ESTADO_PRESTAMO_STYLES: Record<string, { label: string; cls: string }> = {
  activo: { label: "En Curso / Activo", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  pendiente: { label: "Por Autorizar", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  devuelto: { label: "Devuelto / Finalizado", cls: "bg-slate-100 text-slate-600 border-slate-200" },
  vencido: { label: "Vencido / Demora", cls: "bg-rose-50 text-rose-700 border-rose-200" },
};

export default function DetallePrestamoPage() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClient();

  const [prestamo, setPrestamo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function cargarDetalle() {
      try {
        const idStr = Array.isArray(id) ? id[0] : id;

        const { data, error } = await supabase
          .from("prestamos")
          .select(`
            *,
            usuario:usuarios!prestamos_usuario_id_fkey(nombre_completo),
            autorizador:usuarios!prestamos_created_by_fkey(nombre_completo),
            departamento:departamentos!prestamos_departamento_id_fkey(nombre),
            detalle_prestamo (
              cantidad,
              inventario:inventario_id!detalle_prestamo_inventario_id_fkey (
                nombre, clave, descripcion
              )
            )
          `)
          .eq("id", idStr)
          .single();

        if (error) throw error;
        setPrestamo(data);
      } catch (err) {
        console.error("Error cargando detalle:", err);
      } finally {
        setLoading(false);
      }
    }

    if (id) cargarDetalle();
  }, [id, supabase]);

  // Formateador formal de fechas de auditoría
  const formatFecha = (fechaStr: string) => {
    if (!fechaStr) return "—";
    return new Date(fechaStr).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading || !prestamo) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          {/* Spinner ajustado al color de interacción de alto contraste */}
          <div className="animate-spin w-9 h-9 border-4 border-[#014ba0] border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  // Obtener estilo del estado actual o fallback elegante en azul institucional
  const statusConfig = ESTADO_PRESTAMO_STYLES[prestamo.estado?.toLowerCase()] || {
    label: prestamo.estado || "Desconocido",
    cls: "bg-[#004091]/10 text-[#004091] border-[#004091]/20",
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 lg:ml-64 p-4 md:p-10 print:ml-0 print:p-0">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Fila superior de navegación - Oculta fluidamente al imprimir */}
          <div className="flex justify-between items-center print:hidden">
            <button 
              onClick={() => router.back()}
              className="flex items-center gap-2 text-[#004091] hover:text-[#014ba0] font-bold text-sm transition-all duration-300 ease-in-out hover:-translate-x-1"
            >
              <ArrowLeft size={16} /> Volver al listado
            </button>

            <button 
              onClick={() => window.print()}
              className="flex items-center gap-2 bg-[#004091] hover:bg-[#014ba0] text-white px-5 py-2.5 rounded-xl font-bold text-xs transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-lg shadow-md"
            >
              <Printer size={15} /> Imprimir Comprobante
            </button>
          </div>

          {/* Tarjeta de información principal de resguardo */}
          <div className="bg-white rounded-3xl shadow-xl border border-[#004091]/5 p-6 md:p-10 space-y-8 print:shadow-none print:border-none print:p-0">
            
            {/* Encabezado Principal */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-[#004091]/5 rounded-2xl text-[#004091] border border-[#004091]/10">
                  <Hash size={24} />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                    Préstamo de Material #{prestamo.id}
                  </h1>
                  <p className="text-xs font-medium text-slate-400 mt-0.5 tracking-wide">ID Único de Seguimiento de Auditoría</p>
                </div>
              </div>
              <div className="sm:text-right">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-xl text-xs font-black uppercase tracking-wider ${statusConfig.cls}`}>
                  <Tag size={12} /> {statusConfig.label}
                </span>
              </div>
            </div>

            {/* Bloque de Tiempos y Fechas Formales */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-slate-50 pb-6">
              <div className="flex items-center gap-3 text-xs text-slate-600">
                <Calendar size={16} className="text-[#004091]" />
                <div>
                  <p className="font-bold text-slate-400 uppercase text-[9px] tracking-wider">Fecha de Entrega / Salida</p>
                  <p className="font-semibold text-slate-800 mt-0.5">{formatFecha(prestamo.fecha_salida || prestamo.created_at)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-600">
                <Calendar size={16} className="text-[#014ba0]" />
                <div>
                  <p className="font-bold text-slate-400 uppercase text-[9px] tracking-wider">Fecha Compromiso de Devolución</p>
                  <p className="font-semibold text-slate-800 mt-0.5">
                    {prestamo.fecha_devolucion ? formatFecha(prestamo.fecha_devolucion) : "Abierto / Sin fecha límite"}
                  </p>
                </div>
              </div>
            </div>

            {/* Bloque Personal Responsable */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#004091]/5 p-5 rounded-2xl border border-[#004091]/10 text-xs transition-all duration-300 hover:bg-[#004091]/10">
                <p className="font-bold text-[#004091] uppercase tracking-wider text-[10px] flex items-center gap-1.5 mb-2">
                  <User size={13} /> Colaborador Solicitante
                </p>
                <p className="font-black text-slate-900 text-sm">
                  {prestamo.solicitante_externo || prestamo.usuario?.nombre_completo || "—"}
                </p>
                <p className="text-slate-500 mt-1 font-medium">{prestamo.departamento?.nombre ?? "Departamento no asignado"}</p>
              </div>

              <div className="bg-[#004091]/5 p-5 rounded-2xl border border-[#004091]/10 text-xs transition-all duration-300 hover:bg-[#004091]/10">
                <p className="font-bold text-[#014ba0] uppercase tracking-wider text-[10px] flex items-center gap-1.5 mb-2">
                  <ShieldCheck size={13} /> Autorización Interna
                </p>
                <p className="font-black text-slate-900 text-sm">
                  {prestamo.autorizador?.nombre_completo ?? "Validación automática de sistema"}
                </p>
                <p className="text-slate-500 mt-1 font-medium">Laboratorios Pier S.A.</p>
              </div>
            </div>

            {/* Listado de Artículos Solicitados */}
            <div className="space-y-4">
              <p className="font-bold text-[#004091] text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Layers size={14} /> Artículos bajo resguardo custodio
              </p>
              <div className="space-y-3">
                {prestamo.detalle_prestamo?.map((d: any, i: number) => (
                  <div 
                    key={i} 
                    className="border border-slate-100 bg-slate-50/50 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all duration-300 hover:border-[#004091]/20 hover:bg-white"
                  >
                    <div className="flex gap-3 items-start">
                      <div className="p-2 bg-white rounded-xl border border-slate-200 text-[#004091] shrink-0 mt-0.5 shadow-sm">
                        <Package size={16} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{d.inventario?.nombre}</p>
                        <p className="text-xs font-mono font-bold text-[#014ba0] mt-0.5">Clave: {d.inventario?.clave}</p>
                        {d.inventario?.descripcion && (
                          <p className="text-xs text-slate-500 mt-1.5 italic bg-white px-2 py-1 rounded-lg border border-slate-100 inline-block">
                            {d.inventario.descripcion}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-xs font-black bg-white px-3 py-1.5 rounded-xl border border-[#004091]/10 text-[#004091] shadow-sm whitespace-nowrap self-stretch sm:self-auto text-center sm:text-left">
                      Cantidad: {d.cantidad} ud.
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Notas y Observaciones Complementarias */}
            {prestamo.observaciones && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 text-xs">
                <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px] flex items-center gap-1 mb-1.5">
                  <FileText size={13} /> Notas aclaratorias de la bitácora
                </p>
                <p className="text-slate-600 italic leading-relaxed">"{prestamo.observaciones}"</p>
              </div>
            )}

            {/* Firma formal de recibido - Solo visible al imprimir el PDF/Comprobante físico */}
            <div className="hidden print:flex justify-between items-center pt-16 mt-12 border-t border-dashed border-slate-300">
              <div className="text-center w-52">
                <div className="border-b border-slate-400 w-full h-8" />
                <p className="text-[10px] font-bold uppercase mt-2 text-slate-500">Firma Colaborador</p>
              </div>
              <div className="text-center w-52">
                <div className="border-b border-slate-400 w-full h-8" />
                <p className="text-[10px] font-bold uppercase mt-2 text-slate-500">Sello y Firma Control Interno</p>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}