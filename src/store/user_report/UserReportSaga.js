// reportSaga.js
import { toast } from "react-toastify";
import { all, call, put, takeLatest } from "redux-saga/effects";
// import reportServices from "../../services/userreport.service";
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
import user_reportService from "../../services/user_report.service";

function* getDailyReports(action) {
  
  try {
    const data = yield call(user_reportService.getdailyreports, action.payload);
    yield put({ type: GET_DAILY_REPORTS_SUCCESS, payload: data });
  } catch (error) {
    yield put({ type: GET_DAILY_REPORTS_FAILURE, payload: error.message });
    toast.error("Failed to fetch daily reports");
  }
}

function* getMonthlyReports(action) {
  try {
    const data = yield call(user_reportService.getmonthlyreports, action.payload);
    yield put({ type: GET_MONTHLY_REPORTS_SUCCESS, payload: data });
  } catch (error) {
    yield put({ type: GET_MONTHLY_REPORTS_FAILURE, payload: error.message });
    toast.error("Failed to fetch monthly reports");
  }
}

function* getYearlyReports(action) {
  try {
    const data = yield call(user_reportService.getyearlyreports, action.payload);
    yield put({ type: GET_YEARLY_REPORTS_SUCCESS, payload: data });
  } catch (error) {
    yield put({ type: GET_YEARLY_REPORTS_FAILURE, payload: error.message });
    toast.error("Failed to fetch yearly reports");
  }
}

export function* userreportSaga() {
  yield all([
    takeLatest(GET_DAILY_REPORTS_REQUEST, getDailyReports),
    takeLatest(GET_MONTHLY_REPORTS_REQUEST, getMonthlyReports),
    takeLatest(GET_YEARLY_REPORTS_REQUEST, getYearlyReports),
  ]);
}

export default userreportSaga;
