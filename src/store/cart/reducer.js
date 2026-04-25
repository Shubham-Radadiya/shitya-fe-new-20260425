import { useSelector } from "react-redux";
import {
  ADD_TO_BHET_CART,
  ADD_TO_CART,
  ADD_TO_PURCHASE_CART,
  ADD_TO_UPDATEBHETCART,
  ADD_TO_UPDATEDCART,
  ADD_TO_UPDATEPURCHASECART,
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
  bhetItems: [],
};

const cartReducer = (state = initialState, action) => {
  switch (action.type) {
    case ADD_TO_CART: {
      const product = action.payload;

      // Use uniqueKey if present, otherwise productId
      const key = product.uniqueKey || product.productId;

      const existingItemIndex = state.items.findIndex(
        (item) => (item.uniqueKey || item.productId) === key
      );

      if (existingItemIndex !== -1) {
        // If already exists, increase quantity
        const updatedItems = [...state.items];
        updatedItems[existingItemIndex].quantity += 1;
        return { ...state, items: updatedItems };
      }

      // If not exist, add new
      return {
        ...state,
        items: [...state.items, { ...product, quantity: 1 }],
      };
    }

    case ADD_TO_PURCHASE_CART: {
      const product = action.payload;
      const key = product.uniqueKey || product.productId;

      const existingItemIndex = state.purchaseItems.findIndex(
        (item) => (item.uniqueKey || item.productId) === key
      );

      if (existingItemIndex !== -1) {
        const updatedItems = [...state.purchaseItems];
        updatedItems[existingItemIndex].quantity += 1;
        return { ...state, purchaseItems: updatedItems };
      }

      return {
        ...state,
        purchaseItems: [...state.purchaseItems, { ...product, quantity: 1 }],
      };
    }

    case ADD_TO_BHET_CART: {
      const product = action.payload;
      const key = product.uniqueKey || product.productId;

      const existingItemIndex = state.bhetItems.findIndex(
        (item) => (item.uniqueKey || item.productId) === key
      );

      if (existingItemIndex !== -1) {
        const updatedItems = [...state.bhetItems];
        updatedItems[existingItemIndex].quantity += 1;
        return { ...state, bhetItems: updatedItems };
      }

      return {
        ...state,
        bhetItems: [...state.bhetItems, { ...product, quantity: 1 }],
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

    case ADD_TO_UPDATEPURCHASECART:
      const existingItemIndexs1 = state.purchaseItems.findIndex(
        (item) => item.productId === action.payload.productId
      );
      if (existingItemIndexs1 !== -1) {
        const updatedItems = [...state.items];
        updatedItems[existingItemIndexs1].quantity += 1;
        return {
          ...state,
          purchaseItems: updatedItems,
        };
      } else {
        return {
          ...state,
          purchaseItems: action.payload,
        };
      }
      // case "UPDATE_CART_ITEM_PRICE": {
      //   const updatePrice = (arr) =>
      //     arr.map((item, index) => {
      //       const key = item.uniqueKey || `${item._id}-${index}`;
      //       return item.priceType === "CUSTOM" && key === action.payload.uniqueKey
      //         ? { ...item, price: action.payload.price }
      //         : item;
      //     });
      
      //   return {
      //     ...state,
      //     items: updatePrice(state.items),
      //     purchaseItems: updatePrice(state.purchaseItems),
      //     bhetItems: updatePrice(state.bhetItems),
      //   };
      // }
      
      case "UPDATE_CART_ITEM_PRICE": {
        const updatePrice = (arr) =>
          arr.map((item) =>
            item.uniqueKey === action.payload.uniqueKey
              ? { ...item, price: action.payload.price }
              : item
          );
      
        return {
          ...state,
          items: updatePrice(state.items),
          purchaseItems: updatePrice(state.purchaseItems),
          bhetItems: updatePrice(state.bhetItems),
        };
      }

      

    case ADD_TO_UPDATEBHETCART:
      const existingItemIndexs2 = state.bhetItems.findIndex(
        (item) => item.productId === action.payload.productId
      );
      if (existingItemIndexs2 !== -1) {
        const updatedItems = [...state.items];
        updatedItems[existingItemIndexs2].quantity += 1;

        return {
          ...state,
          bhetItems: updatedItems,
        };
      } else {
        return {
          ...state,
          bhetItems: action.payload,
        };
      }

    case REMOVE_FROM_PURCHASE_CART: {
      const exitingIndex = state.purchaseItems.findIndex(
        (item) =>
          (item.uniqueKey || item._id || item.productId) === action.payload
      );

      if (exitingIndex !== -1) {
        const updatedItems = [...state.purchaseItems];
        if (updatedItems[exitingIndex].quantity > 1) {
          updatedItems[exitingIndex].quantity -= 1;
        } else {
          updatedItems.splice(exitingIndex, 1);
        }
        return { ...state, purchaseItems: updatedItems };
      }
      return state; // always return state if item not found
    }

    case REMOVE_FROM_BHET_CART: {
      const exitingIndex = state.bhetItems.findIndex(
        (item) => (item.uniqueKey || item._id) === action.payload
      );

      if (exitingIndex !== -1) {
        const updatedItems = [...state.bhetItems];
        if (updatedItems[exitingIndex].quantity > 1) {
          updatedItems[exitingIndex].quantity -= 1;
        } else {
          updatedItems.splice(exitingIndex, 1);
        }
        return { ...state, bhetItems: updatedItems };
      }
      return state;
    }

    case REMOVE_FROM_CART: {
      const exitingIndex = state.items.findIndex(
        (item) => (item.uniqueKey || item._id) === action.payload
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
      return state;
    }

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
      console.log("Updated purchaseItems:", action.payload);
      return {
        ...state,
        purchaseItems: action.payload,
      };
    case EDIT_BHET_DATA:
      return {
        ...state,
        bhetItems: action.payload,
      };
    default:
      return state;
  }
};

export default cartReducer;

export function useCartReducer() {
  return useSelector((state) => state.cartReducer);
}
