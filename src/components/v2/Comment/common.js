import * as dbUtil from '../../../util/databaseUtil';
import { TABLECOMMENT } from '../../../constant';

export const getListCommentTop = async ({ limit, offset }, postId, authorId) => {
  const sql = `
    SELECT cm.*,
      u.id "user.id",
      u.fullName "user.fullName",
      u.avatar "user.avatar"
    FROM comments cm 
    INNER JOIN users u ON u.id = cm.userId
    WHERE 
      cm.postId = ? 
      AND cm.authorId = ?
    ORDER BY cm.upVoteNumber DESC 
    LIMIT ? OFFSET ?
  `;
  const params = [postId, authorId, limit, offset];
  const rows = await dbUtil.query(sql, params);

  return rows.map(dbUtil.nested);
};

export const getListCommentNew = async ({ limit, lastId }, postId, authorId) => {
  const sql = `
    SELECT cm.*,
      u.id "user.id",
      u.fullName "user.fullName",
      u.avatar "user.avatar"
    FROM comments cm 
    INNER JOIN users u ON u.id = cm.userId
    WHERE 
      cm.postId = ? 
      AND (? = -1 OR cm.id < ?)
      AND cm.authorId = ?
    ORDER BY cm.id DESC 
    LIMIT ?
  `;

  const params = [postId, lastId, lastId, authorId, limit];
  const rows = await dbUtil.query(sql, params);

  return rows.map(dbUtil.nested);
};

export const getVotes = async (userId, commentIds, type) => {
  const table = TABLECOMMENT[type];
  const sql = `
    SELECT l.commentId, l.vote
    FROM ${table.votes_comment} l
    WHERE l.userId = ? AND l.commentId IN (?)
  `;
  const params = [userId, commentIds];
  const rows = await dbUtil.query(sql, params);

  return rows.reduce((result, { commentId, vote }) => ({ ...result, [commentId]: vote }), {});
};

export const getListSubComment = async ({ limit, lastId }, parentCmtId) => {
  const sql = `
    SELECT cm.*,
      user.id "user.id",
      user.fullName "user.fullName",
      user.avatar "user.avatar"
    FROM sub_comments cm
    INNER JOIN users user ON user.id = cm.userId
    WHERE cm.parentCmtId = ? AND (? = -1 OR cm.id < ?)
    ORDER BY cm.id DESC LIMIT ?
  `;
  const params = [parentCmtId, lastId, lastId, limit];
  const rows = await dbUtil.query(sql, params);

  return rows.map(dbUtil.nested);
};
