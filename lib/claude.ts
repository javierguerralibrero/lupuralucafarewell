import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function generateFriendPage(
  name: string,
  message: string,
  fileUrl?: string
): Promise<string> {
  const fileSection = fileUrl
    ? `\nPhoto/video URL: ${fileUrl}\n${
        fileUrl.match(/\.(mp4|webm|mov|avi)$/i)
          ? `Video: use <video src="${fileUrl}" controls autoplay muted loop style="max-width:100%;"> prominently in the page.`
          : `Photo: use <img src="${fileUrl}" alt="Foto de ${name}" style="max-width:100%;"> prominently in the page.`
      }`
    : "";

  const prompt = `You are a creative web designer generating a unique farewell page.

Friend name: ${name}
Message: ${message}${fileSection}

Generate a COMPLETE self-contained HTML page (<!DOCTYPE html> through </html>) for this farewell message to Dan Lupu and Raluca, who are moving from Madrid to the French Riviera.

Requirements:
- Complete HTML with ALL CSS embedded in <style> tags - no external CSS files
- You decide EVERYTHING: layout, colors, fonts, decorations, animations
- Be creative and unique - layouts can be: centered card, full-screen hero, split screen, comic panels, vintage poster, newspaper style, travel journal, etc.
- Feature the photo/video prominently if provided
- Include subtle Dan & Raluca references (running, French coast, Romania)
- Include a back button: <a href="/" style="position:fixed;top:20px;left:20px;background:rgba(0,0,0,0.7);color:#fff;padding:8px 16px;border-radius:4px;font-family:sans-serif;font-size:14px;z-index:9999;">← Volver al muro</a>
- Mobile responsive
- You MAY use Google Fonts via <link> tags
- CSS animations and creative typography encouraged
- Make it emotionally resonant and beautiful
- No JavaScript required (pure CSS is fine for animations)
- The page should feel like a unique work of art, not a template

Output ONLY the complete HTML, nothing else.`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  // Strip markdown code fences if present
  let html = content.text.trim();
  if (html.startsWith("```html")) {
    html = html.slice(7);
  } else if (html.startsWith("```")) {
    html = html.slice(3);
  }
  if (html.endsWith("```")) {
    html = html.slice(0, -3);
  }
  return html.trim();
}
