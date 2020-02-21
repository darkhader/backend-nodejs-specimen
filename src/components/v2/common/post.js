// lib
import * as dbUtil from '../../../util/databaseUtil';
import redisUtil from '../../../util/redisUtil';
import { REDIS, CATEGORY } from '../../../constant';

const getListPostFromCache = async (postIds) => {
  const listPost = [];
  const listPostIdNotExist = [];

  const listPostKey = [];
  for (const postId of postIds) {
    listPostKey.push(`${REDIS.POST_LITE_PREFIX}:${postId}:detail`, `${REDIS.POST_LITE_PREFIX}:${postId}:upVoteNumber`,
      `${REDIS.POST_LITE_PREFIX}:${postId}:downVoteNumber`, `${REDIS.POST_LITE_PREFIX}:${postId}:commentNumber`,
      `${REDIS.POST_LITE_PREFIX}:${postId}:shareNumber`);
  }
  try {
    const listPostData = await redisUtil.mgetAsync(listPostKey);
    for (let i = 0; i < postIds.length; i++) {
      const postId = postIds[i];
      if (listPostData[5 * i] && listPostData[5 * i + 1] && listPostData[5 * i + 2] && listPostData[5 * i + 3] && listPostData[5 * i + 4]) {
        const newPost = JSON.parse(listPostData[5 * i]);
        newPost.upVoteNumber = Number(listPostData[5 * i + 1]);
        newPost.downVoteNumber = Number(listPostData[5 * i + 2]);
        newPost.commentNumber = Number(listPostData[5 * i + 3]);
        newPost.shareNumber = Number(listPostData[5 * i + 4]);
        listPost.push(newPost);
      } else {
        listPostIdNotExist.push(postId);
      }
    }
    return [listPost, listPostIdNotExist];
  } catch (error) {
    return [[], [...postIds]];
  }
};

const getListPostFromDb = async (listPostId = []) => {
  if (listPostId.length === 0) {
    return [];
  }
  const sql = `
    SELECT p.id,p.authorId,p.title,p.shortContent,p.featureImages,p.displayType,p.seeMore,p.video,
      p.createdTime,p.createdAt,p.updatedAt,
      p.upVoteNumber,p.downVoteNumber,p.shareNumber,p.commentNumber,p.slug,
      u.id "author.id",
      u.fullName "author.fullName",
      u.avatar "author.avatar",
      c.id "categories.id",
      c.name "categories.name"
    FROM posts p 
    INNER JOIN users u ON u.id = p.authorId
    INNER JOIN category_post cp ON cp.postId = p.id
    INNER JOIN categories c ON (c.id = cp.categoryId AND c.status = ${CATEGORY.STATUS.ACTIVE})
    WHERE p.id IN(?)
  `;
  const rows = await dbUtil.query(sql, [listPostId]);
  const posts = dbUtil.group(rows.map(row => ({
    ...dbUtil.nested(row),
    featureImagesssss: JSON.parse(row.featureImages),
    featureImages: JSON.parse(row.featureImages).map(({ large }) => large),
  })), 'id', 'categories');
  return posts;
};

const savePostsToCache = posts => {
  const transaction = redisUtil.multi();
  for (const post of posts) {
    const { upVoteNumber, downVoteNumber, shareNumber, commentNumber, ...newPost } = post;
    transaction.set(`${REDIS.POST_LITE_PREFIX}:${post.id}:detail`, JSON.stringify(newPost), 'ex', REDIS.POST_TTL);
    transaction.set(`${REDIS.POST_LITE_PREFIX}:${post.id}:upVoteNumber`, upVoteNumber, 'ex', REDIS.POST_TTL);
    transaction.set(`${REDIS.POST_LITE_PREFIX}:${post.id}:downVoteNumber`, downVoteNumber, 'ex', REDIS.POST_TTL);
    transaction.set(`${REDIS.POST_LITE_PREFIX}:${post.id}:commentNumber`, commentNumber, 'ex', REDIS.POST_TTL);
    transaction.set(`${REDIS.POST_LITE_PREFIX}:${post.id}:shareNumber`, shareNumber, 'ex', REDIS.POST_TTL);
  }
  transaction.execAsync().catch(() => {
    transaction.discardAsync();
  });
};

const getVotes = async (userId, postIds) => {
  const sql = `
    SELECT 
      p.id,
      vp.vote,
      au.authorId IS NOT NULL followed,
      b.postId IS NOT NULL saved 
    FROM posts p
    LEFT JOIN votes_post vp ON ( vp.postId = p.id AND vp.userId = ?)
    LEFT JOIN author_follows au ON ( au.authorId = p.authorId AND au.userId = ?)
    LEFT JOIN bookmarks b ON ( b.postId = p.id AND b.userId = ?)
    WHERE p.id IN (?)
  `;
  const params = [userId, userId, userId, postIds];
  const rows = await dbUtil.query(sql, params);
  return rows.reduce((result, { id, vote, followed, saved }) => ({ ...result, [id]: { vote, followed, saved } }), {});
};

const getListPostData = async (listPostId, needCache) => {
  const [listPost, dbPost] = await getListPostFromCache(listPostId);
  const postFromDb = await getListPostFromDb(dbPost);
  // execute savePostsToCache async
  if (needCache) {
    savePostsToCache(postFromDb);
  }

  const items = listPost.concat(postFromDb);
  return items;
};

export const getListPost = async (userId, listPostId, needCache = true) => {
  if (listPostId.length === 0) {
    return [];
  }
  const [items, votedPostObj] = await Promise.all([
    getListPostData(listPostId, needCache),
    getVotes(userId, listPostId),
  ]);
  return items.map(post => ({
    ...post,
    vote: votedPostObj[post.id].vote || 0,
    followed: votedPostObj[post.id].followed,
    saved: votedPostObj[post.id].saved,
  }));
};

export const deletePostOfCategoryInCache = async categoryId => {
  const sql = 'SELECT cp.postId FROM category_post cp WHERE cp.categoryId = ? ORDER BY cp.createdTime DESC LIMIT 100';
  const rows = await dbUtil.query(sql, [categoryId]);
  const postIds = rows.map(row => row.postId);
  return deleteFromRedis(postIds);
};

export const deletePostOfAuthorInCache = async authorId => {
  const sql = 'SELECT p.id FROM posts p WHERE p.authorId = ? ORDER BY p.createdTime DESC LIMIT 100';
  const rows = await dbUtil.query(sql, [authorId]);
  const postIds = rows.map(row => row.id);
  return deleteFromRedis(postIds);
};

// redis
const deleteFromRedis = async postIds => {
  const keys = [];
  for (const postId of postIds) {
    keys.push(
      `${REDIS.POST_LITE_PREFIX}:${postId}:detail`,
      `${REDIS.POST_LITE_PREFIX}:${postId}:upVoteNumber`,
      `${REDIS.POST_LITE_PREFIX}:${postId}:downVoteNumber`,
      `${REDIS.POST_LITE_PREFIX}:${postId}:commentNumber`,
      `${REDIS.POST_LITE_PREFIX}:${postId}:shareNumber`,
      `${REDIS.POST_FULL_PREFIX}:${postId}:content`,
    );
  }
  if (keys.length) {
    await redisUtil.delAsync(keys);
  }
};
