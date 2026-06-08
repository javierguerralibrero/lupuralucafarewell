"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CrearForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successSlug, setSuccessSlug] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.[0]) setFile(e.target.files[0]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !message.trim()) {
      setError("Por favor rellena tu nombre y mensaje.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("message", message.trim());
      if (file) formData.append("file", file);

      const res = await fetch("/api/submit", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Algo salió mal. Inténtalo de nuevo.");
        setLoading(false);
        return;
      }

      setSuccessSlug(data.slug);
      router.push(`/${data.slug}`);
    } catch {
      setError("Error de conexión. Inténtalo de nuevo.");
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "#111",
    border: "1px solid #333",
    borderRadius: "6px",
    padding: "12px 16px",
    color: "#fff",
    fontSize: "1rem",
    fontFamily: "Georgia, serif",
    outline: "none",
  };

  return (
    <div style={{ background: "#0a0a0a", minHeight: "100vh", color: "#fff", padding: "40px 20px" }}>
      <div style={{ maxWidth: "620px", margin: "0 auto" }}>
        {/* Back */}
        <Link href="/" style={{ color: "#555", fontSize: "0.85rem", display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "32px" }}>
          ← Volver al muro
        </Link>

        {/* Title */}
        <h1 style={{ fontFamily: "Impact, Arial Black, sans-serif", fontSize: "2rem", letterSpacing: "0.05em", marginBottom: "8px" }}>
          Tu despedida para Dan &amp; Raluca
        </h1>
        <p style={{ color: "#888", marginBottom: "36px", lineHeight: "1.6" }}>
          Rellena esto. La IA diseña el resto — tú no tocas nada.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Name */}
          <div>
            <label style={{ display: "block", color: "#aaa", fontSize: "0.85rem", marginBottom: "8px", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              Tu nombre o el de tu familia
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Los García, Ana y Marcos..."
              style={inputStyle}
              required
            />
          </div>

          {/* Message */}
          <div>
            <label style={{ display: "block", color: "#aaa", fontSize: "0.85rem", marginBottom: "8px", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              Escribe lo que quieras decirles...
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Un recuerdo, una anécdota, un deseo... lo que salga del corazón."
              rows={6}
              style={{ ...inputStyle, resize: "vertical" }}
              required
            />
          </div>

          {/* File upload */}
          <div>
            <label style={{ display: "block", color: "#aaa", fontSize: "0.85rem", marginBottom: "8px", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              Foto o vídeo (opcional · máx 200 MB)
            </label>
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${dragging ? "#e94560" : "#333"}`,
                borderRadius: "8px",
                padding: "32px",
                textAlign: "center",
                cursor: "pointer",
                background: dragging ? "#1a0a0e" : "#0f0f0f",
                transition: "all 0.2s",
              }}
            >
              {file ? (
                <div>
                  <p style={{ color: "#f5c97a", marginBottom: "4px" }}>✓ {file.name}</p>
                  <p style={{ color: "#555", fontSize: "0.8rem" }}>{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                </div>
              ) : (
                <div>
                  <p style={{ color: "#555", marginBottom: "4px" }}>Arrastra aquí o haz clic para seleccionar</p>
                  <p style={{ color: "#333", fontSize: "0.8rem" }}>Imágenes o vídeos</p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
          </div>

          {/* Magic box */}
          <div style={{
            background: "rgba(100, 50, 180, 0.15)",
            border: "1px solid rgba(100, 50, 180, 0.4)",
            borderRadius: "8px",
            padding: "20px",
          }}>
            <p style={{ color: "#c084fc", fontSize: "0.9rem", margin: 0, lineHeight: "1.6" }}>
              ✨ <strong>Claude AI</strong> generará una página única y personalizada con tu mensaje — layout, colores, tipografía, animaciones, todo. Cada página es una obra de arte diferente.
            </p>
          </div>

          {/* Error */}
          {error && (
            <p style={{ color: "#e94560", fontSize: "0.9rem" }}>{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              background: loading ? "#444" : "#e94560",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              padding: "16px",
              fontSize: "1.1rem",
              fontFamily: "Impact, sans-serif",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background 0.2s",
            }}
          >
            {loading ? "✨ La IA está creando tu página..." : "🚀 Crear mi página"}
          </button>
        </form>
      </div>
    </div>
  );
}
