import { Router } from 'express';
import * as controller from './AuthorController';
import { paginationMiddleware, requireAnonymousToken } from '../../../middleware';
import { throwAsNext } from '../../../libs';
import { commonIgnoreAndBlock } from '../common';
// import subrouter
// ...
const path = '/author';
const router = Router();

// route
router.use('', requireAnonymousToken);
// --- List Followers
router.get('/:authorId/followers', paginationMiddleware({
  maxSize: 20,
  defaultSize: 10,
}), throwAsNext(controller.getListFollowers));
router.get('/:authorId',
  throwAsNext(commonIgnoreAndBlock.checkBlockUserMw('params.authorId')),
  throwAsNext(controller.getDetail));

// registerSubrouter

// export
export default { path, router };
