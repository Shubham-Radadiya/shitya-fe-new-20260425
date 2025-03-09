import { ADD_ITEM, DECREMENT, DELETE_ITEM, INCREMENT } from "../actionType/actionTypes";


const initialState = {
  numOfItems: 0,
  products: [],
};

export const cartReducer = (state = initialState, action) => {
 
  switch (action.type) {
    case ADD_ITEM:
      return {
        ...state,
        numOfItems: state.filter((item) => item.id === action.payload.id),
        products:[...state.products,action.payload],
      };

      case INCREMENT:
        return{
          ...state,
          itemIncrement: state.itemIncrement + 1,
          products:[...state.products,action.payload]
        }
        case DECREMENT:
          return{
            ...state,
            numOfItems: state.numOfItems - 1,
          }
    case DELETE_ITEM:
      return {
        ...state,
        numOfItems: state.filter((item) => item.id !== action.payload.id),
        
      };
    default:
      return state;
  }
};
