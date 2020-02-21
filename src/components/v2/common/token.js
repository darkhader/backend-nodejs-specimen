import uuidv4 from 'uuid/v4';
import * as jwtUtil from '../../../util/jwtUtil';
import redisUtil from '../../../util/redisUtil';
import { TOKEN, REDIS } from '../../../constant';

export const getToken = (id, fullName, avatar) => jwtUtil.getToken({ id, fullName, avatar }, { expiresIn: TOKEN.TOKEN_EXPIRED });
export const getRefreshToken = async (token) => {
  const refreshToken = uuidv4();
  redisUtil.setAsync(`${REDIS.REFRESH_TOKEN_PREFIX}:${refreshToken}`, token, 'ex', TOKEN.REFRESH_TOKEN_EXPIRED).catch(() => { });
  return refreshToken;
};
