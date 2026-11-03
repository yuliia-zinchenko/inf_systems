import type { RequestHandler } from 'express';
import { videosService } from '../videos.services.ts';

export const checkVideoExist: RequestHandler = (req, _res, next) => {
  const id = req.params.id ?? req.params.videoId;
  if (typeof id !== 'string') {
    next();
    return;
  }
  videosService
    .getById(id)
    .then(() => next())
    .catch(next);
};
