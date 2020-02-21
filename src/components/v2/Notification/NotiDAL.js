import * as dbUtil from '../../../util/databaseUtil';

export const getNoti = async ({ limit, offset }, userId) => {
  const sql = `
    SELECT * FROM notifications
    WHERE userId = ?
    ORDER BY createdAt DESC
    LIMIT ?
    OFFSET ?
  `;
  const rows = await dbUtil.query(sql, [userId, limit, offset]);
  return rows.map(row => ({ ...row, data: row.data ? JSON.parse(row.data) : null }));
};
