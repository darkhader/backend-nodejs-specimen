import * as dbUtil from '../../../../util/databaseUtil';
import { POSTS } from '../../../../constant';

export const createBookmark = async (postId, userId) => {
  const sql = 'INSERT IGNORE INTO bookmarks SET ?';
  return dbUtil.execute(sql, { postId, userId });
};

export const removeBookmark = async (postId, userId) => {
  const deleteQuery = 'DELETE FROM bookmarks WHERE userId = ? AND postId = ?';
  const params = [userId, postId];
  return dbUtil.execute(deleteQuery, params);
};

export const getPostIdsBookmarks = async ({ limit, offset }, userId, ignoredPostIds = [], blockUserIds = []) => {
  const sql = `
    SELECT bm.postId
    FROM bookmarks bm 
    INNER JOIN posts p ON ( 
      bm.postId = p.id 
      AND p.status = ${POSTS.STATUS.ACTIVE} 
      ${ignoredPostIds.length ? 'AND p.id NOT IN (?)' : ''}
      ${blockUserIds.length ? 'AND p.authorId NOT IN (?)' : ''}
      )
    WHERE bm.userId = ?
    ORDER BY bm.createdAt DESC LIMIT ? OFFSET ?
  `;
  const params = [];
  if (ignoredPostIds.length) {
    params.push(ignoredPostIds);
  }
  if (blockUserIds.length) {
    params.push(blockUserIds);
  }
  params.push(userId, limit, offset);
  const rows = await dbUtil.query(sql, params);

  return rows.map(row => row.postId);
};
