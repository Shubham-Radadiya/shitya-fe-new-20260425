import { all, call, put, takeLatest } from "redux-saga/effects";
import reportServices from "../../services/admin_report.services";
import { FETCH_CUSTOME_PRODUCT, FETCH_MONTHLY_PRODUCT, FETCH_TODAY_PRODUCT, FETCH_YEARLY_PRODUCT, REQUEST_CUSTOME_PRODUCT, REQUEST_MONTHLY_PRODUCT, REQUEST_TODAY_PRODUCT, REQUEST_YEARLY_PRODUCT } from "./ReportAction";
import { toast } from "react-toastify";
import { getApiErrorMessage } from "../../utils/apiErrorMessage";

function* getdailyreports(action) {
    try {
     const data= yield call(reportServices.getTodayProduct, action.payload);
      yield put({ type: FETCH_TODAY_PRODUCT,payload: data});
    } catch (error) {
      toast.error(getApiErrorMessage(error, "No daily data found"));
      yield put({ type: FETCH_TODAY_PRODUCT, payload: [] });
    }
  }

  function* getmonthlyeports(action) {
    try {
     const data= yield call(reportServices.getMonthlyProduct, action.payload);
     
      yield put({ type: FETCH_MONTHLY_PRODUCT,payload: data});
    } catch (error) {
      toast.error(getApiErrorMessage(error, "No data found for selected date"));
      yield put({ type: FETCH_MONTHLY_PRODUCT, payload: [] });
    }
  }

  function* getyearlyreports(action) {
    try {
     const data= yield call(reportServices.getYearlyProduct, action.payload);
      yield put({ type: FETCH_YEARLY_PRODUCT,payload: data});
    } catch (error) {
      toast.error(getApiErrorMessage(error, "No yearly data found"));
      yield put({ type: FETCH_YEARLY_PRODUCT, payload: [] });
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