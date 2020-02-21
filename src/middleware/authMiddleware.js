import * as jwtUtil from '../util/jwtUtil';
import { logger } from '../util/logUtil';
import { ERRORS } from '../constant';

export const authMiddleware = async (req, res, next) => {
  req.isLogged = false;
  const { authorization } = req.headers;
  if (authorization && authorization.match(/^Bearer /g)) {
    const token = authorization.split(' ')[1];
    if (token) {
      try {
        const tokenDecoded = await jwtUtil.verifyToken(token);
        req.isLogged = tokenDecoded.id.substring(0, 4) !== 'NAU-';
        req.userId = tokenDecoded.id;
        req.fullName = tokenDecoded.fullName;
        req.avatar = tokenDecoded.avatar;
        req.token = token;
      } catch (error) {
        logger.error({ token, error });
      }
    }
  }
  next();
};
export const requireLogin = async (req, res, next) => {
  // if (req.isLogged) {
  //   next();
  // } else {
  //   next(ERRORS.UNAUTHORIZED_ERROR);
  // }
  next();
};
export const requireAnonymousToken = async (req, res, next) => {
  // if (req.userId) {
  //   next();
  // } else {
  //   next(ERRORS.UNAUTHORIZED_ERROR);
  // }
  next();
};
