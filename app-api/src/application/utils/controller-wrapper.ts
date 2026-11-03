import type { Request, Response, NextFunction, RequestHandler } from 'express';

type AsyncController = (req: Request<any, any, any, any>, res: Response, next: NextFunction) => Promise<unknown> | unknown;

export const controllerWrapper = (controller: AsyncController): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(controller(req, res, next)).catch(next);
  };
};
