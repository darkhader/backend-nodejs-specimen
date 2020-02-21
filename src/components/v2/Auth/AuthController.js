import * as common from './common';
import * as dbAccess from './AuthDAL';
import * as fbUtil from '../../../util/fbUtil';
import { ERRORS, USERS } from '../../../constant';

export const refreshToken = async (req, res) => {
  const { refreshToken: oldRefreshToken } = req.body;
  res.json(await dbAccess.refreshToken(oldRefreshToken));
};

export const registerWithPhone = async (req, res) => {
  const { phone, otp } = req.body;
  const isPhoneExist = await dbAccess.checkPhoneExist(phone);
  if (isPhoneExist) {
    return Promise.reject(ERRORS.PHONE_EXISTED);
  }
  if (!otp) {
    const newOtp = common.generateOtp();
    await dbAccess.insertOtpPhoneToDb(phone, newOtp);
    // await common.sendPhoneOtp(phone, newOtp);
    return res.json({ otp: newOtp });
  }

  const isOtpValid = await dbAccess.checkOtpValid(phone, otp);
  if (!isOtpValid) {
    return Promise.reject(ERRORS.INVALID_OTP_ERROR);
  }
  const registerCode = await common.getRegisterCode(phone);

  return res.json({ registerCode });
};

export const loginWithPhone = async (req, res) => {
  const { phone, password } = req.body;

  const user = await dbAccess.getUserByPhone(phone);
  if (user) {
    if (user.status === USERS.STATUS.ACTIVE) {
      const passwordValid = await common.checkPassword(password, user.passwordHash);
      if (passwordValid) {
        const token = await common.getToken(user.id, user.fullName, user.avatar);
        const refreshToken = await dbAccess.getRefreshToken(token);
        return res.json({ token, refreshToken });
      }
      return Promise.reject(ERRORS.INVALID_PASSWORD_ERROR);
    }
    return Promise.reject(ERRORS.USER_INACTIVED_ERROR);
  }
  return Promise.reject(ERRORS.USER_NOTFOUND_ERROR);
};

export const updateInfo = async (req, res) => {
  const { password, fullName, registerCode, followingCategoryIds } = req.body;
  const phone = await common.getPhoneFromRegisterCode(registerCode);
  const userId = await dbAccess.createUserPhone(phone, fullName, password);
  if (followingCategoryIds) {
    await dbAccess.syncFollowingCategories(followingCategoryIds, userId);
  }
  const token = await common.getToken(userId, fullName, null);
  const refreshToken = await dbAccess.getRefreshToken(token);
  return res.json({ token, refreshToken });
};

export const loginFacebook = async (req, res) => {
  const { code, followingCategoryIds } = req.body;
  const accessToken = code ? await fbUtil.getAccessToken(code) : req.body.accessToken;
  const userFb = await fbUtil.getFbProfile(accessToken, ['id', 'name']);
  const user = await dbAccess.getUserFromFacebookId(userFb.id);
  if (!user) {
    const userId = await dbAccess.createUserFacebook(userFb.id, userFb.name, `http://graph.facebook.com/${userFb.id}/picture?type=large`);
    if (followingCategoryIds) {
      await dbAccess.syncFollowingCategories(followingCategoryIds, userId);
    }
    const token = await common.getToken(userId, userFb.name, `http://graph.facebook.com/${userFb.id}/picture?type=large`);
    const refreshToken = await dbAccess.getRefreshToken(token);
    return res.json({ token, refreshToken });
  }
  if (user.status !== USERS.STATUS.ACTIVE) {
    return Promise.reject(ERRORS.USER_INACTIVED_ERROR);
  }
  const token = await common.getToken(user.id, user.fullName, user.avatar);
  const refreshToken = await dbAccess.getRefreshToken(token);
  return res.json({ token, refreshToken });
};

// Forgot Password
export const forgotPassword = async (req, res) => {
  const { code, newPassword } = req.body;
  const accessToken = code ? await fbUtil.getAccessTokenAccountKit(code) : req.body.accessToken;
  const phone = await fbUtil.getPhoneFromAccessToken(accessToken);
  const isPhoneExist = await dbAccess.checkPhoneExist(phone);
  if (!isPhoneExist) {
    return Promise.reject(ERRORS.PHONE_NOT_EXISTED);
  }
  if (newPassword) {
    await dbAccess.setNewPassword(phone, newPassword);
  }
  res.ok();
};

export const linkPhone = async (req, res) => {
  const { phone, password, code, otp } = req.body;
  const isPhoneExist = await dbAccess.checkPhoneExist(phone);
  if (isPhoneExist) {
    return Promise.reject(ERRORS.PHONE_EXISTED);
  }
  if (!otp) {
    const newOtp = common.generateOtp();
    await common.sendPhoneOtp(phone, newOtp);
    await dbAccess.insertOtpPhoneToDb(phone, newOtp);
    return res.json({ otp: newOtp });
  }
  const isOtpValid = await dbAccess.checkOtpValid(phone, otp);
  if (!isOtpValid) {
    return Promise.reject(ERRORS.INVALID_OTP_ERROR);
  }
  // save in db
  const accessToken = code ? await fbUtil.getAccessToken(code) : req.body.accessToken;
  const userFb = await fbUtil.getFbProfile(accessToken, ['id', 'name']);
  const user = await dbAccess.getUserFromFacebookId(userFb.id);
  await dbAccess.linkUserPhone(user.id, phone, password);
  res.ok();
};

export const linkFacebook = async (req, res) => {
  const { code } = req.body;
  const { userId } = req;
  const accessToken = code ? await fbUtil.getAccessToken(code) : req.body.accessToken;
  const userFb = await fbUtil.getFbProfile(accessToken, ['id', 'name']);
  const fbExist = await dbAccess.checkFbExist(userFb.id);
  if (fbExist) {
    return Promise.reject(ERRORS.FACEBOOK_EXIST);
  }
  await dbAccess.linkFacebook(userFb.id, userId, userFb.name);
  res.ok();
};

export const registerWithFbKit = async (req, res) => {
  const { code, password, fullName, followingCategoryIds } = req.body;
  const accessToken = code ? await fbUtil.getAccessTokenAccountKit(code) : req.body.accessToken;
  const phone = await fbUtil.getPhoneFromAccessToken(accessToken);
  const isPhoneExist = await dbAccess.checkPhoneExist(phone);
  if (isPhoneExist) {
    return Promise.reject(ERRORS.PHONE_EXISTED);
  }
  const userId = await dbAccess.createUserPhone(phone, fullName, password);
  if (followingCategoryIds) {
    await dbAccess.syncFollowingCategories(followingCategoryIds, userId);
  }
  const token = await common.getToken(userId, fullName, null);
  const refreshToken = await dbAccess.getRefreshToken(token);
  return res.json({ token, refreshToken });
};

export const getAnonymousToken = async (req, res) => {
  const userId = common.getAnonymousUserId();
  const token = await common.getAnonymousToken(userId);
  return res.json({ token, refreshToken: 'refreshToken' });
};
