import { Router } from 'express';
import * as controller from './VoteController';
import { requireAnonymousToken } from '../../../../middleware';
import { throwAsNext } from '../../../../libs';
import {
  votePostValidator,
  voteCommentValidator,
} from './validator';

// import subrouter

// ...
const path = '/vote';
const router = Router();

// route not require authentication
router.use('/', requireAnonymousToken);
// --- Vote
router.post('/upvote-post', votePostValidator, throwAsNext(controller.upVotePost));
router.post('/unupvote-post', votePostValidator, throwAsNext(controller.unUpVotePost));
router.post('/downvote-post', votePostValidator, throwAsNext(controller.downVotePost));
router.post('/undownvote-post', votePostValidator, throwAsNext(controller.unDownVotePost));
router.post('/upvote-comment', voteCommentValidator, throwAsNext(controller.upVoteComment));
router.post('/unupvote-comment', voteCommentValidator, throwAsNext(controller.unUpVoteComment));
router.post('/downvote-comment', voteCommentValidator, throwAsNext(controller.downVoteComment));
router.post('/undownvote-comment', voteCommentValidator, throwAsNext(controller.unDownVoteComment));

// registerSubrouter

// export
export default { path, router };
