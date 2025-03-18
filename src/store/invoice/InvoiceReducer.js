import { useSelector } from "react-redux";
import {
  ERROR_CREATE_INVOICE,
  SET_CREATE_INVOICE,
  SET_INVOICE_DATA,
} from "./InvoiceAction";

const initialState = {
  message: "",
  busy: false,
  invoice: [],
  invoiceData: [],
};

const invoiceReducer = (state = initialState, action) => {
  switch (action.type) {
    case SET_CREATE_INVOICE:
      return {
        ...state,
        busy: false,
        invoice: [...state.invoice, action.payload],
      };
    case SET_INVOICE_DATA:
      return {
        ...state,
        busy: false,
        invoiceData: action.payload,
      };
    case ERROR_CREATE_INVOICE:
      return {
        ...state,
        busy: false,
        message: action.payload,
      };
    default:
      return state;
  }
};

export default invoiceReducer;

export function useInvoice() {
  return useSelector((state) => state.invoice);
}
