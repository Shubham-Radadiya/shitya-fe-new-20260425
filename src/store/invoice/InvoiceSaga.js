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
  BHET_DATA_FETCH_ERROR,
  INVOICE_DATA_FETCH_ERROR,
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
import { getApiErrorMessage } from "../../utils/apiErrorMessage";

function* requestCreateInvoice(action) {
  try {
    const data = yield call(invoiceServices.createInvoice, action.payload);
    yield put({ type: SET_CREATE_INVOICE, payload: data });
  } catch (error) {
    const msg = handleError(error);
    toast.error(msg);
    yield put({ type: ERROR_CREATE_INVOICE, payload: msg });
  }
}
function* requestCreateBhet(action) {
  try {
    const data = yield call(invoiceServices.createBhet, action.payload);
    yield put({ type: SET_CREATE_BHET, payload: data });
  } catch (error) {
    const msg = handleError(error);
    toast.error(msg);
    yield put({ type: ERROR_CREATE_BHET, payload: msg });
  }
}

function* requestInvoiceData(action) {
  try {
    const p = action.payload;
    const isReturned = typeof p === "boolean" ? p : Boolean(p?.isReturned);
    const range =
      typeof p === "object" && p?.startDate && p?.endDate
        ? { startDate: p.startDate, endDate: p.endDate }
        : undefined;
    const storeWide = Boolean(
      typeof p === "object" && p && p.storeWide === true
    );
    const data = yield call(
      invoiceServices.getInvoices,
      isReturned,
      range,
      storeWide
    );
    yield put({ type: SET_INVOICE_DATA, payload: data });
  } catch (error) {
    const msg = handleError(error);
    toast.error(msg);
    yield put({
      type: INVOICE_DATA_FETCH_ERROR,
      payload: msg,
    });
  }
}

function* requestBhetData(action) {
  try {
    console.log("Saga - Fetching Bhet Data with isReturned:", action.payload);
    const data = yield call(invoiceServices.getBhet, action.payload);
    yield put({ type: SET_BHET_DATA, payload: data });
  } catch (error) {
    const msg = handleError(error, "Failed to load bhet data");
    toast.error(msg);
    yield put({
      type: BHET_DATA_FETCH_ERROR,
      payload: msg,
    });
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
    const msg = handleError(error);
    toast.error(msg);
    yield put({ type: ERROR_CREATE_INVOICE, payload: msg });
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
    const msg = handleError(error);
    toast.error(msg);
    yield put({ type: ERROR_CREATE_INVOICE, payload: msg });
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
    const msg = handleError(error);
    toast.error(msg);
    yield put({ type: ERROR_CREATE_INVOICE, payload: msg });
  }
}

function* requestReturnPurchase(action) {
  try {
    const data = yield call(invoiceServices.createInvoiceReturn, action.payload);
    yield put({ type: SET_RETURN_PURCHASE, payload: data });
  } catch (error) {
    const msg = handleError(error);
    toast.error(msg);
    yield put({ type: ERROR_RETURN_PURCHASE, payload: msg });
  }
}

function* requestReturnBhet(action) {
  try {
    const data = yield call(invoiceServices.createReturnBhet, action.payload);
    yield put({ type: SET_RETURN_BHET, payload: data });
  } catch (error) {
    const msg = handleError(error);
    toast.error(msg);
    yield put({ type: ERROR_RETURN_BHET, payload: msg });
  }
}

function handleError(error, fallback) {
  return getApiErrorMessage(
    error,
    fallback || "Something went wrong, please try again later."
  );
}

function* requestFetchInvoiceNumber(action) {
  try {
    const data = yield call(invoiceServices.fetchInvoiceNumber, action.payload);
    yield put({ type: SET_FETCH_INVOICE_NUMBER, payload: data });
  } catch (error) {
    const msg = handleError(error, "Could not fetch invoice number.");
    toast.error(msg);
    yield put({ type: ERROR_FETCH_INVOICE_NUMBER, payload: msg });
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
