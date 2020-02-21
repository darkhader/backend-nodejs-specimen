import * as dbUtil from '../../../../util/databaseUtil';
import redisUtil from '../../../../util/redisUtil';
import { ERRORS, REDIS } from '../../../../constant';

/**
 * Comment
 */
// can author id de check truong hop gui sai authorId de pass qua block
export const addComment = async (userId, { postId, authorId, content }) => {
  const transaction = await dbUtil.beginTransaction();

  try {
    const nowInSecond = Math.floor(new Date().getTime() / 1000);
    const comment = { userId, postId, content, authorId, createdTime: nowInSecond };
    const sqlInsertComment = 'INSERT INTO comments SET ?';
    const sqlUpdateNumberComment = `
      UPDATE 
        posts 
      SET 
        commentNumber=commentNumber+1
      WHERE 
        id=? 
        AND authorId=?
      `;
    const [{ insertId: commentId }, updateCommentResult] = await Promise.all([
      dbUtil.execute(sqlInsertComment, comment, transaction),
      dbUtil.execute(sqlUpdateNumberComment, [postId, authorId], transaction),
    ]);
    if (updateCommentResult.affectedRows > 0) {
      await dbUtil.commitTransaction(transaction);
      redisUtil.incrbyAsync(`${REDIS.POST_LITE_PREFIX}:${postId}:commentNumber`, 1).catch(() => { });
      return commentId;
    }
    dbUtil.rollbackTransaction(transaction);
    return Promise.reject(ERRORS.USER_DONT_HAVE_PERMISSION_ERROR);
  } catch (error) {
    dbUtil.rollbackTransaction(transaction);
    return Promise.reject(error);
  }
};

/**
 * Delete Comment
 */
export const deleteComment = async (userId, { commentId }) => {
  const transaction = await dbUtil.beginTransaction();

  try {
    const sqlDeleteComment = 'DELETE FROM comments WHERE userId=? AND id=? RETURNING postId,subCommentNumber';
    const deleteResult = await dbUtil.execute(sqlDeleteComment, [userId, commentId], transaction);
    if (deleteResult[0]) {
      const sqlDeleteSubComment = 'DELETE FROM sub_comments WHERE parentCmtId=?';
      await dbUtil.execute(sqlDeleteSubComment, [commentId], transaction);
      const { subCommentNumber, postId } = deleteResult[0];
      const sqlUpdateNumberComment = 'UPDATE posts SET commentNumber=commentNumber-? WHERE id=?';
      const updateCommentResult = await dbUtil.execute(sqlUpdateNumberComment, [1 + subCommentNumber, postId], transaction);
      await dbUtil.commitTransaction(transaction);
      if (updateCommentResult.affectedRows > 0) {
        redisUtil.incrbyAsync(`${REDIS.POST_LITE_PREFIX}:${postId}:commentNumber`, -1 - subCommentNumber).catch(() => { });
      }
      return;
    }
    dbUtil.rollbackTransaction(transaction);
    return Promise.reject(ERRORS.USER_DONT_HAVE_PERMISSION_ERROR);
  } catch (error) {
    dbUtil.rollbackTransaction(transaction);
    return Promise.reject(error);
  }
};

/**
 * Edit Comment
 */
export const editComment = async (userId, { commentId, content }) => {
  const sqlUpdateComment = 'UPDATE comments SET content=? WHERE userId=? AND id=? ';
  const updateResult = await dbUtil.execute(sqlUpdateComment, [content, userId, commentId]);
  if (updateResult.affectedRows === 0) {
    return Promise.reject(ERRORS.USER_DONT_HAVE_PERMISSION_ERROR);
  }
};

/**
 * Create sub Comment
 */
// can userparentid de check xem co gui userparentid gia de pass block
export const createSubComment = async (userId, parentCmtId, content, postId, authorId, userParentId) => {
  const transaction = await dbUtil.beginTransaction();

  try {
    const comment = { userId, parentCmtId, content, postId, authorId, userParentId };
    const sqlInsertComment = 'INSERT INTO sub_comments SET ? ';
    const { insertId: commentId } = await dbUtil.execute(sqlInsertComment, comment, transaction);
    const sqlUpdateNumberSub = 'UPDATE comments SET subCommentNumber = subCommentNumber+1 WHERE id = ? AND postId = ? AND authorId = ? AND userId = ?';
    const updateSubCommentResult = await dbUtil.execute(sqlUpdateNumberSub, [parentCmtId, postId, authorId, userParentId], transaction);
    if (updateSubCommentResult.affectedRows > 0) {
      const sqlUpdateNumberComment = 'UPDATE posts SET commentNumber=commentNumber+1 WHERE id=?';
      const updateCommentResult = await dbUtil.execute(sqlUpdateNumberComment, [postId], transaction);
      if (updateCommentResult.affectedRows > 0) {
        await dbUtil.commitTransaction(transaction);
        redisUtil.incrbyAsync(`${REDIS.POST_LITE_PREFIX}:${postId}:commentNumber`, 1).catch(() => { });
        return commentId;
      }
    }
    dbUtil.rollbackTransaction(transaction);
    return Promise.reject(ERRORS.COMMENT_NOT_EXISTED);
  } catch (err) {
    dbUtil.rollbackTransaction(transaction);
    return Promise.reject(err);
  }
};
/**
 * Delete Sub Comment
 */
export const deleteSubComment = async (userId, commentId) => {
  const transaction = await dbUtil.beginTransaction();

  try {
    const sqlDeleteComment = 'DELETE FROM sub_comments WHERE userId = ? AND id = ? RETURNING parentCmtId,postId';
    const deleteResult = await dbUtil.execute(sqlDeleteComment, [userId, commentId], transaction);
    if (deleteResult[0]) {
      const { parentCmtId, postId } = deleteResult[0];
      const sqlUpdateNumberSubComment = 'UPDATE comments SET subCommentNumber = subCommentNumber-1 WHERE id = ?';
      await dbUtil.execute(sqlUpdateNumberSubComment, [parentCmtId], transaction);
      const sqlUpdateNumberComment = 'UPDATE posts SET commentNumber=commentNumber-1 WHERE id=?';
      await dbUtil.execute(sqlUpdateNumberComment, [postId], transaction);
      await dbUtil.commitTransaction(transaction);
      redisUtil.incrbyAsync(`${REDIS.POST_LITE_PREFIX}:${postId}:commentNumber`, -1).catch(() => { });
      return;
    }
    dbUtil.rollbackTransaction(transaction);
    return Promise.reject(ERRORS.USER_DONT_HAVE_PERMISSION_ERROR);
  } catch (error) {
    dbUtil.rollbackTransaction(transaction);
    return Promise.reject(error);
  }
};

/**
 * Edit SubComment
 */
// khong can parent Id de update
export const editSubComment = async (userId, commentId, content) => {
  const sqlUpdateComment = 'UPDATE sub_comments SET content = ? WHERE userId = ? AND id = ?';
  const updateResult = await dbUtil.execute(sqlUpdateComment, [content, userId, commentId]);
  if (updateResult.affectedRows === 0) {
    return Promise.reject(ERRORS.USER_DONT_HAVE_PERMISSION_ERROR);
  }
};

// Get List Comment
export const getListComment = async ({ limit, lastId }, userId) => {
  const sql = `
    SELECT 
    cm.id,cm.content,cm.upVoteNumber,cm.downVoteNumber,cm.createdAt,
    p.id "post.id",
    p.displayType "post.displayType",
    p.title "post.title",
    p.shortContent "post.shortContent",
    p.featureImages "post.featureImages",
    u.id "author.id",
    u.fullName "author.fullName", 
    u.avatar "author.avatar" 
    FROM comments cm 
      INNER JOIN posts p ON cm.postId = p.id
      INNER JOIN users u ON p.authorId = u.id
    WHERE userId = ? AND (? = -1 OR cm.id < ?) ORDER BY cm.id DESC LIMIT ?
  `;
  const params = [userId, lastId, lastId, limit];
  const rows = await dbUtil.query(sql, params);
  return rows.map(dbUtil.nested).map(row => ({
    ...row,
    post: {
      ...row.post,
      featureImages: JSON.parse(row.post.featureImages).map(({ large }) => large),
    },
  }));
};
