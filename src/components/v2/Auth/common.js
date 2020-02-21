
import numeral from 'numeral';
import uuidv4 from 'uuid/v4';
import * as jwtUtil from '../../../util/jwtUtil';
import * as elasticSearchUtil from '../../../util/elasticSearchUtil';
import * as bcryptUtil from '../../../util/bcryptUtil';
import * as twilioUtil from '../../../util/twilioUtil';

import { TOKEN } from '../../../constant';

export const getToken = (id, fullName, avatar) => jwtUtil.getToken({ id, fullName, avatar }, { expiresIn: TOKEN.TOKEN_EXPIRED });
export const getAnonymousToken = id => jwtUtil.getToken({ id }, { expiresIn: TOKEN.ANONYMOUS_TOKEN_EXPIRED });
export const getAnonymousUserId = () => {
  const randomUuid = uuidv4();
  return `NAU-${randomUuid.substring(4)}`;
};
export const getUserInfoFromToken = async (token) => {
  const { id, fullName, avatar } = await jwtUtil.verifyToken(token);
  return { id, fullName, avatar };
};

export const { compare: checkPassword, hash: hashPassword } = bcryptUtil;

export const generateOtp = () => numeral(Math.ceil(Math.random() * 9999)).format('0000');

export const sendPhoneOtp = async (phone, otp) => twilioUtil.sendSms(phone, `Your verification code is ${otp}`);

export const getRegisterCode = async phone => jwtUtil.getRegisterCode({ phone }, { expiresIn: TOKEN.REGISTER_CODE_EXPIRED });

export const getPhoneFromRegisterCode = async (registerCode) => {
  const registerCodeDecoded = await jwtUtil.verifyRegisterCode(registerCode);
  return registerCodeDecoded.phone;
};

// Forgot Password
export const getForgotPasswordCode = async phone => jwtUtil.getForgotPasswordCode({ phone }, { expiresIn: TOKEN.FORGOT_PASSWORD_CODE_EXPIRED });
export const getPhoneFromForgotPasswordCode = async forgotPasswordCode => {
  const forgotPasswordCodeDecoded = await jwtUtil.verifyForgotPasswordCode(forgotPasswordCode);
  return forgotPasswordCodeDecoded.phone;
};

// create user elasticsearch
export const createUserElasticSearch = (id, fullName) => {
  elasticSearchUtil.create({
    index: 'ainews_users',
    id,
    body: {
      fullName,
      numberFollower: 0,
      active: true,
    },
  }).catch(() => { });
};
