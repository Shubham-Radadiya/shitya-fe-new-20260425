import { useSelector } from "react-redux";
import {
  ERROR_CREATE_BHET,
  ERROR_CREATE_INVOICE,
  SET_BHET_DATA,
  SET_CREATE_BHET,
  SET_CREATE_INVOICE,
  SET_INVOICE_DATA,
} from "./InvoiceAction";

const initialState = {
  message: "",
  busy: false,
  invoice: [],
  invoiceData: [],
  bhet: [],
  bhetData: [],
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
    case SET_CREATE_BHET:
      return {
        ...state,
        busy: false,
        bhet: [...state.bhet, action.payload],
      };
    case SET_BHET_DATA:
      return {
        ...state,
        busy: false,
        bhetData: action.payload,
      };
    case ERROR_CREATE_BHET:
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

export function useBhet() {
  return useSelector((state) => state.bhet);
}
