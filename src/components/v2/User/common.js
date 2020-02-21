import * as elasticSearchUtil from '../../../util/elasticSearchUtil';
import redisUtil from '../../../util/redisUtil';
import { REDIS } from '../../../constant';

export const incrFollowerNumberBy = (userId, count) => {
  elasticSearchUtil.update({
    index: 'ainews_users',
    id: userId,
    body: {
      script: {
        source: 'ctx._source.numberFollower += params.count',
        lang: 'painless',
        params: {
          count,
        },
      },
    },
  }).catch(() => { });
};

export const updateFullName = (userId, fullName) => {
  elasticSearchUtil.update({
    index: 'ainews_users',
    id: userId,
    body: {
      script: {
        source: 'ctx._source.fullName = params.fullName',
        lang: 'painless',
        params: {
          fullName,
        },
      },
    },
  }).catch(() => { });
};

export const addIgnorePostToCache = (userId, postId) => {
  redisUtil.getAsync(`${REDIS.IGNORE_FLAG_PREFIX}:${userId}`).then(flag => {
    if (flag) {
      redisUtil.saddAsync(`${REDIS.IGNORE_PREFIX}:${userId}`, postId).catch(() => { });
    }
  }).catch(() => { });
};

export const removeIgnorePostToCache = (userId, postId) => {
  redisUtil.getAsync(`${REDIS.IGNORE_FLAG_PREFIX}:${userId}`).then(flag => {
    if (flag) {
      redisUtil.sremAsync(`${REDIS.IGNORE_PREFIX}:${userId}`, postId).catch(() => { });
    }
  }).catch(() => { });
};

export const addBlockedUserToCache = (userId, blockedUserId) => {
  redisUtil.mgetAsync([`${REDIS.BLOCK_FLAG_PREFIX}:${userId}`, `${REDIS.BLOCK_FLAG_PREFIX}:${blockedUserId}`]).then(([flag1, flag2]) => {
    if (flag1) {
      redisUtil.saddAsync(`${REDIS.BLOCK_PROACTIVE_PREFIX}:${userId}`, blockedUserId).catch(() => { });
    }
    if (flag2) {
      redisUtil.saddAsync(`${REDIS.BLOCK_PASSIVE_PREFIX}:${blockedUserId}`, userId).catch(() => { });
    }
  }).catch(() => { });
};

export const removeBlockedUserToCache = (userId, blockedUserId) => {
  redisUtil.mgetAsync([`${REDIS.BLOCK_FLAG_PREFIX}:${userId}`, `${REDIS.BLOCKED_FLAG_PREFIX}:${blockedUserId}`]).then(([flag1, flag2]) => {
    if (flag1) {
      redisUtil.sremAsync(`${REDIS.BLOCK_PROACTIVE_PREFIX}:${userId}`, blockedUserId).catch(() => { });
    }
    if (flag2) {
      redisUtil.sremAsync(`${REDIS.BLOCK_PASSIVE_PREFIX}:${blockedUserId}`, userId).catch(() => { });
    }
  }).catch(() => { });
};
