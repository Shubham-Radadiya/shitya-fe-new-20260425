export const REQUEST_CREATE_INVOICE = "REQUEST_CREATE_INVOICE";
export const SET_CREATE_INVOICE = "SET_CREATE_INVOICE";
export const ERROR_CREATE_INVOICE = "ERROR_CREATE_INVOICE";

export const REQUEST_INVOICE_DATA = "REQUEST_INVOICE_DATA";
export const SET_INVOICE_DATA = "SET_INVOICE_DATA";

export const REQUEST_EDIT_INVOICE_DATA = "REQUEST_EDIT_INVOICE_DATA";

export const REQUEST_CREATE_RETURN_INVOICE = "REQUEST_CREATE_RETURN_INVOICE";

export const createReturnInvoice = (payload) => ({
  type: REQUEST_CREATE_RETURN_INVOICE,
  payload,
});

export const createInvoice = (payload) => ({
  type: REQUEST_CREATE_INVOICE,
  payload,
});


export const fetchInvoices = (isReturned = false) => ({
  type: REQUEST_INVOICE_DATA,
  payload: isReturned,
});


export const editInvoice = (id, payload) => ({
  type: REQUEST_EDIT_INVOICE_DATA,
  id,
  payload,
});
