"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";

interface Props {
  slug: string;
  initialName: string;
  initialMessage: string;
  initialMediaUrls: string[];
  initialInstructions: string;
}

export default function EditarForm({
  slug,
  initialName,
  initialMessage,
  initialMediaUrls,
  initialInstructions,
}: Props) {
  const router = useRouter();
  const [message, setMessage] = useState(initialMessage);
  const [instructions, setInstructions] = useState(initialInstructions);
  const [existingMediaUrls, setExistingMediaUrls] = useState<string[]>(initialMediaUrls);
  const [deletingUrls, setDeletingUrls] = useState<Set<string>>(new Set());
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function addFiles(fileList: FileList | null) {
    if (!fileList) return;
    const arr = Array.from(fileList);
    setNewFiles((prev) => {
      const combined = [...prev, ...arr];
      return combined.slice(0, 6);
    });
  }

  function removeNewFile(index: number) {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function removeExistingMedia(url: string) {
    setDeletingUrls((prev) => new Set(prev).add(url));
    try {
      await fetch("/api/delete-media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      setExistingMediaUrls((prev) => prev.filter((u) => u !== url));
    } catch {
      // Remove from state anyway — blob may already be gone
      setExistingMediaUrls((prev) => prev.filter((u) => u !== url));
    } finally {
      setDeletingUrls((prev) => {
        const next = new Set(prev);
        next.delete(url);
        return next;
      });
    }
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

  function isVideo(url: string) {
    return /\.(mp4|webm|mov|avi)$/i.test(url);
  }

  async function handleDelete() {
    if (!confirm("¿Seguro que quieres borrar tu página? Esto eliminará tu mensaje, fotos y vídeos permanentemente.")) return;
    setLoading(true);
    try {
      await fetch("/api/delete-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      window.location.href = "/";
    } catch {
      setError("Error borrando la página. Inténtalo de nuevo.");
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) {
      setError("El mensaje no puede estar vacío.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("name", initialName);
      formData.append("message", message.trim());
      formData.append("instructions", instructions.trim());
      formData.append("existingMediaUrls", JSON.stringify(existingMediaUrls));
      newFiles.forEach((f) => formData.append("files", f));

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
        <a
          href={`/${slug}`}
          style={{ color: "#555", fontSize: "0.85rem", display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "32px", textDecoration: "none" }}
        >
          ← Volver a la página
        </a>

        <h1 style={{ fontFamily: "Impact, Arial Black, sans-serif", fontSize: "2rem", letterSpacing: "0.05em", marginBottom: "8px" }}>
          Editar tu despedida
        </h1>
        <p style={{ color: "#888", marginBottom: "36px", lineHeight: "1.6" }}>
          Cambia el mensaje, las fotos o las instrucciones — la IA regenerará tu página.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Name (read-only) */}
          <div>
            <label style={{ display: "block", color: "#aaa", fontSize: "0.85rem", marginBottom: "8px", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              Tu nombre o el de tu familia
            </label>
            <div style={{ background: "#111", border: "1px solid #222", borderRadius: "6px", padding: "12px 16px", color: "#666", fontFamily: "Georgia, serif", fontSize: "1rem" }}>
              {initialName}
            </div>
            <p style={{ color: "#444", fontSize: "0.75rem", marginTop: "6px" }}>
              El nombre no se puede cambiar (identifica tu página)
            </p>
          </div>

          {/* Message */}
          <div>
            <label style={{ display: "block", color: "#aaa", fontSize: "0.85rem", marginBottom: "8px", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              Tu mensaje
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

          {/* Existing media */}
          {existingMediaUrls.length > 0 && (
            <div>
              <label style={{ display: "block", color: "#aaa", fontSize: "0.85rem", marginBottom: "8px", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                Archivos actuales
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                {existingMediaUrls.map((url) => {
                  const deleting = deletingUrls.has(url);
                  return (
                    <div
                      key={url}
                      style={{
                        position: "relative",
                        width: "80px",
                        height: "80px",
                        borderRadius: "6px",
                        overflow: "hidden",
                        border: "1px solid #333",
                        opacity: deleting ? 0.4 : 1,
                        transition: "opacity 0.2s",
                      }}
                    >
                      {isVideo(url) ? (
                        <div style={{ width: "100%", height: "100%", background: "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem" }}>
                          🎬
                        </div>
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={url}
                          alt="Media"
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      )}
                      <button
                        type="button"
                        disabled={deleting}
                        onClick={() => removeExistingMedia(url)}
                        style={{
                          position: "absolute",
                          top: "2px",
                          right: "2px",
                          background: "rgba(200,0,0,0.85)",
                          border: "none",
                          borderRadius: "50%",
                          width: "20px",
                          height: "20px",
                          color: "#fff",
                          cursor: deleting ? "not-allowed" : "pointer",
                          fontSize: "0.7rem",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          lineHeight: 1,
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* New file upload */}
          <div>
            <label style={{ display: "block", color: "#aaa", fontSize: "0.85rem", marginBottom: "8px", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              Añadir fotos o vídeos (opcional · máx 6 nuevos)
            </label>
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
              <p style={{ color: "#333", fontSize: "0.8rem" }}>Fotos y/o vídeos</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleFileChange}
              style={{ display: "none" }}
            />

            {newFiles.length > 0 && (
              <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                {newFiles.map((f, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#111", border: "1px solid #222", borderRadius: "6px", padding: "8px 12px" }}>
                    <span style={{ color: "#f5c97a", fontSize: "0.85rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "80%" }}>
                      {f.type.startsWith("video/") ? "🎬" : "📷"} {f.name}
                      <span style={{ color: "#555", marginLeft: "8px" }}>{(f.size / 1024 / 1024).toFixed(1)} MB</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => removeNewFile(i)}
                      style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: "1rem", padding: "0 4px" }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
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
            {loading ? "✨ La IA está regenerando tu página..." : "🔄 Regenerar mi página"}
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            style={{
              background: "none",
              border: "1px solid #333",
              borderRadius: "6px",
              padding: "12px",
              fontSize: "0.85rem",
              fontFamily: "Georgia, serif",
              color: "#555",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "color 0.2s, border-color 0.2s",
            }}
            onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.color = "#e94560"; (e.target as HTMLButtonElement).style.borderColor = "#e94560"; }}
            onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.color = "#555"; (e.target as HTMLButtonElement).style.borderColor = "#333"; }}
          >
            🗑️ Borrar mi página
          </button>
        </form>
      </div>
    </div>
  );
}
