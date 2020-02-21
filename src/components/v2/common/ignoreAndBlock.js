// lib
import _ from 'lodash';
import * as dbUtil from '../../../util/databaseUtil';
import redisUtil from '../../../util/redisUtil';
import { REDIS, ERRORS } from '../../../constant';
import { logger } from '../../../util/logUtil';

// getFlagIgnore
const getFlagIgnore = async (userId, needCheckFlag = true, flag) => {
  if (needCheckFlag) {
    let flagIgnore = false;
    try {
      flagIgnore = await redisUtil.getAsync(`${REDIS.IGNORE_FLAG_PREFIX}:${userId}`);
    } catch (error) {
      logger.warn(error);
    }
    return flagIgnore;
  }
  return flag;
};
// getFlagBlock
const getFlagBlock = async (userId, needCheckFlag = true, flag) => {
  if (needCheckFlag) {
    let flagBlock = false;
    try {
      flagBlock = await redisUtil.getAsync(`${REDIS.BLOCK_FLAG_PREFIX}:${userId}`);
    } catch (error) {
      logger.warn(error);
    }
    return flagBlock;
  }
  return flag;
};
// getFlagIgnoreAndFlagBlock
const getFlagIgnoreAndFlagBlock = async userId => {
  let [flagIgnore, flagBlock] = [false, false];
  try {
    [flagIgnore, flagBlock] = await redisUtil.mgetAsync([`${REDIS.IGNORE_FLAG_PREFIX}:${userId}`, `${REDIS.BLOCK_FLAG_PREFIX}:${userId}`]);
  } catch (error) {
    logger.warn(error);
  }
  return [flagIgnore, flagBlock];
};

// getListPostIdIgnoredFromCache
const getListPostIdIgnoredFromCache = async userId => {
  return redisUtil.smembersAsync(`${REDIS.IGNORE_PREFIX}:${userId}`);
};
// getListPostIdIgnoredFromDb
const getListPostIdIgnoredFromDb = async userId => {
  const sql = `
    SELECT
      i.postId
    FROM ignores i
    WHERE i.userId=?
  `;
  const params = [userId];
  const rows = await dbUtil.query(sql, params);
  return rows.map(row => row.postId);
};
// saveListPostIdIgnoredToCache
const saveListPostIdIgnoredToCache = (userId, postIds) => {
  redisUtil.delAsync(`${REDIS.IGNORE_PREFIX}:${userId}`).then(() => {
    if (postIds.length) {
      redisUtil.saddAsync(`${REDIS.IGNORE_PREFIX}:${userId}`, postIds).catch(() => { });
    }
  });
  redisUtil.setAsync(`${REDIS.IGNORE_FLAG_PREFIX}:${userId}`, 1, 'ex', REDIS.IGNORE_FLAG_TTL).catch(() => { });
};

// getListUserIdBlockFromCache
const getListUserIdBlockFromCache = async userId => {
  return Promise.all([
    redisUtil.smembersAsync(`${REDIS.BLOCK_PROACTIVE_PREFIX}:${userId}`),
    redisUtil.smembersAsync(`${REDIS.BLOCK_PASSIVE_PREFIX}:${userId}`),
  ]);
};
// getListUserIdBlockFromDb
const getListUserIdBlockFromDb = async userId => {
  const sql = `
    SELECT
      b.blockedUserId,
      b.userId
    FROM blocks b
    WHERE b.userId=? OR b.blockedUserId=?
  `;
  const params = [userId, userId];
  const rows = await dbUtil.query(sql, params);
  return [
    rows.map(row => row.blockedUserId).filter(v => v !== userId),
    rows.map(row => row.userId).filter(v => v !== userId),
  ];
};
// saveListUserIdBlockToCache
const saveListUserIdBlockToCache = (userId, blockProactiveIds, blockPassiveUserIds) => {
  redisUtil.delAsync(`${REDIS.BLOCK_PROACTIVE_PREFIX}:${userId}`).then(() => {
    if (blockProactiveIds.length) {
      redisUtil.saddAsync(`${REDIS.BLOCK_PROACTIVE_PREFIX}:${userId}`, blockProactiveIds).catch(() => { });
    }
  });
  redisUtil.delAsync(`${REDIS.BLOCK_PASSIVE_PREFIX}:${userId}`).then(() => {
    if (blockPassiveUserIds.length) {
      redisUtil.saddAsync(`${REDIS.BLOCK_PASSIVE_PREFIX}:${userId}`, blockPassiveUserIds).catch(() => { });
    }
  });
  redisUtil.setAsync(`${REDIS.BLOCK_FLAG_PREFIX}:${userId}`, 1, 'ex', REDIS.BLOCK_FLAG_TTL).catch(() => { });
};

// get list ignore
export const getListPostIdIgnored = async (userId, needCheckFlag = true, flag) => {
  const flagIgnore = await getFlagIgnore(userId, needCheckFlag, flag);
  if (flagIgnore) {
    return getListPostIdIgnoredFromCache(userId);
  }
  const postIds = await getListPostIdIgnoredFromDb(userId);
  saveListPostIdIgnoredToCache(userId, postIds);
  return postIds;
};

// get list block
export const getListUserIdBlock = async (userId, needCheckFlag = true, flag) => {
  const flagBlock = await getFlagBlock(userId, needCheckFlag, flag);
  if (flagBlock) {
    const [blockProactiveUserIds, blockPassiveUserIds] = await getListUserIdBlockFromCache(userId);
    return _.union(blockProactiveUserIds, blockPassiveUserIds);
  }
  const [blockProactiveUserIds, blockPassiveUserIds] = await getListUserIdBlockFromDb(userId);
  saveListUserIdBlockToCache(userId, blockProactiveUserIds, blockPassiveUserIds);
  return _.union(blockProactiveUserIds, blockPassiveUserIds);
};

// get list ignore and block
export const getListIgnoreAndBlock = async userId => {
  const [flagIgnore, flagBlock] = await getFlagIgnoreAndFlagBlock(userId);
  return Promise.all([
    getListPostIdIgnored(userId, false, flagIgnore),
    getListUserIdBlock(userId, false, flagBlock),
  ]);
};

// check ignore
export const checkIgnorePost = async (userId, ignorePostId, needCheckFlag = true, flag) => {
  const flagIgnore = await getFlagIgnore(userId, needCheckFlag, flag);
  if (flagIgnore) {
    return redisUtil.sismemberAsync(`${REDIS.IGNORE_PREFIX}:${userId}`, ignorePostId);
  }
  const postIds = await getListPostIdIgnoredFromDb(userId);
  saveListPostIdIgnoredToCache(userId, postIds);
  return postIds.includes(ignorePostId);
};
export const checkIgnorePostMw = (ignorePostIdPath) => async (req, res, next) => {
  const { userId } = req;
  const ignorePostId = _.get(req, ignorePostIdPath);
  const ignored = await checkIgnorePost(userId, ignorePostId);
  if (ignored) {
    return Promise.reject(ERRORS.USER_DONT_HAVE_PERMISSION_ERROR);
  }
  next();
};

// check block
export const checkBlockUser = async (userId, blockUserId, needCheckFlag = true, flag) => {
  const flagBlock = await getFlagBlock(userId, needCheckFlag, flag);
  if (flagBlock) {
    const [blockProactive, blockPassive] = await Promise.all([
      redisUtil.sismemberAsync(`${REDIS.BLOCK_PROACTIVE_PREFIX}:${userId}`, blockUserId),
      redisUtil.sismemberAsync(`${REDIS.BLOCK_PASSIVE_PREFIX}:${userId}`, blockUserId),
    ]);
    return blockProactive || blockPassive;
  }
  const [blockProactiveUserIds, blockPassiveUserIds] = await getListUserIdBlockFromDb(userId);
  saveListUserIdBlockToCache(userId, blockProactiveUserIds, blockPassiveUserIds);
  return blockProactiveUserIds.includes(blockUserId) || blockPassiveUserIds.includes(blockUserId);
};
export const checkBlockUserMw = (blockUserIdPath) => async (req, res, next) => {
  const { userId } = req;
  const blockUserId = _.get(req, blockUserIdPath);
  const blocked = await checkBlockUser(userId, blockUserId);
  if (blocked) {
    return Promise.reject(ERRORS.USER_DONT_HAVE_PERMISSION_ERROR);
  }
  next();
};

// check ignore and block
export const checkIgnorePostOrBlockUser = async (userId, ignorePostId, blockUserId) => {
  const [flagIgnore, flagBlock] = await getFlagIgnoreAndFlagBlock(userId);
  const [ignored, blocked] = await Promise.all([
    checkIgnorePost(userId, ignorePostId, false, flagIgnore),
    checkBlockUser(userId, blockUserId, false, flagBlock),
  ]);
  return ignored || blocked;
};
export const checkIgnorePostOrBlockUserMw = (ignorePostIdPath, blockUserIdPath) => async (req, res, next) => {
  const { userId } = req;
  const ignorePostId = _.get(req, ignorePostIdPath);
  const blockUserId = _.get(req, blockUserIdPath);
  const ignoredOrBlocked = await checkIgnorePostOrBlockUser(userId, ignorePostId, blockUserId);
  if (ignoredOrBlocked) {
    return Promise.reject(ERRORS.USER_DONT_HAVE_PERMISSION_ERROR);
  }
  next();
};
