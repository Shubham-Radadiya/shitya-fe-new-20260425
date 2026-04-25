import { all, call, put, takeLatest } from "redux-saga/effects";
import subCategoryServices from "../../services/subcategory.services";
import {
  CREATE_SUBCATEGORY_REQUEST,
  DELETE_SUBCATEGORY,
  ERROR_SUBCATEGORY,
  RECEIVE_SUBCATEGORY,
  REQUEST_SUBCATEGORY,
  REQUEST_UPDATE_SUBCATEGORY,
} from "./SubCategoryAction";
import { toast } from "react-toastify";
import { getApiErrorMessage } from "../../utils/apiErrorMessage";

function* requestSubCategory() {
  try {
    const result = yield call(subCategoryServices.SubCategoryrequest);
    yield put({ type:RECEIVE_SUBCATEGORY, payload: result?.data });
  } catch (error) {
    toast.error(getApiErrorMessage(error, "Error fetching sub-categories"));
  }
}
function* createSubCategorySaga(action) {
  try {
    yield call(
      subCategoryServices.createSubCategory,
      action.payload
    );
    toast.success("sub-category created Successfully");
  } catch (error) {
    toast.error(getApiErrorMessage(error, "Sub-category didn't create"));
  }
}

function* updateSubCategorySaga(action) {
  try {
    const { data, id } = action.payload;
    const response = yield call(subCategoryServices.updateSubCategory, data, id);
    toast.success("Sub-Category updated successfully", response);
    yield put({ type: RECEIVE_SUBCATEGORY });
  } catch (error) {
    const msg = getApiErrorMessage(error, "Sub-Category update failed");
    toast.error(msg);
    yield put({ type: ERROR_SUBCATEGORY, payload: msg });
  }
}

function* deleteSubCategorySaga(action) {
  try {
    yield call(subCategoryServices.deleteSubCategory, action.payload);
        toast.success("Sub-Category deleted successfully");
    yield put({ type: REQUEST_SUBCATEGORY });  
  } catch (error) {
    toast.error(getApiErrorMessage(error, "Sub-Category didn't delete"));
  }
}

const subCategorySaga = function* () {
  yield all([
    takeLatest(CREATE_SUBCATEGORY_REQUEST, createSubCategorySaga),
    takeLatest(REQUEST_SUBCATEGORY, requestSubCategory),
    takeLatest(DELETE_SUBCATEGORY, deleteSubCategorySaga),
    takeLatest(REQUEST_UPDATE_SUBCATEGORY, updateSubCategorySaga),
  ]);
};

export default subCategorySaga;
