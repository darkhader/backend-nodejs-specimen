import * as dbUtil from '../../../util/databaseUtil';
import { POSTS } from '../../../constant';

export const getGroups = async () => {
  const sql = `
    SELECT 
      name,
      image,
      numberPost 
    FROM 
      groups_hot
  `;
  const rows = await dbUtil.query(sql);
  return rows.map(group => ({ ...group, image: group.image ? JSON.parse(group.image).large : null }));
};

export const getPostIdsOfGroup = async ({ limit, offset }, groupName, ignoredPostIds = [], blockUserIds = []) => {
  const sql = `
    SELECT
      gph.postId
    FROM group_post_hot gph
      INNER JOIN posts p ON p.id = gph.postId
    WHERE gph.groupName = ?
      AND p.status = ${POSTS.STATUS.ACTIVE} 
      ${ignoredPostIds.length ? 'AND p.id NOT IN (?)' : ''}
      ${blockUserIds.length ? 'AND p.authorId NOT IN (?)' : ''}
    ORDER BY gph.order ASC
    LIMIT ? OFFSET ?
  `;
  const params = [groupName];
  if (ignoredPostIds.length) {
    params.push(ignoredPostIds);
  }
  if (blockUserIds.length) {
    params.push(blockUserIds);
  }
  params.push(limit, offset);
  const groups = await dbUtil.query(sql, params);
  return groups.map(group => group.postId);
};
