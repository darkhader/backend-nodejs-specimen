import _ from 'lodash';
import redisUtil from '../../../util/redisUtil';
import * as dbUtil from '../../../util/databaseUtil';
import { logger } from '../../../util/logUtil';
import { REDIS, CATEGORY, ERRORS } from '../../../constant';

let syncFlagDbAndCache = false;
let syncFlagDBAndMemory = false;
let categoryIdsInactive = [];

const getCategoryIdInactiveInDb = async () => {
  const sql = `SELECT id FROM categories WHERE status = ${CATEGORY.STATUS.INACTIVE}`;
  const rows = await dbUtil.query(sql);
  return rows.map(row => row.id);
};

const saveCategoryIdInactiveToCache = categoryIds => {
  redisUtil.delAsync(REDIS.CATEGORY_INACTIVE_NAMESPACE, categoryIds).then(() => {
    if (categoryIds.length) {
      redisUtil.saddAsync(REDIS.CATEGORY_INACTIVE_NAMESPACE, categoryIds).catch(() => { });
    }
  });
};

const checkCategoryInactive = async categoryId => {
  if (syncFlagDbAndCache) {
    try {
      const isInactive = await redisUtil.sismemberAsync(REDIS.CATEGORY_INACTIVE_NAMESPACE, categoryId);
      return isInactive;
    } catch (error) {
      logger.warn(error);
      return categoryIdsInactive.includes(categoryId);
    }
  }
  if (!syncFlagDBAndMemory) {
    categoryIdsInactive = await getCategoryIdInactiveInDb();
    syncFlagDBAndMemory = true;
    saveCategoryIdInactiveToCache(categoryIdsInactive);
    syncFlagDbAndCache = true;
  }
  return categoryIdsInactive.includes(categoryId);
};

export const checkCategory = categoryPath => async (req, res, next) => {
  const categoryId = _.get(req, categoryPath);
  if (categoryId === undefined) {
    next();
    return;
  }
  const isInactive = await checkCategoryInactive(categoryId);
  if (isInactive) {
    return Promise.reject(ERRORS.CATEGORY_INACTIVE_ERROR);
  }
  next();
};
