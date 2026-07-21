import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { logger } from "./logger";

const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const R2_BUCKET = process.env.CLOUDFLARE_R2_BUCKET;
const R2_ACCESS_KEY_ID = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;

export const R2_ENABLED = !!(
  CF_ACCOUNT_ID &&
  R2_BUCKET &&
  R2_ACCESS_KEY_ID &&
  R2_SECRET_ACCESS_KEY
);

let _s3Client: S3Client | null = null;

export function getS3Client(): S3Client {
  if (!R2_ENABLED) {
    throw new Error(
      "R2 is not configured: set CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_R2_BUCKET, " +
        "CLOUDFLARE_R2_ACCESS_KEY_ID, and CLOUDFLARE_R2_SECRET_ACCESS_KEY",
    );
  }
  if (!_s3Client) {
    _s3Client = new S3Client({
      endpoint: `https://${CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID!,
        secretAccessKey: R2_SECRET_ACCESS_KEY!,
      },
      region: "auto",
    });
  }
  return _s3Client;
}

export async function r2Get(key: string): Promise<Buffer | null> {
  if (!R2_ENABLED) return null;
  try {
    const client = getS3Client();
    const command = new GetObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
    });
    const response = await client.send(command);
    if (!response.Body) return null;

    const bytes = await response.Body.transformToByteArray();
    return Buffer.from(bytes);
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "name" in err &&
      ((err as { name: string }).name === "NoSuchKey" ||
        (err as { name: string }).name === "NotFound")
    ) {
      logger.debug({ key }, "R2 key not found");
    } else {
      logger.error({ err, key }, "R2 get failed");
    }
    return null;
  }
}

export async function r2Put(key: string, body: Buffer): Promise<boolean> {
  if (!R2_ENABLED) return false;
  try {
    const client = getS3Client();
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: body,
      ContentType: "audio/mpeg",
    });
    await client.send(command);
    return true;
  } catch (err) {
    logger.error({ err, key }, "R2 put failed");
    return false;
  }
}
