import { Router } from 'express';
import * as controller from './CommentController';
import { commonIgnoreAndBlock } from '../../common';
import { paginationMiddleware, requireLogin } from '../../../../middleware';
import { throwAsNext } from '../../../../libs';

// import subrouter

import {
  addCommentValidator,
  deleteCommentValidator,
  editCommentValidator,
  addSubCommentValidator,
  deleteSubCommentValidator,
  editSubCommentValidator,
} from './validator';
// ...
const path = '/comment';
const router = Router();
// route require authentication
router.use('/', requireLogin);
// --- Comment
router.post('/', addCommentValidator,
  throwAsNext(commonIgnoreAndBlock.checkIgnorePostOrBlockUserMw('body.postId', 'body.authorId')),
  throwAsNext(controller.addComment));
router.delete('/', deleteCommentValidator, throwAsNext(controller.deleteComment));
router.put('/', editCommentValidator, throwAsNext(controller.editComment));
// --- SubComment
router.post('/sub', addSubCommentValidator,
  throwAsNext(commonIgnoreAndBlock.checkBlockUserMw('body.userParentId')),
  throwAsNext(controller.createSubComment));
router.delete('/sub', deleteSubCommentValidator, throwAsNext(controller.deleteSubComment));
router.put('/sub', editSubCommentValidator, throwAsNext(controller.editSubComment));
// -- Get List Comment
router.get('', paginationMiddleware({
  maxSize: 20,
  defaultSize: 10,
}), throwAsNext(controller.getListComment));
// registerSubrouter

// export
export default { path, router };
