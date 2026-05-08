/**
 * @file app/reportes/page.tsx
 * @description Centro de reportes: descarga de inventario, historial y préstamos
 *              en formato PDF (tabla azul formal) y XLS (tabla formateada),
 *              filtrados por rango de fechas.
 *
 * Dependencias requeridas (instalar si no están):
 *   npm install jspdf jspdf-autotable xlsx
 */

"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/client";
import Sidebar from "@/components/sidebar";
import {
  Calendar,
  FileText,
  FileSpreadsheet,
  Package,
  Clock,
  RefreshCw,
  Download,
  TrendingUp,
  AlertTriangle,
  BarChart2,
  CheckCircle2,
  Loader2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Tipos locales
// ---------------------------------------------------------------------------

/** Reporte seleccionable por el usuario */
type TipoReporte = "inventario" | "historial" | "prestamos";

/** Estadísticas del dashboard de reportes */
interface ReportStats {
  totalArticulos: number;
  unidadesTotales: number;
  stockBajo: number;
  prestamosActivos: number;
  dadosBaja: number;
}

// ---------------------------------------------------------------------------
// Helpers de formato
// ---------------------------------------------------------------------------

/** Convierte una fecha ISO a string legible en español */
const fmtFecha = (f?: string) =>
  f
    ? new Date(f).toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

/** Capitaliza la primera letra de un string */
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// ---------------------------------------------------------------------------
// Función: generar PDF con jsPDF + autoTable
// ---------------------------------------------------------------------------

/**
 * Genera y descarga un PDF con tabla azul formal.
 * @param titulo  - Título del documento
 * @param cabeceras - Encabezados de columna
 * @param filas     - Filas de datos (array de strings)
 * @param fileName  - Nombre del archivo sin extensión
 */
async function generarPDF(
  titulo: string,
  cabeceras: string[],
  filas: (string | number)[][],
  fileName: string
) {
  // Importación dinámica para evitar SSR
  const jsPDF = (await import("jspdf")).default;
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  // ── Encabezado del documento ──────────────────────────────────────────────
  doc.setFillColor(30, 64, 175);          // Azul oscuro (blue-800)
  doc.rect(0, 0, 297, 22, "F");

  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("LABORATORIOS PIER — Sistema de Inventario", 14, 10);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(titulo, 14, 17);

  // Fecha de generación (derecha)
  const hoy = new Date().toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  doc.text(`Generado: ${hoy}`, 297 - 14, 17, { align: "right" });

  // ── Tabla principal ───────────────────────────────────────────────────────
  autoTable(doc, {
    head: [cabeceras],
    body: filas,
    startY: 28,
    styles: {
      fontSize: 8,
      cellPadding: 3,
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: [37, 99, 235],   // blue-600
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "center",
    },
    alternateRowStyles: {
      fillColor: [239, 246, 255], // blue-50
    },
    bodyStyles: {
      textColor: [30, 41, 59],    // slate-800
    },
    columnStyles: {
      0: { cellWidth: "auto" },
    },
    margin: { left: 14, right: 14 },
    // Pie de página con número de página
    didDrawPage: (data: any) => {
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(
        `Página ${data.pageNumber} de ${pageCount}`,
        297 / 2,
        doc.internal.pageSize.height - 6,
        { align: "center" }
      );
    },
  });

  doc.save(`${fileName}.pdf`);
}

// ---------------------------------------------------------------------------
// Función: generar XLS con SheetJS
// ---------------------------------------------------------------------------

/**
 * Genera y descarga un archivo XLSX con formato de tabla.
 * @param titulo    - Título de la hoja
 * @param cabeceras - Encabezados de columna
 * @param filas     - Filas de datos
 * @param fileName  - Nombre del archivo sin extensión
 */
async function generarXLS(
  titulo: string,
  cabeceras: string[],
  filas: (string | number)[][],
  fileName: string
) {
  // Importación dinámica para evitar SSR
  const XLSX = await import("xlsx");

  // Construimos la hoja: fila 0 = título, fila 1 = cabeceras, resto = datos
  const wsData = [
    [titulo],          // Fila 1: título del reporte
    [],                // Fila 2: espacio
    cabeceras,         // Fila 3: cabeceras
    ...filas,          // Filas de datos
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Ancho automático de columnas (máximo 40 chars)
  const colWidths = cabeceras.map((_, colIdx) => {
    const maxLen = Math.max(
      cabeceras[colIdx].length,
      ...filas.map((row) => String(row[colIdx] ?? "").length)
    );
    return { wch: Math.min(maxLen + 4, 40) };
  });
  ws["!cols"] = colWidths;

  // Merge de la celda del título (toda la fila 0)
  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: cabeceras.length - 1 } },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, titulo.substring(0, 31));

  XLSX.writeFile(wb, `${fileName}.xlsx`);
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export default function ReportesPage() {
  // ── Estado de carga y datos ──────────────────────────────────────────────
  const [loading, setLoading]               = useState(true);
  const [exportLoading, setExportLoading]   = useState<string | null>(null);

  // ── Filtros de fecha ─────────────────────────────────────────────────────
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  // ── Tipo de reporte activo ────────────────────────────────────────────────
  const [tipoActivo, setTipoActivo] = useState<TipoReporte>("inventario");

  // ── Estadísticas ─────────────────────────────────────────────────────────
  const [stats, setStats] = useState<ReportStats>({
    totalArticulos: 0,
    unidadesTotales: 0,
    stockBajo: 0,
    prestamosActivos: 0,
    dadosBaja: 0,
  });

  // ── Datos en memoria para exportar ───────────────────────────────────────
  const [dataInventario, setDataInventario]   = useState<any[]>([]);
  const [dataHistorial, setDataHistorial]     = useState<any[]>([]);
  const [dataPrestamos, setDataPrestamos]     = useState<any[]>([]);

  // ── Conteos para la vista previa ─────────────────────────────────────────
  const conteos: Record<TipoReporte, number> = {
    inventario: dataInventario.length,
    historial:  dataHistorial.length,
    prestamos:  dataPrestamos.length,
  };

  // ── Carga de datos ────────────────────────────────────────────────────────
  const fetchData = async () => {
    setLoading(true);
    const supabase = createClient();

    try {
      // — Inventario (siempre completo, sin filtro de fecha) —
      const { data: inv } = await supabase
        .from("inventario")
        .select("*, categorias(nombre), departamentos(nombre)")
        .order("nombre");

      // — Estadísticas rápidas —
      const { count: prestamosActivos } = await supabase
        .from("prestamos")
        .select("*", { count: "exact", head: true })
        .eq("estado", "activo");

      const { count: bajasCount } = await supabase
        .from("inventario")
        .select("*", { count: "exact", head: true })
        .eq("estado", "dado_de_baja");

      const activosConStock = (inv ?? []).filter(
        (i) => i.estado === "activo" && Number(i.stock_disponible) <= Number(i.stock_minimo)
      );

      setStats({
        totalArticulos:   inv?.length ?? 0,
        unidadesTotales:  (inv ?? []).reduce((a, i) => a + Number(i.stock_disponible), 0),
        stockBajo:        activosConStock.length,
        prestamosActivos: prestamosActivos ?? 0,
        dadosBaja:        bajasCount ?? 0,
      });

      setDataInventario(inv ?? []);

      // — Historial filtrado por rango de fechas —
      let qHist = supabase
        .from("historial_inventario")
        .select("*, inventario(nombre, clave), usuarios(nombre_completo)")
        .order("fecha", { ascending: false });
      if (fechaDesde) qHist = qHist.gte("fecha", fechaDesde);
      if (fechaHasta) qHist = qHist.lte("fecha", fechaHasta + "T23:59:59");
      const { data: hist } = await qHist;
      setDataHistorial(hist ?? []);

      // — Préstamos filtrados por rango de fechas —
      let qPre = supabase
        .from("prestamos")
        .select(`
          id, fecha_salida, fecha_devolucion, estado, observaciones,
          solicitante:usuario_id(nombre_completo),
          departamento:departamento_id(nombre),
          autorizador:autorizado_por(nombre_completo)
        `)
        .order("created_at", { ascending: false });
      if (fechaDesde) qPre = qPre.gte("fecha_salida", fechaDesde);
      if (fechaHasta) qPre = qPre.lte("fecha_salida", fechaHasta + "T23:59:59");
      const { data: pre } = await qPre;
      setDataPrestamos(pre ?? []);

    } catch (err) {
      console.error("Error cargando reportes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fechaDesde, fechaHasta]); // Se recarga al cambiar el rango de fechas

  // ── Preparación de datos para exportar ───────────────────────────────────

  /** Convierte los datos de inventario a formato tabla */
  const tablaInventario = () => ({
    cabeceras: ["Clave", "Nombre", "Marca", "Categoría", "Ubicación", "Stock Total", "Disponible", "Mín.", "Estado"],
    filas: dataInventario.map((i) => [
      i.clave,
      i.nombre,
      i.marca ?? "—",
      (i.categorias as any)?.nombre ?? "—",
      i.ubicacion ?? "—",
      i.stock_total,
      i.stock_disponible,
      i.stock_minimo,
      cap(i.estado.replace(/_/g, " ")),
    ]),
  });

  /** Convierte los datos de historial a formato tabla */
  const tablaHistorial = () => ({
    cabeceras: ["ID", "Artículo", "Clave", "Tipo", "Cantidad", "Stock Antes", "Stock Después", "Usuario", "Fecha", "Observaciones"],
    filas: dataHistorial.map((m) => [
      m.id,
      (m.inventario as any)?.nombre ?? "—",
      (m.inventario as any)?.clave ?? "—",
      cap(m.tipo_movimiento),
      m.cantidad,
      m.stock_antes ?? "—",
      m.stock_despues ?? "—",
      (m.usuarios as any)?.nombre_completo ?? "—",
      fmtFecha(m.fecha),
      m.observaciones ?? "—",
    ]),
  });

  /** Convierte los datos de préstamos a formato tabla */
  const tablaPrestamos = () => ({
    cabeceras: ["ID", "Solicitante", "Departamento", "Autorizó", "Fecha Salida", "Fecha Devolución", "Estado", "Observaciones"],
    filas: dataPrestamos.map((p) => [
      p.id,
      (p.solicitante as any)?.nombre_completo ?? "Externo",
      (p.departamento as any)?.nombre ?? "—",
      (p.autorizador as any)?.nombre_completo ?? "—",
      fmtFecha(p.fecha_salida),
      fmtFecha(p.fecha_devolucion),
      cap(p.estado),
      p.observaciones ?? "—",
    ]),
  });

  // Mapa de configuración por tipo de reporte
  const configs: Record<TipoReporte, {
    label: string;
    Icon: any;
    color: string;
    bgColor: string;
    borderColor: string;
    titulo: () => string;
    tabla: () => { cabeceras: string[]; filas: (string | number)[][] };
    fileName: () => string;
  }> = {
    inventario: {
      label:       "Inventario",
      Icon:        Package,
      color:       "text-blue-600",
      bgColor:     "bg-blue-50",
      borderColor: "border-blue-200",
      titulo:      () => "Reporte de Inventario General",
      tabla:       tablaInventario,
      fileName:    () => `inventario_${new Date().toISOString().split("T")[0]}`,
    },
    historial: {
      label:       "Historial",
      Icon:        Clock,
      color:       "text-purple-600",
      bgColor:     "bg-purple-50",
      borderColor: "border-purple-200",
      titulo:      () =>
        fechaDesde && fechaHasta
          ? `Historial de Movimientos: ${fmtFecha(fechaDesde)} — ${fmtFecha(fechaHasta)}`
          : "Historial de Movimientos (Completo)",
      tabla:       tablaHistorial,
      fileName:    () => `historial_${new Date().toISOString().split("T")[0]}`,
    },
    prestamos: {
      label:       "Préstamos",
      Icon:        RefreshCw,
      color:       "text-emerald-600",
      bgColor:     "bg-emerald-50",
      borderColor: "border-emerald-200",
      titulo:      () =>
        fechaDesde && fechaHasta
          ? `Reporte de Préstamos: ${fmtFecha(fechaDesde)} — ${fmtFecha(fechaHasta)}`
          : "Reporte de Préstamos (Completo)",
      tabla:       tablaPrestamos,
      fileName:    () => `prestamos_${new Date().toISOString().split("T")[0]}`,
    },
  };

  // ── Handlers de exportación ───────────────────────────────────────────────

  /** Descarga el reporte activo como PDF */
  const handleDescargarPDF = async (tipo: TipoReporte) => {
    setExportLoading(`${tipo}-pdf`);
    try {
      const cfg    = configs[tipo];
      const { cabeceras, filas } = cfg.tabla();
      await generarPDF(cfg.titulo(), cabeceras, filas, cfg.fileName());
    } catch (err) {
      console.error("Error generando PDF:", err);
      alert("Error al generar el PDF. Verifica que jspdf y jspdf-autotable estén instalados.");
    } finally {
      setExportLoading(null);
    }
  };

  /** Descarga el reporte activo como XLS */
  const handleDescargarXLS = async (tipo: TipoReporte) => {
    setExportLoading(`${tipo}-xls`);
    try {
      const cfg    = configs[tipo];
      const { cabeceras, filas } = cfg.tabla();
      await generarXLS(cfg.titulo(), cabeceras, filas, cfg.fileName());
    } catch (err) {
      console.error("Error generando XLS:", err);
      alert("Error al generar el XLS. Verifica que xlsx esté instalado.");
    } finally {
      setExportLoading(null);
    }
  };

  // ── Renderizado ───────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="flex-1 lg:ml-64 w-full">
        <div className="p-4 md:p-8 lg:p-10 pt-20 lg:pt-10 max-w-7xl mx-auto">

          {/* ── Encabezado de la página ── */}
          <div className="mb-8">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <BarChart2 size={28} className="text-blue-600" />
              Centro de Reportes
            </h1>
            <p className="text-slate-500 font-medium mt-1">
              Exporta inventario, movimientos y préstamos en PDF o Excel
            </p>
          </div>

          {/* ── Tarjetas de estadísticas rápidas ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            {[
              { label: "Total artículos", val: stats.totalArticulos, Icon: Package,      color: "text-slate-800",    bg: "bg-white"          },
              { label: "Unidades totales",val: stats.unidadesTotales, Icon: BarChart2,   color: "text-blue-600",    bg: "bg-blue-50"        },
              { label: "Stock bajo",       val: stats.stockBajo,      Icon: AlertTriangle, color: "text-amber-600",  bg: "bg-amber-50"       },
              { label: "Préstamos activos",val: stats.prestamosActivos, Icon: RefreshCw, color: "text-emerald-600", bg: "bg-emerald-50"     },
              { label: "Dados de baja",    val: stats.dadosBaja,      Icon: TrendingUp,  color: "text-red-500",     bg: "bg-red-50"         },
            ].map(({ label, val, Icon, color, bg }) => (
              <div key={label} className={`${bg} rounded-2xl border border-slate-100 shadow-sm p-5`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">{label}</p>
                    <p className={`text-2xl font-black mt-2 ${color}`}>
                      {loading ? <Loader2 size={20} className="animate-spin" /> : val}
                    </p>
                  </div>
                  <Icon size={18} className={`${color} mt-1`} />
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ── Columna izquierda: Filtros + Selector de reporte ── */}
            <div className="lg:col-span-1 space-y-4">

              {/* Filtro de periodo */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                <h2 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
                  <Calendar size={16} className="text-blue-500" />
                  Periodo de Reporte
                </h2>

                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Desde
                    </label>
                    <input
                      type="date"
                      value={fechaDesde}
                      onChange={(e) => setFechaDesde(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Hasta
                    </label>
                    <input
                      type="date"
                      value={fechaHasta}
                      onChange={(e) => setFechaHasta(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                    />
                  </div>

                  {/* Botón limpiar filtros */}
                  {(fechaDesde || fechaHasta) && (
                    <button
                      onClick={() => { setFechaDesde(""); setFechaHasta(""); }}
                      className="w-full py-2 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors border border-dashed border-slate-200 rounded-xl"
                    >
                      Limpiar filtro de fechas
                    </button>
                  )}
                </div>

                {/* Indicador del rango activo */}
                {fechaDesde && fechaHasta && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Rango activo</p>
                    <p className="text-xs font-bold text-slate-700 mt-1">
                      {fmtFecha(fechaDesde)} → {fmtFecha(fechaHasta)}
                    </p>
                  </div>
                )}
              </div>

              {/* Selector de tipo de reporte */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                <h2 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
                  <FileText size={16} className="text-blue-500" />
                  Tipo de Reporte
                </h2>

                <div className="space-y-2">
                  {(Object.keys(configs) as TipoReporte[]).map((tipo) => {
                    const cfg = configs[tipo];
                    const Icon = cfg.Icon;
                    const activo = tipoActivo === tipo;
                    return (
                      <button
                        key={tipo}
                        onClick={() => setTipoActivo(tipo)}
                        className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                          activo
                            ? `${cfg.bgColor} ${cfg.borderColor} shadow-sm`
                            : "bg-slate-50 border-slate-100 hover:border-slate-200"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon size={16} className={activo ? cfg.color : "text-slate-400"} />
                          <div>
                            <p className={`text-sm font-bold ${activo ? "text-slate-800" : "text-slate-600"}`}>
                              {cfg.label}
                            </p>
                            <p className="text-[10px] text-slate-400 font-medium">
                              {loading ? "..." : `${conteos[tipo]} registros`}
                            </p>
                          </div>
                        </div>
                        <ChevronRight
                          size={16}
                          className={activo ? cfg.color : "text-slate-300"}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── Columna derecha: Panel de descarga ── */}
            <div className="lg:col-span-2 space-y-4">

              {/* Tarjeta de descarga para cada tipo de reporte */}
              {(Object.keys(configs) as TipoReporte[]).map((tipo) => {
                const cfg  = configs[tipo];
                const Icon = cfg.Icon;
                const activo = tipoActivo === tipo;

                return (
                  <div
                    key={tipo}
                    className={`bg-white rounded-3xl border shadow-sm transition-all overflow-hidden ${
                      activo
                        ? `${cfg.borderColor} shadow-md`
                        : "border-slate-100 opacity-60"
                    }`}
                  >
                    {/* Cabecera de la tarjeta */}
                    <div
                      className={`px-6 py-4 flex items-center justify-between cursor-pointer ${
                        activo ? cfg.bgColor : "bg-slate-50"
                      }`}
                      onClick={() => setTipoActivo(tipo)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${activo ? "bg-white shadow-sm" : "bg-slate-100"}`}>
                          <Icon size={18} className={activo ? cfg.color : "text-slate-400"} />
                        </div>
                        <div>
                          <p className="font-black text-slate-800 text-sm">{cfg.label}</p>
                          <p className="text-[10px] text-slate-400 font-medium">
                            {loading
                              ? "Cargando..."
                              : `${conteos[tipo]} registros${
                                  tipo !== "inventario" && (fechaDesde || fechaHasta)
                                    ? " · filtrados por fecha"
                                    : tipo === "inventario"
                                    ? " · estado actual"
                                    : ""
                                }`}
                          </p>
                        </div>
                      </div>
                      <ChevronDown
                        size={18}
                        className={`transition-transform ${activo ? `rotate-180 ${cfg.color}` : "text-slate-300"}`}
                      />
                    </div>

                    {/* Contenido expandible */}
                    {activo && (
                      <div className="px-6 py-5">

                        {/* Descripción del reporte */}
                        <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                          {tipo === "inventario" &&
                            "Listado completo del inventario con claves, stock, categorías y estado. Se exporta el estado actual sin importar el rango de fechas."}
                          {tipo === "historial" &&
                            "Auditoría de todos los movimientos: entradas, salidas, ajustes y traslados. Filtrado según el rango de fechas seleccionado."}
                          {tipo === "prestamos" &&
                            "Registro de préstamos con solicitante, artículos, fechas y estado. Filtrado según el rango de fechas seleccionado."}
                        </p>

                        {/* Botones de descarga */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                          {/* ── Descarga PDF ── */}
                          <button
                            onClick={() => handleDescargarPDF(tipo)}
                            disabled={exportLoading !== null || conteos[tipo] === 0}
                            className="flex items-center justify-between gap-3 p-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:cursor-not-allowed text-white rounded-2xl transition-all shadow-lg shadow-blue-200 group"
                          >
                            <div className="text-left">
                              <p className="text-xs font-black uppercase tracking-wider">
                                Descargar PDF
                              </p>
                              <p className="text-[10px] font-medium opacity-80 mt-0.5">
                                Tabla azul · Formato formal
                              </p>
                            </div>
                            <div className="p-2 bg-blue-500 rounded-xl group-hover:bg-blue-800 transition-colors">
                              {exportLoading === `${tipo}-pdf` ? (
                                <Loader2 size={18} className="animate-spin" />
                              ) : (
                                <FileText size={18} />
                              )}
                            </div>
                          </button>

                          {/* ── Descarga XLS ── */}
                          <button
                            onClick={() => handleDescargarXLS(tipo)}
                            disabled={exportLoading !== null || conteos[tipo] === 0}
                            className="flex items-center justify-between gap-3 p-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:cursor-not-allowed text-white rounded-2xl transition-all shadow-lg shadow-emerald-200 group"
                          >
                            <div className="text-left">
                              <p className="text-xs font-black uppercase tracking-wider">
                                Descargar Excel
                              </p>
                              <p className="text-[10px] font-medium opacity-80 mt-0.5">
                                Tabla .xlsx · Editable
                              </p>
                            </div>
                            <div className="p-2 bg-emerald-500 rounded-xl group-hover:bg-emerald-800 transition-colors">
                              {exportLoading === `${tipo}-xls` ? (
                                <Loader2 size={18} className="animate-spin" />
                              ) : (
                                <FileSpreadsheet size={18} />
                              )}
                            </div>
                          </button>
                        </div>

                        {/* Aviso si no hay datos */}
                        {!loading && conteos[tipo] === 0 && (
                          <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-100 flex items-center gap-2">
                            <AlertTriangle size={14} className="text-amber-500 flex-shrink-0" />
                            <p className="text-xs font-medium text-amber-700">
                              No hay registros para el rango de fechas seleccionado.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* ── Panel de estado del sistema ── */}
              <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl">
                <h3 className="text-sm font-bold mb-5 flex items-center gap-2">
                  <TrendingUp size={16} className="text-emerald-400" />
                  Estado del Sistema
                </h3>

                <div className="space-y-5">
                  {/* Barra: Eficiencia de stock */}
                  <div>
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-slate-400 uppercase font-black tracking-wider text-[10px]">
                        Artículos en Stock Normal
                      </span>
                      <span className="font-bold text-emerald-400">
                        {stats.totalArticulos > 0
                          ? `${Math.round(((stats.totalArticulos - stats.stockBajo) / stats.totalArticulos) * 100)}%`
                          : "—"}
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full transition-all duration-700"
                        style={{
                          width: stats.totalArticulos > 0
                            ? `${((stats.totalArticulos - stats.stockBajo) / stats.totalArticulos) * 100}%`
                            : "0%",
                        }}
                      />
                    </div>
                  </div>

                  {/* Barra: Stock crítico */}
                  <div>
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-slate-400 uppercase font-black tracking-wider text-[10px]">
                        Artículos Críticos
                      </span>
                      <span className="font-bold text-amber-400">
                        {stats.stockBajo}
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-amber-500 h-full transition-all duration-700"
                        style={{
                          width: stats.totalArticulos > 0
                            ? `${Math.min((stats.stockBajo / stats.totalArticulos) * 100, 100)}%`
                            : "0%",
                        }}
                      />
                    </div>
                  </div>

                  {/* Barra: Préstamos activos */}
                  <div>
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-slate-400 uppercase font-black tracking-wider text-[10px]">
                        Préstamos Activos
                      </span>
                      <span className="font-bold text-blue-400">
                        {stats.prestamosActivos}
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-400 h-full"
                        style={{ width: stats.prestamosActivos > 0 ? "60%" : "0%" }}
                      />
                    </div>
                  </div>
                </div>

                <p className="mt-6 text-[10px] text-slate-500 leading-relaxed italic border-t border-slate-800 pt-4">
                  * El reporte de inventario siempre refleja el estado actual. Los reportes de historial y préstamos
                  respetan el rango de fechas seleccionado. Si no se define un rango, se exporta todo el historial disponible.
                </p>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}