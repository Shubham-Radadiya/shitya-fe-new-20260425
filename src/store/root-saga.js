import { all, fork } from "redux-saga/effects";
import categorySaga from "./category/saga";
import { billSaga } from "./bill/saga"; 
import subCategorySaga from "./subcategory/SubCategorySagas";
import productSaga from "./product/ProductSagas";
import authSaga from "./auth/AuthSagas"
import reportSaga from "./admin_report/ReportSagas";
import userreportSaga from "./user_report/UserReportSaga";
import { invoiceSaga } from "./invoice/InvoiceSaga";

function* rootSaga() {
  yield all([fork(categorySaga)]);
  yield all([fork(subCategorySaga)]);
  yield all([fork(productSaga)]);
  yield all([fork(billSaga)]);
  yield all([fork(authSaga)]);
  yield all([fork(reportSaga)]);
  yield all([fork(userreportSaga)])
  yield all([fork(invoiceSaga)]);
}

export default rootSaga;
