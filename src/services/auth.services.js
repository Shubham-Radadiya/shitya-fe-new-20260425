import axios from "axios";
import { API_URL } from "../constant/config";

const getBranchOptions = async () => {
  const response = await axios.get(API_URL + "/auth/branch-options");
  if (response.data) {
    return { data: response.data, status: response.status };
  }
};

// Login API
const userLogin = async (data) => {
  const response = await axios.post(API_URL + "/auth/login", data);
  if (response.data) {
    return {
      data: response.data,
      status: response.status,
      headers: response.headers,
    };
  }
};

// Create User API
const createUser = async (data) => {
  const response = await axios.post(API_URL + "/auth/register", data, {
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

// Current user (role, canAccessSettings, etc.)
const getSession = async () => {
  const response = await axios.get(API_URL + "/auth/session", {
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

// Logout API
const userLogout = async () => {
  const response = await axios.get(API_URL + "/auth/logout", {
    headers: { Authorization: localStorage.getItem("access_token") },
  });
  if (response.data) {
    return { data: response.data, status: response.status };
  }
};

// Get user API
const getUser = async () => {
  const response = await axios.get(API_URL + "/user/get-user-list", {
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

const updateUser = async (data, id) => {
  const response = await axios.patch(API_URL + "/user/" + id, data, {
    headers: { Authorization: localStorage.getItem("access_token") },
  });
  if (response.data) {
    return { data: response.data, status: response.status };
  }
};

const getUserPassword = async (id) => {
  const response = await axios.get(`${API_URL}/user/get-user-password/${id}`, {
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

const authServices = {
  getBranchOptions,
  userLogin,
  createUser,
  getUser,
  getSession,
  userLogout,
  getUserPassword,
  updateUser,
};

export default authServices;
