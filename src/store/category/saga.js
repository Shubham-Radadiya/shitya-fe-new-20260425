import { all, call, put, takeLatest } from "redux-saga/effects";
import { get } from "lodash";
import { toast } from "react-toastify";
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
    toast.error("Error fetching categories", error);
    let message =
      "Something went wrong, please try again after some time or refresh the page.";
    if (get(error, "response.status") === 500) {
      message = "Something happened wrong, try again after sometime.";
    } else if (get(error, "response.status") === 422) {
      message = error.response.data.message || "Please provide valid content";
    } else if (get(error, "response.status") === 415) {
      message = error.response.data.message;
    }
    yield put({ type: ERROR_CATEGORY, payload: message });
  }
}

function* createCategorySaga(action) {
  try {
    yield call(categoryServices.createCategory, action.payload);
    toast.success("Category created successfully");
    yield put({ type: REQUEST_CATEGORY });
  } catch (error) {
    toast.error("Category creation failed", error);
  }
}

function* deleteCategorySaga(action) {
  try {
    yield call(categoryServices.deleteCategory, action.payload);
    toast.success("Category deleted successfully");
    yield call(requestCategory);
  } catch (error) {
    toast.error("Category didn't delete", error);
  }
}

function* updateCategorySaga(action) {
  try {
    const { data, id } = action.payload;
    const response = yield call(categoryServices.updateCategory, data, id);
    toast.success("Category updated successfully", response);
    yield put({ type: REQUEST_CATEGORY });
  } catch (error) {
    yield put({ type: ERROR_CATEGORY });
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
