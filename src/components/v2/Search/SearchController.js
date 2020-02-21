import * as dbAccess from './SearchDAL';
import * as common from './common';
import { commonPost, commonLogAction } from '../common';

export const searchAll = async (req, res) => {
  const { userId } = req;
  const { key } = req.query;
  const [[postIds, countPost, highlightsPost], [userIds, countUser]] = await dbAccess.searchAll(key);
  const [posts, users] = await Promise.all([
    commonPost.getListPost(userId, postIds, false),
    common.getListUser(userId, userIds),
  ]);
  commonLogAction.logSearchAll(userId, key);
  res.json({
    posts: { total: 0, total_record: countPost, items: posts.map(item => ({ ...item, highlight: highlightsPost[item.id] })) },
    users: { total: 0, total_record: countUser, items: users },
  });
};

export const searchUser = async (req, res) => {
  const { userId } = req;
  const { key } = req.query;
  const [userIds, count] = await dbAccess.searchUser(req.pagination, key);
  const items = await common.getListUser(userId, userIds);
  commonLogAction.logSearchUser(userId, key);
  res.json({ total: 0, total_record: count, items });
};

export const searchPost = async (req, res) => {
  const { userId } = req;
  const { key } = req.query;
  const [postIds, count, highlights] = await dbAccess.searchPost(req.pagination, key);
  const items = await commonPost.getListPost(userId, postIds, false);
  commonLogAction.logSearchPost(userId, key);
  res.json({ total: 0, total_record: count, items: items.map(item => ({ ...item, highlight: highlights[item.id] })) });
};

export const suggestKeyWord = async (req, res) => {
  const { key } = req.query;
  const result = await dbAccess.suggestKeyWord(key);
  res.json({ total: 0, total_record: 0, items: result });
};

export const updateSearchKey = async (req, res, next) => {
  const { key } = req.query;
  dbAccess.updateSearchKey(key);
  next();
};
