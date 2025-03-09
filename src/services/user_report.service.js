import axios from "axios";
import { API_URL } from "../constant/config";

const getdailyreports = async (data) => {
  const response = await axios.post(`${API_URL}/report/daily`, data, {
    headers: { Authorization: localStorage.getItem("access_token") },
  });
  return response.data;
};
const getmonthlyreports = async (data) => {
  const response = await axios.post(`${API_URL}/report/monthly`, data, {
    headers: { Authorization: localStorage.getItem("access_token") },
  });
  return response.data;
};
const getyearlyreports = async (data) => {
  const response = await axios.post(`${API_URL}/report/yearly`, data, {
    headers: { Authorization: localStorage.getItem("access_token") },
  });
  return response.data;
};

export default {
  getdailyreports,
  getmonthlyreports,
  getyearlyreports,
};
