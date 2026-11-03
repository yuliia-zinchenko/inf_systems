import type {
  ProductTag,
  ProductTagAccent,
  ProductTagVariant,
  ScrapedProduct,
} from '@/types/api';
import { apiFetch } from './http';

export interface CreateProductTagInput {
  time: number;
  duration?: number;
  title: string;
  imageUrl: string;
  link: string;
  variant?: ProductTagVariant;
  accentColor?: ProductTagAccent;
  positionX?: number | null;
  positionY?: number | null;
}

export interface UpdateProductTagInput {
  time?: number;
  duration?: number;
  title?: string;
  imageUrl?: string;
  link?: string;
  variant?: ProductTagVariant;
  accentColor?: ProductTagAccent;
  positionX?: number | null;
  positionY?: number | null;
}

export const productTagsApi = {
  list: (videoId: string): Promise<ProductTag[]> =>
    apiFetch(`/videos/${videoId}/product-tags`),

  create: (
    videoId: string,
    input: CreateProductTagInput,
  ): Promise<ProductTag> =>
    apiFetch(`/videos/${videoId}/product-tags`, {
      method: 'POST',
      json: input,
    }),

  update: (
    videoId: string,
    tagId: string,
    patch: UpdateProductTagInput,
  ): Promise<ProductTag> =>
    apiFetch(`/videos/${videoId}/product-tags/${tagId}`, {
      method: 'PATCH',
      json: patch,
    }),

  remove: (videoId: string, tagId: string): Promise<void> =>
    apiFetch(`/videos/${videoId}/product-tags/${tagId}`, { method: 'DELETE' }),

  scrape: (url: string): Promise<ScrapedProduct> =>
    apiFetch('/product-tags/scrape', { method: 'POST', json: { url } }),
};
