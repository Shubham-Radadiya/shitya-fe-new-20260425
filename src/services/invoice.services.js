import axios from "axios";
import { API_URL } from "../constant/config";

const createInvoice = async (payload) => {
  const response = await axios.post(`${API_URL}/invoice`, payload, {
    headers: { Authorization: localStorage.getItem("access_token") },
  });
  return response.data;
};

const invoiceData = async () => {
  const response = await axios.get(`${API_URL}/invoice`, {
    headers: { Authorization: localStorage.getItem("access_token") },
  });
  return response.data;
};

export default {
  createInvoice,
  invoiceData,
};
