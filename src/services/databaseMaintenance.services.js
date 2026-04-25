import axios from "axios";
import { API_URL } from "../constant/config";
import { resolveStoreSettingsBranchClient } from "../utils/storeSettingsBranch";

const authHeaders = () => ({
  Authorization: localStorage.getItem("access_token"),
});

export const downloadDatabaseBackup = async () => {
  const branchName = resolveStoreSettingsBranchClient();
  const response = await axios.post(
    `${API_URL}/database-maintenance/backup`,
    {},
    {
      headers: authHeaders(),
      params: { branchName },
    }
  );
  return response.data;
};

/**
 * @param {string} backupToken
 * @param {Record<string, boolean>} scopes - see Settings purge modal keys
 */
export const purgeDatabaseAfterBackup = async (backupToken, scopes) => {
  const response = await axios.post(
    `${API_URL}/database-maintenance/purge`,
    { backupToken, scopes },
    { headers: authHeaders() }
  );
  return response.data;
};

export const restoreDatabaseFromBackup = async (file) => {
  const formData = new FormData();
  formData.append("backup", file);
  const response = await axios.post(
    `${API_URL}/database-maintenance/restore`,
    formData,
    {
      headers: authHeaders(),
    }
  );
  return response.data;
};
