const initialState = {
  excelResponse: null,
  error: null,
};

export default function excelReducer(state = initialState, action) {
  switch (action.type) {
    case "SET_EXCEL_RESPONSE":
      return { ...state, excelResponse: action.payload, error: null };

    case "ERROR_EXCEL":
      return { ...state, error: action.payload };

    default:
      return state;
  }
}
