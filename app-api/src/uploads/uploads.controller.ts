import path from 'node:path';
import type { Request, Response } from 'express';
import { ValidationException } from '../application/exceptions/http.exception.ts';
import {
  generateKey,
  getSignedDownloadUrl,
  putObject,
} from './storage/r2-storage.ts';
import { generateThumbnailBuffer } from './storage/thumbnail.ts';
import { uploadBytesTotal, uploadsTotal } from '../application/metrics.ts';

export const uploadsController = {
  async uploadImage(req: Request, res: Response): Promise<void> {
    if (!req.file) {
      throw new ValidationException('Файл не отримано');
    }
    const key = generateKey(req.file.originalname, 'images');
    await putObject(key, req.file.buffer, req.file.mimetype);
    uploadsTotal.inc({ kind: 'image' });
    uploadBytesTotal.inc({ kind: 'image' }, req.file.size);
    const previewUrl = await getSignedDownloadUrl(key);
    res.status(201).json({
      url: key,
      previewUrl,
      filename: key,
      size: req.file.size,
      mime: req.file.mimetype,
    });
  },

  async uploadVideo(req: Request, res: Response): Promise<void> {
    if (!req.file) {
      throw new ValidationException('Файл не отримано');
    }

    const videoKey = generateKey(req.file.originalname);
    await putObject(videoKey, req.file.buffer, req.file.mimetype);
    uploadsTotal.inc({ kind: 'video' });
    uploadBytesTotal.inc({ kind: 'video' }, req.file.size);

    const ext = path.extname(req.file.originalname).toLowerCase() || '.mp4';
    const thumbBuffer = await generateThumbnailBuffer(req.file.buffer, ext);
    let thumbKey: string | null = null;
    if (thumbBuffer) {
      thumbKey = videoKey.replace(/\.[^.]+$/, '.jpg');
      await putObject(thumbKey, thumbBuffer, 'image/jpeg');
    }

    const previewUrl = await getSignedDownloadUrl(videoKey);
    const previewThumbnailUrl = thumbKey ? await getSignedDownloadUrl(thumbKey) : null;

    res.status(201).json({
      // Storage keys: persist these in the videos table.
      url: videoKey,
      thumbnailUrl: thumbKey,
      // Short-lived signed URLs for immediate playback before the video record is saved.
      previewUrl,
      previewThumbnailUrl,
      filename: videoKey,
      size: req.file.size,
      mime: req.file.mimetype,
    });
  },
};
