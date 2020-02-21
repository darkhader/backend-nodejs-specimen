import request from 'request-promise-native';
import * as dbUtil from '../../../util/databaseUtil';
import redisUtil from '../../../util/redisUtil';
import { REDIS, CATEGORY, POSTS, ERRORS, USERS } from '../../../constant';

const CORE_URL = 'http://103.192.236.67:8080/v1';
const CORE_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiYW5ndGluX2FpbmV3cyIsImlhdCI6MTU2NTg4MTMxMSwiZXhwIjoxNjUyMjgxMzE2fQ.CGhPosiGMyeq78YJ-Tirp21CKgHCQd0dPVEUPxzIKSI';

export const getVote = async (userId, postId) => {
  const sql = `
    SELECT 
      vp.vote,
      au.authorId IS NOT NULL followed, 
      b.postId IS NOT NULL saved 
    FROM posts p
    LEFT JOIN votes_post vp ON  ( vp.postId = p.id AND vp.userId = ?)
    LEFT JOIN author_follows au ON ( au.authorId = p.authorId AND au.userId = ?)
    LEFT JOIN bookmarks b ON ( b.postId = p.id AND b.userId = ?)
    WHERE p.id = ?
  `;
  const params = [userId, userId, userId, postId];
  return dbUtil.queryOne(sql, params);
};

export const getPostIdsByAuthor = async ({ limit, lastId }, authorId, ignoredPostIds = []) => {
  const sql = `
    SELECT 
      p.id,
      p.createdTime
    FROM posts p
    WHERE 
      p.authorId = ? 
      AND p.status = ${POSTS.STATUS.ACTIVE} 
      ${lastId !== -1 ? 'AND p.createdTime < ?' : ''}
      ${ignoredPostIds.length ? 'AND p.id NOT IN (?)' : ''}
    ORDER BY p.createdTime DESC 
    LIMIT ?
  `;
  const params = [authorId];
  if (lastId !== -1) {
    params.push(lastId);
  }
  if (ignoredPostIds.length) {
    params.push(ignoredPostIds);
  }
  params.push(limit);
  const rows = await dbUtil.query(sql, params);

  return [
    rows.map(row => row.id),
    rows.length > 0 ? rows[rows.length - 1].createdTime : null,
  ];
};

export const fakeListPostByCategory = async ({ lastId, limit, filters: { categoryId } }, ignoredPostIds = [], blockUserIds = []) => {
  const sql = `
      SELECT 
        cp.postId,
        cp.createdTime 
      FROM category_post cp
      WHERE 
        cp.categoryId = ? 
        AND cp.status = ${POSTS.STATUS.ACTIVE} 
        ${lastId !== -1 ? 'AND cp.createdTime < ?' : ''}
        ${ignoredPostIds.length ? 'AND cp.postId NOT IN (?)' : ''}
        ${blockUserIds.length ? 'AND cp.authorId NOT IN (?)' : ''}
      ORDER BY cp.createdTime DESC 
      LIMIT ?
    `;
  const params = lastId !== -1 ? [categoryId, lastId] : [categoryId];
  if (ignoredPostIds.length) {
    params.push(ignoredPostIds);
  }
  if (blockUserIds.length) {
    params.push(blockUserIds);
  }
  params.push(limit);
  const rows = await dbUtil.query(sql, params);
  rows.sort((a, b) => a.createdTime < b.createdTime);
  return [rows.map(row => row.postId), rows.length > 0 ? rows[rows.length - 1].createdTime : null];
};

export const fakeListPostSuggest = async ({ lastId, limit }, ignoredPostIds = [], blockUserIds = []) => {
  const sql = `
    SELECT 
      p.id,
      p.createdTime 
    FROM posts p 
    WHERE 
      p.status = ${POSTS.STATUS.ACTIVE} 
      ${lastId !== -1 ? 'AND p.createdTime < ?' : ''} 
      ${ignoredPostIds.length ? 'AND p.id NOT IN (?)' : ''}
      ${blockUserIds.length ? 'AND p.authorId NOT IN (?)' : ''}
    ORDER BY p.createdTime DESC 
    LIMIT ?
  `;
  const params = lastId !== -1 ? [lastId] : [];
  if (ignoredPostIds.length) {
    params.push(ignoredPostIds);
  }
  if (blockUserIds.length) {
    params.push(blockUserIds);
  }
  params.push(limit);
  const rows = await dbUtil.query(sql, params);
  return [rows.map(row => row.id), rows.length > 0 ? rows[rows.length - 1].createdTime : null];
};

export const fakeListPostSuggestHasOrder = async ({ limit, offset }, orderBy, ignoredPostIds = [], blockUserIds = []) => {
  const sql = `
    SELECT 
      p.id 
    FROM posts p
    WHERE 
      p.status = ${POSTS.STATUS.ACTIVE} 
      AND p.createdTime > ?
      ${ignoredPostIds.length ? 'AND p.id NOT IN (?)' : ''}
      ${blockUserIds.length ? 'AND p.authorId NOT IN (?)' : ''}
    ORDER BY p.${orderBy} DESC 
    LIMIT ? OFFSET ? 
  `;
  const params = [new Date().getTime() - 7 * 24 * 60 * 60 * 1000];
  if (ignoredPostIds.length) {
    params.push(ignoredPostIds);
  }
  if (blockUserIds.length) {
    params.push(blockUserIds);
  }
  params.push(limit, offset);
  const rows = await dbUtil.query(sql, params);
  return rows.map(row => row.id);
};

export const fakeListPostSuggestCoreOrder = async (userId, { limit, offset }, orderBy) => {
  const body = await request({
    baseUrl: CORE_URL,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${CORE_TOKEN}`,
    },
    body: {
      user_id: userId,
      type: orderBy === POSTS.ORDER_TYPE.RECOMMEND ? 0 : 1,
    },
    uri: '/recommend',
    json: true,
  });
  return body.posts.slice(offset, offset + limit);
};

export const getRelatePost = async (userId, postId) => {
  const body = await request({
    baseUrl: CORE_URL,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${CORE_TOKEN}`,
    },
    body: {
      user_id: userId,
      post_id: postId,
    },
    uri: '/relate',
    json: true,
  });
  return body.posts || [];
};

export const getPostDetail = async (postId) => {
  const [postLite, content] = await getPostFromCache(postId);
  let fullPost = null;

  if (!postLite && !content) {
    fullPost = await getFullPostFromDb(postId);
  } else if (!postLite) {
    const postLite = await getPostLiteFromDb(postId);
    fullPost = { ...postLite, content };
  } else if (!content) {
    const content = await getPostContentFromDb(postId);
    fullPost = { ...postLite, content };
  } else {
    fullPost = { ...postLite, content };
  }
  if (fullPost.displayType === 0) {
    fullPost.content = JSON.parse(fullPost.content);
  }
  return fullPost;
};

export const getFollowSuggest = async (userId, blockUserIds = []) => {
  if (Math.random() < 0.5) {
    const items = await getCategoriesFollowSuggest(userId);
    return {
      displayType: POSTS.DISPLAY_TYPE.SUGGEST_CATEGORY,
      id: Math.floor(Math.random() * 9999999).toString(),
      items,
    };
  }
  const items = await getAuthorsFollowSuggest(userId, blockUserIds);
  return {
    displayType: POSTS.DISPLAY_TYPE.SUGGEST_AUTHOR,
    id: Math.floor(Math.random() * 9999999).toString(),
    items,
  };
};

// lib
// Get Categories Follow Suggest
const getCategoriesFollowSuggest = async userId => {
  const sql = `
    SELECT 
      c.*
    FROM categories c 
    LEFT JOIN category_follows cf ON (cf.categoryId = c.id AND cf.userId = ?)
    WHERE 
      cf.categoryId IS NULL
      AND c.status = ${CATEGORY.STATUS.ACTIVE}
      LIMIT 5
  `;
  const params = [userId];

  return dbUtil.query(sql, params);
};
// Get Authors Follow Suggest
const getAuthorsFollowSuggest = async (userId, blockUserIds = []) => {
  const sql = `
    SELECT 
      u.id,
      u.fullName,
      u.avatar
    FROM users AS u 
    LEFT JOIN author_follows af ON (af.authorId = u.id AND af.userId = ?)
    WHERE 
      u.id != ? 
      AND u.status = ${USERS.STATUS.ACTIVE}
      AND af.userId IS NULL
      ${blockUserIds.length ? 'AND u.id NOT IN (?)' : ''}
    LIMIT 5
  `;
  const params = blockUserIds.length ? [userId, userId, blockUserIds]
    : [userId, userId];

  return dbUtil.query(sql, params);
};

const getPostFromCache = async (postId) => {
  const listKey = [
    `${REDIS.POST_LITE_PREFIX}:${postId}:detail`,
    `${REDIS.POST_LITE_PREFIX}:${postId}:upVoteNumber`,
    `${REDIS.POST_LITE_PREFIX}:${postId}:downVoteNumber`,
    `${REDIS.POST_LITE_PREFIX}:${postId}:commentNumber`,
    `${REDIS.POST_LITE_PREFIX}:${postId}:shareNumber`,
    `${REDIS.POST_FULL_PREFIX}:${postId}:content`,
  ];
  try {
    const postData = await redisUtil.mgetAsync(listKey);
    if (postData[0] && postData[1] && postData[2] && postData[3] && postData[4]) {
      const newPost = JSON.parse(postData[0]);
      newPost.upVoteNumber = Number(postData[1]);
      newPost.downVoteNumber = Number(postData[2]);
      newPost.commentNumber = Number(postData[3]);
      newPost.shareNumber = Number(postData[4]);
      return [newPost, postData[5], JSON.parse(postData[6])];
    }
    return [null, null, null];
  } catch (error) {
    return [null, null, null];
  }
};

const getPostLiteFromDb = async (postId) => {
  const sql = `
    SELECT p.id,p.authorId,p.title,p.shortContent,p.featureImages,p.displayType,p.seeMore,p.video,
      p.createdTime,p.createdAt,p.updatedAt,
      p.upVoteNumber,p.downVoteNumber,p.shareNumber,p.commentNumber,p.slug
      u.id "author.id",
      u.fullName "author.fullName",
      u.avatar "author.avatar",
      c.id "categories.id",
      c.name "categories.name"
    FROM posts p 
    INNER JOIN users u ON u.id = p.authorId
    INNER JOIN category_post cp ON cp.postId = p.id
    INNER JOIN categories c ON (c.id = cp.categoryId AND c.status = ${CATEGORY.STATUS.ACTIVE})
    WHERE p.id = ? AND p.status = ${POSTS.STATUS.ACTIVE}
  `;
  const rows = await dbUtil.query(sql, [postId]);
  const posts = dbUtil.group(rows.map(row => ({
    ...dbUtil.nested(row),
    featureImages: JSON.parse(row.featureImages).map(({ large }) => large),
  })), 'id', 'categories');

  const post = posts[0];
  if (post) {
    saveSinglePostToCache(post);
    return post;
  }
  return Promise.reject(ERRORS.POST_NOT_EXISTED);
};

const getPostContentFromDb = async (postId) => {
  const sql = `
    SELECT p.content FROM posts p
    WHERE p.id = ? AND p.status = ${POSTS.STATUS.ACTIVE}
  `;
  const post = await dbUtil.queryOne(sql, [postId]);
  if (post) {
    saveSinglePostContentToCache(postId, post.content);
    return post.content;
  }
  return Promise.reject(ERRORS.POST_NOT_EXISTED);
};

const getFullPostFromDb = async (postId) => {
  const sql = `
    SELECT p.id,p.authorId,p.title,p.shortContent,p.featureImages,p.displayType,p.seeMore,p.video,p.content,
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
    WHERE p.id = ? AND p.status = ${POSTS.STATUS.ACTIVE}
`;
  const rows = await dbUtil.query(sql, [postId]);
  const posts = dbUtil.group(rows.map(row => ({
    ...dbUtil.nested(row),
    featureImages: JSON.parse(row.featureImages).map(({ large }) => large),
  })), 'id', 'categories');

  const post = posts[0];
  if (post) {
    const { content, ...postToCache } = post;
    saveSinglePostToCache(postToCache);
    saveSinglePostContentToCache(postId, content);
    return post;
  }
  return Promise.reject(ERRORS.POST_NOT_EXISTED);
};

const saveSinglePostToCache = (post) => {
  const transaction = redisUtil.multi();
  const { upVoteNumber, downVoteNumber, commentNumber, shareNumber, ...detail } = Object.assign({}, post);

  transaction.set(`${REDIS.POST_LITE_PREFIX}:${post.id}:detail`, JSON.stringify(detail), 'ex', REDIS.POST_TTL);
  transaction.set(`${REDIS.POST_LITE_PREFIX}:${post.id}:upVoteNumber`, upVoteNumber, 'ex', REDIS.POST_TTL);
  transaction.set(`${REDIS.POST_LITE_PREFIX}:${post.id}:downVoteNumber`, downVoteNumber, 'ex', REDIS.POST_TTL);
  transaction.set(`${REDIS.POST_LITE_PREFIX}:${post.id}:commentNumber`, commentNumber, 'ex', REDIS.POST_TTL);
  transaction.set(`${REDIS.POST_LITE_PREFIX}:${post.id}:shareNumber`, shareNumber, 'ex', REDIS.POST_TTL);

  transaction.execAsync().catch(err => {
    console.log(err);
    transaction.discardAsync();
  });
};

const saveSinglePostContentToCache = (id, content) => {
  redisUtil.setAsync(`${REDIS.POST_FULL_PREFIX}:${id}:content`, content, 'ex', REDIS.POST_TTL).catch(() => { });
};
