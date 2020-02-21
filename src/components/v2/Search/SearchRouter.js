import { Router } from 'express';
import * as controller from './SearchController';
import { paginationMiddleware } from '../../../middleware';
import { throwAsNext } from '../../../libs';
import { searchValidator, searchPostValidator, searchUserValidator, suggestKeyValidator } from './validator';
import { commonCategory } from '../common';

const path = '/search';
const router = Router();

router.get('/', searchValidator, controller.updateSearchKey, throwAsNext(controller.searchAll));

router.get('/users', searchUserValidator, paginationMiddleware({
  maxSize: 20,
  defaultSize: 10,
}), controller.updateSearchKey, throwAsNext(controller.searchUser));

router.get('/posts', searchPostValidator,
  paginationMiddleware({
    maxSize: 20,
    defaultSize: 10,
    filterKeys: ['categoryId', 'fromTime', 'toTime'],
  }),
  throwAsNext(commonCategory.checkCategory('pagination.filters.categoryId')),
  controller.updateSearchKey,
  throwAsNext(controller.searchPost));

router.get('/suggest-key', suggestKeyValidator, throwAsNext(controller.suggestKeyWord));

// export
export default { path, router };
