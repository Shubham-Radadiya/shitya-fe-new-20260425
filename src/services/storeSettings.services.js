import axios from "axios";
import { API_URL } from "../constant/config";
import { resolveStoreSettingsBranchClient } from "../utils/storeSettingsBranch";

function resolveBranchParam(branchOverride) {
  const b = resolveStoreSettingsBranchClient(branchOverride);
  return `?branchName=${encodeURIComponent(b)}`;
}

const getStoreSettings = async (branchOverride) => {
  const response = await axios.get(
    `${API_URL}/store-settings${resolveBranchParam(branchOverride)}`,
    {
      headers: { Authorization: localStorage.getItem("access_token") },
    }
  );
  if (response.data) {
    return { data: response.data, status: response.status };
  }
};

const updateStoreSettings = async (data, branchOverride) => {
  const response = await axios.patch(
    `${API_URL}/store-settings${resolveBranchParam(branchOverride)}`,
    data,
    {
      headers: { Authorization: localStorage.getItem("access_token") },
    }
  );
  if (response.data) {
    return { data: response.data, status: response.status };
  }
};

const storeSettingsService = {
  getStoreSettings,
  updateStoreSettings,
};

export default storeSettingsService;
