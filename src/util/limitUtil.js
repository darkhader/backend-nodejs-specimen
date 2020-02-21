import RateLimit from 'express-rate-limit';
// import RedisStore from 'rate-limit-redis';
// import Client from './redisUtil';

export const limiter = new RateLimit({
  // store: new RedisStore({
  //   client: Client,
  // }),
  max: 30,
  statusCode: 429,
  delayMs: 0,
  windowMs: 1 * 60 * 1000, // 1 minute
});
