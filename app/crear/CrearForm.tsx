"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CrearForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [instructions, setInstructions] = useState("");
  const [avatarPrompt, setAvatarPrompt] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function addFiles(newFiles: FileList | null) {
    if (!newFiles) return;
    const arr = Array.from(newFiles);
    setFiles((prev) => {
      const combined = [...prev, ...arr];
      return combined.slice(0, 6); // max 6 files
    });
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    addFiles(e.target.files);
    e.target.value = "";
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
      formData.append("instructions", instructions.trim());
      formData.append("avatarPrompt", avatarPrompt.trim());
      files.forEach((f) => formData.append("files", f));

      const res = await fetch("/api/submit", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Algo salió mal. Inténtalo de nuevo.");
        setLoading(false);
        return;
      }

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
        <Link href="/" style={{ color: "#555", fontSize: "0.85rem", display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "32px" }}>
          ← Volver al muro
        </Link>

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
              Fotos o vídeo (opcional · máx 6 archivos)
            </label>

            {/* Drop zone */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${dragging ? "#e94560" : "#333"}`,
                borderRadius: "8px",
                padding: "24px",
                textAlign: "center",
                cursor: "pointer",
                background: dragging ? "#1a0a0e" : "#0f0f0f",
                transition: "all 0.2s",
              }}
            >
              <p style={{ color: "#555", marginBottom: "4px" }}>Arrastra aquí o haz clic para seleccionar</p>
              <p style={{ color: "#333", fontSize: "0.8rem" }}>Fotos y/o vídeos · máx 6 archivos</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleFileChange}
              style={{ display: "none" }}
            />

            {/* File list */}
            {files.length > 0 && (
              <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                {files.map((f, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#111", border: "1px solid #222", borderRadius: "6px", padding: "8px 12px" }}>
                    <span style={{ color: "#f5c97a", fontSize: "0.85rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "80%" }}>
                      {f.type.startsWith("video/") ? "🎬" : "📷"} {f.name}
                      <span style={{ color: "#555", marginLeft: "8px" }}>{(f.size / 1024 / 1024).toFixed(1)} MB</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: "1rem", padding: "0 4px" }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Magic box */}
          <div style={{ background: "rgba(100, 50, 180, 0.15)", border: "1px solid rgba(100, 50, 180, 0.4)", borderRadius: "8px", padding: "20px" }}>
            <p style={{ color: "#c084fc", fontSize: "0.9rem", margin: 0, lineHeight: "1.6" }}>
              ✨ <strong>Claude AI</strong> generará una página única y personalizada con tu mensaje — cada uno recibe un estilo visual diferente: póster vintage, carta manuscrita, portada de periódico, galería minimalista... ninguna igual.
            </p>
          </div>

          {/* Avatar prompt */}
          <div style={{ background: "rgba(229, 69, 96, 0.08)", border: "1px solid rgba(229, 69, 96, 0.3)", borderRadius: "8px", padding: "20px" }}>
            <label style={{ display: "block", color: "#f5c97a", fontSize: "0.85rem", marginBottom: "4px", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              ¿Qué quieres que te digan Dan y Raluca? (opcional)
            </label>
            <p style={{ color: "#888", fontSize: "0.8rem", marginBottom: "12px", lineHeight: "1.5" }}>
              Cuéntanos algo — un recuerdo, una broma, un momento especial con ellos... La IA generará un mensaje personalizado en voz de Dan y Raluca para tu tarjeta.
            </p>
            <textarea
              value={avatarPrompt}
              onChange={(e) => setAvatarPrompt(e.target.value)}
              placeholder="Ej: Cuando jugamos al pádel siempre me ganaba pero nunca lo admitía..."
              rows={3}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>

          {/* Instructions */}
          <div>
            <label style={{ display: "block", color: "#aaa", fontSize: "0.85rem", marginBottom: "8px", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              Instrucciones para la IA (opcional)
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Ej: Pon el vídeo en el centro. Usa tipografía grande y negrita. Estilo muy colorido..."
              rows={3}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>

          {error && <p style={{ color: "#e94560", fontSize: "0.9rem" }}>{error}</p>}

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
