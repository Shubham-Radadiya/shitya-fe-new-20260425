// billSaga.js
import { all, call, put, takeLatest } from "redux-saga/effects";
import { toast } from "react-toastify";
import { getApiErrorMessage } from "../../utils/apiErrorMessage";
import * as billServices from "../../services/bill.services";
import {
  REQUEST_CREATE_BILL,
  REQUEST_BILL_NO,
  REQUEST_BILL_DETAILS,
  REQUEST_RETURN_BILL,
  SET_CREATE_BILL,
  SET_BILL_NO,
  SET_BILL_DETAILS,
  SET_RETURN_BILL,
  ERROR_CREATE_BILL,
  ERROR_BILL_NO,
  RETURN_BILL_NO,
  ERROR_RETURN_BILL,
  REPRINT_BILL,
  SET_REPRINT_BILL,
  ERROR_REPRINT_BILL,
  REQUEST_BHET_BILL_NO,
  RETURN_BHET_BILL_NO,
} from "./billActionType";

function* requestCreateBill(action) {
  try {
    const data = yield call(billServices.createBill, action.payload);
    yield put({ type: SET_CREATE_BILL, payload: data });
    yield call(requestBillNo)
  } catch (error) {
    const msg = handleError(error);
    toast.error(msg);
    yield put({ type: ERROR_CREATE_BILL, payload: msg });
  }
}

function* requestBillNo() {
  try {
    const { data } = yield call(billServices.getBillNo);
    yield put({ type: SET_BILL_NO, payload: data });
  } catch (error) {
    const msg = handleError(error);
    yield put({ type: ERROR_BILL_NO, payload: msg });
  }
}

function* requestBhetBillNo() {
  try {
    const { data } = yield call(billServices.getBhetBillNo);
    yield put({ type: SET_BILL_NO, payload: data });
  } catch (error) {
    const msg = handleError(error);
    yield put({ type: ERROR_BILL_NO, payload: msg });
  }
}

function* requestBhetReturnBillNo() {
  try {
    const { data } = yield call(billServices.getBhetReturnBillNo);
    yield put({ type: SET_BILL_NO, payload: data });
  } catch (error) {
    const msg = handleError(error);
    yield put({ type: ERROR_BILL_NO, payload: msg });
  }
}

function* requestreturnBillNo() {
  try {
    const { data } = yield call(billServices.getReturnBillNo);
    yield put({ type: SET_BILL_NO, payload: data });
  } catch (error) {
    const msg = handleError(error);
    yield put({ type: ERROR_BILL_NO, payload: msg });
  }
}


function* requestBillDetails(action) {
  try {
    const { data } = yield call(billServices.getBillDetails, action.payload);
    yield put({ type: SET_BILL_DETAILS, payload: data });
  } catch (error) {
    const msg = handleError(error);
    toast.error(msg);
    yield put({ type: ERROR_BILL_NO, payload: msg });
  }
}
function* requestReprintBill(action) {
  try {
    const data = yield call(billServices.reprintBill, action.payload);
    yield put({ type: SET_REPRINT_BILL, payload: data });
  } catch (error) {
    const msg = handleError(error);
    toast.error(msg);
    yield put({ type: ERROR_REPRINT_BILL, payload: msg });
  }
}

function* requestReturnBill(action) {
  try {
    const data = yield call(billServices.returnBill, action.payload);
    yield put({ type: SET_RETURN_BILL, payload: data });
  } catch (error) {
    const msg = handleError(error);
    toast.error(msg);
    yield put({ type: ERROR_RETURN_BILL, payload: msg });
  }
}

function handleError(error) {
  return getApiErrorMessage(
    error,
    "Something went wrong, please try again after some time."
  );
}

export function* billSaga() {
  yield all([
    takeLatest(REQUEST_CREATE_BILL, requestCreateBill),
    takeLatest(REQUEST_BILL_NO, requestBillNo),
    takeLatest(REQUEST_BHET_BILL_NO, requestBhetBillNo),
    takeLatest(REQUEST_BILL_DETAILS, requestBillDetails),
    takeLatest(REQUEST_RETURN_BILL, requestReturnBill),
    takeLatest(REPRINT_BILL, requestReprintBill),
    takeLatest(RETURN_BILL_NO, requestreturnBillNo),
    takeLatest(RETURN_BHET_BILL_NO, requestBhetReturnBillNo),
  ]);
}
