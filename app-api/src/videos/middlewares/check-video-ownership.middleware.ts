import type { RequestHandler } from 'express';
import { videosService } from '../videos.services.ts';
import {
  ForbiddenException,
  UnauthorizedException,
} from '../../application/exceptions/http.exception.ts';

export const checkVideoOwnership: RequestHandler = (req, _res, next) => {
  const id = req.params.id ?? req.params.videoId;
  if (typeof id !== 'string') {
    next();
    return;
  }
  if (!req.user) {
    next(new UnauthorizedException());
    return;
  }
  const userId = req.user.id;
  videosService
    .getById(id)
    .then((video) => {
      if (video.userId !== userId) {
        throw new ForbiddenException('Доступ заборонено');
      }
      next();
    })
    .catch(next);
};
