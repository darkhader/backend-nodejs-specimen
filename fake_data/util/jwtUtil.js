import jwt from 'jsonwebtoken';

const JWT_TOKEN_SECRET = 'CAUBECHANKIU';
const JWT_REGISTER_CODE_SECRET = 'caubeCHANKIU';
const JWT_FORGOT_PASSWORD_CODE_SECRET = 'caubechankiu';


export const getToken = (payload, options) => new Promise((resolve, reject) => {
  jwt.sign(payload, JWT_TOKEN_SECRET, options || { noTimestamp: true }, (err, token) => {
    if (err) {
      reject(err);
    } else {
      resolve(token);
    }
  });
});

export const verifyToken = token => new Promise((resolve, reject) => {
  jwt.verify(token, JWT_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      reject(err);
    } else {
      resolve(decoded);
    }
  });
});

export const getRegisterCode = (payload, options) => new Promise((resolve, reject) => {
  jwt.sign(payload, JWT_REGISTER_CODE_SECRET, options || { noTimestamp: true }, (err, registerCode) => {
    if (err) {
      reject(err);
    } else {
      resolve(registerCode);
    }
  });
});

export const verifyRegisterCode = registerCode => new Promise((resolve, reject) => {
  jwt.verify(registerCode, JWT_REGISTER_CODE_SECRET, (err, decoded) => {
    if (err) {
      reject(err);
    } else {
      resolve(decoded);
    }
  });
});

export const getForgotPasswordCode = (payload, options) => new Promise((resolve, reject) => {
  jwt.sign(payload, JWT_FORGOT_PASSWORD_CODE_SECRET, options || { noTimestamp: true }, (err, registerCode) => {
    if (err) {
      reject(err);
    } else {
      resolve(registerCode);
    }
  });
});

export const verifyForgotPasswordCode = registerCode => new Promise((resolve, reject) => {
  jwt.verify(registerCode, JWT_FORGOT_PASSWORD_CODE_SECRET, (err, decoded) => {
    if (err) {
      reject(err);
    } else {
      resolve(decoded);
    }
  });
});
