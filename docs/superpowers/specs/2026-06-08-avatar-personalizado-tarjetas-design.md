# Avatares personalizados en tarjetas de despedida

**Fecha:** 2026-06-08  
**Proyecto:** lupuralucafarewell — web de despedida para Dan Lupu y Raluca  
**Estado:** Aprobado — pendiente de implementación

---

## Contexto del proyecto

Web de despedida para Dan y Raluca, pareja rumana que se muda de Madrid a la Costa Azul francesa. Los amigos crean tarjetas personalizadas en `/crear` con fotos y mensajes. Claude AI genera el HTML de cada tarjeta. Las tarjetas se ven en `/{slug}`.

Dan y Raluca tienen avatares de HeyGen (talking photo) ya generados:
- Dan habla en inglés estilo Forrest Gump (voz: Warm William, `31e2fd6e7c924bc9be987ac4cfaac5e8`)
- Raluca habla en español estilo Chiquito de la Calzada (voz: Camila Vega Excited, `e85822bd14e144e8b6fe73da2fb1085c`)

HeyGen asset IDs de las fotos base ya subidas:
- Dan: `9aac339324c34bcf865ff3db8ac13408` (o el último disponible — verificar en `/v1/talking_photo.list`)
- Raluca: `fb1bce7ae0fc48879d53d10e98b87aa7` (o el último disponible)

API Key HeyGen: en 1Password vault "Javier" → "HeyGen API Key — lupuralucafarewell"

---

## Feature: Vídeos personalizados Dan & Raluca en cada tarjeta

### Qué hace

Cuando un amigo crea su tarjeta, puede escribir una descripción libre ("cuando jugamos al pádel siempre me ganaba pero nunca lo admitía..."). Claude genera dos guiones en personaje — uno para Dan (Forrest Gump) y otro para Raluca (Chiquito). HeyGen genera los vídeos en background. Cuando están listos aparecen automáticamente en la tarjeta del amigo.

### Decisiones de diseño

- **Ambos avatares siempre** — es una despedida de pareja, los dos aparecen en cada tarjeta
- **IA genera los guiones** — el amigo describe, Claude escribe en personaje (~25 palabras cada uno)
- **Generación asíncrona** — tarjeta visible al instante, vídeos aparecen solos cuando están listos (~40-60s)
- **Campo opcional** — si el amigo no escribe nada, la tarjeta funciona igual sin vídeos
- **Fondo oscuro `#0a0a0a`** — coincide con el site, avatares integrados visualmente sin chroma key

---

## Modelo de datos

`meta/{slug}.json` — añadir campos:

```json
{
  "avatarPrompt": "texto libre del amigo",
  "danScript": "guión Forrest Gump generado por Claude",
  "ralucaScript": "guión Chiquito generado por Claude",
  "avatarStatus": "pending | ready | failed",
  "danVideoUrl": "https://blob.vercel-storage.com/avatars/{slug}/dan.mp4",
  "ralucaVideoUrl": "https://blob.vercel-storage.com/avatars/{slug}/raluca.mp4"
}
```

Nuevos blobs en Vercel Blob:
- `avatars/{slug}/dan.mp4`
- `avatars/{slug}/raluca.mp4`

---

## Cambios en formulario (`/crear/CrearForm.tsx`)

Añadir un campo nuevo antes del botón de enviar:

```
Label: "¿Qué quieres que te digan Dan y Raluca? (opcional)"
Placeholder: "Cuéntanos algo — un recuerdo, una broma, un momento especial con ellos..."
Tipo: textarea, 3 filas
Campo: avatarPrompt
```

El campo es opcional. Si está vacío, no se generan vídeos.

---

## Rutas API

### `POST /api/submit` (modificar)

Cambios mínimos:
1. Leer `avatarPrompt` del FormData
2. Guardarlo en el meta JSON (con `avatarStatus: "pending"` si no está vacío, campo omitido si está vacío)
3. Si `avatarPrompt` no está vacío, disparar `fetch("/api/generate-avatars", { method: "POST", body: JSON.stringify({ slug }) })` **sin await** (fire-and-forget)
4. Retornar slug inmediatamente como ahora

### `POST /api/generate-avatars` (nueva)

`maxDuration: 120`

Flujo:
1. Leer `slug` del body
2. Leer meta de Vercel Blob → obtener `avatarPrompt`, `name`
3. Llamar a Claude para generar ambos guiones:
   - System: "Eres un asistente que escribe guiones cortos para avatares de despedida."
   - Prompt: genera `danScript` (inglés, Forrest Gump, cálido, ~25 palabras, referenciando al amigo por nombre) y `ralucaScript` (español, Chiquito de la Calzada, expresivo, ~25 palabras)
   - Devolver JSON: `{ danScript, ralucaScript }`
4. Llamar a HeyGen v3 en paralelo para Dan y Raluca:
   - `POST https://api.heygen.com/v3/videos` con `type: "image"`, `image: { type: "asset_id", asset_id: ... }`, `script`, `voice_id`, `background_color: "#0a0a0a"`
5. Hacer polling hasta completado (timeout 90s)
6. Descargar MP4s y subir a Vercel Blob como `avatars/{slug}/dan.mp4` y `avatars/{slug}/raluca.mp4`
7. Actualizar meta: `avatarStatus: "ready"`, `danVideoUrl`, `ralucaVideoUrl`, `danScript`, `ralucaScript`
8. En caso de error en cualquier paso: actualizar meta con `avatarStatus: "failed"`, no romper la tarjeta

### `GET /api/avatar-status/[slug]` (nueva)

Lee `meta/{slug}.json` de Vercel Blob.  
Devuelve: `{ status: "pending"|"ready"|"failed"|"none", danVideoUrl?, ralucaVideoUrl? }`  
Si el meta no tiene `avatarStatus`, devuelve `{ status: "none" }`.

---

## Tarjeta generada (`/{slug}`)

El HTML que Claude genera ya incluye siempre los placeholders cuando hay `avatarPrompt`. Claude recibe como contexto adicional si hay `avatarPrompt` y añade en el HTML:

```html
<!-- Avatares Dan & Raluca -->
<div id="avatar-dan" data-avatar="dan" style="..."></div>
<div id="avatar-raluca" data-avatar="raluca" style="..."></div>

<script>
(function() {
  var slug = "{{SLUG}}";
  var interval = setInterval(function() {
    fetch("/api/avatar-status/" + slug)
      .then(function(r) { return r.json(); })
      .then(function(d) {
        if (d.status === "ready") {
          clearInterval(interval);
          ["dan","raluca"].forEach(function(p) {
            var el = document.querySelector("[data-avatar='" + p + "']");
            if (!el) return;
            var v = document.createElement("video");
            v.src = p === "dan" ? d.danVideoUrl : d.ralucaVideoUrl;
            v.autoplay = true; v.playsInline = true; v.controls = false;
            v.style.width = "100%"; v.style.borderRadius = "8px";
            el.innerHTML = ""; el.appendChild(v);
          });
        } else if (d.status === "failed" || d.status === "none") {
          clearInterval(interval);
        }
      });
  }, 5000);
})();
</script>
```

Si `avatarStatus` ya es `ready` cuando Claude genera el HTML (no aplica en v1 porque el HTML se genera antes), los vídeos se incluyen directamente. En v1 siempre van como placeholder + polling.

---

## Prompt de Claude para guiones

```
El amigo "{name}" ha escrito esto para Dan y Raluca: "{avatarPrompt}"

Genera dos guiones cortos de despedida personalizados para este amigo:

1. DAN (estilo Forrest Gump): En inglés. Cálido, sureño, lento. Empieza con "Mama always said..." o similar. Máximo 30 palabras. Que mencione algo relacionado con lo que escribió el amigo.

2. RALUCA (estilo Chiquito de la Calzada): En español. Explosivo, usa "¡Fistro!", "¡pecador!", "¡jarl!", "¡No puedor creer!". Máximo 30 palabras. Que mencione algo relacionado con lo que escribió el amigo.

Responde en JSON: { "danScript": "...", "ralucaScript": "..." }
```

---

## Consideraciones de coste

- ~$0.10-0.20 por tarjeta (dos vídeos de ~7 segundos a $0.05/seg)
- Con 20 amigos: ~$2-4 total adicional
- Los $5 cargados en HeyGen cubren fácilmente toda la web

---

## Archivos a modificar / crear

| Archivo | Acción |
|---------|--------|
| `app/crear/CrearForm.tsx` | Añadir campo `avatarPrompt` |
| `app/api/submit/route.ts` | Leer `avatarPrompt`, fire-and-forget a generate-avatars |
| `app/api/generate-avatars/route.ts` | Crear — orquesta Claude + HeyGen + Blob |
| `app/api/avatar-status/[slug]/route.ts` | Crear — devuelve estado del meta |
| `lib/heygen.ts` | Crear — funciones reutilizables de HeyGen API |
| `lib/claude.ts` | Añadir función `generateAvatarScripts` |

---

## Fuera de alcance (v1)

- Photocall mode (pantalla para la fiesta) — siguiente feature
- Chroma key / fondo transparente — v2
- Regenerar vídeos si el amigo edita su tarjeta
- Notificación al amigo cuando los vídeos están listos
