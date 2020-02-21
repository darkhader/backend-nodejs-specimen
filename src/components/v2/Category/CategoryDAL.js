import * as dbUtil from '../../../util/databaseUtil';
import { CATEGORY } from '../../../constant';

export const getAllCategories = async (userId) => {
  const sql = `
    SELECT 
      c.id,
      c.name,
      c.image,
      c.icon,
      c.color,
      cf.userId IS NOT NULL followed,
      cf.order
    FROM categories c
    LEFT JOIN category_follows cf ON cf.categoryId = c.id AND cf.userId = ?
    WHERE c.status = ${CATEGORY.STATUS.ACTIVE}
    order by rand()
  `;
  const params = [userId];
  return dbUtil.query(sql, params);
};

export const getDefaultCategories = () => {
  const sql = `
    SELECT 
      c.*
    FROM categories c 
    WHERE 
      c.status = ${CATEGORY.STATUS.ACTIVE}
      AND c.default = 1
    ORDER BY c.defaultOrder ASC
  `;
  return dbUtil.query(sql);
};
