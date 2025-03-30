import { API_URL } from "../constant/config";
import axios from "axios";

const apiRequest = async (method, url, payload = null) => {
  try {
    const response = await axios({
      method,
      url: `${API_URL}${url}`,
      data: payload,
      headers: { Authorization: localStorage.getItem("access_token") },
    });
    return response.data;
  } catch (error) {
    console.error(`Error in API call: ${method.toUpperCase()} ${url}`, error);
    throw error;
  }
};

export const createCategoryApi = (category) => apiRequest("post", "/todo-category", category);
export const createNoteApi = (note) => apiRequest("post", "/todo", note);
export const fetchNotesApi = () => apiRequest("get", "/todo");
export const fetchCategoriesApi = () => apiRequest("get", "/todo-category"); 


// eslint-disable-next-line import/no-anonymous-default-export
export default {
  createCategoryApi,
  createNoteApi,
  fetchNotesApi,
  fetchCategoriesApi
};
