import axios from "axios";
import { API_URL } from "../constant/config";

const STALL_CUSTOM_STORAGE_KEY = "sahitya-custom-stalls";

const PRESET_CODES = [
  "KUD",
  "VDR",
  "VDTL",
  "AHM",
  "MBS",
  "BBS",
  "GVS",
];

function readCustomStallCodesFromStorage() {
  try {
    const raw = localStorage.getItem(STALL_CUSTOM_STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return [
      ...new Set(
        arr
          .filter((x) => typeof x === "string")
          .map((x) => x.trim().toUpperCase())
          .filter(Boolean)
      ),
    ];
  } catch {
    return [];
  }
}

/**
 * Branch dropdown options: API (presets + DB) merged with Settings custom stalls (this browser).
 */
export async function loadBranchOptionsForForms() {
  let fromApi = [];
  try {
    const { data } = await axios.get(`${API_URL}/auth/branch-options`);
    if (Array.isArray(data?.branches)) {
      fromApi = data.branches.map((x) => String(x).trim().toUpperCase()).filter(Boolean);
    }
  } catch {
    /* offline / CORS — fall back to presets + local */
  }
  const custom = readCustomStallCodesFromStorage();
  return [...new Set([...fromApi, ...custom, ...PRESET_CODES])].sort();
}

export { PRESET_CODES as BRANCH_PRESET_CODES };
