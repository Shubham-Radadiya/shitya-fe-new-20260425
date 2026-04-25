import axios from "axios";
import { API_URL } from "../constant/config";

function authHeaders() {
  const token = localStorage.getItem("access_token");
  return token ? { Authorization: token } : {};
}

/** Starts background pull-then-push sync on karelibaug-store (manager session). */
export const postSyncTrigger = async () => {
  const response = await axios.post(
    `${API_URL}/sync/trigger`,
    {},
    { headers: authHeaders(), timeout: 60000 }
  );
  return { data: response.data, status: response.status };
};

/** Current sync cursors / errors on the store server. */
export const getSyncStatus = async () => {
  const response = await axios.get(`${API_URL}/sync/status`, {
    headers: authHeaders(),
    timeout: 30000,
  });
  return { data: response.data, status: response.status };
};

const syncServices = {
  postSyncTrigger,
  getSyncStatus,
};

export default syncServices;
