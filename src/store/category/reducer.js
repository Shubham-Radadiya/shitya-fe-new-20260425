import { useSelector } from "react-redux";
import {
  REQUEST_CATEGORY,
  SET_CATEGORY,
  ERROR_CATEGORY
} from "./categoryActionType";

const initialState = {
  busy: false,
  message: "",
  categories: [],
};

const categoryReducer = (state = initialState, action) => {
  switch (action.type) {
    case REQUEST_CATEGORY:
      return {
        ...state,
        message: "",
        busy: true,
      };

    case SET_CATEGORY:
      return {
        ...state,
        busy: false,
        message: "",
        categories: action.payload,
      };

    case ERROR_CATEGORY:
      return {
        ...state,
        busy: false,
        message: action.payload,
      };

    default:
      return state;
  }
};

export default categoryReducer;

// Define a selector hook
export function useCategory() {
  return useSelector((state) => state.categories);
}