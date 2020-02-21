import * as dbAccess from './CommentDAL';

export const getListCommentTop = async (req, res) => {
  const { userId } = req;

  const comments = await dbAccess.getListCommentTop(req.pagination, userId);

  res.json({ total: 0, total_record: 0, items: comments });
};
export const getListCommentNew = async (req, res) => {
  const { userId } = req;

  const comments = await dbAccess.getListCommentNew(req.pagination, userId);
  const lastId = comments.length ? comments[comments.length - 1].id : null;
  res.json({ total: 0, total_record: 0, lastId, items: comments });
};

export const getListSubComment = async (req, res) => {
  const { userId } = req;
  const subComments = await dbAccess.getListSubComment(req.pagination, userId);
  const lastId = subComments.length ? subComments[subComments.length - 1].id : null;

  res.json({ total: 0, total_record: 0, lastId, items: subComments });
};
