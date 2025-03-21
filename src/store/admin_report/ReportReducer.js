import { useSelector } from "react-redux";
import {FETCH_CUSTOME_PRODUCT, FETCH_MONTHLY_PRODUCT, FETCH_TODAY_PRODUCT, FETCH_YEARLY_PRODUCT, FILTER_DAILY, FILTER_MONTHLY, FILTER_YEARLY } from "./ReportAction";

const initialState = {
  dailyreport: [],
  customereport:[],
  monthlyreport: [],
  yearlyreport: [],
  filterdailyreport: [],
  filtermonthlyreport: [],
  filteryearlyreport: []
};

const ReportReducers = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_TODAY_PRODUCT:
      return {
          ...state,
          dailyreport: action.payload,
      };
      case FETCH_CUSTOME_PRODUCT:
        return{
          ...state,
          customereport:action.payload
        }
      case FETCH_MONTHLY_PRODUCT:
        return {
          ...state,
          monthlyreport: action.payload,
      };
      case FETCH_YEARLY_PRODUCT:

        return {
          ...state,
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
