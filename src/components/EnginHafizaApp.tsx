/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import {
  createInitialState,
  loadState,
  persistState,
  type LocalState,
} from "@/lib/client-utils";
import { LANGUAGE_SEEDS, TOPICS } from "@/lib/seed";
import { DEFAULT_IMAGE, type Publication, toViewableUrl } from "@/lib/types";
import { playClick, playPop, playSuccess, initSound } from "@/lib/sound";
import Sparkles, { emitSparkleBurst, onSparkleBurst } from "@/components/Sparkles";
import AppInstallButton from "@/components/AppInstallButton";

interface EnginHafizaAppProps {
  initialPublications: Publication[];
}

type Step = "language" | "topic" | "cards" | "detail";

const languageMap = new Map(LANGUAGE_SEEDS.map((item) => [item.id, item]));
const topicMap = new Map(TOPICS.map((item) => [item.id, item]));

const topicIcons: Record<string, string> = {
  "A1-1": "🔤", "A1-2": "👋", "A1-3": "🔢", "A1-4": "👨‍👩‍👧‍👦", "A1-5": "🎨", "A1-6": "🍎", "A1-7": "🍳", "A1-8": "🧭",
  "A2-1": "🛒", "A2-2": "🏥", "A2-3": "🌤️", "A2-4": "🎮", "A2-5": "🕰️", "A2-6": "🏠", "A2-7": "🍽️",
  "B1-1": "💼", "B1-2": "❤️", "B1-3": "🎓", "B1-4": "🔗", "B1-5": "🤝", "B1-6": "📰",
  "B2-1": "💬", "B2-2": "💭", "B2-3": "🗣️", "B2-4": "🎭", "B2-5": "⚙️",
  "C1-1": "📚", "C1-2": "✍️", "C1-3": "⚖️", "C1-4": "🎯",
};

export default function EnginHafizaApp({ initialPublications }: EnginHafizaAppProps) {
  const [state, setState] = useState<LocalState>(() => createInitialState(initialPublications));
  const [hydrated, setHydrated] = useState(false);
  const [step, setStep] = useState<Step>("language");
  const [draftImage, setDraftImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [flipped, setFlipped] = useState(false);
  const toastTimer = useRef<number | null>(null);
  const soundReady = useRef(false);
  const suppressClickRef = useRef(false);
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const scrollSyncTimerRef = useRef<number | null>(null);
  const programmaticScrollRef = useRef(false);

  const notify = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2200);
  }, []);

  useEffect(() => {
    initSound();
    soundReady.current = true;
  }, []);

  useEffect(() => {
    const local = loadState(initialPublications);
    // FIX #1: Yayın listesi tek bir, tüm cihazlarda paylaşılan kaynaktan gelir.
    // localStorage cihaza/taraycıya özeldir (mobil yükleme PC'de, PC yükleme mobilde görünmez).
    // Bu yüzden localStorage'deki yayın listesi asla sunucu verisini (initialPublications) override etmez.
    // Yalnızca arayüz tercihleri (dil/konu) localStorage'dan okunur, yayın listesi sunucuya göre ayarlanır.
    setState({
      ...local,
      publications: initialPublications,
    });
    setHydrated(true);
  }, [initialPublications]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      persistState(state);
    } catch {
      notify("Depolama alanı dolu.");
    }
  }, [hydrated, notify, state]);

  useEffect(() => {
    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, []);

  // FIX #5: Sunucudan (Vercel Blob metadata) zorla yenile — cross-device anında senkron
  // Tanımı useEffect'ten ÖNCE yapmalıyız (hoisting sorunu).
  const syncFromServer = useCallback(async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/publications", { cache: "no-store" });
      if (res.ok) {
        const serverPubs = (await res.json()) as Publication[];
        setState((prev) => ({ ...prev, publications: serverPubs }));
        notify("Sunucudan güncellendi ✓");
        playSuccess();
      } else {
        notify("Senklenemedi");
      }
    } catch {
      notify("Senklenemedi");
    } finally {
      setBusy(false);
    }
  }, [notify]);

  // FIX #6: Sekmeye geri dönüldüğünde (mobil↔PC geçiş) sunucudan otomatik yenile
  useEffect(() => {
    const onFocus = () => {
      if (hydrated && !busy && !publishing) {
        syncFromServer();
      }
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [hydrated, busy, publishing, syncFromServer]);

  const tap = (x?: number, y?: number) => {
    if (!soundReady.current) return;
    playClick();
    if (x != null && y != null) emitSparkleBurst(x, y);
  };

  const selectedLanguage = languageMap.get(state.languageId) ?? LANGUAGE_SEEDS[0];
  const selectedTopic = topicMap.get(state.topicId) ?? TOPICS[0];

  const goLanguage = (e?: React.MouseEvent, id?: string) => {
    if (e) { e.stopPropagation(); tap(e.clientX, e.clientY); }
    setState((previous) => ({ ...previous, languageId: id ?? state.languageId }));
    setStep("topic");
    playPop();
  };

  const goTopic = (e?: React.MouseEvent, id?: string) => {
    if (e) { e.stopPropagation(); tap(e.clientX, e.clientY); }
    setState((previous) => ({ ...previous, topicId: id ?? state.topicId }));
    setStep("cards");
    playPop();
  };

  const goCards = (e?: React.MouseEvent, id?: string) => {
    if (e) { e.stopPropagation(); tap(e.clientX, e.clientY); }
    setSelectedCardId(id ?? null);
    setFlipped(false);
    setStep("cards");
    playPop();
  };

  const goDetail = (id: string) => {
    setSelectedCardId(id);
    setFlipped(false);
    setStep("detail");
    playSuccess();
  };

  const processFile = async (file: File) => {
    if (!file) return;
    setBusy(true);
    try {
      const previewUrl = URL.createObjectURL(file);
      setDraftImage(previewUrl);
      setFileName(file.name);

      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload-image", { method: "POST", body: formData });
      const data = await res.json();
      if (data.ok && data.url) {
        URL.revokeObjectURL(previewUrl);
        setDraftImage(data.url);
        notify("Görsel hazır. Yayına ekle'ye dokun.");
      } else {
        URL.revokeObjectURL(previewUrl);
        setDraftImage(null);
        notify(data.error || "Görsel yüklenemedi.");
      }
    } catch (error) {
      notify(error instanceof Error ? error.message : "Görsel yüklenemedi.");
    } finally {
      setBusy(false);
    }
  };

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    await processFile(file);
    input.value = "";
  };

  const handlePaste = async (event: ClipboardEvent) => {
    const items = event.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type && items[i].type.startsWith("image/")) {
        const file = items[i].getAsFile();
        if (file) {
          await processFile(file);
          event.preventDefault();
          return;
        }
      }
    }
  };

  // FIX #14: Mobilde panodaki görseli tek dokunuşla yapıştır.
  // Telefonda Ctrl+V olmadığı için "Yapıştır" butonu bu fonksiyonu çağırır.
  const pasteFromClipboard = async () => {
    if (busy || publishing) return;
    const clipboard = navigator.clipboard as
      | (Clipboard & { read?: () => Promise<ClipboardItem[]> })
      | undefined;
    if (!clipboard || typeof clipboard.read !== "function") {
      notify("Tarayıcı pano görselini okumayı desteklemiyor. Görseli seçerek yükle.");
      return;
    }
    try {
      const items = await clipboard.read();
      for (const item of items) {
        const imageType = item.types.find((type) => type.startsWith("image/"));
        if (!imageType) continue;
        const blob = await item.getType(imageType);
        const ext = imageType.split("/")[1]?.split("+")[0] || "png";
        const file = new File([blob], `pano-${Date.now()}.${ext}`, { type: imageType });
        await processFile(file);
        return;
      }
      notify("Panoda görsel bulunamadı. Önce bir görseli kopyala.");
    } catch {
      notify("Panoya erişilemedi. İzin ver veya görseli seçerek yükle.");
    }
  };

  useEffect(() => {
    document.addEventListener("paste", handlePaste);
    return () => {
      document.removeEventListener("paste", handlePaste);
    };
  }, [handlePaste]);

  const publish = async () => {
    if (!draftImage || publishing) return;
    const topic = topicMap.get(state.topicId) ?? TOPICS[0];
    const item: Publication = {
      id: `pub-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      languageId: state.languageId,
      level: topic.level,
      topicId: state.topicId,
      imageUrl: draftImage,
      createdAt: new Date().toISOString(),
    };
    setPublishing(true);
    setState((previous) => ({ ...previous, publications: [item, ...(previous.publications || [])] }));
    setDraftImage(null);
    setFileName("");
    try {
      const response = await fetch("/api/publications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      const data = (await response.json()) as { ok?: boolean; publication?: Publication; error?: string };
      if (response.ok && data.ok && data.publication) {
        const saved = data.publication;
        setState((previous) => ({
          ...previous,
          publications: (previous.publications || []).map((entry) => (entry.id === item.id ? saved : entry)),
        }));
        notify("Yayın ana sayfaya eklendi.");
        playSuccess();
      } else {
        // FIX #10: gerçek hata mesajını göster (sessizce yutma)
        console.error("Engin Hafıza: yayın kaydedilemedi:", data.error);
        notify(data.error || "Sunucuya kaydedilemedi.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Engin Hafıza: yayın isteği başarısız:", message);
      notify(`Kaydedilemedi: ${message}`);
    } finally {
      setPublishing(false);
    }
  };

  const removePublication = (id: string) => {
    if (!window.confirm("Bu yayını silmek istiyor musun?")) return;
    // Yerel state'i hemen güncelle (localStorage'e persistState ile yazılır)
    setState((previous) => ({
      ...previous,
      publications: (previous.publications || []).filter((item) => item.id !== id),
    }));
    // Sunucuya silmeyi deney (best effort, beklemeden devam et)
    fetch(`/api/publications?id=${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() => undefined);
    notify("Yayın silindi.");
    playClick();
  };

  const filteredCards = (state.publications || []).filter(
    (item) => item.languageId === state.languageId && item.topicId === state.topicId,
  );

  // FIX #20: Seçili karttan ±1 yönde geçiş yap (ok butonları için ortak)
  const goToCardOffset = (dir: -1 | 1) => {
    const currentIndex = filteredCards.findIndex((p) => p.id === selectedCardId);
    if (currentIndex === -1) return;
    const nextIndex = currentIndex + dir;
    if (nextIndex < 0 || nextIndex >= filteredCards.length) return;
    setSelectedCardId(filteredCards[nextIndex].id);
    playClick();
  };

  // FIX #20: Mobilde native kaydırma bittiğinde en yakın kartı seç.
  const handleCarouselScroll = () => {
    if (scrollSyncTimerRef.current) window.clearTimeout(scrollSyncTimerRef.current);
    scrollSyncTimerRef.current = window.setTimeout(() => {
      scrollSyncTimerRef.current = null;
      if (programmaticScrollRef.current) return;
      const node = carouselRef.current;
      if (!node) return;
      const center = node.scrollLeft + node.clientWidth / 2;
      let bestId: string | null = null;
      let bestDist = Number.POSITIVE_INFINITY;
      node.querySelectorAll<HTMLElement>("[data-card-id]").forEach((el) => {
        const elCenter = el.offsetLeft + el.offsetWidth / 2;
        const dist = Math.abs(elCenter - center);
        if (dist < bestDist) {
          bestDist = dist;
          bestId = el.dataset.cardId ?? null;
        }
      });
      if (bestId) {
        const id = bestId;
        setSelectedCardId((prev) => (prev === id ? prev : id));
      }
    }, 90);
  };

  // FIX #20: Seçili kart değişince (ok butonları / karta dokunma) ortala.
  useEffect(() => {
    if (step !== "detail" || !selectedCardId) return;
    const node = carouselRef.current;
    if (!node) return;
    const el = node.querySelector<HTMLElement>(`[data-card-id="${selectedCardId}"]`);
    if (!el) return;
    const center = node.scrollLeft + node.clientWidth / 2;
    const elCenter = el.offsetLeft + el.offsetWidth / 2;
    if (Math.abs(elCenter - center) <= el.offsetWidth * 0.5) return;
    programmaticScrollRef.current = true;
    const target = el.offsetLeft - (node.clientWidth - el.offsetWidth) / 2;
    node.scrollTo({
      left: target,
      behavior: Math.abs(elCenter - center) > node.clientWidth * 1.5 ? "auto" : "smooth",
    });
    window.setTimeout(() => {
      programmaticScrollRef.current = false;
    }, 700);
  }, [step, selectedCardId]);

  const back = () => {
    if (step === "detail") { setStep("cards"); playClick(); return; }
    if (step === "cards") { setStep("topic"); playClick(); return; }
    if (step === "topic") { setStep("language"); playClick(); return; }
  };

  return (
    <div className="app-shell">
      <AppInstallButton />
      <Sparkles />
      <header className="app-header">
        {step !== "language" && (
          <button type="button" className="nav-back" onClick={back} aria-label="Geri">‹ Geri</button>
        )}
        <div className="brand">
          <span className="brand-mark">EH</span>
          <span className="brand-text"><strong>ENGIN HAFIZA</strong><small>TATLI 3D KART AKIŞI</small></span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="header-count">{(state.publications || []).length} yayın</span>
          <button
            type="button"
            className="btn-cute"
            style={{ padding: "6px 10px", fontSize: 11, height: 28 }}
            onClick={syncFromServer}
            disabled={busy}
            aria-label="Sunucudan yenile"
            title="Diğer cihazlardan eklenenleri getir"
          >
            ⟳ Senkron
          </button>
        </div>
      </header>

      <main className="app-main">
        <div className="step-wrap">
          {/* ---- 1. DİL ---- */}
          {step === "language" && (
            <section className="step-fade">
              <div style={{ padding: "0 8px 10px" }}>
                <span style={{ display: "inline-block", padding: "6px 10px", borderRadius: 8, background: "rgba(139,0,0,.09)", color: "#8b0000", fontSize: 10, fontWeight: 850, letterSpacing: ".16em", textTransform: "uppercase", marginBottom: 10 }}>
                  Adım 1 · Dil seç
                </span>
              </div>
              <div className="cute-grid cute-grid--covers">
                {LANGUAGE_SEEDS.map((language) => (
                  <button
                    type="button"
                    key={language.id}
                    className={`cute-card cute-card--cover ${state.languageId === language.id ? "is-active" : ""}`}
                    onClick={(e) => goLanguage(e, language.id)}
                    aria-label={`${language.name} · ${language.nativeName}`}
                  >
                    <span className="cover-frame">
                      {language.cover ? (
                        <img
                          src={language.cover}
                          alt={`${language.name} · ${language.nativeName}`}
                          loading="eager"
                          decoding="async"
                        />
                      ) : (
                        <span className="cover-fallback">
                          <span className="cover-fallback__icon">{language.icon}</span>
                          <span className="cover-caption">
                            <strong>{language.name}</strong>
                            <small>{language.nativeName}</small>
                          </span>
                        </span>
                      )}
                      <span className="cover-shine" aria-hidden="true" />
                      <span className="cover-scrim" aria-hidden="true" />
                      <span className="cover-badge">{language.icon}</span>
                    </span>
                  </button>
                ))}
              </div>
              <div style={{ marginTop: 14, display: "flex", justifyContent: "center", gap: 8 }}>
                <button type="button" className="btn-cute" style={{ padding: "12px 24px", fontSize: 14 }} onClick={(e) => { tap(e.clientX, e.clientY); setStep("cards"); playPop(); }}>
                  Hızlı ilerle
                </button>
              </div>
            </section>
          )}

          {/* ---- 2. KONU ---- */}
          {step === "topic" && (
            <section className="step-fade">
              <div style={{ padding: "0 8px 10px" }}>
                <span style={{ display: "inline-block", padding: "6px 10px", borderRadius: 8, background: "rgba(139,0,0,.09)", color: "#8b0000", fontSize: 10, fontWeight: 850, letterSpacing: ".16em", textTransform: "uppercase", marginBottom: 10 }}>
                  Adım 2 · Konu seç ({selectedLanguage.name})
                </span>
              </div>
              <div className="cute-grid">
                {TOPICS.map((topic) => (
                  <button
                    type="button"
                    key={topic.id}
                    className={`cute-card ${state.topicId === topic.id ? "is-active" : ""}`}
                    onClick={(e) => goTopic(e, topic.id)}
                    aria-label={topic.title}
                  >
                    <span className="cute-card__ring">{topicIcons[topic.id] ?? "✨"}</span>
                    <span className="cute-card__title">{topic.title}</span>
                    <span className="cute-card__sub">{topic.level}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* ---- 3. 3D KELİME KARTLAR ---- */}
          {step === "cards" && (
            <section className="step-fade">
              <div style={{ padding: "0 8px 10px" }}>
                <span style={{ display: "inline-block", padding: "6px 10px", borderRadius: 8, background: "rgba(139,0,0,.09)", color: "#8b0000", fontSize: 10, fontWeight: 850, letterSpacing: ".16em", textTransform: "uppercase", marginBottom: 10 }}>
                  Adım 3 · Kelime kartları
                </span>
                {/* Konulara hızlı dönüş butonu */}
                <button type="button" onClick={() => { tap(); setStep("topic"); playClick(); }} style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  marginBottom: 10, padding: "8px 14px", borderRadius: 10,
                  border: "1px solid rgba(139,0,0,.35)", background: "rgba(139,0,0,.06)",
                  color: "#8b0000", fontWeight: 800, fontSize: 13, cursor: "pointer"
                }}>
                  ← Tüm konulara dön
                </button>
              </div>
              {filteredCards.length === 0 ? (
                <div className="empty-cute">
                  <span className="emoji">🃏</span>
                  <strong>Henüz bu konuda yayın yok</strong>
                  <p style={{ margin: "8px 0 0", fontSize: 13, color: "rgba(27,42,74,.5)" }}>
                    Admin panelinden yeni bir ekleyebilirsin.
                  </p>
                  <button type="button" className="btn-outline" onClick={() => { tap(); setStep("language"); }} style={{ marginTop: 12 }}>(Başa dön)</button>
                </div>
              ) : (
                <div className="image-grid">
                  {filteredCards.map((item, index) => {
                    return (
                      <button
                        type="button"
                        key={item.id}
                        className="image-cell"
                        onClick={(e) => {
                          e.stopPropagation();
                          tap();
                          setSelectedCardId(item.id);
                          setFlipped(false);
                          setStep("detail");
                          playSuccess();
                        }}
                        aria-label={`Görsel ${index + 1}`}
                      >
                        <img
                          className="image-cell__img"
                          src={toViewableUrl(item.imageUrl || DEFAULT_IMAGE)}
                          data-original-src={item.imageUrl || ""}
                          alt={`Görsel ${index + 1}`}
                          loading="eager"
                          decoding="async"
                          onError={(event) => {
                            const img = event.currentTarget;
                            const original = img.getAttribute("data-original-src");
                            if (original && img.src !== original) {
                              img.onerror = null;
                              img.src = original;
                              return;
                            }
                            img.onerror = null;
                            img.src = DEFAULT_IMAGE;
                          }}
                        />
                        <button
                          type="button"
                          className="card-delete"
                          onClick={(e) => { e.stopPropagation(); removePublication(item.id); }}
                          aria-label="Kartı sil"
                        >
                          ✕
                        </button>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* ---- 4. DETAY (3D KARUSEL) ---- */}
          {step === "detail" && selectedCardId && (
            <section className="step-fade">
              <div style={{ padding: "0 8px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <button type="button" className="nav-back" onClick={() => { setStep("cards"); playClick(); }} aria-label="Kartlara dön">‹ Kartlara dön</button>
                <div style={{ display: "flex", gap: 8 }}>
                  {(() => {
                    const currentIndex = filteredCards.findIndex((p) => p.id === selectedCardId);
                    const prevCard = currentIndex > 0 ? filteredCards[currentIndex - 1] : null;
                    const nextCard = currentIndex < filteredCards.length - 1 ? filteredCards[currentIndex + 1] : null;
                    return (
                      <>
                        {prevCard && (
                          <button type="button" className="nav-btn" onClick={(e) => { e.stopPropagation(); setSelectedCardId(prevCard.id); playClick(); }} aria-label="Önceki kart">‹</button>
                        )}
                        {nextCard && (
                          <button type="button" className="nav-btn" onClick={(e) => { e.stopPropagation(); setSelectedCardId(nextCard.id); playClick(); }} aria-label="Sonraki kart">›</button>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
              <div className="detail-3d-wrap">
                <div
                  ref={carouselRef}
                  className="detail-3d-carousel"
                  role="list"
                  aria-label="Kart detayı"
                  onScroll={handleCarouselScroll}
                >
                  {filteredCards.map((item) => {
                    const language = languageMap.get(item.languageId) ?? LANGUAGE_SEEDS[0];
                    const topic = topicMap.get(item.topicId);
                    return (
                      <button
                        type="button"
                        key={item.id}
                        data-card-id={item.id}
                        className="detail-card"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Swipe sonrası oluşan tıklamayı yoksay
                          if (suppressClickRef.current) return;
                          tap();
                          setSelectedCardId(item.id);
                          playSuccess();
                        }}
                        aria-label={`${language.name} · ${topic?.title ?? "Konu"}`}
                      >
                        <img
                          className="detail-card__img"
                          src={toViewableUrl(item.imageUrl || DEFAULT_IMAGE)}
                          data-original-src={item.imageUrl || ""}
                          alt={`${language.name} · ${topic?.title ?? "Konu"}`}
                          loading="eager"
                          decoding="async"
                          onError={(event) => {
                            const img = event.currentTarget;
                            const original = img.getAttribute("data-original-src");
                            if (original && img.src !== original) {
                              img.onerror = null;
                              img.src = original;
                              return;
                            }
                            img.onerror = null;
                            img.src = DEFAULT_IMAGE;
                          }}
                        />
                        <div className="detail-card__info">
                          <span className="detail-card__icon">{language.icon}</span>
                          <span className="detail-card__title">{language.name}</span>
                          <span className="detail-card__sub">{topic?.title ?? "Konu"} · {item.level}</span>
                        </div>
                        <button
                          type="button"
                          className="card-delete"
                          onClick={(e) => { e.stopPropagation(); removePublication(item.id); }}
                          aria-label="Kartı sil"
                        >
                          ✕
                        </button>
                      </button>
                    );
                  })}
                </div>
              </div>
              <p style={{ marginTop: 10, textAlign: "center", fontSize: 12, color: "rgba(27,42,74,.45)", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase" }}>
                Sağ · sola kaydır · merkezdekine dokun
              </p>
            </section>
          )}
        </div>
      </main>

      <footer className="app-footer">ENGIN HAFIZA · 3D kart akışı</footer>

      {/* Yükleme alanı (ana sayfada, admin tarzında) */}
      <section
        className="composer"
        aria-label="Yeni yayın ekle"
        style={{ marginTop: 26 }}
      >
        <div className="composer-head">
          <span>YENİ YAYIN</span>
          <span>GÖRSEL YÜKLE</span>
        </div>
        <div className="form-step">
          <div className="step-head">
            <span className="step-number">01</span>
            <span><strong>Dil seç</strong><small>{LANGUAGE_SEEDS.length} dil</small></span>
          </div>
          <div className="select-wrap">
            <span className="select-code">{selectedLanguage.icon}</span>
            <select
              aria-label="Dil seç"
              id="language-select"
              name="language"
              value={state.languageId}
              onChange={(event) => setState((previous) => ({ ...previous, languageId: event.target.value }))}
            >
              {LANGUAGE_SEEDS.map((language) => (
                <option key={language.id} value={language.id}>{language.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-step">
          <div className="step-head">
            <span className="step-number">02</span>
            <span><strong>Konu seç</strong><small>A1–C1 · konular</small></span>
          </div>
          <div className="select-wrap">
            <span className="select-code is-level">{selectedTopic.level}</span>
            <select
              aria-label="Konu seç"
              id="topic-select"
              name="topic"
              value={state.topicId}
              onChange={(event) => setState((previous) => ({ ...previous, topicId: event.target.value }))}
            >
              {TOPICS.map((topic) => (
                <option key={topic.id} value={topic.id}>{topic.title}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-step is-last">
          <div className="step-head">
            <span className="step-number">03</span>
            <span><strong>Görsel yükle</strong><small>Fotoğraf veya galeri</small></span>
          </div>
          {/* Yayına ekle ve Yapıştır butonları yan yana, eşit orantılı */}
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <button
              type="button"
              onClick={pasteFromClipboard}
              disabled={busy || publishing}
              aria-label="Panodaki görseli yapıştır"
              title="Panodaki görseli yapıştır"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                flex: 1,
                minHeight: "54px",
                padding: 0,
                borderRadius: "13px",
                border: "1px solid rgba(139,0,0,.35)",
                background: "rgba(139,0,0,.06)",
                color: "#8b0000",
                fontSize: "16px",
                fontWeight: 850,
                cursor: busy || publishing ? "not-allowed" : "pointer",
              }}
            >
              📋 Yapıştır
            </button>
            <button
              type="button"
              className="publish-button"
              onClick={publish}
              disabled={!draftImage || busy || publishing}
              style={{
                flex: 1,
                minHeight: "54px",
                borderRadius: "13px",
                fontSize: "16px",
                fontWeight: 850,
              }}
            >
              {publishing ? "Ekleniyor..." : "Yayına ekle"}
            </button>
          </div>
          <label className={`upload-zone ${draftImage ? "has-image" : ""}`} htmlFor="image-file">
            {draftImage ? (
              <>
                <img
                  src={toViewableUrl(draftImage)}
                  data-original-src={draftImage}
                  alt="Yayınlanacak görsel önizlemesi"
                  onError={(event) => {
                    const img = event.currentTarget;
                    const original = img.getAttribute("data-original-src");
                    if (original && img.src !== original) {
                      img.onerror = null;
                      img.src = original;
                      return;
                    }
                    img.onerror = null;
                    img.src = DEFAULT_IMAGE;
                  }}
                />
                <span className="upload-overlay">Değiştir</span>
              </>
            ) : (
              <span className="upload-placeholder">
                <span className="upload-icon">📷</span>
                <strong>{busy ? "Hazırlanıyor..." : "Görsel seç"}</strong>
                <small>Dokun ve fotoğrafını yükle</small>
              </span>
            )}
          </label>
          <input
            id="image-file"
            className="file-input"
            type="file"
            accept="image/*"
            onChange={handleFile}
            disabled={busy || publishing}
          />
          {fileName && <div className="file-name">Seçildi: {fileName}</div>}
          {!draftImage && (
            <div style={{ fontSize: 10, color: "rgba(27,42,74,.45)", marginTop: 4, textAlign: "center" }}>
              📋 Görseli kopyalayıp <strong>Yapıştır</strong>&apos;a dokun (PC&apos;de Ctrl + V)
            </div>
          )}
        </div>
        <div className="selection-summary">
          <span>{selectedLanguage.icon}</span>
          <strong>{selectedLanguage.name}</strong>
          <span className="summary-dot">·</span>
          <span>{selectedTopic.level}</span>
          <span className="summary-dot">·</span>
          <span className="summary-topic">{selectedTopic.title}</span>
        </div>
      </section>

      {toast && (
        <div className="toast toast-info" role="status">
          <span className="toast-dot" />{toast}
        </div>
      )}
    </div>
  );
}
