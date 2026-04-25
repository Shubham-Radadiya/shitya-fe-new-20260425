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
export const getInvoices = (isReturned = false, range, storeWide) => {
  const params = new URLSearchParams({
    isReturned: String(isReturned),
  });
  if (range?.startDate && range?.endDate) {
    params.set("startDate", range.startDate);
    params.set("endDate", range.endDate);
  }
  if (storeWide) params.set("storeWide", "true");
  return apiRequest("get", `/invoice?${params.toString()}`);
};

/** FY merged per user: `products` + `categories` (daily-report shape) for entry-wise purchase UI */
export const getInvoicesEntrySummary = (isReturned = false, range, storeWide) => {
  const params = new URLSearchParams({
    isReturned: String(isReturned),
    entrySummary: "true",
  });
  if (range?.startDate && range?.endDate) {
    params.set("startDate", range.startDate);
    params.set("endDate", range.endDate);
  }
  if (storeWide) params.set("storeWide", "true");
  return apiRequest("get", `/invoice?${params.toString()}`);
};

/** Same as getInvoicesEntrySummary but for bhet bills */
export const getBhetEntrySummary = (isReturned = false) =>
  apiRequest(
    "get",
    `/bhet?isReturned=${encodeURIComponent(String(isReturned))}&entrySummary=true`
  );
export const editInvoice = (id, payload) =>
  apiRequest("patch", `/invoice/${id}`, payload);
export const createReturnInvoice = (payload, id) =>
  apiRequest("patch", `/invoice/return/${id}`, payload);
export const updateReturnBhet = (payload, id) =>
  apiRequest("patch", `/bhet/return/${id}`, payload);
export const getBhet = async (isReturned = false) => {
  const response = await apiRequest("get", `/bhet?isReturned=${isReturned}`);
  console.log("Bhet API Response:", response);
  return response;
};
export const createReturnBhet = (payload)=>{
  apiRequest("post","/bhet/return",payload)
}
export const createBhet = (payload) => apiRequest("post", "/bhet", payload);

/** Admin: multipart Excel → one purchase bill. Columns: productId, Qty, Rate, Amount */
export const importPurchaseBillFromExcel = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await axios.post(
    `${API_URL}/invoice/import-purchase-excel`,
    formData,
    {
      headers: {
        Authorization: localStorage.getItem("access_token"),
      },
    }
  );
  return response.data;
};

/** Admin: multipart Excel → one sales bill (deducts stock). Same columns as purchase import. */
export const importSalesBillFromExcel = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await axios.post(
    `${API_URL}/bill/import-sales-excel`,
    formData,
    {
      headers: {
        Authorization: localStorage.getItem("access_token"),
      },
    }
  );
  return response.data;
};

/** Admin: multipart Excel → one bhet bill (deducts stock). Same columns as purchase import. */
export const importBhetBillFromExcel = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await axios.post(
    `${API_URL}/bhet/import-bhet-excel`,
    formData,
    {
      headers: {
        Authorization: localStorage.getItem("access_token"),
      },
    }
  );
  return response.data;
};

/** Admin: multipart Excel → one purchase return invoice. Same columns as purchase import. */
export const importPurchaseReturnFromExcel = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await axios.post(
    `${API_URL}/invoice/import-purchase-return-excel`,
    formData,
    {
      headers: {
        Authorization: localStorage.getItem("access_token"),
      },
    }
  );
  return response.data;
};

/** Admin: multipart Excel → one sales return (restores stock). Same columns as purchase import. */
export const importSalesReturnFromExcel = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await axios.post(
    `${API_URL}/bill/import-sales-return-excel`,
    formData,
    {
      headers: {
        Authorization: localStorage.getItem("access_token"),
      },
    }
  );
  return response.data;
};

/** Admin: multipart Excel → one bhet return (restores stock). Same columns as purchase import. */
export const importBhetReturnFromExcel = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await axios.post(
    `${API_URL}/bhet/import-bhet-return-excel`,
    formData,
    {
      headers: {
        Authorization: localStorage.getItem("access_token"),
      },
    }
  );
  return response.data;
};

export default {
  createInvoice,
  createInvoiceReturn,
  getInvoices,
  getInvoicesEntrySummary,
  getBhetEntrySummary,
  editInvoice,
  createReturnInvoice,
  createBhet,
  getBhet,
  fetchInvoiceNumber,
  createReturnBhet,
  updateReturnBhet,
  importPurchaseBillFromExcel,
  importSalesBillFromExcel,
  importBhetBillFromExcel,
  importPurchaseReturnFromExcel,
  importSalesReturnFromExcel,
  importBhetReturnFromExcel,
};
