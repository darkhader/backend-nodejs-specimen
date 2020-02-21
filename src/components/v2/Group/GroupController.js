import * as dbAccess from './GroupDAL';
import { commonIgnoreAndBlock, commonPost } from '../common';


export const getGroups = async (req, res) => {
  const groups = await dbAccess.getGroups();
  res.json({ total: 0, total_record: 0, items: groups });
};

export const getPostsOfGroup = async (req, res) => {
  const { groupName } = req.query;
  const { userId } = req;
  const [ignoredPostIds, blockUserIds] = await commonIgnoreAndBlock.getListIgnoreAndBlock(userId);

  const postIds = await dbAccess.getPostIdsOfGroup(req.pagination, groupName, ignoredPostIds, blockUserIds);
  if (postIds.length) {
    const posts = await commonPost.getListPost(userId, postIds);
    res.json({ total: 0, total_record: 0, items: posts });
    return;
  }
  res.json({ total: 0, total_record: 0, items: [] });
};
