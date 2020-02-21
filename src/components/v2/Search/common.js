// lib
import * as dbUtil from '../../../util/databaseUtil';

export const getListUser = async (userId, listUserId) => {
  if (listUserId.length === 0) {
    return [];
  }
  const sql = `SELECT u.id,
    u.fullName,
    u.avatar,
    u.about,
    u.numberFollower,
    af.userId IS NOT NULL followed 
  FROM users u
  LEFT JOIN author_follows af ON af.authorId = u.id AND af.userId = ?
  WHERE u.id IN (?)
  `;
  return dbUtil.query(sql, [userId, listUserId]);
};
