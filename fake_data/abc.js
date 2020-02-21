import * as dbUtil from './util/databaseUtil';

let lastCreatedTime = null;

const getListPosts = async () => {
  let sql = '';
  if (lastCreatedTime) {
    sql = `SELECT 
        id,status,authorId,createdTime
      FROM posts p
      WHERE createdTime <= ${lastCreatedTime} 
      ORDER BY createdTime DESC
      LIMIT 1000
      `;
  } else {
    sql = `SELECT 
        id,status,authorId,createdTime
      FROM posts p
      ORDER BY createdTime DESC
      LIMIT 1000
      `;
  }
  const posts = await dbUtil.query(sql);
  lastCreatedTime = posts[posts.length - 1].createdTime;
  return posts;
};


const fakeAuthors = async () => {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const posts = await getListPosts(lastCreatedTime);
    if (!posts.length) {
      break;
    }
    const sql = 'UPDATE category_post SET authorId=?,createdTime=?,status=? WHERE postId=?';
    const transaction = await dbUtil.beginTransaction();
    for (const post of posts) {
      await dbUtil.execute(sql, [post.authorId, post.createdTime, post.status, post.id], transaction);
    }
    await dbUtil.commitTransaction(transaction);
  }
};

fakeAuthors().catch(console.log);
