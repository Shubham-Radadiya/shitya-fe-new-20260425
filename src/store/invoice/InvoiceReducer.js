import { useSelector } from "react-redux";
import {
  BHET_DATA_FETCH_ERROR,
  ERROR_CREATE_BHET,
  ERROR_CREATE_INVOICE,
  ERROR_FETCH_INVOICE_NUMBER,
  INVOICE_DATA_FETCH_ERROR,
  REQUEST_BHET_DATA,
  REQUEST_FETCH_INVOICE_NUMBER,
  REQUEST_INVOICE_DATA,
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
  invoiceDataLoading: false,
  bhet: [],
  bhetData: [],
  bhetDataLoading: false,
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
    case REQUEST_INVOICE_DATA:
      return {
        ...state,
        invoiceDataLoading: true,
      };
    case SET_INVOICE_DATA:
      return {
        ...state,
        busy: false,
        invoiceDataLoading: false,
        invoiceData: action.payload,
      };
    case INVOICE_DATA_FETCH_ERROR:
      return {
        ...state,
        invoiceDataLoading: false,
        message: action.payload,
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
    case REQUEST_BHET_DATA:
      return {
        ...state,
        bhetDataLoading: true,
      };
    case SET_BHET_DATA:
      console.log("Reducer - Setting Bhet Data:", action.payload);
      return {
        ...state,
        busy: false,
        bhetDataLoading: false,
        bhetData: action.payload,
      };
    case BHET_DATA_FETCH_ERROR:
      return {
        ...state,
        bhetDataLoading: false,
        message: action.payload,
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
