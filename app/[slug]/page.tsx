interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getPageHtml(slug: string): Promise<string | null> {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
    const res = await fetch(`${baseUrl}/api/page/${slug}`, { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.pageUrl) return null;
    const htmlRes = await fetch(data.pageUrl, { cache: "no-store" });
    if (!htmlRes.ok) return null;
    return htmlRes.text();
  } catch {
    return null;
  }
}

export default async function SlugPage({ params }: PageProps) {
  const { slug } = await params;
  const html = await getPageHtml(slug);

  if (!html) {
    return (
      <div style={{ background: "#0a0a0a", minHeight: "100vh", color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "20px" }}>
        <p style={{ color: "#555", fontSize: "1.2rem" }}>Esta página no existe todavía.</p>
        <a href="/" style={{ color: "#e94560", fontSize: "0.9rem" }}>← Volver al muro</a>
      </div>
    );
  }

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
