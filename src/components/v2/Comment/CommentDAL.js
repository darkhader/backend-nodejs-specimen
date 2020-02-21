import * as common from './common';

export const getListCommentTop = async ({ limit, offset, filters: { postId, authorId } }, userId) => {
  const comments = await common.getListCommentTop({ limit, offset }, postId, authorId);
  if (!comments.length) return [];

  const commentIds = comments.map(comment => comment.id);
  // If anonymous user then vote = null
  const votedCommentObj = await common.getVotes(userId, commentIds, 0);
  return comments.map(comment => ({
    ...comment,
    // If anonymous user then vote = null
    vote: votedCommentObj[comment.id] || 0,
  }));
};

export const getListCommentNew = async ({ limit, lastId, filters: { postId, authorId } }, userId) => {
  const comments = await common.getListCommentNew({ limit, lastId }, postId, authorId);
  if (!comments.length) return [];

  const commentIds = comments.map(comment => comment.id);
  // If anonymous user then vote = null
  const votedCommentObj = await common.getVotes(userId, commentIds, 0);
  return comments.map(comment => ({
    ...comment,
    // If anonymous user then vote = null
    vote: votedCommentObj[comment.id] || 0,
  }));
};

export const getListSubComment = async ({ limit, lastId, filters: { parentCmtId } }, userId) => {
  const subComments = await common.getListSubComment({ limit, lastId }, parentCmtId);
  if (!subComments.length) return [];
  const commentIds = subComments.map(comment => comment.id);
  // If anonymous user then vote = null
  const votedCommentObj = await common.getVotes(userId, commentIds, 1);
  return subComments.map(comment => ({
    ...comment,
    vote: votedCommentObj[comment.id] || 0,
  }));
};
