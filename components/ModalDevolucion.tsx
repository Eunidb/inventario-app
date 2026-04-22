/**
 * @file components/ModalDevolucion.tsx
 * @description Modal para registrar la devolución total o parcial de un préstamo.
 */
"use client";

import { useState } from "react";
import { createClient } from "@/lib/client";
import { X, CornerDownLeft, Loader2, CheckCircle2 } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  prestamo: any | null;
  onSaved: () => void;
}

export default function ModalDevolucion({ isOpen, onClose, prestamo, onSaved }: Props) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  // Estado local de cantidades a devolver por línea
  const [devoluciones, setDevoluciones] = useState<Record<number, number>>({});

  if (!isOpen || !prestamo) return null;

  const lineas: any[] = prestamo.detalle_prestamo ?? [];
  const pendientes = lineas.filter(l => l.cantidad_devuelta < l.cantidad);

  const maxDevolver = (l: any) => l.cantidad - l.cantidad_devuelta;

  const getCantidad = (l: any) =>
    devoluciones[l.id] !== undefined ? devoluciones[l.id] : maxDevolver(l);

  const setCantidad = (id: number, val: number, max: number) => {
    setDevoluciones(prev => ({ ...prev, [id]: Math.min(Math.max(0, val), max) }));
  };

  const handleSubmit = async () => {
    const devolver = pendientes.filter(l => getCantidad(l) > 0);
    if (devolver.length === 0) { alert("Indica al menos una devolución mayor a 0."); return; }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    for (const l of devolver) {
      const nuevaDevuelta = l.cantidad_devuelta + getCantidad(l);
      const { error } = await supabase
        .from("detalle_prestamo")
        .update({ cantidad_devuelta: nuevaDevuelta })
        .eq("id", l.id);

      if (error) { alert("Error: " + error.message); setLoading(false); return; }

      // Historial
      await supabase.from("historial_inventario").insert({
        inventario_id: l.inventario_id,
        usuario_id: user!.id,
        tipo_movimiento: "devolucion",
        cantidad: getCantidad(l),
        prestamo_id: prestamo.id,
        observaciones: `Devolución préstamo #${prestamo.id}`,
      });
    }

    // Verificar si todo fue devuelto
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

    setLoading(false);
    setDevoluciones({});
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600 rounded-xl text-white">
              <CornerDownLeft size={18} />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-800">Registrar Devolución</h2>
              <p className="text-xs text-slate-400">Préstamo #{prestamo.id} · {prestamo.usuarios?.nombre_completo ?? prestamo.solicitante_externo}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
          {pendientes.length === 0 ? (
            <div className="py-8 text-center">
              <CheckCircle2 size={40} className="text-emerald-400 mx-auto mb-3" />
              <p className="text-slate-600 font-bold">Todo ha sido devuelto</p>
            </div>
          ) : pendientes.map((l: any) => {
            const max = maxDevolver(l);
            const cant = getCantidad(l);
            return (
              <div key={l.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">{l.inventario?.nombre}</p>
                  <p className="text-[11px] text-slate-400 font-mono">{l.inventario?.clave}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Prestado: {l.cantidad} · Ya devuelto: {l.cantidad_devuelta} · <span className="text-amber-600 font-bold">Pendiente: {max}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button type="button" onClick={() => setCantidad(l.id, cant - 1, max)}
                    className="w-8 h-8 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-lg transition-colors flex items-center justify-center">−</button>
                  <span className="w-8 text-center text-sm font-black text-slate-800">{cant}</span>
                  <button type="button" onClick={() => setCantidad(l.id, cant + 1, max)}
                    className="w-8 h-8 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-lg transition-colors flex items-center justify-center">+</button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
          <button onClick={onClose} className="px-5 py-2.5 text-slate-500 font-bold text-sm hover:text-slate-700 transition-colors">
            Cancelar
          </button>
          {pendientes.length > 0 && (
            <button onClick={handleSubmit} disabled={loading}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-emerald-200 disabled:opacity-60 transition-all">
              {loading ? <Loader2 size={15} className="animate-spin" /> : <CornerDownLeft size={15} />}
              {loading ? "Guardando..." : "Confirmar Devolución"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}