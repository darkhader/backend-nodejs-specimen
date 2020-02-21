/* eslint-disable no-constant-condition */
import * as dbUtil from './util/databaseUtil';
import * as elasticSearchUtil from './util/elasticSearchUtil';

let lastCreatedTime = null;
const getListPosts = async () => {
  let sql = '';
  if (lastCreatedTime) {
    sql = `SELECT 
        id,createdTime
      FROM posts p
      WHERE createdTime <= ${lastCreatedTime} 
      ORDER BY createdTime DESC
      LIMIT 500
      `;
  } else {
    sql = `SELECT 
        id,createdTime
      FROM posts p
      ORDER BY createdTime DESC
      LIMIT 500
      `;
  }
  const posts = await dbUtil.query(sql);
  lastCreatedTime = posts[posts.length - 1].createdTime;
  const sql2 = `SELECT p.id,p.title,p.content,p.status,p.displayType,p.createdTime,
        cp.categoryId "categories.id"
      FROM posts p 
      INNER JOIN category_post cp ON cp.postId = p.id
      WHERE p.id IN(?)
  `;
  const rows = await dbUtil.query(sql2, [posts.map(post => post.id)]);
  return dbUtil.group(rows.map(dbUtil.nested), 'id', 'categories')
    .map(post => {
      if (post.displayType === 0) {
        return {
          id: post.id,
          createdTime: post.createdTime,
          title: post.title,
          categoryIds: post.categories.map(({ id }) => id),
          content: JSON.parse(post.content).map(({ content, type }) => {
            if (type === 'text') return content;
            return '';
          }).join(' '),
          active: post.status === 1,
        };
      }
      return {
        id: post.id,
        createdTime: post.createdTime,
        categoryIds: post.categories.map(({ id }) => id),
        content: post.content,
        active: post.status === 1,
      };
    });
};

const updatePost = async posts => {
  const body = [];
  for (const post of posts) {
    if (post.title) {
      body.push({ create: { _index: 'ainews_posts', _type: '_doc', _id: post.id } },
        { title: post.title, createdTime: post.createdTime, content: post.content, categoryIds: post.categoryIds, active: post.active });
    } else {
      body.push({ create: { _index: 'ainews_posts', _type: '_doc', _id: post.id } },
        { createdTime: post.createdTime, content: post.content, categoryIds: post.categoryIds, active: post.active });
    }
  }
  await elasticSearchUtil.bulk({ body });
};

const run = async () => {
  while (true) {
    const posts = await getListPosts();
    await updatePost(posts);
    if (posts.length < 500) {
      break;
    }
  }
};

run();
