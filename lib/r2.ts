import { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectsCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const BUCKET = process.env.R2_BUCKET!;
const PUBLIC_URL = process.env.R2_PUBLIC_URL!;

export const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

function keyFromUrl(url: string): string {
  const base = PUBLIC_URL.endsWith("/") ? PUBLIC_URL : PUBLIC_URL + "/";
  return url.startsWith(base) ? url.slice(base.length) : url;
}

function urlFromKey(key: string): string {
  const base = PUBLIC_URL.endsWith("/") ? PUBLIC_URL : PUBLIC_URL + "/";
  return base + key;
}

interface PutOptions {
  access?: "public";
  contentType?: string;
  allowOverwrite?: boolean;
}

export async function put(key: string, body: Buffer | string | Uint8Array, options: PutOptions = {}): Promise<{ url: string }> {
  await r2.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: body,
    ContentType: options.contentType,
  }));
  return { url: urlFromKey(key) };
}

interface BlobItem {
  url: string;
  pathname: string;
}

export async function list(options: { prefix?: string } = {}): Promise<{ blobs: BlobItem[] }> {
  const blobs: BlobItem[] = [];
  let continuationToken: string | undefined;

  do {
    const res = await r2.send(new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: options.prefix,
      ContinuationToken: continuationToken,
    }));

    for (const obj of res.Contents ?? []) {
      if (obj.Key) {
        blobs.push({ url: urlFromKey(obj.Key), pathname: obj.Key });
      }
    }

    continuationToken = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (continuationToken);

  return { blobs };
}

export async function del(urlOrUrls: string | string[]): Promise<void> {
  const urls = Array.isArray(urlOrUrls) ? urlOrUrls : [urlOrUrls];
  const keys = urls.map(keyFromUrl);

  await r2.send(new DeleteObjectsCommand({
    Bucket: BUCKET,
    Delete: { Objects: keys.map((Key) => ({ Key })) },
  }));
}

export async function getPresignedUploadUrl(key: string, contentType: string, expiresIn = 3600): Promise<string> {
  return getSignedUrl(
    r2,
    new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType }),
    { expiresIn }
  );
}
