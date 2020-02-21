import { Router } from 'express';
import * as controller from './PostController';
import { paginationMiddleware, requireAnonymousToken } from '../../../middleware';
import { throwAsNext } from '../../../libs';
import { listPostValidator } from './validator';
import { commonIgnoreAndBlock, commonCategory } from '../common';

// import subrouter
// ...
const path = '/posts';
const router = Router();

// route
router.use('', requireAnonymousToken);
router.get('', listPostValidator,
  paginationMiddleware({
    maxSize: 20,
    defaultSize: 10,
    filterKeys: ['categoryId'],
  }),
  throwAsNext(commonCategory.checkCategory('pagination.filters.categoryId')),
  throwAsNext(controller.getListPost));
router.get('/next', listPostValidator,
  paginationMiddleware({
    maxSize: 20,
    defaultSize: 10,
    filterKeys: ['categoryId'],
  }),
  throwAsNext(commonCategory.checkCategory('pagination.filters.categoryId')),
  throwAsNext(controller.getNextPost));
router.get('/relate', throwAsNext(controller.getRelatePost));
router.get('/by-author',
  paginationMiddleware({
    maxSize: 20,
    defaultSize: 10,
  }),
  throwAsNext(commonIgnoreAndBlock.checkBlockUserMw('query.authorId')),
  throwAsNext(controller.getListPostByAuthor));
router.get('/:postId',
  throwAsNext(commonIgnoreAndBlock.checkIgnorePostMw('params.postId')),
  throwAsNext(controller.getPostDetail));


// registerSubrouter

// export
export default { path, router };
