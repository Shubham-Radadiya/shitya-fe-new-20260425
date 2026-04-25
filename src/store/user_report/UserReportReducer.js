// ReportReducers.js
import { useSelector } from "react-redux";
import {
  GET_DAILY_REPORTS_REQUEST,
  GET_DAILY_REPORTS_SUCCESS,
  GET_DAILY_REPORTS_FAILURE,
  GET_MONTHLY_REPORTS_REQUEST,
  GET_MONTHLY_REPORTS_SUCCESS,
  GET_MONTHLY_REPORTS_FAILURE,
  GET_YEARLY_REPORTS_REQUEST,
  GET_YEARLY_REPORTS_SUCCESS,
  GET_YEARLY_REPORTS_FAILURE,
} from "./UserReportAction";

const initialState = {
  dailyReport: [],
  monthlyReport: [],
  yearlyReport: [],
  loadingDaily: false,
  loadingMonthly: false,
  loadingYearly: false,
  error: null,
};

const UserReportReducers = (state = initialState, action) => {
  switch (action.type) {
    case GET_DAILY_REPORTS_REQUEST:
      return {
        ...state,
        dailyReport: [],
        loadingDaily: true,
        error: null,
      };

    case GET_MONTHLY_REPORTS_REQUEST:
      return {
        ...state,
        loadingMonthly: true,
        error: null,
      };

    case GET_YEARLY_REPORTS_REQUEST:
      return {
        ...state,
        loadingYearly: true,
        error: null,
      };

    case GET_DAILY_REPORTS_SUCCESS:
      return {
        ...state,
        loadingDaily: false,
        dailyReport: action.payload,
      };

    case GET_MONTHLY_REPORTS_SUCCESS:
      return {
        ...state,
        loadingMonthly: false,
        monthlyReport: action.payload,
      };

    case GET_YEARLY_REPORTS_SUCCESS:
      return {
        ...state,
        loadingYearly: false,
        yearlyReport: action.payload,
      };

    case GET_DAILY_REPORTS_FAILURE:
      return {
        ...state,
        loadingDaily: false,
        error: action.payload,
      };

    case GET_MONTHLY_REPORTS_FAILURE:
      return {
        ...state,
        loadingMonthly: false,
        error: action.payload,
      };

    case GET_YEARLY_REPORTS_FAILURE:
      return {
        ...state,
        loadingYearly: false,
        error: action.payload,
      };

    default:
      return state;
  }
};

export default UserReportReducers;

export function useReport() {
  return useSelector((state) => state.userReport);
}
