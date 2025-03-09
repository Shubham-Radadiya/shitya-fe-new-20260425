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
  loading: false,
  error: null,
};

const UserReportReducers = (state = initialState, action) => {
  switch (action.type) {
    case GET_DAILY_REPORTS_REQUEST:
    case GET_MONTHLY_REPORTS_REQUEST:
    case GET_YEARLY_REPORTS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case GET_DAILY_REPORTS_SUCCESS:
      
      return {
        ...state,
        loading: false,
        dailyReport: action.payload,
      };

    case GET_MONTHLY_REPORTS_SUCCESS:
      return {
        ...state,
        loading: false,
        monthlyReport: action.payload,
      };

    case GET_YEARLY_REPORTS_SUCCESS:
      return {
        ...state,
        loading: false,
        yearlyReport: action.payload,
      };

    case GET_DAILY_REPORTS_FAILURE:
    case GET_MONTHLY_REPORTS_FAILURE:
    case GET_YEARLY_REPORTS_FAILURE:
      return {
        ...state,
        loading: false,
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
