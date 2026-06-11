import FotosCarrusel from "./FotosCarrusel";

interface ManifestPhoto {
  url: string;
}

async function getPhotoUrls(): Promise<string[]> {
  try {
    const manifestUrl = `${process.env.R2_PUBLIC_URL}/madrid-photos/manifest.json`;
    const manifest: { photos: ManifestPhoto[] } = await fetch(manifestUrl, { cache: "no-store" }).then((r) => r.json());
    return manifest.photos.map((p) => p.url);
  } catch {
    return [];
  }
}

export default async function FotosPage() {
  const photos = await getPhotoUrls();
  return <FotosCarrusel photos={photos} />;
}
