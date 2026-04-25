export const REQUEST_CREATE_INVOICE = "REQUEST_CREATE_INVOICE";
export const SET_CREATE_INVOICE = "SET_CREATE_INVOICE";
export const ERROR_CREATE_INVOICE = "ERROR_CREATE_INVOICE";

export const REQUEST_CREATE_BHET = "REQUEST_CREATE_BHET";
export const SET_CREATE_BHET = "SET_CREATE_BHET";
export const ERROR_CREATE_BHET = "ERROR_CREATE_BHET";

export const REQUEST_RETURN_BHET = "REQUEST_RETURN_BHET";
export const SET_RETURN_BHET = "SET_RETURN_BHET";
export const ERROR_RETURN_BHET = "ERROR_RETURN_BHET";


export const REQUEST_RETURN_PURCHASE = "REQUEST_RETURN_PURCHASE";
export const SET_RETURN_PURCHASE = "SET_RETURN_PURCHASE";
export const ERROR_RETURN_PURCHASE = "ERROR_RETURN_PURCHASE";

export const REQUEST_INVOICE_DATA = "REQUEST_INVOICE_DATA";
export const SET_INVOICE_DATA = "SET_INVOICE_DATA";
export const INVOICE_DATA_FETCH_ERROR = "INVOICE_DATA_FETCH_ERROR";

export const REQUEST_BHET_DATA = "REQUEST_BHET_DATA";
export const SET_BHET_DATA = "SET_BHET_DATA";
export const BHET_DATA_FETCH_ERROR = "BHET_DATA_FETCH_ERROR";

export const REQUEST_EDIT_INVOICE_DATA = "REQUEST_EDIT_INVOICE_DATA";

export const REQUEST_CREATE_RETURN_INVOICE = "REQUEST_CREATE_RETURN_INVOICE";
export const REQUEST_CREATE_RETURN_BHET = "REQUEST_CREATE_RETURN_BHET";

export const REQUEST_FETCH_INVOICE_NUMBER = "REQUEST_FETCH_INVOICE_NUMBER";
export const SET_FETCH_INVOICE_NUMBER = "SET_FETCH_INVOICE_NUMBER";
export const ERROR_FETCH_INVOICE_NUMBER = "ERROR_FETCH_INVOICE_NUMBER";

export const fetchInvoiceNumber = (isReturned) => ({
  type: REQUEST_FETCH_INVOICE_NUMBER,
  payload: isReturned,
});

export const setInvoiceNumber = (invoiceNumber) => ({
  type: SET_FETCH_INVOICE_NUMBER,
  payload: invoiceNumber,
});

export const errorFetchInvoiceNumber = (error) => ({
  type: ERROR_FETCH_INVOICE_NUMBER,
  payload: error,
});


export const createReturnInvoice = (payload) => ({
  type: REQUEST_CREATE_RETURN_INVOICE,
  payload,
});

export const createInvoice = (payload) => ({
  type: REQUEST_CREATE_INVOICE,
  payload,
});
export const createBhet = (payload) => ({
  type: REQUEST_CREATE_BHET,
  payload,
});


export const fetchInvoices = (isReturned = false) => ({
  type: REQUEST_INVOICE_DATA,
  payload: isReturned,
});

export const fetchBhet = (isReturned = false) => ({
  type: REQUEST_BHET_DATA,
  payload: isReturned,
});

export const editInvoice = (id, payload) => ({
  type: REQUEST_EDIT_INVOICE_DATA,
  id,
  payload,
});
