"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const VIDEO_LARGE_THRESHOLD = 80 * 1024 * 1024; // 80 MB → lower quality

async function convertVideo(
  file: File,
  onProgress: (pct: number) => void
): Promise<File> {
  const { FFmpeg } = await import("@ffmpeg/ffmpeg");
  const { fetchFile, toBlobURL } = await import("@ffmpeg/util");

  const ffmpeg = new FFmpeg();
  ffmpeg.on("progress", ({ progress }) => onProgress(Math.round(progress * 100)));

  const base = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
  await ffmpeg.load({
    coreURL: await toBlobURL(`${base}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${base}/ffmpeg-core.wasm`, "application/wasm"),
  });

  const ext = file.name.split(".").pop() || "mp4";
  const inputName = `in.${ext}`;
  await ffmpeg.writeFile(inputName, await fetchFile(file));

  // Large files: compress harder (crf 28). Small files: preserve quality (crf 20).
  const crf = file.size > VIDEO_LARGE_THRESHOLD ? "28" : "20";

  await ffmpeg.exec([
    "-i", inputName,
    "-vf", "scale='min(1280,iw)':-2",
    "-c:v", "libx264",
    "-crf", crf,
    "-preset", "fast",
    "-c:a", "aac",
    "-b:a", "128k",
    "-movflags", "+faststart",
    "out.mp4",
  ]);

  const data = await ffmpeg.readFile("out.mp4");
  const bytes = new Uint8Array(data instanceof Uint8Array ? data : new Uint8Array());
  return new File([bytes], "video.mp4", { type: "video/mp4" });
}

export default function CrearForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [instructions, setInstructions] = useState("");
  const [avatarPrompt, setAvatarPrompt] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function addFiles(newFiles: FileList | null) {
    if (!newFiles) return;
    setFiles((prev) => [...prev, ...Array.from(newFiles)].slice(0, 6));
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function handleDrop(e: DragEvent<HTMLElement>) {
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
      // 1. Upload all files directly to Vercel Blob from the browser
      const uploadedUrls: string[] = [];
      const ts = Date.now();

      for (let i = 0; i < files.length; i++) {
        let file = files[i];
        const isVideo = file.type.startsWith("video/");

        // Always convert video to H.264 MP4 for universal browser compatibility
        if (isVideo) {
          setStatusMsg(`Convirtiendo vídeo ${i + 1}/${files.length} a formato compatible...`);
          setProgress(0);
          file = await convertVideo(file, setProgress);
          setProgress(null);
        }

        setStatusMsg(`Subiendo archivo ${i + 1} de ${files.length}...`);
        const ext = file.name.split(".").pop() || "bin";
        const key = `uploads/tmp-${ts}-${i}.${ext}`;
        const { url: presignedUrl, publicUrl } = await fetch("/api/blob-upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, contentType: file.type || "application/octet-stream" }),
        }).then((r) => r.json());
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.upload.onprogress = (e) => { if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100)); };
          xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`)));
          xhr.onerror = () => reject(new Error("Upload network error"));
          xhr.open("PUT", presignedUrl);
          xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
          xhr.send(file);
        });
        uploadedUrls.push(publicUrl);
        setProgress(null);
      }

      // 2. Submit metadata + URLs (no raw files) to the server
      setStatusMsg("🎩 SebâstIAn está creando tu página...");
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("message", message.trim());
      formData.append("instructions", instructions.trim());
      formData.append("avatarPrompt", avatarPrompt.trim());
      formData.append("existingMediaUrls", JSON.stringify(uploadedUrls));

      const res = await fetch("/api/submit", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Algo salió mal. Inténtalo de nuevo.");
        setLoading(false);
        setStatusMsg("");
        return;
      }

      router.push(`/${data.slug}`);
    } catch (err) {
      console.error(err);
      setError("Error de conexión. Inténtalo de nuevo.");
      setLoading(false);
      setStatusMsg("");
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
          Rellena esto. SebâstIAn diseña el resto — tú no tocas nada.
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
            <label
              htmlFor="file-upload-input"
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              style={{
                display: "block",
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
              <p style={{ color: "#333", fontSize: "0.8rem" }}>Fotos y/o vídeos · máx 6 archivos · sin límite de tamaño</p>
            </label>
            <input
              id="file-upload-input"
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleFileChange}
              style={{ position: "absolute", opacity: 0, width: "1px", height: "1px", overflow: "hidden" }}
            />

            {files.length > 0 && (
              <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                {files.map((f, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#111", border: "1px solid #222", borderRadius: "6px", padding: "8px 12px" }}>
                    <span style={{ color: "#f5c97a", fontSize: "0.85rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "80%" }}>
                      {f.type.startsWith("video/") ? "🎬" : "📷"} {f.name}
                      <span style={{ color: "#555", marginLeft: "8px" }}>{(f.size / 1024 / 1024).toFixed(1)} MB</span>
                      {f.type.startsWith("video/") && (
                        <span style={{ color: "#c084fc", marginLeft: "8px", fontSize: "0.75rem" }}>se convertirá a MP4</span>
                      )}
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
              🎩 <strong>SebâstIAn</strong> generará una página única y personalizada con tu mensaje — cada uno recibe un estilo visual diferente: póster vintage, carta manuscrita, portada de periódico, galería minimalista... ninguna igual.
            </p>
          </div>

          {/* Avatar prompt — hidden until avatars are ready */}
          {false && (
          <div style={{ background: "rgba(229, 69, 96, 0.08)", border: "1px solid rgba(229, 69, 96, 0.3)", borderRadius: "8px", padding: "20px" }}>
            <label style={{ display: "block", color: "#f5c97a", fontSize: "0.85rem", marginBottom: "4px", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              ¿Qué quieres que te digan Dan y Raluca? (opcional)
            </label>
            <p style={{ color: "#888", fontSize: "0.8rem", marginBottom: "12px", lineHeight: "1.5" }}>
              Cuéntanos algo — un recuerdo, una broma, un momento especial con ellos... SebâstIAn generará un mensaje personalizado en voz de Dan y Raluca para tu tarjeta.
            </p>
            <textarea
              value={avatarPrompt}
              onChange={(e) => setAvatarPrompt(e.target.value)}
              placeholder="Ej: Cuando jugamos al pádel siempre me ganaba pero nunca lo admitía..."
              rows={3}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>
          )}

          {/* Instructions */}
          <div>
            <label style={{ display: "block", color: "#aaa", fontSize: "0.85rem", marginBottom: "8px", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              Para SebâstIAn 🎩 (opcional)
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Ej: Fondo negro con olas de mar en turquesa, vídeo grande centrado, iconos de corazones flotando, tipografía elegante en dorado..."
              rows={3}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>

          {error && <p style={{ color: "#e94560", fontSize: "0.9rem" }}>{error}</p>}

          {/* Loading state with progress */}
          {loading && (
            <div style={{ background: "#111", border: "1px solid #222", borderRadius: "8px", padding: "16px" }}>
              <p style={{ color: "#c084fc", fontSize: "0.9rem", margin: "0 0 10px" }}>{statusMsg}</p>
              {progress !== null && (
                <div style={{ background: "#222", borderRadius: "4px", height: "4px", overflow: "hidden" }}>
                  <div style={{ background: "#e94560", height: "100%", width: `${progress}%`, transition: "width 0.3s ease", borderRadius: "4px" }} />
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              background: loading ? "#222" : "#e94560",
              color: loading ? "#555" : "#fff",
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
            {loading ? "Procesando..." : "🚀 Crear mi página"}
          </button>
        </form>
      </div>
    </div>
  );
}
