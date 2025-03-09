import axios from "axios";
import { API_URL } from "../constant/config";

// create subcategory api
const createSubCategory = async (data) => {
  const response = await axios.post(API_URL + "/sub-category", data, {
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

const SubCategoryrequest = async (data) => {
  const response = await axios.get(API_URL + "/sub-category", {
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
const updateSubCategory = async (data, id) => {
  const response = await axios.patch(API_URL + "/sub-category/" + id, data, {
    headers: { Authorization: localStorage.getItem("access_token") },
  });
  if (response.data) {
    return { data: response.data, status: response.status };
  }
};

// delete category api
const deleteSubCategory = async (id) => {
  const response = await axios.delete(API_URL + "/sub-category/" + id, {
    headers: { Authorization: localStorage.getItem("access_token") }});
  if (response.data) {
      return { data: response.data, status: response.status };
  }
};

const subCategoryService = { 
  createSubCategory, 
  SubCategoryrequest, 
  deleteSubCategory, 
  updateSubCategory 
};

export default subCategoryService;
