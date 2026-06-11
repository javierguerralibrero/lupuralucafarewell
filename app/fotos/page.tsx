import { list } from "@/lib/r2";
import FotosCarrusel from "./FotosCarrusel";

interface ManifestPhoto {
  url: string;
}

async function getPhotoUrls(): Promise<string[]> {
  try {
    const { blobs } = await list({ prefix: "madrid-photos/manifest.json" });
    if (!blobs.length) return [];
    const manifest: { photos: ManifestPhoto[] } = await fetch(blobs[0].url, { cache: "no-store" }).then((r) => r.json());
    return manifest.photos.map((p) => p.url);
  } catch {
    return [];
  }
}

export default async function FotosPage() {
  const photos = await getPhotoUrls();
  return <FotosCarrusel photos={photos} />;
}
