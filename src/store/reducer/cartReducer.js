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
      case "UPDATE_CUSTOM_PRICE":
  return {
    ...state,
    items: state.items.map((item) =>
      item._id === action.payload.id
        ? { ...item, price: action.payload.price } // 👈 override price
        : item
    ),
    purchaseItems: state.purchaseItems.map((item) =>
      item._id === action.payload.id
        ? { ...item, price: action.payload.price }
        : item
    ),
    bhetItems: state.bhetItems.map((item) =>
      item._id === action.payload.id
        ? { ...item, price: action.payload.price }
        : item
    ),
  };

    default:
      return state;
  }
};
