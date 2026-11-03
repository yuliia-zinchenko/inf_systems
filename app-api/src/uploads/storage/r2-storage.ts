import path from 'node:path';
import multer from 'multer';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { RequestHandler } from 'express';
import { ServiceUnavailableException } from '../../application/exceptions/http.exception.ts';
import { logger } from '../../application/logger.ts';

const MAX_FILE_SIZE = Number(process.env.MAX_UPLOAD_BYTES ?? 200 * 1024 * 1024);
const ALLOWED_MIME = new Set([
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime',
  'video/x-matroska',
]);

const endpoint = process.env.S3_ENDPOINT;
const region = process.env.S3_REGION ?? 'auto';
const bucket = process.env.S3_BUCKET;
const accessKeyId = process.env.S3_ACCESS_KEY_ID;
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;

/**
 * Object storage is optional: without S3_* the API still runs (and the whole
 * monitoring stack with it); only file uploads answer 503.
 */
export const storageEnabled = Boolean(endpoint && bucket && accessKeyId && secretAccessKey);

if (!storageEnabled) {
  logger.warn(
    'Сховище не налаштоване (S3_ENDPOINT, S3_REGION, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY) — завантаження файлів вимкнено',
  );
}

export const BUCKET = bucket ?? '';
const s3: S3Client | null = storageEnabled
  ? new S3Client({
      endpoint: endpoint!,
      region,
      credentials: { accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey! },
      forcePathStyle: true,
    })
  : null;

function client(): S3Client {
  if (!s3) throw new ServiceUnavailableException('Сховище файлів не налаштоване на сервері');
  return s3;
}

/** Rejects upload requests before multer buffers the file when storage is off. */
export const requireStorage: RequestHandler = (_req, _res, next) => {
  next(storageEnabled ? undefined : new ServiceUnavailableException('Сховище файлів не налаштоване на сервері'));
};

/** Default lifetime for download links handed to the browser. */
export const DEFAULT_SIGNED_URL_TTL_SEC = Number(
  process.env.S3_SIGNED_URL_TTL_SEC ?? 60 * 60,
);

export const videoUploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      cb(new Error('Підтримуються лише відеофайли (mp4, webm, ogg, mov, mkv)'));
      return;
    }
    cb(null, true);
  },
}).single('file');

const MAX_IMAGE_SIZE = Number(process.env.MAX_IMAGE_BYTES ?? 8 * 1024 * 1024);
const ALLOWED_IMAGE_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

export const imageUploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_SIZE, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_IMAGE_MIME.has(file.mimetype)) {
      cb(new Error('Підтримуються лише зображення (jpg, png, webp, gif)'));
      return;
    }
    cb(null, true);
  },
}).single('file');

export function generateKey(originalName: string, prefix = 'videos'): string {
  const ext = path.extname(originalName).toLowerCase().replace(/[^a-z0-9.]/g, '') || '.mp4';
  return `${prefix}/${crypto.randomUUID()}${ext}`;
}

export async function putObject(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<void> {
  await client().send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}

export async function getSignedDownloadUrl(
  key: string,
  expiresInSec: number = DEFAULT_SIGNED_URL_TTL_SEC,
): Promise<string> {
  // Without storage the key is returned as-is: such records only exist if
  // storage was configured earlier, and listing them should not fail.
  if (!s3) return key;
  return getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: BUCKET, Key: key }),
    { expiresIn: expiresInSec },
  );
}

export async function deleteObject(key: string): Promise<void> {
  if (!s3) return;
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}
