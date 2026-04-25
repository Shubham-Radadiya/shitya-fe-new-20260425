import axios from "axios";
import { toast } from "react-toastify";
import { API_URL } from "../constant/config";
import { resolveStoreSettingsBranchClient } from "./storeSettingsBranch";

/**
 * Trigger browser download (usually saves to the user's Downloads folder).
 */
export function downloadExcelBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Upload .xlsx to API; server writes under **Excel export path** from Settings
 * (e.g. `Downloads/Sahitya/Daily Sales` on the **machine running the API**).
 */
/**
 * Upload file to API; server writes under **report export path** from Settings
 * (`salesPrintCopyPath1`, e.g. `Downloads/Sahitya/Export` on the API machine).
 */
export async function uploadReportExportToServer(blob, fileName) {
  const token = localStorage.getItem("access_token");
  if (!blob || !(blob instanceof Blob)) {
    return { ok: false };
  }
  if (!token) {
    return { ok: false };
  }
  const form = new FormData();
  form.append("file", blob, fileName || "export.bin");
  try {
    await axios.post(`${API_URL}/store-settings/save-report-export`, form, {
      headers: { Authorization: token },
      params: { branchName: resolveStoreSettingsBranchClient() },
      maxContentLength: 30 * 1024 * 1024,
      maxBodyLength: 30 * 1024 * 1024,
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e };
  }
}

/**
 * Sends a copy of the file to Settings "Backup mail id" via API (no disk write on server).
 * Used when the user only downloads or saves locally — server-side save paths already email.
 */
export async function mailExportCopyToBackupEmail(blob, fileName) {
  const token = localStorage.getItem("access_token");
  if (!blob || !(blob instanceof Blob)) {
    return { skipped: true };
  }
  if (!token) {
    return { skipped: true };
  }
  const form = new FormData();
  form.append("file", blob, fileName || "export.bin");
  try {
    const { data } = await axios.post(
      `${API_URL}/store-settings/mail-export-copy`,
      form,
      {
        headers: { Authorization: token },
        params: { branchName: resolveStoreSettingsBranchClient() },
        maxContentLength: 30 * 1024 * 1024,
        maxBodyLength: 30 * 1024 * 1024,
      }
    );
    return {
      exportEmailSent: data?.exportEmailSent,
      exportEmailMessage: data?.exportEmailMessage,
    };
  } catch (e) {
    console.warn("mailExportCopyToBackupEmail:", e);
    return { exportEmailSent: false, error: e };
  }
}

export async function uploadExcelToServerExportFolder(blob, fileName) {
  const token = localStorage.getItem("access_token");
  if (!blob || !(blob instanceof Blob)) {
    return { ok: false };
  }
  if (!token) {
    return { ok: false };
  }
  const form = new FormData();
  form.append("file", blob, fileName || "export.xlsx");
  try {
    await axios.post(`${API_URL}/store-settings/save-sales-export`, form, {
      headers: { Authorization: token },
      params: { branchName: resolveStoreSettingsBranchClient() },
      maxContentLength: 30 * 1024 * 1024,
      maxBodyLength: 30 * 1024 * 1024,
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e };
  }
}

/**
 * @param {FileSystemDirectoryHandle|null} directoryHandle
 * @param {string} fileName
 * @param {Blob} blob
 */
export async function saveExcelBlob(directoryHandle, fileName, blob) {
  return saveExcelWithFallback(blob, fileName, directoryHandle);
}

/**
 * Save Excel: (1) server export folder from admin settings, (2) browser-picked folder handle, (3) download.
 *
 * @param {Blob} blob
 * @param {string} fileName
 * @param {FileSystemDirectoryHandle|null} directoryHandle - from Settings "Select Path" (Chrome/Edge)
 * @param {{ tryServer?: boolean }} [options] - set tryServer: false to skip API upload
 */
export async function saveExcelWithFallback(
  blob,
  fileName,
  directoryHandle,
  options = {}
) {
  const tryServer = options.tryServer !== false;

  if (tryServer) {
    const { ok } = await uploadExcelToServerExportFolder(blob, fileName);
    if (ok) {
      return {
        savedToFolder: false,
        downloaded: false,
        savedToServer: true,
      };
    }
  }

  if (
    directoryHandle &&
    typeof directoryHandle.getFileHandle === "function"
  ) {
    try {
      const fileHandle = await directoryHandle.getFileHandle(fileName, {
        create: true,
      });
      const writable = await fileHandle.createWritable();
      await writable.write(await blob.arrayBuffer());
      await writable.close();
      void mailExportCopyToBackupEmail(blob, fileName);
      return {
        savedToFolder: true,
        downloaded: false,
        savedToServer: false,
      };
    } catch (e) {
      console.warn("excelExport: save to picked folder failed:", e);
    }
  }

  try {
    downloadExcelBlob(blob, fileName);
    void mailExportCopyToBackupEmail(blob, fileName);
    return {
      savedToFolder: false,
      downloaded: true,
      savedToServer: false,
    };
  } catch (e) {
    console.error("saveExcelWithFallback:", e);
    return {
      savedToFolder: false,
      downloaded: false,
      savedToServer: false,
      error: true,
    };
  }
}

/**
 * Reports / PDFs / other exports: (1) server report folder from settings, (2) browser-picked folder, (3) download.
 *
 * @param {Blob} blob
 * @param {string} fileName
 * @param {FileSystemDirectoryHandle|null} reportDirectoryHandle - from Settings "Report export" folder button
 * @param {{ tryServer?: boolean }} [options]
 */
export async function saveReportExportWithFallback(
  blob,
  fileName,
  reportDirectoryHandle,
  options = {}
) {
  const tryServer = options.tryServer !== false;

  if (tryServer) {
    const { ok } = await uploadReportExportToServer(blob, fileName);
    if (ok) {
      return {
        savedToFolder: false,
        downloaded: false,
        savedToServer: true,
      };
    }
  }

  if (
    reportDirectoryHandle &&
    typeof reportDirectoryHandle.getFileHandle === "function"
  ) {
    try {
      const fileHandle = await reportDirectoryHandle.getFileHandle(fileName, {
        create: true,
      });
      const writable = await fileHandle.createWritable();
      await writable.write(await blob.arrayBuffer());
      await writable.close();
      void mailExportCopyToBackupEmail(blob, fileName);
      return {
        savedToFolder: true,
        downloaded: false,
        savedToServer: false,
      };
    } catch (e) {
      console.warn("excelExport: report save to picked folder failed:", e);
    }
  }

  try {
    downloadExcelBlob(blob, fileName);
    void mailExportCopyToBackupEmail(blob, fileName);
    return {
      savedToFolder: false,
      downloaded: true,
      savedToServer: false,
    };
  } catch (e) {
    console.error("saveReportExportWithFallback:", e);
    return {
      savedToFolder: false,
      downloaded: false,
      savedToServer: false,
      error: true,
    };
  }
}

function notifyReportExportSaveResult(result, fileName) {
  const { downloaded, error, savedToServer, savedToFolder } = result;
  if (savedToServer) {
    toast.success(
      `Saved to report export folder (${fileName}). Path is on the computer running the API.`
    );
  } else if (savedToFolder) {
    toast.success(`Saved to selected folder: ${fileName}`);
  } else if (downloaded) {
    toast.success(`Downloaded: ${fileName}`);
  } else if (error) {
    toast.error("Could not save export.");
  }
}

/**
 * Wraps `saveReportExportWithFallback` and shows the usual success/error toasts.
 * @param {{ silent?: boolean }} [options] - `silent: true` skips toasts (e.g. silent modal export).
 */
export async function saveReportExcelWithToast(
  blob,
  fileName,
  reportExportDirectoryHandle,
  options = {}
) {
  const { silent = false, ...fallbackOptions } = options;
  const result = await saveReportExportWithFallback(
    blob,
    fileName,
    reportExportDirectoryHandle,
    fallbackOptions
  );
  if (!silent) notifyReportExportSaveResult(result, fileName);
  return result;
}
