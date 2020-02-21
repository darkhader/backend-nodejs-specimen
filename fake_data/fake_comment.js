import faker from 'faker/locale/vi';
import * as dbUtil from './util/databaseUtil';
import comments from './comments.json';

require('dotenv').config();

const getListAuthor = async () => {
  const rows = await dbUtil.query('SELECT id from users LIMIT 100');
  return rows.map(row => row.id);
};

const getListPost = async () => {
  return dbUtil.query('SELECT id, authorId from posts ORDER BY createdTime DESC LIMIT 1000');
};

const fakeComment = async () => {
  const [authors, posts] = await Promise.all([
    getListAuthor(),
    getListPost(),
  ]);

  let transaction = null;
  for (let i = 0; i < posts.length; i += 1) {
    if (i % 20 === 0) {
      transaction = await dbUtil.beginTransaction();
    }
    for (let j = 0; j < 20; j++) {
      const comment = {
        userId: faker.random.arrayElement(authors),
        postId: posts[i].id,
        authorId: posts[i].authorId,
        content: faker.random.arrayElement(comments),
        upVoteNumber: faker.random.number({ min: 0, max: 10000 }),
        downVoteNumber: faker.random.number({ min: 0, max: 10000 }),
        subCommentNumber: 2,
      };
      await dbUtil.execute('INSERT INTO comments SET ?', comment, transaction);
    }
    if (i % 20 === 19) {
      await dbUtil.commitTransaction(transaction);
    }
  }
  dbUtil.commitTransaction(transaction).catch(() => { });
};

fakeComment();
