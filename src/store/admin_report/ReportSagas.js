import { all, call, put, takeLatest } from "redux-saga/effects";
import reportServices from "../../services/admin_report.services";
import { FETCH_CUSTOME_PRODUCT, FETCH_MONTHLY_PRODUCT, FETCH_TODAY_PRODUCT, FETCH_YEARLY_PRODUCT, REQUEST_CUSTOME_PRODUCT, REQUEST_MONTHLY_PRODUCT, REQUEST_TODAY_PRODUCT, REQUEST_YEARLY_PRODUCT } from "./ReportAction";
import { toast } from "react-toastify";

function* getdailyreports(action) {
    try {
     const data= yield call(reportServices.getTodayProduct, action.payload);
      yield put({ type: FETCH_TODAY_PRODUCT,payload: data});
    } catch (error) {
      toast.error("No daily data found", error);
    }
  }

  function* getmonthlyeports(action) {
    try {
     const data= yield call(reportServices.getMonthlyProduct, action.payload);
     
      yield put({ type: FETCH_MONTHLY_PRODUCT,payload: data});
    } catch (error) {
      toast.error("No data found selected date", error);
    }
  }

  function* getyearlyreports(action) {
    try {
     const data= yield call(reportServices.getYearlyProduct, action.payload);
      yield put({ type: FETCH_YEARLY_PRODUCT,payload: data});
    } catch (error) {
      toast.error("No yearly data found", error);
    }
  }
  
  const reportSaga = function* () {
    yield all([
      takeLatest(REQUEST_TODAY_PRODUCT, getdailyreports),
      takeLatest(REQUEST_MONTHLY_PRODUCT, getmonthlyeports),
      takeLatest(REQUEST_YEARLY_PRODUCT, getyearlyreports)
    ]);
  };
  
  export default reportSaga;