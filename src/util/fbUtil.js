import request from 'request-promise-native';

const APP_ID = '609298636149165';
const APP_SECRET = '2bbb61250021c967cbe79434c9490500';
const APP_KIT_SECRET = 'ae19b03aabdf16fa2fe6333e3126f528';

const GRAPH_URL = 'https://graph.facebook.com/v3.2';
const ACCESS_TOKEN_URL = 'https://graph.facebook.com/v3.2/oauth/access_token';
const REDIRECT_URI = 'http://localhost:3000/';
const ACCOUNT_KIT_URL = 'https://graph.accountkit.com/v1.3';

export const getFbProfile = async (accessToken, fields) => {
  const options = {
    qs: {
      access_token: accessToken,
      fields: fields.toString(),
    },
    baseUrl: GRAPH_URL,
  };
  const body = await request.get('/me', options);
  return JSON.parse(body);
};

export const getAccessToken = async (code) => {
  const options = {
    qs: {
      client_id: APP_ID,
      client_secret: APP_SECRET,
      redirect_uri: REDIRECT_URI,
      code,
    },
  };
  const body = await request.get(ACCESS_TOKEN_URL, options);
  return JSON.parse(body).access_token;
};

export const getAccessTokenAccountKit = async (code) => {
  const options = {
    qs: {
      grant_type: 'authorization_code',
      access_token: `AA|${APP_ID}|${APP_KIT_SECRET}`,
      code,
    },
    baseUrl: ACCOUNT_KIT_URL,
  };
  const body = await request.get('/access_token', options);
  return JSON.parse(body).access_token;
};

export const getPhoneFromAccessToken = async (accessToken) => {
  const options = {
    qs: {
      access_token: accessToken,
    },
    baseUrl: ACCOUNT_KIT_URL,
  };
  return new Promise((resolve, reject) => {
    request.get('/me', options, (err, res, body) => {
      if (err) {
        return reject(err);
      }
      const bodyObj = JSON.parse(body);
      if (bodyObj.error) {
        return reject(bodyObj.error);
      }
      return resolve(JSON.parse(body).phone.number);
    });
  });
};
