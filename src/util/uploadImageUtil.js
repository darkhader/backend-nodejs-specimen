
import request from 'request-promise-native';

const CORE_URL = 'http://103.192.236.67:8080/v1';
const CORE_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE1NjU4ODc0NzUsImV4cCI6MTY1MjI4NzQ4MCwic3ViIjoidGhlb2RvaWJhb2NoaSJ9.M9I01fkn-Qu34UTR-9UkMIGC-QSG201T7Hcz4AQmR74';

export const uploadImage = async (data, type) => {
  const body = await request({
    baseUrl: CORE_URL,
    method: 'POST',
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    auth: {
      bearer: CORE_TOKEN,
    },
    formData: {
      image_type: type,
      data: {
        value: data,
        options: {
          filename: 'image_file',
        },
      },
    },
    uri: '/image/upload',
  });
  return body;
};
