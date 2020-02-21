import * as dbUtil from './util/databaseUtil';
import * as elasticSearchUtil from './util/elasticSearchUtil';
import groupAuthors from './init_data/groups_author.json';
import newsAuthors from './init_data/news_author.json';
import pageAuthors from './init_data/pages_author.json';
import profileAuthors from './init_data/profiles_author.json';

const fakeAuthors = async () => {
  let transaction = null;
  let body = [];
  let i = 0;
  const insertToDb = async (author, social) => {
    if (i % 200 === 0) {
      transaction = await dbUtil.beginTransaction();
    }
    const user = {
      id: author.id.trim(),
      fullName: author.name.trim(),
      avatar: social ? `http://graph.facebook.com/${author.id.trim()}/picture` : null,
      role: 1,
      realUser: 0,
    };
    try {
      await dbUtil.execute('INSERT INTO users SET ?', user, transaction);
      body.push({ create: { _index: 'ainews_users', _type: '_doc', _id: user.id } }, { fullName: user.fullName, numberFollower: 0 });
    } catch (error) {
      console.log(error);
    }

    if (i % 200 === 199) {
      await dbUtil.commitTransaction(transaction);
      await elasticSearchUtil.bulk({ body });
      body = [];
    }
    i++;
  };
  for (const author of newsAuthors) {
    await insertToDb(author);
  }
  for (const author of pageAuthors) {
    await insertToDb(author, true);
  }
  for (const author of profileAuthors) {
    await insertToDb(author, true);
  }
  for (const author of groupAuthors) {
    await insertToDb(author, true);
  }
  if (i % 200 !== 0) {
    await dbUtil.commitTransaction(transaction).catch(() => { });
    await elasticSearchUtil.bulk({ body });
    body = [];
  }
};

fakeAuthors().catch(console.log);
