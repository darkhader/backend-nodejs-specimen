/* eslint-disable no-constant-condition */
import * as dbUtil from './util/databaseUtil';

let lastCreatedTime = null;
const listPost = async lastCreatedTime => {
  let sql = '';
  if (lastCreatedTime) {
    sql = `SELECT * FROM posts WHERE createdTime <= ${lastCreatedTime} ORDER BY createdTime DESC LIMIT 500`;
  } else {
    sql = 'SELECT * FROM posts ORDER BY createdTime DESC LIMIT 500';
  }
  return dbUtil.query(sql, []);
};

const updatePost = async (posts) => {
  const transaction = await dbUtil.beginTransaction();
  for (const post of posts) {
    const featureImages = JSON.parse(post.featureImages);
    const newFeatureImages = [];
    if (featureImages.length) {
      for (const image of featureImages) {
        if (image && typeof image === 'string') {
          newFeatureImages.push({ small: image, large: image });
        }
      }
    }
    if (newFeatureImages.length) {
      const sql = 'UPDATE posts SET featureImages = ? WHERE id = ?';
      await dbUtil.execute(sql, [JSON.stringify(newFeatureImages), post.id], transaction);
    }
  }
  await dbUtil.commitTransaction(transaction);
  lastCreatedTime = posts[posts.length - 1].createdTime;
};

const run = async () => {
  while (true) {
    const posts = await listPost(lastCreatedTime);
    await updatePost(posts);
    if (posts.length < 500) {
      break;
    }
  }
};

run();
