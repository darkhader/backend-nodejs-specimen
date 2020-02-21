import { Router } from 'express';
import * as controller from './CommentController';
import { paginationMiddleware, requireAnonymousToken } from '../../../middleware';
import { throwAsNext } from '../../../libs';
import { listCommentValidator, listSubCommentValidator } from './validator';
import { commonIgnoreAndBlock } from '../common';

// import subrouter
// ...
const path = '/comments';
const router = Router();

// route
router.use('', requireAnonymousToken);

router.get('/top', listCommentValidator,
  paginationMiddleware({
    maxSize: 20,
    defaultSize: 10,
    filterKeys: ['postId', 'authorId'],
  }),
  throwAsNext(commonIgnoreAndBlock.checkIgnorePostOrBlockUserMw('pagination.filters.postId', 'pagination.filters.authorId')),
  throwAsNext(controller.getListCommentTop));

router.get('/new', listCommentValidator,
  paginationMiddleware({
    maxSize: 20,
    defaultSize: 10,
    filterKeys: ['postId', 'authorId'],
  }),
  throwAsNext(commonIgnoreAndBlock.checkIgnorePostOrBlockUserMw('pagination.filters.postId', 'pagination.filters.authorId')),
  throwAsNext(controller.getListCommentNew));

router.get('/sub', listSubCommentValidator,
  paginationMiddleware({
    maxSize: 20,
    defaultSize: 10,
    filterKeys: ['parentCmtId'],
  }), throwAsNext(controller.getListSubComment));

// registerSubrouter

// export
export default { path, router };
