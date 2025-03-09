import axios from "axios";
import { API_URL } from "../constant/config";

// Create category API
const createCategory = async (data) => {
  const response = await axios.post(API_URL + "/category", data, {
    headers: { Authorization: localStorage.getItem("access_token") },
  });
  if (response.data) {
    return {
      data: response.data,
      status: response.status,
      headers: response.headers,
    };
  }
};

// Get category API
const getCategory = async (data) => {
  const response = await axios.get(API_URL + "/category", {
    headers: { Authorization: localStorage.getItem("access_token") },
  });
  if (response.data) {
    return {
      data: response.data,
      status: response.status,
      headers: response.headers,
    };
  }
};

// Update category API
const updateCategory = async (data, id) => {
  const response = await axios.patch(API_URL + "/category/" + id, data, {
    headers: { Authorization: localStorage.getItem("access_token") },
  });
  if (response.data) {
    return { data: response.data, status: response.status };
  }
};

// Delete category API
const deleteCategory = async (id) => {
  const response = await axios.delete(API_URL + "/category/" + id, {
    headers: { Authorization: localStorage.getItem("access_token") },
  });
  if (response.data) {
    return { data: response.data, status: response.status };
  }
};

const categoryService = { createCategory, getCategory, deleteCategory, updateCategory };

export default categoryService;
