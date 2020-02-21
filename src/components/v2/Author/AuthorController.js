import * as dbAccess from './AuthorDAL';
import { commonLogAction } from '../common';

export const getListFollowers = async (req, res) => {
  const { authorId } = req.params;
  const followers = await dbAccess.getListFollower(authorId, req.pagination);
  res.json({ total: 0, total_record: 0, items: followers });
};

export const getDetail = async (req, res) => {
  const { authorId } = req.params;
  const { userId } = req;

  const author = await dbAccess.getDetail(authorId, userId);
  // Log Action
  commonLogAction.logViewAuthor(userId, authorId);
  res.json(author);
};
