import request from 'request';
import { ONESIGNAL } from '../constant';

const optionTemplate = {
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    Authorization: `Basic ${ONESIGNAL.REST_API_KEY}`,
  },
  baseUrl: ONESIGNAL.BASE_URL,
};

export const createNotification = async (playerIds, msg, data) => {
  const options = {
    ...optionTemplate,
    method: 'POST',
    uri: '/notifications',
    body: JSON.stringify({
      app_id: ONESIGNAL.APP_ID,
      include_player_ids: playerIds,
      data,
      contents: { en: msg },
    }),
  };
  return callAPI(options);
};

// lib
const callAPI = async options => new Promise((resolve, reject) => {
  request(options, (err, response, body) => {
    if (err) {
      return reject(err);
    }
    try {
      const bodyObj = JSON.parse(body);
      if (bodyObj.error) {
        return reject(bodyObj.error);
      }
      return resolve(bodyObj);
    } catch (error) {
      return reject(body);
    }
  });
});
