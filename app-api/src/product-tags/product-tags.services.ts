import { NotFoundException, ValidationException } from '../application/exceptions/http.exception.ts';
import { productTagsRepository } from './repositories/product-tags.repository.ts';
import { getSignedDownloadUrl } from '../uploads/storage/r2-storage.ts';
import { logger } from '../application/logger.ts';
import {
  decodeEntities,
  extractTitleTag,
  isExternalUrl,
  pickMeta,
  toAbsoluteUrl,
} from './scrape.helpers.ts';
import type { ProductTag } from './types/product-tag.interface.ts';
import type { ProductTagCreateRequestBody } from './types/product-tag-create-request.interface.ts';

const DEFAULT_DURATION_SEC = 5;

async function withSignedImage(tag: ProductTag): Promise<ProductTag> {
  if (!tag.imageUrl || isExternalUrl(tag.imageUrl)) return tag;
  return { ...tag, imageUrl: await getSignedDownloadUrl(tag.imageUrl) };
}

export const productTagsService = {
  async create(
    videoId: string,
    input: ProductTagCreateRequestBody,
  ): Promise<ProductTag> {
    const created = await productTagsRepository.create({
      videoId,
      time: input.time,
      duration: input.duration ?? DEFAULT_DURATION_SEC,
      title: input.title,
      imageUrl: input.imageUrl,
      link: input.link,
      variant: input.variant ?? 'card',
      accentColor: input.accentColor ?? 'fuchsia',
      positionX: input.positionX ?? null,
      positionY: input.positionY ?? null,
    });
    return withSignedImage(created);
  },

  async listByVideo(videoId: string): Promise<ProductTag[]> {
    const tags = await productTagsRepository.listByVideo(videoId);
    return Promise.all(tags.map(withSignedImage));
  },

  async update(
    videoId: string,
    tagId: string,
    patch: {
      time?: number;
      duration?: number;
      title?: string;
      imageUrl?: string;
      link?: string;
      variant?: 'card' | 'compact' | 'badge' | 'minimal';
      accentColor?: 'fuchsia' | 'emerald' | 'sky' | 'amber' | 'rose' | 'white';
      positionX?: number | null;
      positionY?: number | null;
    },
  ): Promise<ProductTag> {
    const tag = await productTagsRepository.findById(tagId);
    if (!tag || tag.videoId !== videoId) {
      throw new NotFoundException(`Product tag "${tagId}" not found`);
    }
    const updated = await productTagsRepository.update(tagId, patch);
    if (!updated) throw new NotFoundException(`Product tag "${tagId}" not found`);
    return withSignedImage(updated);
  },

  async remove(videoId: string, tagId: string): Promise<void> {
    const tag = await productTagsRepository.findById(tagId);
    if (!tag || tag.videoId !== videoId) {
      throw new NotFoundException(`Product tag "${tagId}" not found`);
    }
    await productTagsRepository.delete(tagId);
  },

  /**
   * Best-effort metadata extraction for a product page.
   * Reads OpenGraph / Twitter / <title> tags. Returns nulls when nothing is
   * available — the UI keeps the form editable so the user can fill the gaps.
   */
  async scrape(url: string): Promise<{ title: string | null; imageUrl: string | null }> {
    const _t0 = performance.now();
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw new ValidationException('Невалідне посилання на товар');
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new ValidationException('Підтримуються лише http(s) посилання');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);
    let html: string;
    try {
      const res = await fetch(parsed.toString(), {
        signal: controller.signal,
        redirect: 'follow',
        headers: {
          // Many storefronts reject empty/bot UAs.
          'user-agent':
            'Mozilla/5.0 (compatible; TagShopBot/1.0; +https://tagshop.local)',
          accept: 'text/html,application/xhtml+xml',
        },
      });
      if (!res.ok) {
        throw new ValidationException(`Не вдалось завантажити сторінку (${res.status})`);
      }
      // Cap to 512 KB — we only need <head>.
      const buf = await res.arrayBuffer();
      html = new TextDecoder('utf-8', { fatal: false }).decode(
        buf.byteLength > 512 * 1024 ? buf.slice(0, 512 * 1024) : buf,
      );
    } catch (err) {
      if (err instanceof ValidationException) throw err;
      throw new ValidationException('Сторінка недоступна або занадто повільна');
    } finally {
      clearTimeout(timeout);
    }

    const title = pickMeta(html, ['og:title', 'twitter:title']) ?? extractTitleTag(html);
    const imageRaw = pickMeta(html, ['og:image', 'og:image:secure_url', 'twitter:image']);

    logger.info(
      { host: parsed.hostname, durationMs: Math.round(performance.now() - _t0) },
      'Product page scraped',
    );

    return {
      title: title ? decodeEntities(title).trim().slice(0, 200) : null,
      imageUrl: imageRaw ? toAbsoluteUrl(imageRaw, parsed) : null,
    };
  },
};

