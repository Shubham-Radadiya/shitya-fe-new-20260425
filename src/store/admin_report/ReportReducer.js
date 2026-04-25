import { useSelector } from "react-redux";
import {
  FETCH_CUSTOME_PRODUCT,
  FETCH_MONTHLY_PRODUCT,
  FETCH_TODAY_PRODUCT,
  FETCH_YEARLY_PRODUCT,
  FILTER_DAILY,
  FILTER_MONTHLY,
  FILTER_YEARLY,
  REQUEST_CUSTOME_PRODUCT,
  REQUEST_MONTHLY_PRODUCT,
  REQUEST_TODAY_PRODUCT,
  REQUEST_YEARLY_PRODUCT,
} from "./ReportAction";

const initialState = {
  dailyreport: [],
  customereport: [],
  monthlyreport: [],
  yearlyreport: [],
  filterdailyreport: [],
  filtermonthlyreport: [],
  filteryearlyreport: [],
  loadingDaily: false,
  loadingMonthly: false,
  loadingYearly: false,
  loadingCustom: false,
};

const ReportReducers = (state = initialState, action) => {
  switch (action.type) {
    case REQUEST_TODAY_PRODUCT:
      return { ...state, loadingDaily: true };
    case FETCH_TODAY_PRODUCT:
      return {
        ...state,
        loadingDaily: false,
        dailyreport: action.payload,
      };
    case REQUEST_CUSTOME_PRODUCT:
      return { ...state, loadingCustom: true };
    case FETCH_CUSTOME_PRODUCT:
      return {
        ...state,
        loadingCustom: false,
        customereport: action.payload,
      };
    case REQUEST_MONTHLY_PRODUCT:
      return { ...state, loadingMonthly: true };
    case FETCH_MONTHLY_PRODUCT:
      return {
        ...state,
        loadingMonthly: false,
        monthlyreport: action.payload,
      };
    case REQUEST_YEARLY_PRODUCT:
      return { ...state, loadingYearly: true };
    case FETCH_YEARLY_PRODUCT:
      return {
        ...state,
        loadingYearly: false,
        yearlyreport: action.payload,
      };
      case FILTER_MONTHLY:
        return {
          ...state,
          filtermonthlyreport:action.payload
        };
        case FILTER_DAILY:
        return {
          ...state,
          filterdailyreport:action.payload
        };
        case FILTER_YEARLY:
        return {
          ...state,
          filteryearlyreport:action.payload
        };
    default:
      return state;
  }
};

export default ReportReducers;

export function useReport() {
  return useSelector((state) => state.report);
}
