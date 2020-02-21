import { logger } from '../util/logUtil';

// eslint-disable-next-line no-unused-vars
export const errorHandler = (error, req, res, next) => {
  if (typeof error === 'string') {
    res.status(500).json({ message: error });
    logger.error(error);
  } else {
    res.status(error.status || 500).json(error);
    logger.error({ ...error });
  }
};
