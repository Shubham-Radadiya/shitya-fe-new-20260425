import { ADD_ITEM, DECREMENT, DELETE_ITEM, INCREMENT } from "../actionType/actionTypes";

const addItem = (products) => {
  return {
    type: ADD_ITEM,
    payload:products,
  };
};

const increment = (products) => {
  return {
    type: INCREMENT,
    payload:products,
  };
};
const decrement = (products) => {
  return {
    type: DECREMENT,
    payload:products,
  };
};

const deleteItem = (product) => {
  return {
    type: DELETE_ITEM,
    payload:product,
  };
};


export { addItem, deleteItem };