import axios from "axios";
import { API_URL } from "../constant/config";

/** Same endpoints as user sales reports; managers get full store (see backend allUsers / merge). */
const getTodayProduct = async (data) => {
  const response = await axios.post(`${API_URL}/report/daily`, data, {
    headers: { Authorization: localStorage.getItem("access_token") },
  });
  return response.data;
};

const getMonthlyProduct = async (data) => {
  const response = await axios.post(`${API_URL}/report/monthly`, data, {
    headers: { Authorization: localStorage.getItem("access_token") },
  });
  return response.data;
};

const getYearlyProduct = async (data) => {
  const response = await axios.post(`${API_URL}/report/yearly`, data, {
    headers: { Authorization: localStorage.getItem("access_token") },
  });
  return response.data;
};

export default {
  getTodayProduct,
  getMonthlyProduct,
  getYearlyProduct
};