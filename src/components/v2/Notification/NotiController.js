import * as dbAccess from './NotiDAL';

export const getNoti = async (req, res) => {
  const { userId } = req;
  const noti = await dbAccess.getNoti(req.pagination, userId);
  res.json({ total: 0, total_record: 0, items: noti });
};
