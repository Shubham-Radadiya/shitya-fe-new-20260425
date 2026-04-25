// bill.services.js
import axios from "axios";
import { API_URL } from "../constant/config";

export const createBill = async (payload) => {
  const response = await axios.post(`${API_URL}/bill`, payload, {
    headers: { Authorization: localStorage.getItem("access_token") },
  });
  return response.data;
};

export const getBillNo = async () => {
  const response = await axios.get(`${API_URL}/bill/getBillNo`, {
    headers: { Authorization: localStorage.getItem("access_token") },
  });
  return {
    data: response.data,
    status: response.status,
    headers: response.headers,
  };
};

export const getBhetBillNo = async () => {
  const response = await axios.get(`${API_URL}/bhet/getBhetNo`, {
    headers: { Authorization: localStorage.getItem("access_token") },
  });
  return {
    data: response.data,
    status: response.status,
    headers: response.headers,
  };
};

export const getBhetReturnBillNo = async () => {
  const response = await axios.get(`${API_URL}/bhet/return-bhet-no`, {
    headers: { Authorization: localStorage.getItem("access_token") },
  });
  return {
    data: response.data,
    status: response.status,
    headers: response.headers,
  };
};

export const getReturnBillNo = async () => {
  const response = await axios.get(`${API_URL}/bill/return-bill-no`, {
    headers: { Authorization: localStorage.getItem("access_token") },
  });
  return {
    data: response.data,
    status: response.status,
    headers: response.headers,
  };
};

export const getBillDetails = async (payload) => {
  const response = await axios.post(`${API_URL}/bill/getBillDetails`, payload, {
    headers: { Authorization: localStorage.getItem("access_token") },
  });
  return response.data;
};
/** Server route is `POST /bill/re-print` (hyphenated), not `/bill/reprint`. */
export const reprintBill = async (payload) => {
  const response = await axios.post(`${API_URL}/bill/re-print`, payload, {
    headers: { Authorization: localStorage.getItem("access_token") },
  });
  return response.data;
};

export const returnBill = async (payload) => {
  const response = await axios.post(`${API_URL}/bill/return`, payload, {
    headers: { Authorization: localStorage.getItem("access_token") },
  });
  return response.data;
};
