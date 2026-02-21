import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Arena | Customer Operations Omnicanal",
  description:
    "Demo de la Plataforma de Customer Operations Omnicanal de Arena Analytics",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
