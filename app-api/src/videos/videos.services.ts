import {
  ForbiddenException,
  NotFoundException,
} from '../application/exceptions/http.exception.ts';
import { videosRepository } from './repositories/videos.repository.ts';
import {
  deleteObject,
  getSignedDownloadUrl,
} from '../uploads/storage/r2-storage.ts';
import type { Video, VideoSourceType } from './types/video.interface.ts';
import type { VideoCreateRequestBody } from './types/video-create-request.interface.ts';

/**
 * For uploaded videos the DB stores the storage key (e.g. "videos/uuid.mp4");
 * swap it for a short-lived presigned URL on the way out. External URLs
 * (sourceType === 'url') are returned untouched.
 */
async function withSignedUrls(video: Video): Promise<Video> {
  if (video.sourceType !== 'upload') return video;
  const [videoUrl, thumbnailUrl] = await Promise.all([
    getSignedDownloadUrl(video.videoUrl),
    video.thumbnailUrl ? getSignedDownloadUrl(video.thumbnailUrl) : Promise.resolve(null),
  ]);
  return { ...video, videoUrl, thumbnailUrl };
}

export const videosService = {
  async create(input: VideoCreateRequestBody, userId: string): Promise<Video> {
    const sourceType: VideoSourceType = input.sourceType ?? 'url';
    const video = await videosRepository.create({
      title: input.title,
      videoUrl: input.videoUrl,
      thumbnailUrl: input.thumbnailUrl ?? null,
      sourceType,
      userId,
    });
    return withSignedUrls(video);
  },

  async getById(id: string): Promise<Video> {
    const video = await videosRepository.findById(id);
    if (!video) throw new NotFoundException(`Video "${id}" not found`);
    return withSignedUrls(video);
  },

  /** Loads the video and ensures the caller owns it. */
  async getOwnedById(id: string, userId: string): Promise<Video> {
    const video = await this.getById(id);
    if (video.userId !== userId) {
      throw new ForbiddenException('Доступ заборонено');
    }
    return video;
  },

  async listForUser(userId: string): Promise<Video[]> {
    const videos = await videosRepository.listByUser(userId);
    return Promise.all(videos.map(withSignedUrls));
  },

  async update(
    id: string,
    userId: string,
    patch: { title?: string },
  ): Promise<Video> {
    await this.getOwnedById(id, userId);
    const updated = await videosRepository.update(id, patch);
    if (!updated) throw new NotFoundException(`Video "${id}" not found`);
    return withSignedUrls(updated);
  },

  async remove(id: string, userId: string): Promise<void> {
    // Read the raw row first — we need the storage keys before mapping signs them away.
    const raw = await videosRepository.findById(id);
    if (!raw) throw new NotFoundException(`Video "${id}" not found`);
    if (raw.userId !== userId) throw new ForbiddenException('Доступ заборонено');

    await videosRepository.delete(id);

    if (raw.sourceType === 'upload') {
      await Promise.allSettled([
        deleteObject(raw.videoUrl),
        raw.thumbnailUrl ? deleteObject(raw.thumbnailUrl) : Promise.resolve(),
      ]);
    }
  },
};
