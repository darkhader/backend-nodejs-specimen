import uuidv4 from 'uuid/v4';
import createError from 'http-errors';
import * as dbUtil from '../../../util/databaseUtil';
import redisUtil from '../../../util/redisUtil';
import * as common from './common';

import { TOKEN, REDIS } from '../../../constant';

export const getUserByPhone = async (phone) => {
  const sql = `SELECT 
      up.id,
      up.phone,
      up.passwordHash,
      u.fullName,
      u.avatar,
      u.status 
    FROM user__phone up 
    INNER JOIN users u ON up.id = u.id
    WHERE phone = ?
  `;
  return dbUtil.queryOne(sql, [phone]);
};

export const createUserPhone = async (phone, fullName, password) => {
  const transaction = await dbUtil.beginTransaction();
  const userId = uuidv4();
  const passwordHash = common.hashPassword(password);
  const userPhone = { id: userId, phone, passwordHash };
  const user = { id: userId, fullName };
  try {
    const sqlInsertUserPhone = 'INSERT INTO user__phone SET ?';
    await dbUtil.execute(sqlInsertUserPhone, userPhone, transaction);
    const sqlInsertUser = 'INSERT INTO users SET ?';
    await dbUtil.execute(sqlInsertUser, user, transaction);
    await dbUtil.commitTransaction(transaction);
    // exec async
    common.createUserElasticSearch(userId, fullName);
    return userId;
  } catch (error) {
    dbUtil.rollbackTransaction(transaction);
    return Promise.reject(error);
  }
};

// sync anonymous user into new user
export const syncFollowingCategories = async (catetogyIds, userId) => {
  const transaction = await dbUtil.beginTransaction();
  try {
    const sqlInsertFollowCategory = 'INSERT INTO category_follows(userId,categoryId,`order`) VALUES ?';
    const paramsInsertFollowCategory = [catetogyIds.map((catetogyId, i) => [userId, catetogyId, i])];
    await dbUtil.execute(sqlInsertFollowCategory, paramsInsertFollowCategory, transaction);
    const sqlUpdateNumberFollower = 'UPDATE categories SET numberFollower = numberFollower+1 WHERE id IN (?)';
    await dbUtil.execute(sqlUpdateNumberFollower, [catetogyIds], transaction);
    await dbUtil.commitTransaction(transaction);
    return;
  } catch (error) {
    dbUtil.rollbackTransaction(transaction);
    return Promise.reject(error);
  }
};

export const insertOtpPhoneToDb = async (phone, otp) => {
  const otpKeyInRedis = `${REDIS.OTP_REGISTER_PREFIX}:${phone}`;
  const ttlOtp = await redisUtil.ttlAsync(otpKeyInRedis);
  if (ttlOtp < 4 * 60) {
    const setSuccess = await redisUtil.setAsync(otpKeyInRedis, otp, 'ex', 5 * 60);
    if (setSuccess !== 'OK') {
      return Promise.reject(setSuccess);
    }
  } else {
    return Promise.reject(createError(400, `Resend otp after ${ttlOtp - 4 * 60}s`, { remaining: ttlOtp - 4 * 60 }));
  }
};

export const checkOtpValid = async (phone, otp) => {
  const otpInDb = await redisUtil.getAsync(`${REDIS.OTP_REGISTER_PREFIX}:${phone}`);
  if (otpInDb === otp) {
    await redisUtil.delAsync(`${REDIS.OTP_REGISTER_PREFIX}:${phone}`);
    return true;
  }
  return false;
};

export const checkPhoneExist = async (phone) => {
  const sql = 'SELECT EXISTS(SELECT id FROM user__phone WHERE phone = ?) as exist';
  const params = [phone];
  const row = await dbUtil.queryOne(sql, params);
  return row.exist;
};

// facebook
export const createUserFacebook = async (facebookId, name, avatar) => {
  const transaction = await dbUtil.beginTransaction();
  const userId = uuidv4();
  const userFacebook = { id: userId, facebookId, name };
  const user = { id: userId, fullName: name, avatar };
  try {
    const sqlInsertUserFacebook = 'INSERT INTO user__facebook SET ?';
    await dbUtil.execute(sqlInsertUserFacebook, [userFacebook], transaction);
    const sqlInsertUser = 'INSERT INTO users SET ?';
    await dbUtil.execute(sqlInsertUser, user, transaction);
    await dbUtil.commitTransaction(transaction);
    // exec async
    common.createUserElasticSearch(userId, name);
    return userId;
  } catch (error) {
    dbUtil.rollbackTransaction(transaction);
    return Promise.reject(error);
  }
};

export const getUserFromFacebookId = async (facebookId) => {
  const sql = 'SELECT u.* FROM user__facebook uf INNER JOIN users u ON u.id = uf.id WHERE uf.facebookId = ? LIMIT 1';
  return dbUtil.queryOne(sql, [facebookId]);
};

export const refreshToken = async (oldRefreshToken) => {
  const oldToken = await redisUtil.getAsync(`${REDIS.REFRESH_TOKEN_PREFIX}:${oldRefreshToken}`);
  const { id: userId, fullName, avatar } = await common.getUserInfoFromToken(oldToken);
  const newToken = await common.getToken(userId, fullName, avatar);
  const newRefreshToken = uuidv4();
  await Promise.all([
    redisUtil.delAsync(`${REDIS.REFRESH_TOKEN_PREFIX}:${oldRefreshToken}`),
    redisUtil.setAsync(`${REDIS.REFRESH_TOKEN_PREFIX}:${newRefreshToken}`, newToken, 'ex', TOKEN.REFRESH_TOKEN_EXPIRED),
  ]);
  return { token: newToken, refreshToken: newRefreshToken };
};

export const getRefreshToken = async (token) => {
  const refreshToken = uuidv4();
  redisUtil.setAsync(`${REDIS.REFRESH_TOKEN_PREFIX}:${refreshToken}`, token, 'ex', TOKEN.REFRESH_TOKEN_EXPIRED).catch(() => { });
  return refreshToken;
};

// Forgot Password
export const setNewPassword = async (phone, newPassword) => {
  const newPasswordHash = common.hashPassword(newPassword);
  const sql = 'UPDATE user__phone SET passwordHash = ? WHERE phone = ? LIMIT 1';
  return dbUtil.execute(sql, [newPasswordHash, phone]);
};

export const linkUserPhone = async (userId, phone, password) => {
  const passwordHash = common.hashPassword(password);
  const userPhone = { id: userId, phone, passwordHash };
  try {
    const sqlInsertUserPhone = 'INSERT INTO user__phone SET ?';
    await dbUtil.execute(sqlInsertUserPhone, userPhone);
    return userId;
  } catch (error) {
    return Promise.reject(error);
  }
};

export const linkFacebook = async (fbId, userId, name) => {
  const userFacebook = { id: userId, facebookId: fbId, name };
  try {
    const linkFbSql = 'INSERT INTO user__facebook SET ?';
    await dbUtil.execute(linkFbSql, userFacebook);
    return userId;
  } catch (err) {
    return Promise.reject(err);
  }
};

export const checkFbExist = async (fbId) => {
  const sql = 'SELECT EXISTS(SELECT id FROM user__facebook WHERE facebookId = ?) as exist';
  const params = [fbId];
  const row = await dbUtil.queryOne(sql, params);
  return row.exist;
};
