import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: "Engin Hafıza | 3D Kart Akışı",
  description: "Dil seç. Konu seç. 3D kelime kartını aç. Görseli yayınla.",
  manifest: "/manifest.json",
  applicationName: "Engin Hafıza",
  appleWebApp: {
    capable: true,
    title: "Engin Hafıza",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [{ url: "/icons/icon-32x32.svg", type: "image/svg+xml", sizes: "32x32" }],
    apple: [{ url: "/icons/icon-192x192.svg", type: "image/svg+xml" }],
  },
  openGraph: {
    title: "Engin Hafıza",
    description: "Dil seç. Konu seç. 3D kelime kartını aç. Görseli yayınla.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#8b0000",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="tr">
      <body className="app-body">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
