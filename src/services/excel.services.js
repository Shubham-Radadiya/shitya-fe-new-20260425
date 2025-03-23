import axios from "axios";
import { API_URL } from "../constant/config";

const userExcel = async (data) => {
    const response = await axios.post(API_URL + "/excel/user", data, {
      headers: { Authorization: localStorage.getItem("access_token") },
    });
    if (response.data) {
      return { data: response.data, status: response.status };
    }
  };
const adminExcel = async (data) => {
    const response = await axios.post(API_URL + "/excel/admin", data, {
      headers: { Authorization: localStorage.getItem("access_token") },
    });
    if (response.data) {
      return { data: response.data, status: response.status };
    }
  };

  
const excelService = { userExcel, adminExcel };

export default excelService;