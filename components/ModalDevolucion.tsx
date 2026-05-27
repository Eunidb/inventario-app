/**
 * @file components/ModalDevolucion.tsx
 * @description Modal para registrar la devolución de artículos de un préstamo.
 */

"use client";

import { useState } from "react";
import { createClient } from "@/lib/client";
import { X, CornerDownLeft, Loader2, CheckCircle2, Box } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  prestamo: any | null;
  onSaved: () => void;
}

export default function ModalDevolucion({ isOpen, onClose, prestamo, onSaved }: Props) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [devoluciones, setDevoluciones] = useState<Record<number, number>>({});

  if (!isOpen || !prestamo) return null;

  const lineas: any[] = prestamo.detalle_prestamo ?? [];
  const pendientes = lineas.filter(l => l.cantidad_devuelta < l.cantidad);

  const maxDevolver = (l: any) => l.cantidad - l.cantidad_devuelta;
  const getCantidad = (l: any) => devoluciones[l.id] !== undefined ? devoluciones[l.id] : maxDevolver(l);

  const setCantidad = (id: number, val: number, max: number) => {
    setDevoluciones(prev => ({ ...prev, [id]: Math.min(Math.max(0, val), max) }));
  };

  const handleSubmit = async () => {
    const devolver = pendientes.filter(l => getCantidad(l) > 0);
    if (devolver.length === 0) { alert("Indica al menos una devolución mayor a 0."); return; }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      for (const l of devolver) {
        const nuevaDevuelta = l.cantidad_devuelta + getCantidad(l);
        const { error } = await supabase
          .from("detalle_prestamo")
          .update({ cantidad_devuelta: nuevaDevuelta })
          .eq("id", l.id);

        if (error) throw error;

        await supabase.from("historial_inventario").insert({
          inventario_id: l.inventario_id,
          usuario_id: user!.id,
          tipo_movimiento: "devolucion",
          cantidad: getCantidad(l),
          prestamo_id: prestamo.id,
          observaciones: `Devolución préstamo #${prestamo.id}`,
        });
      }

      const todasDevueltas = lineas.every(l => {
        const yaDevuelta = l.cantidad_devuelta + (getCantidad(l) || 0);
        return yaDevuelta >= l.cantidad;
      });

      if (todasDevueltas) {
        await supabase
          .from("prestamos")
          .update({ estado: "devuelto", fecha_devolucion: new Date().toISOString() })
          .eq("id", prestamo.id);
      }

      setDevoluciones({});
      onSaved();
      onClose();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh] animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-100 bg-blue-50/40">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 bg-blue-600 rounded-xl text-white flex-shrink-0">
              <CornerDownLeft size={18} />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-black text-slate-800 tracking-tight">Registrar Devolución</h2>
              <p className="text-xs text-slate-400 truncate mt-0.5">
                Préstamo #{prestamo.id} · {prestamo.usuarios?.nombre_completo ?? prestamo.solicitante_externo}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex-shrink-0 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Contenido con Scroll responsivo */}
        <div className="p-5 sm:p-6 space-y-3 overflow-y-auto flex-1 custom-scrollbar">
          {pendientes.length === 0 ? (
            <div className="py-10 text-center">
              <CheckCircle2 size={44} className="text-blue-500 mx-auto mb-3 animate-bounce" />
              <p className="text-slate-700 font-bold text-sm">Todo el material ha sido devuelto con éxito</p>
            </div>
          ) : pendientes.map((l: any) => {
            const max = maxDevolver(l);
            const cant = getCantidad(l);
            return (
              <div key={l.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/60">
                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Box size={14} className="text-blue-500 flex-shrink-0" />
                    <p className="text-sm font-bold text-slate-800 truncate">{l.inventario?.nombre}</p>
                  </div>
                  <p className="text-[10px] font-mono text-slate-400">{l.inventario?.clave}</p>
                  <p className="text-[11px] text-slate-500 pt-0.5">
                    Entregado: {l.cantidad} · Devuelto: {l.cantidad_devuelta} · <span className="text-blue-600 font-bold">Pendiente: {max}</span>
                  </p>
                </div>
                
                {/* Controles de Contador */}
                <div className="flex items-center justify-end gap-2.5 self-end sm:self-center bg-white px-2 py-1.5 rounded-xl border border-slate-200 shadow-sm flex-shrink-0">
                  <button type="button" onClick={() => setCantidad(l.id, cant - 1, max)}
                    className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-bold text-base transition-colors flex items-center justify-center">−</button>
                  <span className="w-6 text-center text-xs font-black text-slate-800">{cant}</span>
                  <button type="button" onClick={() => setCantidad(l.id, cant + 1, max)}
                    className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-bold text-base transition-colors flex items-center justify-center">+</button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 flex justify-end gap-2 bg-slate-50">
          <button onClick={onClose} className="px-4 py-2.5 text-slate-500 font-bold text-xs uppercase tracking-wider hover:text-slate-700 transition-colors rounded-lg">
            Cancelar
          </button>
          {pendientes.length > 0 && (
            <button onClick={handleSubmit} disabled={loading}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-100 disabled:opacity-60 transition-all w-full sm:w-auto">
              {loading ? <Loader2 size={14} className="animate-spin" /> : <CornerDownLeft size={14} />}
              {loading ? "Procesando..." : "Confirmar Entrega"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}