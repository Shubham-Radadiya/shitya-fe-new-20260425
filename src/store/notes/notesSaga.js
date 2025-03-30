import { call, put, takeLatest } from "redux-saga/effects";
import {
  CREATE_NOTE_CATEGORY_REQUEST,
  CREATE_NOTE_CATEGORY_SUCCESS,
  CREATE_NOTE_CATEGORY_FAILURE,
  CREATE_NOTE_REQUEST,
  CREATE_NOTE_SUCCESS,
  CREATE_NOTE_FAILURE,
  FETCH_NOTES_REQUEST,
  FETCH_NOTES_SUCCESS,
  FETCH_NOTES_FAILURE,
  FETCH_CATEGORIES_REQUEST,
  FETCH_CATEGORIES_SUCCESS,
  FETCH_CATEGORIES_FAILURE,
} from "./notesAction";
import { createCategoryApi, createNoteApi, fetchNotesApi, fetchCategoriesApi } from "../../services/notes.services";

function* createCategoryNoteSaga(action) {
  try {
    const response = yield call(createCategoryApi, action.payload);
    yield put({ type: CREATE_NOTE_CATEGORY_SUCCESS, payload: response });
  } catch (error) {
    yield put({ type: CREATE_NOTE_CATEGORY_FAILURE, payload: error.message });
  }
}

function* createNoteSaga(action) {
  try {
    const response = yield call(createNoteApi, action.payload);
    yield put({ type: CREATE_NOTE_SUCCESS, payload: response });
  } catch (error) {
    yield put({ type: CREATE_NOTE_FAILURE, payload: error.message });
  }
}

function* fetchNotesSaga() {
  try {
    const response = yield call(fetchNotesApi);
    yield put({ type: FETCH_NOTES_SUCCESS, payload: response });
  } catch (error) {
    yield put({ type: FETCH_NOTES_FAILURE, payload: error.message });
  }
}

function* fetchCategoriesSaga() {
  try {
    const response = yield call(fetchCategoriesApi);
    yield put({ type: FETCH_CATEGORIES_SUCCESS, payload: response });
  } catch (error) {
    yield put({ type: FETCH_CATEGORIES_FAILURE, payload: error.message });
  }
}

export default function* notesSaga() {
  yield takeLatest(CREATE_NOTE_CATEGORY_REQUEST, createCategoryNoteSaga);
  yield takeLatest(CREATE_NOTE_REQUEST, createNoteSaga);
  yield takeLatest(FETCH_NOTES_REQUEST, fetchNotesSaga);
  yield takeLatest(FETCH_CATEGORIES_REQUEST, fetchCategoriesSaga);
}
