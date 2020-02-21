import * as dbUtil from '../../../util/databaseUtil';
import { USERS } from '../../../constant';

export const getListFollower = async (authorId, { limit, offset }) => {
  const sql = `SELECT u.id,
      u.fullName,
      u.avatar 
    FROM author_follows af
    INNER JOIN users u ON (u.id = af.userId AND af.authorId = ?)
    LIMIT ? OFFSET ?`;
  return dbUtil.query(sql, [authorId, limit, offset]);
};

export const getDetail = async (authorId, userId) => {
  const sql = `SELECT u.id,
      u.fullName,
      u.avatar,
      u.numberFollower, 
      u.numberPost, 
      u.about,
      af.userId IS NOT NULL followed 
    FROM users u
    LEFT JOIN author_follows af ON af.authorId = u.id AND af.userId = ?
    WHERE u.id = ? AND u.status = ${USERS.STATUS.ACTIVE}
  `;
  return dbUtil.queryOne(sql, [userId, authorId]);
};
