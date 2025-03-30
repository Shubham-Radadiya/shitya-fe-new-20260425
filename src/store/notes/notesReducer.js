import {
  CREATE_NOTE_CATEGORY_FAILURE,
  CREATE_NOTE_CATEGORY_REQUEST,
  CREATE_NOTE_CATEGORY_SUCCESS,
  CREATE_NOTE_FAILURE,
  CREATE_NOTE_REQUEST,
  CREATE_NOTE_SUCCESS,
  FETCH_NOTES_FAILURE,
  FETCH_NOTES_REQUEST,
  FETCH_NOTES_SUCCESS,
  FETCH_CATEGORIES_REQUEST,
  FETCH_CATEGORIES_SUCCESS,
  FETCH_CATEGORIES_FAILURE,
} from "./notesAction";

const initialState = {
  categories: [],
  notes: [],
  loading: false,
  error: null,
};

const notesReducer = (state = initialState, action) => {
  switch (action.type) {
    case CREATE_NOTE_CATEGORY_REQUEST:
    case CREATE_NOTE_REQUEST:
    case FETCH_NOTES_REQUEST:
    case FETCH_CATEGORIES_REQUEST:
      return { ...state, loading: true };

    case CREATE_NOTE_CATEGORY_SUCCESS:
      return { ...state, loading: false, categories: [...state.categories, action.payload] };

    case CREATE_NOTE_SUCCESS:
      return { ...state, loading: false, notes: [...state.notes, action.payload] };

    case FETCH_NOTES_SUCCESS:
      return { ...state, loading: false, notes: action.payload };

    case FETCH_CATEGORIES_SUCCESS:
      return { ...state, loading: false, categories: action.payload };

    case CREATE_NOTE_CATEGORY_FAILURE:
    case CREATE_NOTE_FAILURE:
    case FETCH_NOTES_FAILURE:
    case FETCH_CATEGORIES_FAILURE:
      return { ...state, loading: false, error: action.payload };

    default:
      return state;
  }
};

export default notesReducer;
