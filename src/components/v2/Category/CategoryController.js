import * as dbAccess from './CategoryDAL';

export const getAllCategories = async (req, res) => {
  const { userId } = req;
  const categories = await dbAccess.getAllCategories(userId);
  res.json(categories);
};

export const getDefaultCategories = async (req, res) => {
  const categories = await dbAccess.getDefaultCategories();
  res.json({ total: 0, total_record: 0, items: categories });
};
