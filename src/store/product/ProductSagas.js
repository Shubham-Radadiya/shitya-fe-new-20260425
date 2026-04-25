import { all, call, put, takeLatest } from "redux-saga/effects";
import productServices from "../../services/product.services";
import { REQUEST_CATEGORY } from "../category/categoryActionType";
import {
  CREATE_PRODUCT_REQUEST,
  DELETE_PRODUCT,
  ERROR_PRODUCT,
  PRODUCT_REQUEST,
  REQUEST_UPDATE_PRODUCT,
  REQUEST_STOCK_QUANTITY,
  SET_PRODUCT,
  REQUEST_GET_STOCk,
  GET_STOCK,
} from "./ProductAction";
import { toast } from "react-toastify";
import { getApiErrorMessage } from "../../utils/apiErrorMessage";

function* createProductSaga(action) {
  try {
    const { data } = yield call(productServices.createProduct, action.payload);
    toast.success("Product created Successfully", data);
    yield put({ type: REQUEST_CATEGORY });
    yield put({ type: PRODUCT_REQUEST });
  } catch (error) {
    toast.error(
      getApiErrorMessage(error, "Product creation failed")
    );
  }
}

function* requestProductSaga() {
  try {
    const data = yield call(productServices.getProduct);
    yield put({ type: SET_PRODUCT, payload: data });
  } catch (error) {
    toast.error(getApiErrorMessage(error, "Failed to fetch products"));
  }
}

function* updateProductSaga(action) {
  try {
    const { data, id } = action.payload;
    const response = yield call(productServices.updateProduct, data, id);
    toast.success("Product updated successfully", response);
    yield put({ type: REQUEST_CATEGORY });
    yield put({ type: PRODUCT_REQUEST });
  } catch (error) {
    const msg = getApiErrorMessage(error, "Product update failed");
    toast.error(msg);
    yield put({ type: ERROR_PRODUCT, payload: msg });
  }
}

function* updateStockQuantitySaga(action) {
  try {
    const { data, id } = action.payload;
    yield call(productServices.updateStockQuantity, data, id);
    toast.success("Stock quantity updated successfully");
    yield put({ type: PRODUCT_REQUEST });
  } catch (error) {
    const msg = getApiErrorMessage(error, "Stock update failed");
    toast.error(msg);
    yield put({ type: ERROR_PRODUCT, payload: msg });
  }
}

function* deleteProductSaga(action) {
  try {
    yield call(productServices.deleteProduct, action.payload);
    yield put({ type: REQUEST_CATEGORY });
    yield call(requestProductSaga);
    toast.success("Product deleted successfully");
  } catch (error) {
    toast.error(getApiErrorMessage(error, "Could not delete product"));
    yield put({ type: ERROR_PRODUCT });
  }
}

function* requestStockSaga(action) {
  try {
    const range = action?.payload || {};
    const data = yield call(productServices.getStock, range);
    yield put({ type: GET_STOCK, payload: data });
  } catch (error) {
    toast.error(getApiErrorMessage(error, "Failed to fetch stock"));
    yield put({ type: GET_STOCK, payload: [] });
  }
}

const productSaga = function* () {
  yield all([
    takeLatest(CREATE_PRODUCT_REQUEST, createProductSaga),
    takeLatest(PRODUCT_REQUEST, requestProductSaga),
    takeLatest(DELETE_PRODUCT, deleteProductSaga),
    takeLatest(REQUEST_UPDATE_PRODUCT, updateProductSaga),
    takeLatest(REQUEST_STOCK_QUANTITY, updateStockQuantitySaga),
    takeLatest(REQUEST_GET_STOCk, requestStockSaga),
  ]);
};

export default productSaga;
