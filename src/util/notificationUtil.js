import request from 'request-promise-native';
import { ONESIGNAL } from '../constant';

const optionTemplate = {
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    Authorization: `Basic ${ONESIGNAL.REST_API_KEY}`,
  },
  baseUrl: ONESIGNAL.BASE_URL,
};

export const createNotificationByPlayerIds = async (playerIds, msg, data) => {
  const options = {
    ...optionTemplate,
    method: 'POST',
    uri: '/notifications',
    body: {
      app_id: ONESIGNAL.APP_ID,
      include_player_ids: playerIds,
      data,
      contents: { en: msg },
    },
    json: true,
  };
  return request(options);
};

export const createNotificationBytags = async (tags = [], key, msg, data) => {
  const options = {
    ...optionTemplate,
    method: 'POST',
    uri: '/notifications',
    body: {
      app_id: ONESIGNAL.APP_ID,
      filters: tags.reduce((filters, tag, i) => {
        if (i === 0) {
          filters.push({ field: 'tag', key, relation: '=', value: tag });
        } else {
          filters.push({ operator: 'OR' });
          filters.push({ field: 'tag', key, relation: '=', value: tag });
        }
        return filters;
      }, []),
      data,
      contents: { en: msg },
    },
    json: true,
  };
  return request(options);
};

export const createNotificationActiveUser = async (msg, data) => {
  const options = {
    ...optionTemplate,
    method: 'POST',
    uri: '/notifications',
    body: {
      app_id: ONESIGNAL.APP_ID,
      included_segments: ['Active Users'],
      data,
      contents: { en: msg },
    },
    json: true,
  };
  return request(options);
};
