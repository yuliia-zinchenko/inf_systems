import type { Request, Response } from 'express';
import { productTagsService } from './product-tags.services.ts';
import type { ProductTagCreateRequestBody } from './types/product-tag-create-request.interface.ts';

export const productTagsController = {
  async create(
    req: Request<{ videoId: string }, unknown, ProductTagCreateRequestBody>,
    res: Response,
  ): Promise<void> {
    const tag = await productTagsService.create(req.params.videoId, req.body);
    res.status(201).json(tag);
  },

  async list(req: Request<{ videoId: string }>, res: Response): Promise<void> {
    const tags = await productTagsService.listByVideo(req.params.videoId);
    res.status(200).json(tags);
  },

  async update(
    req: Request<
      { videoId: string; tagId: string },
      unknown,
      {
        time?: number;
        duration?: number;
        title?: string;
        imageUrl?: string;
        link?: string;
        variant?: 'card' | 'compact' | 'badge' | 'minimal';
        accentColor?: 'fuchsia' | 'emerald' | 'sky' | 'amber' | 'rose' | 'white';
        positionX?: number | null;
        positionY?: number | null;
      }
    >,
    res: Response,
  ): Promise<void> {
    const tag = await productTagsService.update(req.params.videoId, req.params.tagId, req.body);
    res.status(200).json(tag);
  },

  async remove(req: Request<{ videoId: string; tagId: string }>, res: Response): Promise<void> {
    await productTagsService.remove(req.params.videoId, req.params.tagId);
    res.status(204).end();
  },

  async scrape(
    req: Request<unknown, unknown, { url: string }>,
    res: Response,
  ): Promise<void> {
    const result = await productTagsService.scrape(req.body.url);
    res.status(200).json(result);
  },
};
