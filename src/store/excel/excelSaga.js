import { toast } from "react-toastify";
import excelService from "../../services/excel.services";
import { all, call, put, takeLatest } from "redux-saga/effects";
import { ERROR_EXCEL, REQUEST_ADMIN_EXCEL, REQUEST_USER_EXCEL, SET_EXCEL_RESPONSE } from "./excelAction";
import { REQUEST_CATEGORY } from "../category/categoryActionType";

// ✅ User Excel Upload Saga
function* userExcelSaga(action) {
  try {
    const response = yield call(excelService.userExcel, action.payload.data);
    toast.success("Excel uploaded successfully");

    yield put({ type: SET_EXCEL_RESPONSE, payload: response.data }); // ✅ Store response in Redux

  } catch (error) {
    toast.error("File upload failed");
    yield put({ type: ERROR_EXCEL, payload: "File upload failed" });
  }
}

// ✅ Admin Excel Upload Saga
function* adminExcelSaga(action) {
  try {
    const response = yield call(excelService.adminExcel, action.payload.data);
    toast.success("Excel uploaded successfully");
    yield put({ type: SET_EXCEL_RESPONSE, payload: response.data });
    yield put({ type: REQUEST_CATEGORY }); // Refresh categories/product list after upload
  } catch (error) {
    const message =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      (typeof error?.response?.data === "string" ? error.response.data : null) ||
      "File upload failed";
    toast.error(message);
    yield put({ type: ERROR_EXCEL, payload: message });
  }
}
const excelSaga = function* () {
  yield all([
    takeLatest(REQUEST_USER_EXCEL, userExcelSaga),
    takeLatest(REQUEST_ADMIN_EXCEL, adminExcelSaga),
  ]);
};

export default excelSaga;
