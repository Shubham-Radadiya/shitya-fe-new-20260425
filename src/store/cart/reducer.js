import { useSelector } from "react-redux";
import {
  ADD_TO_BHET_CART,
  ADD_TO_CART,
  ADD_TO_PURCHASE_CART,
  ADD_TO_UPDATEDCART,
  CLEAR_BHET_CART,
  CLEAR_CART,
  CLEAR_PURCHASE_CART,
  EDIT_BHET_DATA,
  EDIT_PURCHASE_DATA,
  REMOVE_FROM_BHET_CART,
  REMOVE_FROM_CART,
  REMOVE_FROM_PURCHASE_CART,
} from "./cartActionType";

const initialState = {
  items: [],
  quantity: 0,
  purchaseItems: [],
  bhetItems: []
};

const cartReducer = (state = initialState, action) => {
  switch (action.type) {
    case ADD_TO_CART:
      const existingItemIndex = state.items.findIndex(
        (item) => item.productId === action.payload.productId
      );
      if (existingItemIndex !== -1) {
        const updatedItems = [...state.items];
        updatedItems[existingItemIndex].quantity += 1;

        return {
          ...state,
          items: updatedItems,
        };
      } else {
        return {
          ...state,
          items: [...state.items, { ...action.payload, quantity: 1 }],
        };
      }

    case ADD_TO_PURCHASE_CART:
      const existingItemIndex1 = state.purchaseItems.findIndex(
        (item) => item.productId === action.payload.productId
      );
      if (existingItemIndex1 !== -1) {
        const updatedItems = [...state.purchaseItems];
        updatedItems[existingItemIndex1].quantity += 1;

        return {
          ...state,
          purchaseItems: updatedItems,
        };
      } else {
        return {
          ...state,
          purchaseItems: [
            ...state.purchaseItems,
            { ...action.payload, quantity: 1 },
          ],
        };
      }

      case ADD_TO_BHET_CART:
        const existingItemIndex2 = state.bhetItems.findIndex(
          (item) => item.productId === action.payload.productId
        );
        if (existingItemIndex2 !== -1) {
          const updatedItems = [...state.bhetItems];
          updatedItems[existingItemIndex2].quantity += 1;
  
          return {
            ...state,
            bhetItems: updatedItems,
          };
        } else {
          return {
            ...state,
            bhetItems: [
              ...state.bhetItems,
              { ...action.payload, quantity: 1 },
            ],
          };
        }

    case ADD_TO_UPDATEDCART:
      const existingItemIndexs = state.items.findIndex(
        (item) => item.productId === action.payload.productId
      );
      if (existingItemIndexs !== -1) {
        const updatedItems = [...state.items];
        updatedItems[existingItemIndexs].quantity += 1;

        return {
          ...state,
          items: updatedItems,
        };
      } else {
        return {
          ...state,
          items: action.payload,
        };
      }

    case REMOVE_FROM_CART:
      const exitingIndex = state.items.findIndex(
        (item) => item._id === action.payload
      );

      if (exitingIndex !== -1) {
        const updatedItems = [...state.items];
        if (updatedItems[exitingIndex].quantity > 1) {
          updatedItems[exitingIndex].quantity -= 1;
        } else {
          updatedItems.splice(exitingIndex, 1);
        }
        return {
          ...state,
          items: updatedItems,
        };
      }
      break;

    case REMOVE_FROM_PURCHASE_CART:
      const exitingIndex1 = state.purchaseItems.findIndex(
        (item) => item._id === action.payload
      );

      if (exitingIndex1 !== -1) {
        const updatedItems = [...state.purchaseItems];
        if (updatedItems[exitingIndex1].quantity > 1) {
          updatedItems[exitingIndex1].quantity -= 1;
        } else {
          updatedItems.splice(exitingIndex1, 1);
        }
        return {
          ...state,
          purchaseItems: updatedItems,
        };
      }
      break;

      case REMOVE_FROM_BHET_CART:
      const exitingIndex2 = state.bhetItems.findIndex(
        (item) => item._id === action.payload
      );

      if (exitingIndex1 !== -1) {
        const updatedItems = [...state.bhetItems];
        if (updatedItems[exitingIndex1].quantity > 1) {
          updatedItems[exitingIndex1].quantity -= 1;
        } else {
          updatedItems.splice(exitingIndex1, 1);
        }
        return {
          ...state,
          bhetItems: updatedItems,
        };
      }
      break;

    case CLEAR_CART:
      return {
        ...state,
        items: [],
      };

    case CLEAR_PURCHASE_CART:
      return { ...state, purchaseItems: [] };

    case CLEAR_BHET_CART:
      return { ...state, bhetItems: [] };

    case EDIT_PURCHASE_DATA:
      return {
        ...state,
        purchaseItems: action.payload,
      };
    case EDIT_BHET_DATA:
      return {
        ...state,
        purchaseItems: action.payload,
      };
    default:
      return state;
  }
};

export default cartReducer;

export function useCartReducer() {
  return useSelector((state) => state.cartReducer);
}
