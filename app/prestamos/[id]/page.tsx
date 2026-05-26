/**
 * @file app/prestamos/[id]/page.tsx
 * @description Detalle extendido de préstamos individuales adaptado a la línea gráfica azul.
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
  Tag
} from "lucide-react";

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

  if (loading || !prestamo) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 lg:ml-64 p-4 md:p-10">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Fila superior de navegación */}
          <div className="flex justify-between items-center print:hidden">
            <button 
              onClick={() => router.back()}
              className="flex items-center gap-2 text-blue-900 hover:text-blue-700 font-bold text-sm transition-colors"
            >
              <ArrowLeft size={16} /> Volver al listado
            </button>

            <button 
              onClick={() => window.print()}
              className="flex items-center gap-2 bg-blue-900 hover:bg-blue-950 text-white px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md"
            >
              <Printer size={15} /> Imprimir Comprobante
            </button>
          </div>

          {/* Tarjeta de información principal */}
          <div className="bg-white rounded-3xl shadow-xl border border-blue-50 p-6 md:p-10 space-y-8 print:shadow-none print:border-none">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-blue-50 pb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-50 rounded-2xl text-blue-600 border border-blue-100">
                  <Hash size={24} />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-blue-950 tracking-tight">
                    Préstamo de Material #{prestamo.id}
                  </h1>
                  <p className="text-xs font-medium text-slate-400 mt-0.5">ID Único de Seguimiento de Auditoría</p>
                </div>
              </div>
              <div className="sm:text-right">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-black uppercase tracking-wider">
                  <Tag size={12} /> {prestamo.estado}
                </span>
              </div>
            </div>

            {/* Bloque Personal Responsable */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50/30 p-4 rounded-2xl border border-blue-50 text-xs">
                <p className="font-bold text-blue-400 uppercase tracking-wider text-[10px] flex items-center gap-1 mb-2">
                  <User size={13} className="text-blue-500" /> Colaborador Solicitante
                </p>
                <p className="font-bold text-blue-950 text-sm">
                  {prestamo.solicitante_externo || prestamo.usuario?.nombre_completo || "—"}
                </p>
                <p className="text-slate-500 mt-0.5 font-medium">{prestamo.departamento?.nombre ?? "Departamento no asignado"}</p>
              </div>

              <div className="bg-blue-50/30 p-4 rounded-2xl border border-blue-50 text-xs">
                <p className="font-bold text-blue-400 uppercase tracking-wider text-[10px] flex items-center gap-1 mb-2">
                  <ShieldCheck size={13} className="text-blue-500" /> Autorización Interna
                </p>
                <p className="font-bold text-blue-950 text-sm flex items-center gap-1.5">
                  {prestamo.autorizador?.nombre_completo ?? "Validación automática de sistema"}
                </p>
                <p className="text-slate-500 mt-0.5 font-medium">Laboratorios Pier S.A.</p>
              </div>
            </div>

            {/* Listado de Artículos */}
            <div className="space-y-3">
              <p className="font-bold text-blue-900 text-xs uppercase tracking-wider flex items-center gap-1">
                <Layers size={14} /> Artículos bajo resguardo custodio
              </p>
              <div className="space-y-2">
                {prestamo.detalle_prestamo?.map((d: any, i: number) => (
                  <div key={i} className="border border-blue-50 bg-blue-50/10 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex gap-3 items-start">
                      <div className="p-2 bg-white rounded-xl border border-blue-100 text-blue-600 shrink-0 mt-0.5">
                        <Package size={16} />
                      </div>
                      <div>
                        <p className="font-bold text-blue-950 text-sm">{d.inventario?.nombre}</p>
                        <p className="text-xs font-mono font-bold text-blue-600 mt-0.5">Clave: {d.inventario?.clave}</p>
                        {d.inventario?.descripcion && (
                          <p className="text-xs text-slate-500 mt-1 italic">{d.inventario.descripcion}</p>
                        )}
                      </div>
                    </div>
                    <span className="text-xs font-black bg-white px-3 py-1.5 rounded-xl border border-blue-100 text-blue-900 shadow-sm whitespace-nowrap">
                      Cantidad: {d.cantidad} ud.
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Observaciones complementarias */}
            {prestamo.observaciones && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
                <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px] flex items-center gap-1 mb-1">
                  <FileText size={13} /> Notas aclaratorias de la bitácora
                </p>
                <p className="text-slate-600 italic">"{prestamo.observaciones}"</p>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}