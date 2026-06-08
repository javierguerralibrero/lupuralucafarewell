import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lupu & Raluca Farewell",
  description: "Web de despedida",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
