"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  createInitialState,
  loadState,
  makeId,
  persistState,
  type LocalState,
} from "@/lib/client-utils";
import { LANGUAGE_SEEDS, TOPICS } from "@/lib/seed";
import { LEVELS, DEFAULT_IMAGE, type Publication, toViewableUrl } from "@/lib/types";

interface AdminPanelProps {
  initialPublications: Publication[];
}

const languageMap = new Map(LANGUAGE_SEEDS.map((item) => [item.id, item]));
const topicMap = new Map(TOPICS.map((item) => [item.id, item]));

export default function AdminPanel({ initialPublications }: AdminPanelProps) {
  const [state, setState] = useState<LocalState>(() => createInitialState(initialPublications));
  const [draftImage, setDraftImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState(false);
  const [filterLanguage, setFilterLanguage] = useState("");
  const [filterTopic, setFilterTopic] = useState("");
  const toastTimer = useRef<number | null>(null);

  useEffect(() => {
    setState(loadState(initialPublications));
  }, [initialPublications]);

  useEffect(() => {
    try {
      persistState(state);
    } catch {
      // sessis
    }
  }, [state]);

  const notify = (message: string) => {
    // basit tarayıcı uyarısı (admin paneli için minimal)
    window.alert(message);
  };

  const filtered = useMemo(() => {
    return (state.publications || []).filter((item) => {
      if (filterLanguage && item.languageId !== filterLanguage) return false;
      if (filterTopic && item.topicId !== filterTopic) return false;
      return true;
    });
  }, [state.publications, filterLanguage, filterTopic]);

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
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
      } else {
        URL.revokeObjectURL(previewUrl);
        setDraftImage(null);
        notify(data.error || "Görsel yüklenemedi.");
      }
    } catch (error) {
      notify(error instanceof Error ? error.message : "Görsel yüklenemedi.");
    } finally {
      setBusy(false);
      event.currentTarget.value = "";
    }
  };

  const addPublication = async () => {
    if (!draftImage) return;
    const topic = topicMap.get(state.topicId) ?? TOPICS[0];
    const item = {
      id: makeId("pub"),
      languageId: state.languageId,
      level: topic.level,
      topicId: state.topicId,
      imageUrl: draftImage,
      createdAt: new Date().toISOString(),
    };
    try {
      const res = await fetch("/api/publications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      const data = await res.json();
      if (res.ok && data.ok && data.publication) {
        setState((previous) => ({ ...previous, publications: [data.publication, ...(previous.publications || [])] }));
        setDraftImage(null);
        setFileName("");
        notify("Yayın eklendi.");
      } else {
        notify(data.error || "Yayın eklenemedi.");
      }
    } catch {
      notify("Yayın eklenemedi.");
    }
  };

  const removePublication = async (id: string) => {
    if (!window.confirm("Bu yayını silmek istediğinizden emin misiniz?")) return;
    setState((previous) => ({
      ...previous,
      publications: (previous.publications || []).filter((item) => item.id !== id),
    }));
    try {
      await fetch(`/api/publications?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    } catch {
      // sessis
    }
    notify("Yayın silindi.");
  };

  const totalByLanguage = useMemo(() => {
    const counts: Record<string, number> = {};
    (state.publications || []).forEach((item) => {
      counts[item.languageId] = (counts[item.languageId] || 0) + 1;
    });
    return counts;
  }, [state.publications]);

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto", fontFamily: "system-ui, sans-serif", color: "#1b2a4a" }}>
      <h1 style={{ fontSize: 26, marginBottom: 8, letterSpacing: "-.02em" }}>Yönetim Paneli</h1>
      <p style={{ marginBottom: 24, color: "rgba(27, 42, 74, 0.6)" }}>
        Tüm yayınları burada görebilir, silebilir ve yeni yayın ekleyebilirsiniz. Bu sayfa ana ekranda görünmez.
      </p>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 160 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: "rgba(27, 42, 74, 0.7)" }}>Dil filtresi</label>
          <select
            id="admin-filter-language"
            name="filter-language"
            value={filterLanguage}
            onChange={(e) => setFilterLanguage(e.target.value)}
            style={{ padding: 8, borderRadius: 8, border: "1px solid rgba(27,42,74,.13)", background: "#fff" }}
          >
            <option value="">Tüm diller</option>
            {LANGUAGE_SEEDS.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 160 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: "rgba(27, 42, 74, 0.7)" }}>Konu filtresi</label>
          <select
            id="admin-filter-topic"
            name="filter-topic"
            value={filterTopic}
            onChange={(e) => setFilterTopic(e.target.value)}
            style={{ padding: 8, borderRadius: 8, border: "1px solid rgba(27,42,74,.13)", background: "#fff" }}
          >
            <option value="">Tüm konular</option>
            {TOPICS.map((t) => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, justifyContent: "flex-end" }}>
          <button
            onClick={() => setFilterLanguage("")}
            style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(27,42,74,.13)", background: "#fbfaf8", cursor: "pointer" }}
          >
            Sıfırla
          </button>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16 }}>
        <strong style={{ fontSize: 14 }}>{filtered.length} yayın</strong>
        <div style={{ display: "flex", gap: 6, fontSize: 11, color: "rgba(27, 42, 74, 0.6)" }}>
          {Object.entries(totalByLanguage).map(([langId, count]) => {
            const lang = languageMap.get(langId);
            return lang ? (
              <span key={langId} style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "rgba(139,0,0,.08)", padding: "3px 8px", borderRadius: 6, color: "#8b0000", fontWeight: 700 }}>
                {lang.icon} {lang.name}: {count}
              </span>
            ) : null;
          })}
        </div>
      </div>

      {/* Yayın ekleme */}
      <section
        style={{
          border: "1px solid rgba(27,42,74,.13)",
          borderRadius: 16,
          padding: 20,
          background: "#fff",
          marginBottom: 24,
          boxShadow: "0 8px 22px rgba(27,42,74,.07)",
        }}
      >
        <h2 style={{ fontSize: 16, marginBottom: 16, letterSpacing: ".1em", textTransform: "uppercase", color: "#8b0000" }}>Yeni yayın ekle</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "rgba(27,42,74,.7)" }}>Dil</label>
            <select
              id="admin-language-select"
              name="language"
              value={state.languageId}
              onChange={(e) => setState((prev) => ({ ...prev, languageId: e.target.value }))}
              style={{ padding: 10, borderRadius: 10, border: "1px solid rgba(27,42,74,.13)", background: "#fbfaf8" }}
            >
              {LANGUAGE_SEEDS.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "rgba(27,42,74,.7)" }}>Konu</label>
            <select
              id="admin-topic-select"
              name="topic"
              value={state.topicId}
              onChange={(e) => setState((prev) => ({ ...prev, topicId: e.target.value }))}
              style={{ padding: 10, borderRadius: 10, border: "1px solid rgba(27,42,74,.13)", background: "#fbfaf8" }}
            >
              {TOPICS.map((t) => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: "rgba(27,42,74,.7)" }}>Görsel</label>
          <div
            style={{
              position: "relative",
              minHeight: 140,
              border: "2px dashed rgba(27,42,74,.22)",
              borderRadius: 14,
              background: "#fbfaf8",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
            }}
            onClick={() => document.getElementById("admin-image-file")?.click()}
          >
            {draftImage ? (
              <img src={toViewableUrl(draftImage)} alt="Önizleme" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 12 }} />
            ) : (
              <div style={{ textAlign: "center", color: "rgba(27,42,74,.6)" }}>
                <div style={{ fontSize: 32, marginBottom: 6 }}>📷</div>
                <div>{busy ? "Hazırlanıyor..." : "Görsel seçin"}</div>
              </div>
            )}
            <input
              id="admin-image-file"
              type="file"
              accept="image/*"
              onChange={handleFile}
              disabled={busy}
              style={{ display: "none" }}
            />
          </div>
          {fileName && <div style={{ marginTop: 8, fontSize: 11, color: "rgba(27,42,74,.6)" }}>{fileName}</div>}
        </div>
        <button
          onClick={addPublication}
          disabled={!draftImage || busy}
          style={{
            width: "100%",
            padding: 14,
            borderRadius: 12,
            border: 0,
            background: !draftImage || busy ? "rgba(139,0,0,.35)" : "#8b0000",
            color: "#fff",
            fontWeight: 800,
            fontSize: 15,
            cursor: !draftImage || busy ? "not-allowed" : "pointer",
          }}
        >
          {busy ? "Ekleniyor..." : "Yayına ekle"}
        </button>
      </section>

      {/* Yayın listesi */}
      <section style={{ border: "1px solid rgba(27,42,74,.13)", borderRadius: 16, padding: 20, background: "#fff", boxShadow: "0 8px 22px rgba(27,42,74,.07)" }}>
        <h2 style={{ fontSize: 16, marginBottom: 16, letterSpacing: ".1em", textTransform: "uppercase", color: "#8b0000" }}>Tüm yayınlar</h2>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "rgba(27,42,74,.6)" }}>Yayın bulunamadı.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
            {filtered.map((item) => {
              const language = languageMap.get(item.languageId) ?? LANGUAGE_SEEDS[0];
              const topic = topicMap.get(item.topicId);
              return (
                <div
                  key={item.id}
                  style={{
                    border: "1px solid rgba(27,42,74,.13)",
                    borderRadius: 12,
                    overflow: "hidden",
                    background: "#fff",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div style={{ position: "relative", aspectRatio: "1 / 1", background: "#fbfaf8" }}>
                    <img
                      src={toViewableUrl(item.imageUrl || DEFAULT_IMAGE)}
                      alt={language.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                    <div style={{ position: "absolute", top: 6, left: 6, background: "rgba(27,42,74,.85)", color: "#fff", padding: "2px 7px", borderRadius: 6, fontSize: 10, fontWeight: 800 }}>
                      {language.icon}
                    </div>
                    <div style={{ position: "absolute", top: 6, right: 6, background: "rgba(139,0,0,.9)", color: "#fff", padding: "2px 7px", borderRadius: 6, fontSize: 10, fontWeight: 800 }}>
                      {item.level}
                    </div>
                  </div>
                  <div style={{ padding: 10, display: "flex", flexDirection: "column", gap: 4 }}>
                    <strong style={{ fontSize: 13 }}>{language.name}</strong>
                    <div style={{ fontSize: 11, color: "rgba(27,42,74,.6)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {topic?.title ?? "Konu"}
                    </div>
                    <div style={{ fontSize: 10, color: "rgba(27,42,74,.4)", marginTop: 4 }}>
                      {new Date(item.createdAt).toLocaleDateString("tr-TR")}
                    </div>
                    <button
                      onClick={() => removePublication(item.id)}
                      style={{
                        marginTop: 6,
                        padding: "6px 10px",
                        borderRadius: 8,
                        border: "1px solid #8b0000",
                        background: "transparent",
                        color: "#8b0000",
                        fontWeight: 700,
                        fontSize: 11,
                        cursor: "pointer",
                        alignSelf: "flex-start",
                      }}
                    >
                      Sil
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
