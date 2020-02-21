import config from '../config';
import {
  Client,
  Connection,
  ConnectionPool,
} from '@elastic/elasticsearch';

class MyConnectionPool extends ConnectionPool {
  markAlive(connection) {
    super.markAlive(connection);
  }
}
class MyConnection extends Connection {
  request(params, callback) {
    super.request(params, callback);
  }
}

const client = new Client({
  node: config.elasticSearchUrl,
  maxRetries: 3,
  requestTimeout: 30000,
  Connection: MyConnection,
  ConnectionPool: MyConnectionPool,
});

export const search = async (params) => {
  const { body } = await client.search(params);
  return body;
};

export const { create: insert, update, bulk } = client;
