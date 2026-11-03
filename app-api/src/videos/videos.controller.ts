import type { Request, Response } from 'express';
import { videosService } from './videos.services.ts';
import { UnauthorizedException } from '../application/exceptions/http.exception.ts';
import type { VideoCreateRequestBody } from './types/video-create-request.interface.ts';

export const videosController = {
  async create(
    req: Request<unknown, unknown, VideoCreateRequestBody>,
    res: Response,
  ): Promise<void> {
    if (!req.user) throw new UnauthorizedException();
    const video = await videosService.create(req.body, req.user.id);
    res.status(201).json(video);
  },

  async list(req: Request, res: Response): Promise<void> {
    if (!req.user) throw new UnauthorizedException();
    res.status(200).json(await videosService.listForUser(req.user.id));
  },

  async getById(req: Request<{ id: string }>, res: Response): Promise<void> {
    const video = await videosService.getById(req.params.id);
    res.status(200).json(video);
  },

  async update(
    req: Request<{ id: string }, unknown, { title?: string }>,
    res: Response,
  ): Promise<void> {
    if (!req.user) throw new UnauthorizedException();
    const video = await videosService.update(req.params.id, req.user.id, req.body);
    res.status(200).json(video);
  },

  async remove(req: Request<{ id: string }>, res: Response): Promise<void> {
    if (!req.user) throw new UnauthorizedException();
    await videosService.remove(req.params.id, req.user.id);
    res.status(204).end();
  },
};
