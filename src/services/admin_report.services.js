import axios from "axios";
import { API_URL } from "../constant/config";

const getTodayProduct = async (data) => {
  const response = await axios.post(`${API_URL}/report/daily/admin`, data, {
    headers: { Authorization: localStorage.getItem("access_token") },
  });
  console.log(data, "data_reducer_daily");
  return response.data;
};

const getMonthlyProduct = async (data) => {
  const response = await axios.post(`${API_URL}/report/monthly/admin`, data, {
    headers: { Authorization: localStorage.getItem("access_token") },
  });
  return response.data;
};

const getYearlyProduct = async (data) => {
  const response = await axios.post(`${API_URL}/report/yearly/admin`, data, {
    headers: { Authorization: localStorage.getItem("access_token") },
  });
  return response.data;
};

export default {
  getTodayProduct,
  getMonthlyProduct,
  getYearlyProduct
};