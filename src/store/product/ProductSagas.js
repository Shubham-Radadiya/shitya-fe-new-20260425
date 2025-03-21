import { all, call, put, takeLatest } from "redux-saga/effects";
import productServices from "../../services/product.services";
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

function* createProductSaga(action) {
  try {
    const { data } = yield call(productServices.createProduct, action.payload);
    toast.success("Product created Successfully", data);
    yield put({ type: PRODUCT_REQUEST });
  } catch (error) {
    toast.error("Product creation failed", error);
  }
}

function* requestProductSaga() {
  try {
    const data = yield call(productServices.getProduct);
    yield put({ type: SET_PRODUCT, payload: data });
  } catch (error) {
    toast.error("Failed to fetch products", error);
  }
}

function* updateProductSaga(action) {
  try {
    const { data, id } = action.payload;
    const response = yield call(productServices.updateProduct, data, id);
    toast.success("Product updated successfully", response);
    yield put({ type: PRODUCT_REQUEST });
  } catch (error) {
    toast.error("Product update failed", error);
    yield put({ type: ERROR_PRODUCT, payload: "Product update failed" });
  }
}

function* updateStockQuantitySaga(action) {
  try {
    const { data, id } = action.payload;
    yield call(productServices.updateStockQuantity, data, id);
    toast.success("Stock quantity updated successfully");
    yield put({ type: PRODUCT_REQUEST });
  } catch (error) {
    toast.error("Stock update failed", error);
    yield put({ type: ERROR_PRODUCT, payload: "Stock update failed" });
  }
}

function* deleteProductSaga(action) {
  try {
    yield call(productServices.deleteProduct, action.payload);
    yield call(requestProductSaga);
    toast.success("Product deleted successfully");
  } catch (error) {
    yield put({ type: ERROR_PRODUCT });
  }
}

function* requestStockSaga() {
  try {
    const data = yield call(productServices.getStock);
    yield put({ type: GET_STOCK, payload: data });
  } catch (error) {
    toast.error("Failed to fetch products", error);
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
