import * as dbUtil from '../../../../util/databaseUtil';
import redisUtil from '../../../../util/redisUtil';
import { REDIS, ERRORS, TABLECOMMENT } from '../../../../constant';

/**
 * Vote
 */
export const upVotePost = async (userId, postId) => {
  const transaction = await dbUtil.beginTransaction();
  try {
    const vote = [userId, postId, 1];
    const sqlInsertVote = `INSERT INTO votes_post (userId,postId,vote) VALUES (?,?,?)
      ON DUPLICATE KEY UPDATE vote = VALUES(vote)
    `;
    const insertResult = await dbUtil.execute(sqlInsertVote, vote, transaction);
    if (insertResult.affectedRows === 1) {
      const sqlUpdateVote = 'UPDATE posts SET upVoteNumber = upVoteNumber+1 WHERE id = ?';
      const updateVoteResult = await dbUtil.execute(sqlUpdateVote, [postId], transaction);
      await dbUtil.commitTransaction(transaction);
      if (updateVoteResult.affectedRows > 0) {
        redisUtil.incrbyAsync(`${REDIS.POST_LITE_PREFIX}:${postId}:upVoteNumber`, 1).catch(() => { });
      }
      return;
    }
    if (insertResult.affectedRows === 2) {
      const sqlUpdateVote = 'UPDATE posts SET upVoteNumber = upVoteNumber+1,downVoteNumber=downVoteNumber-1 WHERE id = ?';
      const updateVoteResult = await dbUtil.execute(sqlUpdateVote, [postId], transaction);
      await dbUtil.commitTransaction(transaction);
      if (updateVoteResult.affectedRows > 0) {
        redisUtil.incrbyAsync(`${REDIS.POST_LITE_PREFIX}:${postId}:upVoteNumber`, 1).catch(() => { });
        redisUtil.incrbyAsync(`${REDIS.POST_LITE_PREFIX}:${postId}:downVoteNumber`, -1).catch(() => { });
      }
      return;
    }
    dbUtil.rollbackTransaction(transaction);
    return Promise.reject(ERRORS.NOTHING_CHANGED);
  } catch (error) {
    dbUtil.rollbackTransaction(transaction);
    return Promise.reject(error);
  }
};
export const unUpVotePost = async (userId, postId) => {
  const transaction = await dbUtil.beginTransaction();
  try {
    const sqlDeleteVote = 'DELETE FROM votes_post WHERE userId = ? AND postId = ? AND vote = ?';
    const params = [userId, postId, 1];
    const deleteResult = await dbUtil.execute(sqlDeleteVote, params, transaction);
    if (deleteResult.affectedRows > 0) {
      const sqlUpdateVote = 'UPDATE posts SET upVoteNumber = upVoteNumber-1 WHERE id = ?';
      const updateVoteResult = await dbUtil.execute(sqlUpdateVote, [postId], transaction);
      await dbUtil.commitTransaction(transaction);
      if (updateVoteResult.affectedRows > 0) {
        redisUtil.incrbyAsync(`${REDIS.POST_LITE_PREFIX}:${postId}:upVoteNumber`, -1).catch(() => { });
      }
      return;
    }
    dbUtil.rollbackTransaction(transaction);
    return Promise.reject(ERRORS.NOTHING_CHANGED);
  } catch (error) {
    dbUtil.rollbackTransaction(transaction);
    return Promise.reject(error);
  }
};
export const downVotePost = async (userId, postId) => {
  const transaction = await dbUtil.beginTransaction();
  try {
    const vote = [userId, postId, -1];
    const sqlInsertVote = `INSERT INTO votes_post (userId,postId,vote) VALUES (?,?,?)
      ON DUPLICATE KEY UPDATE vote = VALUES(vote)
    `;
    const insertResult = await dbUtil.execute(sqlInsertVote, vote, transaction);

    if (insertResult.affectedRows === 1) {
      const sqlUpdateVote = 'UPDATE posts SET downVoteNumber = downVoteNumber+1 WHERE id = ?';
      const updateVoteResult = await dbUtil.execute(sqlUpdateVote, [postId], transaction);
      await dbUtil.commitTransaction(transaction);
      if (updateVoteResult.affectedRows > 0) {
        redisUtil.incrbyAsync(`${REDIS.POST_LITE_PREFIX}:${postId}:downVoteNumber`, 1).catch(() => { });
      }
      return;
    }
    if (insertResult.affectedRows === 2) {
      const sqlUpdateVote = 'UPDATE posts SET upVoteNumber = upVoteNumber-1,downVoteNumber=downVoteNumber+1 WHERE id = ?';
      const updateVoteResult = await dbUtil.execute(sqlUpdateVote, [postId], transaction);
      await dbUtil.commitTransaction(transaction);
      if (updateVoteResult.affectedRows > 0) {
        redisUtil.incrbyAsync(`${REDIS.POST_LITE_PREFIX}:${postId}:upVoteNumber`, -1).catch(() => { });
        redisUtil.incrbyAsync(`${REDIS.POST_LITE_PREFIX}:${postId}:downVoteNumber`, 1).catch(() => { });
      }
      return;
    }
    dbUtil.rollbackTransaction(transaction);
    return Promise.reject(ERRORS.NOTHING_CHANGED);
  } catch (error) {
    dbUtil.rollbackTransaction(transaction);
    return Promise.reject(error);
  }
};
export const unDownVotePost = async (userId, postId) => {
  const transaction = await dbUtil.beginTransaction();
  try {
    const sqlDeleteVote = 'DELETE FROM votes_post WHERE userId = ? AND postId = ? AND vote = ?';
    const params = [userId, postId, -1];
    const deleteResult = await dbUtil.execute(sqlDeleteVote, params, transaction);
    if (deleteResult.affectedRows > 0) {
      const sqlUpdateVote = 'UPDATE posts SET downVoteNumber = downVoteNumber-1 WHERE id = ?';
      const updateVoteResult = await dbUtil.execute(sqlUpdateVote, [postId], transaction);
      await dbUtil.commitTransaction(transaction);
      if (updateVoteResult.affectedRows > 0) {
        redisUtil.incrbyAsync(`${REDIS.POST_LITE_PREFIX}:${postId}:downVoteNumber`, -1).catch(() => { });
      }
      return;
    }
    dbUtil.rollbackTransaction(transaction);
    return Promise.reject(ERRORS.NOTHING_CHANGED);
  } catch (error) {
    dbUtil.rollbackTransaction(transaction);
    return Promise.reject(error);
  }
};
export const upVoteComment = async (userId, commentId, type) => {
  const transaction = await dbUtil.beginTransaction();
  const table = TABLECOMMENT[type];
  try {
    const vote = [userId, commentId, 1];
    const sqlInsertVote = `INSERT INTO ${table.votes_comment} (userId,commentId,vote) VALUES (?,?,?)
      ON DUPLICATE KEY UPDATE vote = VALUES(vote)
    `;
    const insertResult = await dbUtil.execute(sqlInsertVote, vote, transaction);

    if (insertResult.affectedRows === 1) {
      const sqlUpdateVote = `UPDATE ${table.comment} SET upVoteNumber = upVoteNumber+1 WHERE id = ?`;
      await dbUtil.execute(sqlUpdateVote, [commentId], transaction);
      await dbUtil.commitTransaction(transaction);
      return;
    }
    if (insertResult.affectedRows === 2) {
      const sqlUpdateVote = `UPDATE ${table.comment} SET upVoteNumber = upVoteNumber+1,downVoteNumber=downVoteNumber-1 WHERE id = ?`;
      await dbUtil.execute(sqlUpdateVote, [commentId], transaction);
      await dbUtil.commitTransaction(transaction);
      return;
    }
    dbUtil.rollbackTransaction(transaction);
    return Promise.reject(ERRORS.NOTHING_CHANGED);
  } catch (error) {
    dbUtil.rollbackTransaction(transaction);
    return Promise.reject(error);
  }
};
export const unUpVoteComment = async (userId, commentId, type) => {
  const transaction = await dbUtil.beginTransaction();
  const table = TABLECOMMENT[type];
  try {
    const sqlDeleteVote = `DELETE FROM ${table.votes_comment} WHERE userId = ? AND commentId = ? AND vote = ?`;
    const params = [userId, commentId, 1];
    const deleteResult = await dbUtil.execute(sqlDeleteVote, params, transaction);
    if (deleteResult.affectedRows > 0) {
      const sqlUpdateVote = `UPDATE ${table.comment} SET upVoteNumber = upVoteNumber-1 WHERE id = ?`;
      await dbUtil.execute(sqlUpdateVote, [commentId], transaction);
      await dbUtil.commitTransaction(transaction);
      return;
    }
    dbUtil.rollbackTransaction(transaction);
    return Promise.reject(ERRORS.NOTHING_CHANGED);
  } catch (error) {
    dbUtil.rollbackTransaction(transaction);
    return Promise.reject(error);
  }
};
export const downVoteComment = async (userId, commentId, type) => {
  const transaction = await dbUtil.beginTransaction();
  const table = TABLECOMMENT[type];
  try {
    const vote = [userId, commentId, -1];
    const sqlInsertVote = `INSERT INTO ${table.votes_comment} (userId,commentId,vote) VALUES (?,?,?)
      ON DUPLICATE KEY UPDATE vote = VALUES(vote)
    `;
    const insertResult = await dbUtil.execute(sqlInsertVote, vote, transaction);

    if (insertResult.affectedRows === 1) {
      const sqlUpdateVote = `UPDATE ${table.comment} SET downVoteNumber = downVoteNumber+1 WHERE id = ?`;
      await dbUtil.execute(sqlUpdateVote, [commentId], transaction);
      await dbUtil.commitTransaction(transaction);
      return;
    }
    if (insertResult.affectedRows === 2) {
      const sqlUpdateVote = `UPDATE ${table.comment} SET upVoteNumber = upVoteNumber-1,downVoteNumber=downVoteNumber+1 WHERE id = ?`;
      await dbUtil.execute(sqlUpdateVote, [commentId], transaction);
      await dbUtil.commitTransaction(transaction);
      return;
    }
    dbUtil.rollbackTransaction(transaction);
    return Promise.reject(ERRORS.NOTHING_CHANGED);
  } catch (error) {
    dbUtil.rollbackTransaction(transaction);
    return Promise.reject(error);
  }
};
export const unDownVoteComment = async (userId, commentId, type) => {
  const transaction = await dbUtil.beginTransaction();
  const table = TABLECOMMENT[type];
  try {
    const sqlDeleteVote = `DELETE FROM ${table.votes_comment} WHERE userId = ? AND commentId = ? AND vote = ?`;
    const params = [userId, commentId, -1];
    const deleteResult = await dbUtil.execute(sqlDeleteVote, params, transaction);
    if (deleteResult.affectedRows > 0) {
      const sqlUpdateVote = `UPDATE ${table.comment} SET downVoteNumber = downVoteNumber-1 WHERE id = ?`;
      await dbUtil.execute(sqlUpdateVote, [commentId], transaction);
      await dbUtil.commitTransaction(transaction);
      return;
    }
    dbUtil.rollbackTransaction(transaction);
    return Promise.reject(ERRORS.NOTHING_CHANGED);
  } catch (error) {
    dbUtil.rollbackTransaction(transaction);
    return Promise.reject(error);
  }
};
