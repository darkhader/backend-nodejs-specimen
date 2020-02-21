import { TWILIO } from '../constant';
import request from 'request-promise-native';

const requestOptions = {
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  baseUrl: TWILIO.BASE_URL,
  auth: {
    user: TWILIO.ACCOUNT_SID,
    pass: TWILIO.AUTH_TOKEN,
  },
};

export const sendSms = async (phone, message) => {
  const options = Object.assign({
    form: {
      From: TWILIO.PHONE,
      To: phone,
      Body: message,
    },
  }, requestOptions);
  return request.post(`${TWILIO.API_VERSION}/Accounts/${TWILIO.ACCOUNT_SID}/Messages.json`, options);
};
