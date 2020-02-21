import * as dbUtil from './util/databaseUtil';
import * as elasticSearchUtil from './util/elasticSearchUtil';

const getListUsers = async () => {
  const sql = 'SELECT id,fullName,numberFollower,status FROM users';
  return dbUtil.query(sql);
};

const fakeAuthors = async () => {
  const authors = await getListUsers();

  let body = [];
  let i = 0;
  const insertToEs = async (author) => {
    body.push({ create: { _index: 'ainews_users', _type: '_doc', _id: author.id } },
      { fullName: author.fullName, numberFollower: author.numberFollower, active: Boolean(author.status) });

    if (i % 200 === 199) {
      await elasticSearchUtil.bulk({ body });
      body = [];
    }
    i++;
  };
  for (const author of authors) {
    await insertToEs(author);
  }
  if (i % 200 !== 0) {
    await elasticSearchUtil.bulk({ body });
    body = [];
  }
};

fakeAuthors().catch(console.log);
