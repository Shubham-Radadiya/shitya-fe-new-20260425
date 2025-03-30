import { useSelector } from "react-redux";
import {
  ERROR_CREATE_BHET,
  ERROR_CREATE_INVOICE,
  ERROR_FETCH_INVOICE_NUMBER,
  REQUEST_FETCH_INVOICE_NUMBER,
  SET_BHET_DATA,
  SET_CREATE_BHET,
  SET_CREATE_INVOICE,
  SET_FETCH_INVOICE_NUMBER,
  SET_INVOICE_DATA,
} from "./InvoiceAction";

const initialState = {
  message: "",
  busy: false,
  invoice: [],
  invoiceData: [],
  bhet: [],
  bhetData: [],
  invoiceNumber: "",
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
      console.log("Reducer - Setting Bhet Data:", action.payload);
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
      case SET_FETCH_INVOICE_NUMBER:
      return {
        ...state,
        busy: false,
        invoiceNumber: action.payload,
      };
    case ERROR_FETCH_INVOICE_NUMBER:
      return {
        ...state,
        busy: false,
        message: action.payload,
      };
    case REQUEST_FETCH_INVOICE_NUMBER:
      return {
        ...state,
        busy: true,
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
  return useSelector((state) => state.invoice);
}
