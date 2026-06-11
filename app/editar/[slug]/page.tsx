import { list } from "@/lib/r2";
import EditarForm from "./EditarForm";
import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function EditarPage({ params }: PageProps) {
  const { slug } = await params;
  const { blobs } = await list({ prefix: `meta/${slug}.json` });
  if (!blobs.length) redirect("/crear");
  const res = await fetch(blobs[0].url, { cache: "no-store" });
  const meta = await res.json();
  return (
    <EditarForm
      slug={slug}
      initialName={meta.name}
      initialMessage={meta.message || ""}
      initialMediaUrls={meta.mediaUrls || []}
      initialInstructions={meta.instructions || ""}
    />
  );
}
