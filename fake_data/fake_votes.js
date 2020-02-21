import faker from 'faker/locale/vi';
import * as dbUtil from '../src/util/databaseUtil';

require('dotenv').config();

const getListAuthor = async () => {
  const rows = await dbUtil.query('SELECT id from users');
  return rows.map(row => row.id);
};
const fakeVote = async () => {
  const authors = await getListAuthor();
  let transaction = null;
  for (let i = 0; i < 1000000; i += 1) {
    if (i % 100 === 0) {
      transaction = await dbUtil.beginTransaction();
    }
    for (const authorId of authors) {
      const vote = {
        userId: authorId,
        postId: i + 1,
        vote: faker.random.arrayElement([-1, 1]),
      };
      await dbUtil.execute('INSERT IGNORE votes_post SET ?', vote, transaction);
    }
    if (i % 100 === 99) {
      await dbUtil.commitTransaction(transaction);
    }
  }
  await dbUtil.commitTransaction(transaction);
};

fakeVote();
