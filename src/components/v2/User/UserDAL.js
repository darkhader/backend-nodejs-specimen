import _ from 'lodash';
import * as dbUtil from '../../../util/databaseUtil';
import redisUtil from '../../../util/redisUtil';
import * as common from './common';
import { commonPost } from '../common';
import { REDIS, CATEGORY, USERS, ERRORS } from '../../../constant';

// Get Me
export const getMe = async userId => {
  const sql = `
    SELECT
    u.id "id",
    u.fullName "fullName",
    u.avatar "avatar",
    u.numberFollower "numberFollower",
    u.numberFollowing "numberFollowing",
    u.numberPost "numberPost",
    u.about "about",
    up.phone "phone"
    FROM users AS u LEFT JOIN user__phone AS up ON u.id = up.id
    WHERE u.id = ?
  `;
  return dbUtil.queryOne(sql, [userId]);
};

// Update Profile
export const updateProfile = async (userId, fullName, about) => {
  if (fullName) {
    if (about !== null && about !== undefined) {
      const sql = 'UPDATE users SET fullName=?,about=? WHERE id=?';
      const params = [fullName, about, userId];
      // exec async
      common.updateFullName(userId, fullName);
      commonPost.deletePostOfAuthorInCache(userId);
      return dbUtil.execute(sql, params);
    }
    const sql = 'UPDATE users SET fullName=? WHERE id=?';
    const params = [fullName, userId];
    // exec async
    common.updateFullName(userId, fullName);
    commonPost.deletePostOfAuthorInCache(userId);
    return dbUtil.execute(sql, params);
  }
  if (about !== null && about !== undefined) {
    const sql = 'UPDATE users SET about=? WHERE id=?';
    const params = [about, userId];
    return dbUtil.execute(sql, params);
  }
};

// Update Avatar
export const updateAvatar = async (userId, avatar) => {
  const sql = 'UPDATE users SET avatar=? WHERE id=?';
  const params = [avatar, userId];
  // exec async
  commonPost.deletePostOfAuthorInCache(userId);

  return dbUtil.execute(sql, params);
};

// Get Authors Following
export const getAuthorsFollowing = async (userId, { limit, offset }, blockUserIds = []) => {
  const sql = `
    SELECT 
      u.id,
      u.fullName,
      u.avatar,
      u.numberFollower,
      u.numberFollowing
    FROM author_follows af 
    INNER JOIN users u ON (af.authorId = u.id AND af.userId = ?) 
    WHERE 
      u.status = ${USERS.STATUS.ACTIVE}
      ${blockUserIds.length ? 'AND u.id NOT IN (?)' : ''}
    ORDER BY af.createdAt DESC
    LIMIT ? OFFSET ?
  `;
  const params = blockUserIds.length ? [userId, limit, offset, blockUserIds] : [userId, limit, offset];

  return dbUtil.query(sql, params);
};

/**
 * Get Authors Follow Suggest
 */
export const getAuthorsFollowSuggest = async (userId, { limit, offset }, blockUserIds = []) => {
  const sql = `
    SELECT 
      u.id,
      u.fullName,
      u.avatar,
      u.numberFollower,
      u.numberFollowing
    FROM users AS u 
    LEFT JOIN author_follows af ON (af.authorId = u.id AND af.userId = ?)
    WHERE 
      u.id != ? 
      AND u.status = ${USERS.STATUS.ACTIVE}
      AND af.userId IS NULL
      ${blockUserIds.length ? 'AND u.id NOT IN (?)' : ''}
      order by rand()
    LIMIT ? OFFSET ?
  `;
  const params = blockUserIds.length ? [userId, userId, blockUserIds, limit, offset]
    : [userId, userId, limit, offset];

  return dbUtil.query(sql, params);
};

/**
 * Follow Author
 */
export const followAuthor = async (userId, authorId) => {
  const transaction = await dbUtil.beginTransaction();

  try {
    const follow = { userId, authorId };
    const sqlInsertFollow = 'INSERT IGNORE INTO author_follows SET ?';
    const insertResult = await dbUtil.execute(sqlInsertFollow, follow, transaction);
    if (insertResult.affectedRows > 0) {
      const sqlUpdateNumberFollower = 'UPDATE users SET numberFollower = numberFollower+1 WHERE id = ?';
      const sqlUpdateNumberFollowing = 'UPDATE users SET numberFollowing = numberFollowing+1 WHERE id = ?';

      await Promise.all([
        dbUtil.execute(sqlUpdateNumberFollower, [authorId], transaction),
        dbUtil.execute(sqlUpdateNumberFollowing, [userId], transaction),
      ]);
      await dbUtil.commitTransaction(transaction);
      common.incrFollowerNumberBy(authorId, 1);
      return;
    }
    dbUtil.rollbackTransaction(transaction);
    return Promise.reject(ERRORS.NOTHING_CHANGED);
  } catch (error) {
    dbUtil.rollbackTransaction(transaction);
    return Promise.reject(error);
  }
};

/**
 * Unfollow Author
 */
export const unfollowAuthor = async (userId, authorId) => {
  const transaction = await dbUtil.beginTransaction();

  try {
    const sqlDeleteFollow = 'DELETE FROM author_follows WHERE userId = ? AND authorId = ?';
    const deleteResult = await dbUtil.execute(sqlDeleteFollow, [userId, authorId], transaction);
    if (deleteResult.affectedRows > 0) {
      const sqlUpdateNumberFollower = 'UPDATE users SET numberFollower = numberFollower-1 WHERE id = ? AND numberFollower > 0';
      const sqlUpdateNumberFollowing = 'UPDATE users SET numberFollowing = numberFollowing-1 WHERE id = ? AND numberFollowing > 0';

      await Promise.all([
        dbUtil.execute(sqlUpdateNumberFollower, [authorId], transaction),
        dbUtil.execute(sqlUpdateNumberFollowing, [userId], transaction),
      ]);

      await dbUtil.commitTransaction(transaction);
      common.incrFollowerNumberBy(authorId, -1);
      return;
    }
    dbUtil.rollbackTransaction(transaction);
    return;
  } catch (error) {
    dbUtil.rollbackTransaction(transaction);
    return Promise.reject(error);
  }
};

/**
 * Get Categories Following
 */
export const getCategoriesFollowing = async (userId) => {
  const sql = `
    SELECT 
      c.*
    FROM categories c 
    INNER JOIN category_follows cf ON (cf.categoryId = c.id AND cf.userId = ?)
    WHERE 
      c.status = ${CATEGORY.STATUS.ACTIVE}
    ORDER BY cf.order ASC
  `;
  const params = [userId];

  return dbUtil.query(sql, params);
};

/**
 * Get Categories Follow Suggest
 */
export const getCategoriesFollowSuggest = async (userId) => {
  const sql = `
    SELECT 
      c.*
    FROM categories c 
    LEFT JOIN category_follows cf ON (cf.categoryId = c.id AND cf.userId = ?)
    WHERE 
      cf.categoryId IS NULL
      AND c.status = ${CATEGORY.STATUS.ACTIVE}
  `;
  const params = [userId];

  return dbUtil.query(sql, params);
};

/**
 * Update Follow Category
 */
export const updateFollowCategory = async (userId, updatedCategories) => {
  const transaction = await dbUtil.beginTransaction();
  try {
    const sqlDeleteCategoryFollow = 'DELETE FROM category_follows WHERE userId = ? RETURNING categoryId';
    const deletedCategoryFollowResult = await dbUtil.execute(sqlDeleteCategoryFollow, [userId], transaction);
    let unfollowCategoryIds = [];
    let followCategoryIds = [];
    if (deletedCategoryFollowResult[0]) {
      const categoriesFollowing = deletedCategoryFollowResult.map(category => category.categoryId);
      unfollowCategoryIds = _.difference(categoriesFollowing, updatedCategories);
      followCategoryIds = _.difference(updatedCategories, categoriesFollowing);
    } else {
      followCategoryIds = updatedCategories;
    }
    // follow categories
    const sqlInsertFollow = 'INSERT INTO category_follows(categoryId,userId,`order`) VALUES ?';
    await dbUtil.execute(sqlInsertFollow, [updatedCategories.map((categoryId, i) => [categoryId, userId, i])], transaction);
    // update number follow
    if (unfollowCategoryIds.length) {
      const sqlMinusNumberFollower = 'UPDATE categories SET numberFollower = numberFollower-1 WHERE id IN (?)';
      await dbUtil.execute(sqlMinusNumberFollower, [unfollowCategoryIds], transaction);
    }
    if (followCategoryIds.length) {
      const sqlPlusNumberFollower = 'UPDATE categories SET numberFollower = numberFollower+1 WHERE id IN (?)';
      await dbUtil.execute(sqlPlusNumberFollower, [followCategoryIds], transaction);
    }
    await dbUtil.commitTransaction(transaction);
    return { followCategoryIds, unfollowCategoryIds };
  } catch (error) {
    dbUtil.rollbackTransaction(transaction);
    return Promise.reject(error);
  }
};

/**
 * Follow Category
 */
export const followCategory = async (userId, categoryId) => {
  const transaction = await dbUtil.beginTransaction();

  try {
    const sqlCount = 'SELECT MAX(`order`) max FROM category_follows WHERE userId = ?';
    const row = await dbUtil.queryOne(sqlCount, [userId]);
    const maxOrder = row ? row.max || 0 : 0;
    const follow = { userId, categoryId, order: maxOrder + 1 };
    const sqlInsertFollow = 'INSERT IGNORE INTO category_follows SET ?';
    const insertResult = await dbUtil.execute(sqlInsertFollow, follow, transaction);
    if (insertResult.affectedRows > 0) {
      const sqlUpdateNumberFollower = 'UPDATE categories SET numberFollower = numberFollower+1 WHERE id = ?';
      await dbUtil.execute(sqlUpdateNumberFollower, [categoryId], transaction);
      await dbUtil.commitTransaction(transaction);
      return;
    }
    dbUtil.rollbackTransaction(transaction);
    return;
  } catch (error) {
    dbUtil.rollbackTransaction(transaction);
    return Promise.reject(error);
  }
};

/**
 * Unfollow Category
 */
export const unfollowCategory = async (userId, categoryId) => {
  const transaction = await dbUtil.beginTransaction();

  try {
    const sqlDeleteFollow = 'DELETE FROM category_follows WHERE userId = ? AND categoryId = ?';
    const deleteResult = await dbUtil.execute(sqlDeleteFollow, [userId, categoryId], transaction);
    if (deleteResult.affectedRows > 0) {
      const sqlUpdateNumberFollower = 'UPDATE categories SET numberFollower = numberFollower-1 WHERE id = ? AND numberFollower > 0';
      await dbUtil.execute(sqlUpdateNumberFollower, [categoryId], transaction);
      await dbUtil.commitTransaction(transaction);
      return;
    }
    dbUtil.rollbackTransaction(transaction);
    return;
  } catch (error) {
    dbUtil.rollbackTransaction(transaction);
    return Promise.reject(error);
  }
};


/**
 * share
 */

export const anonymousShare = async (postId) => {
  const shareSql = 'UPDATE posts SET shareNumber = shareNumber+1 WHERE id = ?';
  const updateShareResult = await dbUtil.execute(shareSql, [postId]);
  if (updateShareResult.affectedRows > 0) {
    redisUtil.incrbyAsync(`${REDIS.POST_LITE_PREFIX}:${postId}:shareNumber`, 1).catch(() => { });
  }
};

// Report Post
export const reportPost = async (userId, postId, reasonId) => {
  const transaction = await dbUtil.beginTransaction();

  try {
    const sqlInsertReport = 'INSERT INTO reports SET ?';
    const insertResult = await dbUtil.execute(sqlInsertReport, { userId, postId, reasonId });
    if (insertResult.affectedRows > 0) {
      const sqlUpdateReportNumber = 'UPDATE posts SET reportNumber = reportNumber+1 WHERE id = ?';
      await dbUtil.execute(sqlUpdateReportNumber, [postId], transaction);
      await dbUtil.commitTransaction(transaction);
      return;
    }
    dbUtil.rollbackTransaction(transaction);
    return;
  } catch (error) {
    dbUtil.rollbackTransaction(transaction);
    return Promise.reject(error);
  }
};

// Ignore Post
export const ignorePost = async (userId, postId) => {
  const ignoreSql = 'INSERT IGNORE INTO ignores SET ?';
  return dbUtil.execute(ignoreSql, { userId, postId });
};

// Unignore Post
export const unignorePost = async (userId, postId) => {
  const ignoreSql = 'DELETE FROM ignores WHERE userId=? AND postId=?';
  return dbUtil.execute(ignoreSql, [userId, postId]);
};

// Block Author
export const blockUser = async (userId, blockedUserId) => {
  const blockSql = 'INSERT INTO blocks SET ?';
  return dbUtil.execute(blockSql, { userId, blockedUserId });
};

// Unblock Author
export const unblockUser = async (userId, blockedUserId) => {
  const blockSql = 'DELETE FROM blocks WHERE userId=? AND blockedUserId=?';
  return dbUtil.execute(blockSql, [userId, blockedUserId]);
};
