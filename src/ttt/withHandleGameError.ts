import { RequestHandler } from 'express-serve-static-core'
import GameError from '../libs/GameError'

export const withHandleGameError = (f: RequestHandler): RequestHandler => (req, res, next) => {
  try {
    f(req, res, next);
  } catch (e) {
    if (e.name === GameError.name) {
      res.status(400).json({
        error: e.message
      });
    } else {
      res.status(500).json({
        error: e.message
      });
    }
  }
};
