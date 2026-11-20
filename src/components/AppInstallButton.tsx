"use client";

import { useEffect, useState } from "react";

/**
 * PWA "uygulama olarak yükle" butonu.
 * Chrome/Edge/Safari'da beforeinstallprompt eventi yakalanır,
 * kullanıcıya sağ üstte bir buton sunulur ve tek tıkla kurulur.
 * Zaten yüklüyse buton gizlenir.
 */
export default function AppInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [show, setShow] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Zaten standalone (uygulama) modunda mı? Yüklüyse buton gerekmez.
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;
    try {
      (deferredPrompt as any).prompt();
      const { outcome } = await (deferredPrompt as any).userChoice;
      if (outcome === "accepted") {
        setShow(false);
        setInstalled(true);
      }
    } catch {
      // sessis
    } finally {
      setDeferredPrompt(null);
    }
  };

  if (installed) return null;

  return (
    show && (
      <button
        type="button"
        className="install-btn"
        onClick={install}
        aria-label="Engin Hafızayı uygulamaya yükle"
      >
        📱 Uygulamayı Yükle
      </button>
    )
  );
}
