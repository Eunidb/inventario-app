import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap', // Esto ayuda a que el texto se vea con una fuente del sistema mientras carga
  preload: false,  // Desactiva el preload automático (no recomendado para SEO, pero quita el aviso)
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap', // Esto ayuda a que el texto se vea con una fuente del sistema mientras carga
  preload: false,  // Desactiva el preload automático (no recomendado para SEO, pero quita el aviso)
});

export const metadata: Metadata = {
  title: "Sistema de Inventario",
  description: "Gestión de inventario",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} bg-gray-50`}>
        {children}
      </body>
    </html>
  );
}