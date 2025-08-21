import { all, call, put, takeLatest } from "redux-saga/effects";
import invoiceServices from "../../services/invoice.services";
import {
  ERROR_CREATE_BHET,
  ERROR_CREATE_INVOICE,
  ERROR_FETCH_INVOICE_NUMBER,
  ERROR_RETURN_BHET,
  ERROR_RETURN_PURCHASE,
  REQUEST_BHET_DATA,
  REQUEST_CREATE_BHET,
  REQUEST_CREATE_INVOICE,
  REQUEST_CREATE_RETURN_BHET,
  REQUEST_CREATE_RETURN_INVOICE,
  REQUEST_EDIT_INVOICE_DATA,
  REQUEST_FETCH_INVOICE_NUMBER,
  REQUEST_INVOICE_DATA,
  REQUEST_RETURN_BHET,
  REQUEST_RETURN_PURCHASE,
  SET_BHET_DATA,
  SET_CREATE_BHET,
  SET_CREATE_INVOICE,
  SET_FETCH_INVOICE_NUMBER,
  SET_INVOICE_DATA,
  SET_RETURN_BHET,
  SET_RETURN_PURCHASE,

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
function* requestCreateBhet(action) {
  try {
    const data = yield call(invoiceServices.createBhet, action.payload);
    yield put({ type: SET_CREATE_BHET, payload: data });
  } catch (error) {
    yield put({ type: ERROR_CREATE_BHET, payload: handleError(error) });
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

function* requestBhetData(action) {
  try {
    console.log("Saga - Fetching Bhet Data...");
    const data = yield call(invoiceServices.getBhet);
    console.log("Saga - Bhet Data API Response:", data);
    yield put({ type: SET_BHET_DATA, payload: data });
    console.log("Saga - Dispatched SET_BHET_DATA");
  } catch (error) {
    console.error("Saga - Bhet API Error:", error);
    yield put({ type: ERROR_CREATE_BHET, payload: error.message });
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

function* requestEditreturnBhet(action) {
  try {
    const data = yield call(
      invoiceServices.updateReturnBhet,
      action.payload,
      action.id
    );
    toast.success("Return invoice created successfully");
    yield put({ type: SET_CREATE_INVOICE, payload: data });
  } catch (error) {
    yield put({ type: ERROR_CREATE_INVOICE, payload: handleError(error) });
  }
}

function* requestReturnPurchase(action) {
  try {
    const data = yield call(invoiceServices.createInvoiceReturn, action.payload);
    yield put({ type: SET_RETURN_PURCHASE, payload: data });
  } catch (error) {
    yield put({ type: ERROR_RETURN_PURCHASE, payload: handleError(error) });
  }
}

function* requestReturnBhet(action) {
  try {
    const data = yield call(invoiceServices.createReturnBhet, action.payload);
    yield put({ type: SET_RETURN_BHET, payload: data });
  } catch (error) {
    yield put({ type: ERROR_RETURN_BHET, payload: handleError(error) });
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

function* requestFetchInvoiceNumber(action) {
  try {
    const data = yield call(invoiceServices.fetchInvoiceNumber, action.payload);
    yield put({ type: SET_FETCH_INVOICE_NUMBER, payload: data });
  } catch (error) {
    yield put({ type: ERROR_FETCH_INVOICE_NUMBER, payload: error.message });
  }
}

export function* invoiceSaga() {
  yield all([
    takeLatest(REQUEST_CREATE_INVOICE, requestCreateInvoice),
    takeLatest(REQUEST_CREATE_RETURN_INVOICE, requestCreateReturnInvoice),
    takeLatest(REQUEST_INVOICE_DATA, requestInvoiceData),
    takeLatest(REQUEST_BHET_DATA, requestBhetData),
    takeLatest(REQUEST_RETURN_PURCHASE, requestReturnPurchase),
    takeLatest(REQUEST_EDIT_INVOICE_DATA, requestEditInvoice),
    takeLatest(REQUEST_CREATE_BHET, requestCreateBhet),
    takeLatest(REQUEST_FETCH_INVOICE_NUMBER, requestFetchInvoiceNumber),
    takeLatest(REQUEST_RETURN_BHET, requestReturnBhet),
    takeLatest(REQUEST_CREATE_RETURN_BHET, requestEditreturnBhet),
  ]);
}
