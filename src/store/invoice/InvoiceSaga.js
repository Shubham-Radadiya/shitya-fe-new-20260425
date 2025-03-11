import { all, call, put, takeLatest } from "redux-saga/effects";
import invoiceServices from "../../services/invoice.services";
import { ERROR_CREATE_INVOICE, REQUEST_CREATE_INVOICE, SET_CREATE_INVOICE } from "./InvoiceAction";

function* requestCreateInvoice(action) {
  try {
    const data = yield call(invoiceServices.createInvoice, action.payload);
    yield put({ type: SET_CREATE_INVOICE, payload: data });
    // yield call(requestBillNo)
  } catch (error) {
    yield put({ type: ERROR_CREATE_INVOICE, payload: handleError(error) });
  }
}

function handleError(error) {
    let message = "Something went wrong, please try again after some time.";
    if (error.response) {
      const { status, data } = error.response;
      if (status === 500) {
        message = "Something happened wrong, try again after some time.";
      } else if (status === 422 || status === 415) {
        message = data.message || "Please provide valid content.";
      }
    }
    return message;
  }

export function* invoiceSaga() {
    yield all([takeLatest(REQUEST_CREATE_INVOICE, requestCreateInvoice)]);
}