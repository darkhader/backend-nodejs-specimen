import faker from 'faker/locale/vi';
import * as dbUtil from '../src/util/databaseUtil';

require('dotenv').config();

const getListPostId = async () => {
  const posts = await dbUtil.query('SELECT id from posts');
  return posts.map(post => post.id);
};
const getListCategoryId = async () => {
  const categories = await dbUtil.query('SELECT id from categories');
  return categories.map(category => category.id);
};

const fakeDb = async () => {
  const [postIds, categoryIds] = await Promise.all([
    getListPostId(),
    getListCategoryId(),
  ]);

  let transaction = null;
  for (let i = 0; i < postIds.length; i += 1) {
    if (i % 20 === 0) {
      transaction = await dbUtil.beginTransaction();
    }

    const listCategoryId = [];

    while (listCategoryId.length < 3) {
      const categoryIdRandom = faker.random.arrayElement(categoryIds);
      if (!listCategoryId.includes(categoryIdRandom)) {
        listCategoryId.push(categoryIdRandom);
      }
    }
    for (const categoryId of listCategoryId) {
      const categoryPost = { categoryId, postId: postIds[i] };
      await dbUtil.execute('INSERT IGNORE INTO category_post SET ?', categoryPost, transaction);
    }
    if (i % 20 === 19) {
      await dbUtil.commitTransaction(transaction);
    }
  }
  await dbUtil.commitTransaction(transaction);
};

fakeDb();
