import { logger } from '../util/logUtil';

export const throwAsNext = f => async (req, res, next) => {
  try {
    await f(req, res, next);
  } catch (error) {
    next(error);
  }
};

export const measureTime = f => async (...params) => {
  const start = new Date().getTime();
  const result = await f(...params);
  const end = new Date().getTime();
  logger.warn({ time: end - start });
  return result;
};
