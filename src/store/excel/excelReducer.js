const initialState = {
    excelResponse: null,
  };
  
  export default function excelReducer(state = initialState, action) {
    switch (action.type) {
      case "SET_EXCEL_RESPONSE":
        return { ...state, excelResponse: action.payload };
      default:
        return state;
    }
  }
  