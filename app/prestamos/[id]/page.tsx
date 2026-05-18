"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/client";
import Sidebar from "@/components/sidebar";
import { 
  ArrowLeft, 
  Printer, 
  ShieldCheck
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
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 lg:ml-64 p-4 md:p-10">
        <div className="max-w-4xl mx-auto">
          
          {/* Acciones */}
          <div className="flex justify-between items-center mb-8">
            <button 
              onClick={() => router.back()}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold"
            >
              <ArrowLeft size={20} /> Volver
            </button>

            <button 
              onClick={() => window.print()}
              className="flex items-center gap-2 bg-slate-800 text-white px-6 py-3 rounded-2xl font-black text-xs"
            >
              <Printer size={18} /> Imprimir
            </button>
          </div>

          {/* Card */}
          <div className="bg-white rounded-3xl shadow-xl border p-10 space-y-8">
            <div>
              <h1 className="text-2xl font-black">
                Préstamo #{prestamo.id}
              </h1>
              <p className="text-sm text-slate-400 uppercase tracking-wider mt-1">{prestamo.estado}</p>
            </div>

            {/* Personas */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-slate-400">Solicitante</p>
                <p className="font-bold text-slate-800 mt-1">
                  {prestamo.solicitante_externo || prestamo.usuario?.nombre_completo}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-400">Autorizador</p>
                <p className="flex items-center gap-2 font-bold text-slate-800 mt-1">
                  <ShieldCheck size={16} className="text-blue-500" />
                  {prestamo.autorizador?.nombre_completo}
                </p>
              </div>
            </div>

            {/* Artículos */}
            <div>
              <p className="text-xs text-slate-400 mb-3">Artículos Prestados</p>
              <ul className="space-y-2">
                {prestamo.detalle_prestamo?.map((d: any, i: number) => (
                  <li key={i} className="border border-slate-100 bg-slate-50/50 p-4 rounded-xl flex justify-between items-start">
                    <div>
                      <p className="font-bold text-slate-800">{d.inventario?.nombre}</p>
                      <p className="text-xs text-slate-400 mt-0.5">Clave: {d.inventario?.clave}</p>
                      {d.inventario?.descripcion && (
                        <p className="text-xs text-slate-500 mt-1 italic">{d.inventario.descripcion}</p>
                      )}
                    </div>
                    <span className="text-sm font-black bg-white px-3 py-1 rounded-lg border text-slate-700 shadow-sm">
                      Cant: {d.cantidad}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}