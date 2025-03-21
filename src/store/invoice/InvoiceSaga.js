import { all, call, put, takeLatest } from "redux-saga/effects";
import invoiceServices from "../../services/invoice.services";
import {
  ERROR_CREATE_INVOICE,
  REQUEST_CREATE_INVOICE,
  REQUEST_CREATE_RETURN_INVOICE,
  REQUEST_EDIT_INVOICE_DATA,
  REQUEST_INVOICE_DATA,
  SET_CREATE_INVOICE,
  SET_INVOICE_DATA,
} from "./InvoiceAction";
import { toast } from "react-toastify";

function* requestCreateInvoice(action) {
  try {
    const data = yield call(invoiceServices.createInvoice, action.payload);
    yield put({ type: SET_CREATE_INVOICE, payload: data });
  } catch (error) {
    yield put({ type: ERROR_CREATE_INVOICE, payload: handleError(error) });
  }
}

function* requestInvoiceData(action) {
  try {
    const data = yield call(invoiceServices.getInvoices, action.payload);
    yield put({ type: SET_INVOICE_DATA, payload: data });
  } catch (error) {
    yield put({ type: ERROR_CREATE_INVOICE, payload: handleError(error) });
  }
}

function* requestEditInvoice(action) {
  try {
    const data = yield call(
      invoiceServices.editInvoice,
      action.id,
      action.payload
    );
    toast.success("Invoice updated successfully");
    yield put({ type: SET_CREATE_INVOICE, payload: data });
  } catch (error) {
    yield put({ type: ERROR_CREATE_INVOICE, payload: handleError(error) });
  }
}

function* requestCreateReturnInvoice(action) {
  try {
    const data = yield call(
      invoiceServices.createReturnInvoice,
      action.payload,
      action.id
    );
    toast.success("Return invoice created successfully");
    yield put({ type: SET_CREATE_INVOICE, payload: data });
  } catch (error) {
    yield put({ type: ERROR_CREATE_INVOICE, payload: handleError(error) });
  }
}

function handleError(error) {
  let message = "Something went wrong, please try again later.";
  if (error.response) {
    const { status, data } = error.response;
    if (status === 500) {
      message = "Server error. Try again later.";
    } else if (status === 422 || status === 415) {
      message = data.message || "Invalid data.";
    }
  }
  return message;
}

export function* invoiceSaga() {
  yield all([
    takeLatest(REQUEST_CREATE_INVOICE, requestCreateInvoice),
    takeLatest(REQUEST_CREATE_RETURN_INVOICE, requestCreateReturnInvoice),
    takeLatest(REQUEST_INVOICE_DATA, requestInvoiceData),
    takeLatest(REQUEST_EDIT_INVOICE_DATA, requestEditInvoice),
  ]);
}
