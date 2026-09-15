import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";

export { CMS_LIMITS } from "@/lib/cms-limits";

export type R2Folder = "achievements" | "gallery" | "leadership" | "events";

function r2Config() {
  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  const bucket = process.env.R2_BUCKET?.trim();
  const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL?.trim()?.replace(/\/$/, "");

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicBaseUrl) {
    return null;
  }

  return { accountId, accessKeyId, secretAccessKey, bucket, publicBaseUrl };
}

export function isR2Configured() {
  return r2Config() != null;
}

function getClient() {
  const cfg = r2Config();
  if (!cfg) throw new Error("Cloudflare R2 is not configured");
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${cfg.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey,
    },
    // R2 rejects AWS SDK v3 flexible checksum headers
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
  return { client, cfg };
}

export async function uploadR2Object(opts: {
  folder: R2Folder;
  contentType: string;
  body: Buffer | Uint8Array;
}) {
  const { client, cfg } = getClient();
  const ext =
    opts.contentType === "image/webp"
      ? "webp"
      : opts.contentType === "image/png"
        ? "png"
        : "jpg";
  const key = `cms/${opts.folder}/${randomUUID()}.${ext}`;
  await client.send(
    new PutObjectCommand({
      Bucket: cfg.bucket,
      Key: key,
      Body: opts.body,
      ContentType: opts.contentType,
    }),
  );
  const publicUrl = `${cfg.publicBaseUrl}/${key}`;
  return { publicUrl, key };
}

export function isOurR2Url(url: string | null | undefined) {
  if (!url) return false;
  const cfg = r2Config();
  if (!cfg) return false;
  return url.startsWith(`${cfg.publicBaseUrl}/`);
}

export async function deleteR2ObjectByUrl(url: string | null | undefined) {
  if (!isOurR2Url(url)) return;
  const cfg = r2Config();
  if (!cfg || !url) return;
  const key = url.slice(`${cfg.publicBaseUrl}/`.length);
  if (!key) return;
  const { client } = getClient();
  await client.send(new DeleteObjectCommand({ Bucket: cfg.bucket, Key: key }));
}
