import axios from "axios";
import { API_URL } from "../constant/config";

const createProduct = async (data) => {
  const response = await axios.post(`${API_URL}/product`, data, {
    headers: { Authorization: localStorage.getItem("access_token") },
  });
  return response.data;
};

const getProduct = async () => {
  const response = await axios.get(`${API_URL}/product`, {
    headers: { Authorization: localStorage.getItem("access_token") },
  });
  return response.data;
};

// Update product API
const updateProduct = async (data, id) => {
  const response = await axios.patch(`${API_URL}/product/${id}`, data, {
    headers: { Authorization: localStorage.getItem("access_token") },
  });
  return response.data;
};

// Update stock quantity API
const updateStockQuantity = async (data, id) => {
  const response = await axios.patch(`${API_URL}/product/stock/${id}`, data, {
    headers: { Authorization: localStorage.getItem("access_token") },
  });
  return response.data;
};

// Delete product API
const deleteProduct = async (id) => {
  const response = await axios.delete(`${API_URL}/product/${id}`, {
    headers: { Authorization: localStorage.getItem("access_token") },
  });
  return response.data;
};

const getStock = async () => {
  const response = await axios.get(`${API_URL}/stock`, {
    headers: { Authorization: localStorage.getItem("access_token") },
  });
  return response.data;
};

const productService = {
  createProduct,
  getProduct,
  deleteProduct,
  updateProduct,
  updateStockQuantity,
  getStock,
};

export default productService;
