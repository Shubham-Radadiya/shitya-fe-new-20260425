import { useSelector } from "react-redux";
import { ERROR_SUBCATEGORY, RECEIVE_SUBCATEGORY } from "./SubCategoryAction";

const initialState = {
  busy: false,
  loading: false,
  error: null,
  message: "",
  subcategories: [],
};

const SubCategoryReducers = (state = initialState, action) => {
  switch (action.type) {
    case RECEIVE_SUBCATEGORY:
      return {
    
          ...state,
          loading: true,
          error: null,
        subcategories: action.payload,
      };

      case ERROR_SUBCATEGORY:
      return {
        ...state,
        busy: false,
        message: action.payload,
      }; 

    default:
      return state;
  }
};

export default SubCategoryReducers;

export function useCategory() {
  return useSelector((state) => state.SubCategoryReducers);
}
