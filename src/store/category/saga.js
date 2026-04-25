import { all, call, put, takeLatest } from "redux-saga/effects";
import { toast } from "react-toastify";
import { getApiErrorMessage } from "../../utils/apiErrorMessage";
import {
  CREATE_CATEGORY_REQUEST,
  DELETE_CATEGORY,
  ERROR_CATEGORY,
  REQUEST_CATEGORY,
  REQUEST_UPDATE_CATEGORY,
  SET_CATEGORY,
} from "./categoryActionType";
import categoryServices from "../../services/category.services";

function* requestCategory(action) {
  try {
    const result = yield call(categoryServices.getCategory);
    yield put({ type: SET_CATEGORY, payload: result.data });
  } catch (error) {
    const message = getApiErrorMessage(
      error,
      "Something went wrong, please try again after some time or refresh the page."
    );
    toast.error(message);
    yield put({ type: ERROR_CATEGORY, payload: message });
  }
}

function* createCategorySaga(action) {
  try {
    yield call(categoryServices.createCategory, action.payload);
    toast.success("Category created successfully");
    yield put({ type: REQUEST_CATEGORY });
  } catch (error) {
    toast.error(getApiErrorMessage(error, "Category creation failed"));
  }
}

function* deleteCategorySaga(action) {
  try {
    yield call(categoryServices.deleteCategory, action.payload);
    toast.success("Category deleted successfully");
    yield call(requestCategory, { type: REQUEST_CATEGORY });
  } catch (error) {
    toast.error(getApiErrorMessage(error, "Category didn't delete"));
  }
}

function* updateCategorySaga(action) {
  try {
    const { data, id } = action.payload;
    const response = yield call(categoryServices.updateCategory, data, id);
    toast.success("Category updated successfully", response);
    yield put({ type: REQUEST_CATEGORY });
  } catch (error) {
    const msg = getApiErrorMessage(error, "Category update failed");
    toast.error(msg);
    yield put({ type: ERROR_CATEGORY, payload: msg });
  }
}

const categorySaga = function* () {
  yield all([
    takeLatest(REQUEST_CATEGORY, requestCategory),
    takeLatest(CREATE_CATEGORY_REQUEST, createCategorySaga),
    takeLatest(DELETE_CATEGORY, deleteCategorySaga),
    takeLatest(REQUEST_UPDATE_CATEGORY, updateCategorySaga),
  ]);
};

export default categorySaga;
