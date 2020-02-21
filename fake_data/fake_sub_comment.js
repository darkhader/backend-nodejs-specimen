import faker from 'faker/locale/vi';
import * as dbUtil from './util/databaseUtil';
import commentTemplates from './comments.json';

const getListAuthor = async () => {
  const rows = await dbUtil.query('SELECT id from users LIMIT 100');
  return rows.map(row => row.id);
};

const getListComment = async () => {
  return dbUtil.query('SELECT id,userId,postId,authorId FROM comments ORDER BY createdAt DESC LIMIT 20000');
};

const fakeSubComment = async () => {
  const [authors, comments] = await Promise.all([
    getListAuthor(),
    getListComment(),
  ]);

  let transaction = null;
  for (let i = 0; i < comments.length; i += 1) {
    if (i % 20 === 0) {
      transaction = await dbUtil.beginTransaction();
    }
    for (let j = 0; j < 2; j++) {
      const subComment = {
        userId: faker.random.arrayElement(authors),
        postId: comments[i].postId,
        authorId: comments[i].authorId,
        parentCmtId: comments[i].id,
        userParentId: comments[i].userId,
        content: faker.random.arrayElement(commentTemplates),
        upVoteNumber: faker.random.number({ min: 0, max: 10000 }),
        downVoteNumber: faker.random.number({ min: 0, max: 10000 }),
      };
      await dbUtil.execute('INSERT INTO sub_comments SET ?', subComment, transaction);
    }
    if (i % 20 === 19) {
      await dbUtil.commitTransaction(transaction);
    }
  }
  dbUtil.commitTransaction(transaction).catch(() => { });
};

fakeSubComment();
