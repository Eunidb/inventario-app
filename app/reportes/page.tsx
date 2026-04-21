/**
 * @file app/reportes/page.tsx
 * @description Módulo de reportes del sistema de inventario.
 * Genera reportes del inventario actual y de movimientos históricos.
 * Exportación a PDF (imprimible) y Excel (xlsx).
 */

"use client";

import { useState } from "react";
import { createClient } from '@/lib/client'
import Sidebar from "@/components/sidebar";

// Cliente Supabase del navegador — instancia única por módulo
const supabase = createClient()


// ---------------------------------------------------------------------------
// Tipo de reporte disponible
// ---------------------------------------------------------------------------
type TipoReporte = "inventario" | "movimientos" | "prestamos";

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------
export default function ReportesPage() {
  const [tipoReporte, setTipoReporte]   = useState<TipoReporte>("inventario");
  const [fechaDesde, setFechaDesde]     = useState("");
  const [fechaHasta, setFechaHasta]     = useState("");
  const [soloActivos, setSoloActivos]   = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [mensaje, setMensaje]           = useState<{ tipo: "ok" | "err"; texto: string } | null>(null);

  // -------------------------------------------------------------------------
  // Generar y descargar reporte en Excel (CSV compatible)
  // -------------------------------------------------------------------------
  const handleExportExcel = async () => {
    setIsGenerating(true);
    setMensaje(null);
    try {
      let csvContent = "";

      if (tipoReporte === "inventario") {
        // --- Reporte de inventario ---
        let q = supabase
          .from("inventario")
          .select(`*, categorias(nombre), departamentos(nombre)`)
          .order("nombre");

        if (soloActivos) q = q.eq("estado", "activo");

        const { data, error } = await q;
        if (error) throw error;

        const headers = ["Clave", "Nombre", "Descripción", "Marca", "Modelo", "Categoría", "Departamento",
          "Stock Total", "Stock Disponible", "Stock Mínimo", "Unidad", "Ubicación", "Estado"];

        const rows = (data ?? []).map((i) => [
          i.clave, i.nombre, i.descripcion ?? "", i.marca ?? "", i.modelo ?? "",
          (i.categorias as any)?.nombre ?? "", (i.departamentos as any)?.nombre ?? "",
          i.stock_total, i.stock_disponible, i.stock_minimo,
          i.unidad_medida ?? "", i.ubicacion ?? "", i.estado,
        ]);

        csvContent = [headers, ...rows]
          .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
          .join("\n");

      } else if (tipoReporte === "movimientos") {
        // --- Reporte de movimientos ---
        let q = supabase
          .from("historial_inventario")
          .select(`*, inventario(nombre, clave), usuarios(nombre_completo)`)
          .order("fecha", { ascending: false });

        if (fechaDesde) q = q.gte("fecha", new Date(fechaDesde).toISOString());
        if (fechaHasta) {
          const f = new Date(fechaHasta); f.setHours(23, 59, 59, 999);
          q = q.lte("fecha", f.toISOString());
        }

        const { data, error } = await q;
        if (error) throw error;

        const headers = ["Fecha", "Tipo Movimiento", "Artículo", "Clave", "Usuario",
          "Cantidad", "Stock Antes", "Stock Después", "Observaciones"];

        const rows = (data ?? []).map((m) => [
          new Date(m.fecha).toLocaleString("es-MX"),
          m.tipo_movimiento,
          (m.inventario as any)?.nombre ?? "",
          (m.inventario as any)?.clave ?? "",
          (m.usuarios as any)?.nombre_completo ?? "",
          m.cantidad, m.stock_antes ?? "", m.stock_despues ?? "",
          m.observaciones ?? "",
        ]);

        csvContent = [headers, ...rows]
          .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
          .join("\n");

      } else {
        // --- Reporte de préstamos ---
        let q = supabase
          .from("prestamos")
          .select(`
            *,
            usuarios!prestamos_usuario_id_fkey(nombre_completo),
            departamentos(nombre),
            detalle_prestamo(cantidad, estado, inventario(nombre, clave))
          `)
          .order("created_at", { ascending: false });

        if (fechaDesde) q = q.gte("fecha_salida", new Date(fechaDesde).toISOString());
        if (fechaHasta) {
          const f = new Date(fechaHasta); f.setHours(23, 59, 59, 999);
          q = q.lte("fecha_salida", f.toISOString());
        }

        const { data, error } = await q;
        if (error) throw error;

        const headers = ["ID", "Usuario", "Departamento", "Fecha Salida", "Fecha Devolución",
          "Estado", "Artículos", "Observaciones"];

        const rows = (data ?? []).map((p) => {
          const articulos = p.detalle_prestamo
            ?.map((d: any) => `${d.inventario?.nombre ?? "?"} (×${d.cantidad})`)
            .join("; ");
          return [
            p.id,
            (p.usuarios as any)?.nombre_completo ?? "",
            (p.departamentos as any)?.nombre ?? "",
            new Date(p.fecha_salida).toLocaleString("es-MX"),
            p.fecha_devolucion ? new Date(p.fecha_devolucion).toLocaleString("es-MX") : "",
            p.estado, articulos ?? "", p.observaciones ?? "",
          ];
        });

        csvContent = [headers, ...rows]
          .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
          .join("\n");
      }

      // Descargar el archivo CSV (compatible con Excel)
      const blob  = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url   = URL.createObjectURL(blob);
      const link  = document.createElement("a");
      const fecha = new Date().toISOString().split("T")[0];
      link.href     = url;
      link.download = `reporte_${tipoReporte}_${fecha}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      setMensaje({ tipo: "ok", texto: "Reporte descargado exitosamente." });
    } catch (err: any) {
      setMensaje({ tipo: "err", texto: err.message ?? "Error al generar el reporte." });
    } finally {
      setIsGenerating(false);
    }
  };

  // -------------------------------------------------------------------------
  // Generar reporte PDF (imprimible) — construye una página HTML y la imprime
  // -------------------------------------------------------------------------
  const handleExportPDF = async () => {
    setIsGenerating(true);
    setMensaje(null);
    try {
      let tableHTML = "";
      let titulo    = "";

      if (tipoReporte === "inventario") {
        titulo = "Reporte de Inventario";
        let q = supabase
          .from("inventario")
          .select(`*, categorias(nombre), departamentos(nombre)`)
          .order("nombre");
        if (soloActivos) q = q.eq("estado", "activo");
        const { data, error } = await q;
        if (error) throw error;

        tableHTML = `
          <table>
            <thead>
              <tr>
                <th>Clave</th><th>Nombre</th><th>Categoría</th>
                <th>Stock Total</th><th>Disponible</th><th>Mínimo</th>
                <th>Ubicación</th><th>Estado</th>
              </tr>
            </thead>
            <tbody>
              ${(data ?? []).map((i) => `
                <tr>
                  <td>${i.clave}</td>
                  <td>${i.nombre}</td>
                  <td>${(i.categorias as any)?.nombre ?? ""}</td>
                  <td class="num">${i.stock_total}</td>
                  <td class="num ${i.stock_disponible <= i.stock_minimo ? "alerta" : ""}">${i.stock_disponible}</td>
                  <td class="num">${i.stock_minimo}</td>
                  <td>${i.ubicacion ?? ""}</td>
                  <td><span class="badge">${i.estado}</span></td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        `;
      } else if (tipoReporte === "movimientos") {
        titulo = "Reporte de Movimientos";
        let q = supabase
          .from("historial_inventario")
          .select(`*, inventario(nombre, clave), usuarios(nombre_completo)`)
          .order("fecha", { ascending: false });
        if (fechaDesde) q = q.gte("fecha", new Date(fechaDesde).toISOString());
        if (fechaHasta) {
          const f = new Date(fechaHasta); f.setHours(23, 59, 59, 999);
          q = q.lte("fecha", f.toISOString());
        }
        const { data, error } = await q;
        if (error) throw error;

        tableHTML = `
          <table>
            <thead>
              <tr>
                <th>Fecha</th><th>Tipo</th><th>Artículo</th>
                <th>Usuario</th><th>Cantidad</th><th>Antes</th><th>Después</th>
              </tr>
            </thead>
            <tbody>
              ${(data ?? []).map((m) => `
                <tr>
                  <td>${new Date(m.fecha).toLocaleString("es-MX")}</td>
                  <td><span class="badge">${m.tipo_movimiento}</span></td>
                  <td>${(m.inventario as any)?.nombre ?? ""}</td>
                  <td>${(m.usuarios as any)?.nombre_completo ?? ""}</td>
                  <td class="num">${m.cantidad}</td>
                  <td class="num">${m.stock_antes ?? ""}</td>
                  <td class="num">${m.stock_despues ?? ""}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        `;
      } else {
        titulo = "Reporte de Préstamos";
        let q = supabase
          .from("prestamos")
          .select(`*, usuarios!prestamos_usuario_id_fkey(nombre_completo), departamentos(nombre), detalle_prestamo(cantidad, inventario(nombre))`)
          .order("created_at", { ascending: false });
        if (fechaDesde) q = q.gte("fecha_salida", new Date(fechaDesde).toISOString());
        if (fechaHasta) {
          const f = new Date(fechaHasta); f.setHours(23, 59, 59, 999);
          q = q.lte("fecha_salida", f.toISOString());
        }
        const { data, error } = await q;
        if (error) throw error;

        tableHTML = `
          <table>
            <thead>
              <tr>
                <th>#</th><th>Usuario</th><th>Dpto.</th>
                <th>Fecha Salida</th><th>Estado</th><th>Artículos</th>
              </tr>
            </thead>
            <tbody>
              ${(data ?? []).map((p) => `
                <tr>
                  <td>${p.id}</td>
                  <td>${(p.usuarios as any)?.nombre_completo ?? ""}</td>
                  <td>${(p.departamentos as any)?.nombre ?? ""}</td>
                  <td>${new Date(p.fecha_salida).toLocaleString("es-MX")}</td>
                  <td><span class="badge">${p.estado}</span></td>
                  <td>${p.detalle_prestamo?.map((d: any) => `${d.inventario?.nombre ?? "?"} ×${d.cantidad}`).join(", ") ?? ""}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        `;
      }

      // Construir la página de impresión
      const fecha = new Date().toLocaleDateString("es-MX", { dateStyle: "full" });
      const printHTML = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>${titulo}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #111; padding: 20px; }
    h1 { font-size: 16px; font-weight: bold; margin-bottom: 4px; color: #1e40af; }
    .meta { font-size: 10px; color: #6b7280; margin-bottom: 14px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th { background: #1e40af; color: white; padding: 6px 8px; text-align: left; font-size: 10px; font-weight: 600; }
    td { padding: 5px 8px; border-bottom: 1px solid #e5e7eb; }
    tr:nth-child(even) { background: #f8fafc; }
    .num { text-align: center; }
    .alerta { color: #dc2626; font-weight: bold; }
    .badge { background: #dbeafe; color: #1e40af; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 600; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <h1>${titulo}</h1>
  <p class="meta">Generado el ${fecha} · Sistema de Inventario InvControl</p>
  ${tableHTML}
</body>
</html>`;

      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(printHTML);
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 800);
      }

      setMensaje({ tipo: "ok", texto: "Ventana de impresión abierta. Elige 'Guardar como PDF' para descargar." });
    } catch (err: any) {
      setMensaje({ tipo: "err", texto: err.message ?? "Error al generar el reporte." });
    } finally {
      setIsGenerating(false);
    }
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      {/* Contenido Principal con margen responsive */}
      <main className="flex-1 transition-all duration-300 lg:ml-64 w-full">
        <div className="p-4 md:p-8 lg:p-10 pt-20 lg:pt-10 max-w-7xl mx-auto">

      {/* Encabezado */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Genera y descarga reportes del inventario y movimientos
        </p>
      </div>

      {/* Tarjeta principal */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-6">
        {/* Selección de tipo de reporte */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">Tipo de reporte</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(["inventario", "movimientos", "prestamos"] as TipoReporte[]).map((tipo) => {
              const info = {
                inventario:  { label: "Inventario", desc: "Estado actual de todos los artículos", icon: "📦" },
                movimientos: { label: "Movimientos", desc: "Historial de entradas, salidas y ajustes", icon: "📊" },
                prestamos:   { label: "Préstamos",   desc: "Control de material prestado", icon: "🔄" },
              }[tipo];

              return (
                <button
                  key={tipo}
                  onClick={() => setTipoReporte(tipo)}
                  className={`
                    text-left p-4 rounded-xl border-2 transition-all
                    ${tipoReporte === tipo
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-blue-200 hover:bg-gray-50"
                    }
                  `}
                >
                  <div className="text-xl mb-1">{info.icon}</div>
                  <p className={`text-sm font-semibold ${tipoReporte === tipo ? "text-blue-700" : "text-gray-900"}`}>
                    {info.label}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{info.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Opciones según tipo de reporte */}
        <div className="space-y-4 border-t border-gray-100 pt-5">
          {/* Filtro solo activos (inventario) */}
          {tipoReporte === "inventario" && (
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="soloActivos"
                checked={soloActivos}
                onChange={(e) => setSoloActivos(e.target.checked)}
                className="w-4 h-4 accent-blue-600 cursor-pointer"
              />
              <label htmlFor="soloActivos" className="text-sm text-gray-700 cursor-pointer">
                Solo artículos con estado "activo"
              </label>
            </div>
          )}

          {/* Filtro de fechas (movimientos y préstamos) */}
          {(tipoReporte === "movimientos" || tipoReporte === "prestamos") && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Fecha desde</label>
                <input
                  type="date"
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Fecha hasta</label>
                <input
                  type="date"
                  value={fechaHasta}
                  onChange={(e) => setFechaHasta(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Mensaje de estado */}
        {mensaje && (
          <div className={`rounded-lg px-4 py-3 text-sm ${
            mensaje.tipo === "ok"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}>
            {mensaje.texto}
          </div>
        )}

        {/* Botones de exportación */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
          {/* Excel / CSV */}
          <button
            onClick={handleExportExcel}
            disabled={isGenerating}
            className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-5 py-3 rounded-lg transition-colors disabled:opacity-60"
          >
            {isGenerating ? (
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            )}
            Descargar Excel (.csv)
          </button>

          {/* PDF / Imprimir */}
          <button
            onClick={handleExportPDF}
            disabled={isGenerating}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-3 rounded-lg transition-colors disabled:opacity-60"
          >
            {isGenerating ? (
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
            )}
            Imprimir / PDF
          </button>
        </div>
      </div>
       </div>
      </main>
    </div>
  );
}