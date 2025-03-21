import {
  ERROR_PRODUCT,
  PRODUCT_REQUEST,
  SET_PRODUCT,
  REQUEST_STOCK_QUANTITY,
  GET_STOCK,
} from "./ProductAction";
import { useSelector } from "react-redux";

const initialState = {
  busy: false,
  message: "",
  products: [],
  stock: [],
};

const ProductReducer = (state = initialState, action) => {
  switch (action.type) {
    case PRODUCT_REQUEST:
      return {
        ...state,
        message: "",
        busy: true,
      };

    case SET_PRODUCT:
      return {
        ...state,
        busy: false,
        message: "",
        products: action.payload,
      };

    case REQUEST_STOCK_QUANTITY:
      return {
        ...state,
        busy: true,
      };

    case ERROR_PRODUCT:
      return {
        ...state,
        busy: false,
        message: action.payload,
      };
    case GET_STOCK:
      return {
        ...state,
        busy: false,
        stock: action.payload,
      };
    default:
      return state;
  }
};

export default ProductReducer;

export function useProducts() {
  return useSelector((state) => state.product.products);
}
