import axios from "axios";
import { API_URL } from "../constant/config";

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

// Logout API
const userLogout = async () => {
  const response = await axios.get(
    API_URL + "/auth/logout",
    { headers: { Authorization: localStorage.getItem("access_token") } }
  );
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
    headers: { Authorization: localStorage.getItem("access_token") }
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
}

const authServices = {
  userLogin,
  createUser,
  getUser,
  userLogout,
  getUserPassword,
  updateUser
};

export default authServices;
