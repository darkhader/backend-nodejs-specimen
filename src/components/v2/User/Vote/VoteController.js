import * as dbAccess from './VoteDAL';
import { commonLogAction } from '../../common';
/**
 * Vote
 */
export const upVotePost = async (req, res) => {
  const { postId } = req.body;
  const { userId } = req;
  // execute async
  dbAccess.upVotePost(userId, postId).then(() => {
    // Log Action
    commonLogAction.logUpvotePost(userId, postId);
  });
  res.ok();
};
export const unUpVotePost = async (req, res) => {
  const { postId } = req.body;
  const { userId } = req;
  // execute async
  dbAccess.unUpVotePost(userId, postId).then(() => {
    // Log Action
    commonLogAction.logUnUpvotePost(userId, postId);
  });
  res.ok();
};
export const downVotePost = async (req, res) => {
  const { postId } = req.body;
  const { userId } = req;
  // execute async
  dbAccess.downVotePost(userId, postId).then(() => {
    // Log Action
    commonLogAction.logDownvotePost(userId, postId);
  });
  res.ok();
};
export const unDownVotePost = async (req, res) => {
  const { postId } = req.body;
  const { userId } = req;
  // execute async
  dbAccess.unDownVotePost(userId, postId).then(() => {
    // Log Action
    commonLogAction.logUnDownvotePost(userId, postId);
  });
  res.ok();
};

export const upVoteComment = async (req, res) => {
  const { commentId, type } = req.body;
  const { userId } = req;
  // execute async
  dbAccess.upVoteComment(userId, commentId, type).then(() => {
    // Log Action
    if (type === 0) {
      commonLogAction.logUpvoteComment(userId, commentId);
    } else if (type === 1) {
      commonLogAction.logUpvoteSubComment(userId, commentId);
    }
  });
  res.ok();
};
export const unUpVoteComment = async (req, res) => {
  const { commentId, type } = req.body;
  const { userId } = req;
  // execute async
  dbAccess.unUpVoteComment(userId, commentId, type).then(() => {
    // Log Action
    if (type === 0) {
      commonLogAction.logUnUpvoteComment(userId, commentId);
    } else if (type === 1) {
      commonLogAction.logUnUpvoteSubComment(userId, commentId);
    }
  });
  res.ok();
};
export const downVoteComment = async (req, res) => {
  const { commentId, type } = req.body;
  const { userId } = req;
  // execute async
  dbAccess.downVoteComment(userId, commentId, type).then(() => {
    // Log Action
    if (type === 0) {
      commonLogAction.logDownvoteComment(userId, commentId);
    } else if (type === 1) {
      commonLogAction.logDownvoteSubComment(userId, commentId);
    }
  });
  res.ok();
};
export const unDownVoteComment = async (req, res) => {
  const { commentId, type } = req.body;
  const { userId } = req;
  // execute async
  dbAccess.unDownVoteComment(userId, commentId, type).then(() => {
    // Log Action
    if (type === 0) {
      commonLogAction.logUnDownvoteComment(userId, commentId);
    } else if (type === 1) {
      commonLogAction.logUnDownvoteSubComment(userId, commentId);
    }
  });
  res.ok();
};
