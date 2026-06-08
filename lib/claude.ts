import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const STYLES = [
  {
    name: "vintage travel poster",
    desc: "1930s Art Deco travel poster. Bold geometric shapes, limited color palette (2-3 bold colors + cream/ivory), large serif display font, illustrated borders. Think vintage French Riviera tourism posters.",
    palette: "deep navy, terracotta red, golden yellow on ivory/cream background",
  },
  {
    name: "polaroid scrapbook",
    desc: "Personal scrapbook / photo album aesthetic. White page background, polaroid-style photo frames with handwritten-style captions, torn paper edges, tape/sticker decorations, warm nostalgic feel.",
    palette: "warm whites, kraft paper brown, faded photo tones, red accents",
  },
  {
    name: "cinema title card",
    desc: "Silent film / classic cinema intro card. Black background, elegant white serif typography, film grain texture overlay, horizontal rule decorations, dramatic quote presentation.",
    palette: "pure black, warm white/cream, single gold accent",
  },
  {
    name: "mediterranean mosaic",
    desc: "Colorful Mediterranean tile / mosaic inspired. Geometric tile patterns as background, vibrant colors, bold borders, playful festive energy. Think Barcelona / Côte d'Azur ceramics.",
    palette: "cobalt blue, terracotta, white, turquoise, warm yellow",
  },
  {
    name: "newspaper front page",
    desc: "Old-school newspaper front page. Two or three column layout, serif fonts, fake newspaper name in masthead, article-style text formatting, black ink on yellowed paper.",
    palette: "cream/yellowed paper, dark ink black, single red accent for headlines",
  },
  {
    name: "handwritten letter",
    desc: "Intimate handwritten letter on parchment paper. Slightly off-white textured background, cursive/script fonts, envelope-style decorations, wax seal aesthetic, lined paper guide marks.",
    palette: "aged parchment, deep ink blue/brown, gold wax seal accent",
  },
  {
    name: "minimalist gallery",
    desc: "Clean contemporary art gallery wall. Pure white background, generous whitespace, single large media display, minimal sans-serif typography, one bold accent color used sparingly.",
    palette: "pure white, charcoal black, one vivid accent (coral, cobalt, or emerald)",
  },
  {
    name: "night sky postcard",
    desc: "Dreamy night sky over the sea. Deep gradient from midnight blue to purple, stars, moon reflection on water, romantic and poetic mood. Message floats among the stars.",
    palette: "midnight blue, deep purple, silver starlight, soft gold",
  },
];

export async function generateAvatarScripts(
  name: string,
  avatarPrompt: string
): Promise<{ danScript: string; ralucaScript: string }> {
  const prompt = `El amigo "${name}" ha escrito esto para Dan y Raluca: "${avatarPrompt}"

Genera dos guiones cortos de despedida personalizados para este amigo:

1. DAN (estilo Forrest Gump): En inglés. Cálido, sureño, lento. Empieza con "Mama always said..." o similar. Máximo 30 palabras. Que mencione algo relacionado con lo que escribió el amigo.

2. RALUCA (estilo Chiquito de la Calzada): En español. Explosivo, usa "¡Fistro!", "¡pecador!", "¡jarl!", "¡No puedor creer!". Máximo 30 palabras. Que mencione algo relacionado con lo que escribió el amigo.

Responde en JSON: { "danScript": "...", "ralucaScript": "..." }`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    system:
      "Eres un asistente que escribe guiones cortos para avatares de despedida. Responde SOLO con el JSON solicitado, sin texto adicional.",
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type");

  let text = content.text.trim();
  if (text.startsWith("```json")) text = text.slice(7);
  else if (text.startsWith("```")) text = text.slice(3);
  if (text.endsWith("```")) text = text.slice(0, -3);

  return JSON.parse(text.trim()) as { danScript: string; ralucaScript: string };
}

function injectAvatarSection(html: string, slug: string): string {
  const section = `
<div id="lupuraluca-avatars" style="max-width:800px;margin:48px auto 0;padding:20px;display:flex;gap:32px;justify-content:center;flex-wrap:wrap;">
  <div style="text-align:center;flex:1;min-width:220px;max-width:300px;">
    <div data-avatar="dan" style="background:#111;border:2px solid #e94560;border-radius:12px;aspect-ratio:9/16;display:flex;align-items:center;justify-content:center;overflow:hidden;">
      <p style="color:#555;font-size:0.8rem;font-family:sans-serif;text-align:center;padding:16px;animation:av-pulse 2s ease-in-out infinite;">Dan está preparando<br>su mensaje...</p>
    </div>
    <p style="color:#aaa;font-family:sans-serif;font-size:0.85rem;margin-top:8px;letter-spacing:0.1em;">DAN LUPU</p>
  </div>
  <div style="text-align:center;flex:1;min-width:220px;max-width:300px;">
    <div data-avatar="raluca" style="background:#111;border:2px solid #f5c97a;border-radius:12px;aspect-ratio:9/16;display:flex;align-items:center;justify-content:center;overflow:hidden;">
      <p style="color:#555;font-size:0.8rem;font-family:sans-serif;text-align:center;padding:16px;animation:av-pulse 2s ease-in-out infinite 0.5s;">Raluca está preparando<br>su mensaje...</p>
    </div>
    <p style="color:#aaa;font-family:sans-serif;font-size:0.85rem;margin-top:8px;letter-spacing:0.1em;">RALUCA</p>
  </div>
</div>
<style>@keyframes av-pulse{0%,100%{opacity:.3}50%{opacity:1}}</style>
<script>
(function(){
  var slug="${slug}";
  var interval=setInterval(function(){
    fetch("/api/avatar-status/"+slug)
      .then(function(r){return r.json();})
      .then(function(d){
        if(d.status==="ready"){
          clearInterval(interval);
          ["dan","raluca"].forEach(function(p){
            var el=document.querySelector("[data-avatar='"+p+"']");
            if(!el)return;
            var v=document.createElement("video");
            v.src=p==="dan"?d.danVideoUrl:d.ralucaVideoUrl;
            v.autoplay=true;v.playsInline=true;v.controls=false;v.loop=true;
            v.style.cssText="width:100%;height:100%;object-fit:cover;display:block;";
            el.innerHTML="";el.appendChild(v);
          });
        }else if(d.status==="failed"||d.status==="none"){
          clearInterval(interval);
          var sec=document.getElementById("lupuraluca-avatars");
          if(sec)sec.style.display="none";
        }
      }).catch(function(){});
  },5000);
})();
</script>`;

  const closeBody = html.lastIndexOf("</body>");
  if (closeBody === -1) return html + section;
  return html.slice(0, closeBody) + section + html.slice(closeBody);
}

export async function generateFriendPage(
  name: string,
  message: string,
  mediaUrls: string[] = [],
  instructions?: string,
  avatarPrompt?: string,
  slug?: string
): Promise<string> {
  // Pick a style deterministically based on name (so same person always gets same style if regenerated)
  const styleIndex =
    name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % STYLES.length;
  const style = STYLES[styleIndex];

  // Build media section
  let mediaSection = "";
  if (mediaUrls.length > 0) {
    const mediaItems = mediaUrls.map((url, i) => {
      if (url.match(/\.(mp4|webm|mov|avi)$/i)) {
        return `- Video ${i + 1}: <video src="${url}" controls autoplay muted loop style="max-width:100%;border-radius:8px;">`;
      } else {
        return `- Photo ${i + 1}: <img src="${url}" alt="Foto ${i + 1} de ${name}" style="max-width:100%;border-radius:8px;">`;
      }
    });
    mediaSection = `\n\nMedia files to embed in the page (distribute them naturally throughout the layout — don't stack them all together):\n${mediaItems.join("\n")}`;
  }

  const instructionsSection = instructions
    ? `\n\nAdditional instructions from the author (follow these exactly):\n${instructions}`
    : "";

  const prompt = `You are a creative web designer generating a unique farewell page.

Friend name: ${name}
Message: "${message}"${mediaSection}

DESIGN STYLE YOU MUST USE: **${style.name}**
Style description: ${style.desc}
Color palette: ${style.palette}

Generate a COMPLETE self-contained HTML page (<!DOCTYPE html> through </html>) for this farewell message to Dan Lupu and Raluca, who are moving from Madrid to the French Riviera (Côte d'Azur).

Requirements:
- IMPORTANT: Keep total HTML under 250 lines. One beautiful focused page beats a complex truncated one.
- The design MUST clearly follow the "${style.name}" style described above — palette, typography, layout, all of it
- ALL CSS embedded in <style> tags — no external CSS files (Google Fonts <link> is OK, max 2 fonts)
- If media files are provided, distribute them naturally in the layout — not all in one block
- Include subtle Dan & Raluca personality touches: Dan runs ultramarathons, they're Romanian, moving to the French coast
- Include this back button exactly: <a href="/" style="position:fixed;top:20px;left:20px;background:rgba(0,0,0,0.6);color:#fff;padding:8px 16px;border-radius:4px;font-family:sans-serif;font-size:13px;text-decoration:none;z-index:9999;">← Volver al muro</a>
- Mobile responsive with a max-width container
- 1-2 subtle CSS animations max
- Emotionally resonant — the message is the hero, design serves it

Output ONLY the complete HTML, nothing else.${instructionsSection}`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  let html = content.text.trim();
  if (html.startsWith("```html")) html = html.slice(7);
  else if (html.startsWith("```")) html = html.slice(3);
  if (html.endsWith("```")) html = html.slice(0, -3);
  html = html.trim();

  if (avatarPrompt && slug) {
    html = injectAvatarSection(html, slug);
  }

  return html;
}
