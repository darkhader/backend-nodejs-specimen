import * as dbAccess from './BookmarkDAL';
import { commonLogAction, commonPost } from '../../common';

export const createBookmark = async (req, res) => {
  const { postId } = req.body;
  const { userId } = req;
  await dbAccess.createBookmark(postId, userId);
  // Log Action
  commonLogAction.logBookmarkPost(userId, postId);
  res.ok();
};

export const removeBookmark = async (req, res) => {
  const { userId } = req;
  const { postId } = req.query;
  await dbAccess.removeBookmark(postId, userId);
  // Log Action
  commonLogAction.logUnBookmarkPost(userId, postId);
  res.ok();
};

export const getBookmarks = async (req, res) => {
  const { userId } = req;
  const listPostId = await dbAccess.getPostIdsBookmarks(req.pagination, userId);

  const items = await commonPost.getListPost(userId, listPostId, false);
  res.json({ total: 0, total_record: 0, items });
};
