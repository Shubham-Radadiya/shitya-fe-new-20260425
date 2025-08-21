import axios from "axios";
import { API_URL } from "../constant/config";

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

export const fetchInvoiceNumber = async (isReturned) => {
  const response = await apiRequest(
    "get",
    `/invoice/getInvoiceNo?isReturned=${isReturned}`
  );
  return response.invoiceNumber;
};


export const createInvoice = (payload) =>
  apiRequest("post", "/invoice", payload);
export const createInvoiceReturn = (payload) =>
  apiRequest("post", "/invoice/return", payload);
export const getInvoices = (isReturned = false) =>
  apiRequest("get", `/invoice?isReturned=${isReturned}`);
export const editInvoice = (id, payload) =>
  apiRequest("patch", `/invoice/${id}`, payload);
export const createReturnInvoice = (payload, id) =>
  apiRequest("patch", `/invoice/return/${id}`, payload);
export const getBhet = async () => {
  const response = await apiRequest("get", `/bhet`);
  console.log("Bhet API Response:", response);
  return response;
};
export const createReturnBhet = (payload)=>{
  apiRequest("post","/bhet/return",payload)
}
export const createBhet = (payload) => apiRequest("post", "/bhet", payload);

export default {
  createInvoice,
  createInvoiceReturn,
  getInvoices,
  editInvoice,
  createReturnInvoice,
  createBhet,
  getBhet,
  fetchInvoiceNumber,
  createReturnBhet
};
