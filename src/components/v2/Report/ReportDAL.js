import * as dbUtil from '../../../util/databaseUtil';

export const getAllReport = async () => {
  const sql = `
    SELECT 
      rr.id,
      rr.reason,
      rr.key
    FROM report_reasons rr
  `;
  return dbUtil.query(sql, []);
};
