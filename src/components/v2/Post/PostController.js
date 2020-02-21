import * as common from './common';
import { commonLogAction, commonIgnoreAndBlock, commonPost } from '../common';
import { POSTS, ERRORS } from '../../../constant';

export const getNextPost = async (req, res) => {
  const { userId } = req;
  const { orderBy } = req.query;

  let listPostId = [];
  let lastId = null;
  const [ignoredPostIds, blockUserIds] = await commonIgnoreAndBlock.getListIgnoreAndBlock(userId);

  const { categoryId } = req.pagination.filters;

  if (categoryId) {
    [listPostId, lastId] = await common.fakeListPostByCategory(req.pagination, ignoredPostIds, blockUserIds);
  } else if (!orderBy || orderBy === POSTS.ORDER_TYPE.CREATED_TIME) {
    [listPostId, lastId] = await common.fakeListPostSuggest(req.pagination, ignoredPostIds, blockUserIds);
  } else if (orderBy === POSTS.ORDER_TYPE.COMMENT_NUMBER || orderBy === POSTS.ORDER_TYPE.DOWNVOTE_NUMBER || orderBy === POSTS.ORDER_TYPE.UPVOTE_NUMBER) {
    listPostId = await common.fakeListPostSuggestHasOrder(req.pagination, orderBy, ignoredPostIds, blockUserIds);
  } else {
    listPostId = await common.fakeListPostSuggestCoreOrder(userId, req.pagination, orderBy);
  }
  const [{ vote, followed, saved }, post] = await Promise.all([
    common.getVote(userId, listPostId[0]),
    common.getPostDetail(listPostId[0]),
  ]);

  // Log Action
  commonLogAction.logViewPost(userId, listPostId[0]);
  res.json({ ...post, vote, followed, saved, lastId });
};

export const getRelatePost = async (req, res) => {
  const { userId } = req;
  const { postId } = req.query;
  const postIds = await common.getRelatePost(userId, postId);
  if (postIds.length) {
    const posts = await commonPost.getListPost(userId, postIds);
    res.json({ items: posts });
    return;
  }
  res.json({ items: [] });
};

export const getListPost = async (req, res) => {
  const { userId } = req;
  const { orderBy } = req.query;

  let listPostId = [];
  let lastId = null;
  const [ignoredPostIds, blockUserIds] = await commonIgnoreAndBlock.getListIgnoreAndBlock(userId);

  // get suggest
  const getSuggestFlag = true;
  // const getSuggestFlag = Math.random() < 0.4;
  let getSuggestPromise = null;
  if (getSuggestFlag) {
    getSuggestPromise = common.getFollowSuggest(userId, blockUserIds);
  }
  const { categoryId } = req.pagination.filters;

  if (categoryId) {
    [listPostId, lastId] = await common.fakeListPostByCategory(req.pagination, ignoredPostIds, blockUserIds);
  } else if (!orderBy || orderBy === POSTS.ORDER_TYPE.CREATED_TIME) {
    [listPostId, lastId] = await common.fakeListPostSuggest(req.pagination, ignoredPostIds, blockUserIds);
  } else if (orderBy === POSTS.ORDER_TYPE.COMMENT_NUMBER || orderBy === POSTS.ORDER_TYPE.DOWNVOTE_NUMBER || orderBy === POSTS.ORDER_TYPE.UPVOTE_NUMBER) {
    listPostId = await common.fakeListPostSuggestHasOrder(req.pagination, orderBy, ignoredPostIds, blockUserIds);
  } else {
    listPostId = await common.fakeListPostSuggestCoreOrder(userId, req.pagination, orderBy);
  }

  if (getSuggestFlag) {
    const [items, itemSuggest] = await Promise.all([
      commonPost.getListPost(userId, listPostId),
      getSuggestPromise,
    ]);
    res.json({ total: 0, total_record: 0, lastId, items: [...items, itemSuggest] });
    return;
  }
  const items = await commonPost.getListPost(userId, listPostId);
  res.json({ total: 0, total_record: 0, lastId, items });
};

export const getPostDetail = async (req, res) => {
  const { postId } = req.params;
  const { userId } = req;

  const [{ vote, followed, saved }, post] = await Promise.all([
    common.getVote(userId, postId),
    common.getPostDetail(postId),
  ]);
  // check block
  const blocked = await commonIgnoreAndBlock.checkBlockUser(userId, post.authorId);
  if (blocked) {
    return Promise.reject(ERRORS.USER_DONT_HAVE_PERMISSION_ERROR);
  }
  // Log Action
  commonLogAction.logViewPost(userId, postId);
  res.json({ ...post, vote, followed, saved });
};

export const getListPostByAuthor = async (req, res) => {
  const { userId, query: { authorId } } = req;

  const ignoredPostIds = await commonIgnoreAndBlock.getListPostIdIgnored(userId);
  const [listPostId, lastId] = await common.getPostIdsByAuthor(req.pagination, authorId, ignoredPostIds);

  const items = await commonPost.getListPost(userId, listPostId, false);
  res.json({ total: 0, total_record: 0, items, lastId });
};
