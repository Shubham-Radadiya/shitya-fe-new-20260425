import { buildSalesPeriodReportAoa } from "./dateRangeReportExcel";
import { reportExcelBlobFromAoa } from "./reportExcelStyled";

/**
 * Sales report period modes (bill / month / year) → styled `.xlsx` blob.
 */
export async function salesPeriodReportExcelBlob(params) {
  const { aoa, sheetName } = buildSalesPeriodReportAoa(params);
  return reportExcelBlobFromAoa(aoa, sheetName);
}
