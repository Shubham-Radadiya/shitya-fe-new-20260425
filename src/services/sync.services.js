import axios from "axios";
import { API_URL, SYNC_LIVE_API_URL, SYNC_LOCAL_API_URL } from "../constant/config";

function authHeaders() {
  const token = localStorage.getItem("access_token");
  return token ? { Authorization: token } : {};
}

function resolveSyncBaseUrl() {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return SYNC_LOCAL_API_URL || API_URL;
  }
  return SYNC_LIVE_API_URL || API_URL;
}

/** Starts background pull-then-push sync on karelibaug-store (manager session). */
export const postSyncTrigger = async () => {
  const baseUrl = resolveSyncBaseUrl();
  const response = await axios.post(
    `${baseUrl}/sync/trigger`,
    {},
    { headers: authHeaders(), timeout: 60000 }
  );
  return { data: response.data, status: response.status };
};

/** Current sync cursors / errors on the store server. */
export const getSyncStatus = async () => {
  const baseUrl = resolveSyncBaseUrl();
  const response = await axios.get(`${baseUrl}/sync/status`, {
    headers: authHeaders(),
    timeout: 30000,
  });
  return { data: response.data, status: response.status };
};

/** Rich sync report for admin UI: collections, pending users/branches, last sync markers. */
export const getSyncReport = async () => {
  const baseUrl = resolveSyncBaseUrl();
  const response = await axios.get(`${baseUrl}/sync/report`, {
    headers: authHeaders(),
    timeout: 30000,
  });
  return { data: response.data, status: response.status };
};

const syncServices = {
  postSyncTrigger,
  getSyncStatus,
  getSyncReport,
};

export default syncServices;
