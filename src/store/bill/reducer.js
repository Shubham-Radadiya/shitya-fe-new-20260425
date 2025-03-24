// src/store/bill/reducer.js
import { useSelector } from "react-redux";
import {
  REQUEST_BILL_NO,
  SET_BILL_NO,
  ERROR_BILL_NO,
  REQUEST_BILL_DETAILS,
  SET_BILL_DETAILS,
  ERROR_BILL_DETAILS,
  REQUEST_CREATE_BILL,
  SET_CREATE_BILL,
  ERROR_CREATE_BILL,
  REQUEST_BILL,
  ERROR_REPRINT_BILL,
  SET_REPRINT_BILL,
  RETURN_BILL_NO,
  REQUEST_BHET_BILL_NO,
} from "./billActionType";

const initialState = {
  busy: false,
  message: "",
  billNo: null,
  billDetails: null,
  bill: [],
  reprintBill: null,
  returnbillNo: null,
};

const bill = (state = initialState, action) => {
  switch (action.type) {
    case REQUEST_BILL_NO:
    case RETURN_BILL_NO:
    case REQUEST_BILL_DETAILS:
    case REQUEST_CREATE_BILL:
    case REQUEST_BILL:
    case REQUEST_BHET_BILL_NO:
      return {
        ...state,
        busy: true,
        message: "",
      };

    case SET_REPRINT_BILL:
      return { ...state, reprintBill: action.payload };
    case ERROR_REPRINT_BILL:
      return { ...state, reprintBill: null };

    case SET_BILL_NO:
      return {
        ...state,
        busy: false,
        billNo: action.payload,
      };

    case SET_BILL_DETAILS:
      return {
        ...state,
        busy: false,
        billDetails: action.payload,
      };

    case SET_CREATE_BILL:
      return {
        ...state,
        busy: false,
        bill: [...state.bill, action.payload],
      };

    case ERROR_BILL_NO:
    case ERROR_BILL_DETAILS:
    case ERROR_CREATE_BILL:
      return {
        ...state,
        busy: false,
        message: action.payload,
      };

    default:
      return state;
  }
};

export default bill;

export function useBill() {
  return useSelector((state) => state.bill);
}
