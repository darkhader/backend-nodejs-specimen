import * as dbAccess from './ReportDAL';

export const getAllReportReasons = async (req, res) => {
  const reportReasons = await dbAccess.getAllReport();
  res.json(reportReasons);
};
