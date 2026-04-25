import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import storeSettingsService from "../services/storeSettings.services";
import { resolveStoreSettingsBranchClient } from "../utils/storeSettingsBranch";

/** Web server stall config (PATCH /store-settings). Scoped by branch (`branchName` query). */
const DEFAULT_EXCEL_PATH = "Downloads/Sahitya/Daily Sales";
/** Reports, PDFs, and other files (API + Settings `salesPrintCopyPath1`). */
const DEFAULT_REPORT_EXPORT_PATH = "Downloads/Sahitya/Export";
/** Must match `karelibaug-store` `defaultEntryPin.ts` — used until settings load and if API omits the field. */
const DEFAULT_ENTRY_PIN = "2898";

const StoreSettingsContext = createContext(null);

function readDefaultSettingsBranch() {
  return resolveStoreSettingsBranchClient();
}

export const useStoreSettings = () => {
  const context = useContext(StoreSettingsContext);
  return (
    context || {
      stallName: "",
      excelExportPath: "Downloads/Sahitya/Daily Sales",
      salesPrintCopyPath1: DEFAULT_REPORT_EXPORT_PATH,
      backupEmail: "",
      entryPin: DEFAULT_ENTRY_PIN,
      allowNegativeStock: false,
      openingSilakMode: "custom",
      openingSilakFixedValue: 10000,
      selectedFolderName: "",
      directoryHandle: null,
      reportExportDirectoryHandle: null,
      settingsLoading: false,
      settingsBranchKey: "KUD",
      setSettingsBranchKey: () => {},
      fetchSettings: () => {},
      saveSettings: async () => false,
      saveAllowNegativeStock: async () => false,
      selectFolder: async () => ({ success: false }),
      selectReportExportFolder: async () => ({ success: false }),
      DEFAULT_EXCEL_PATH: "Downloads/Sahitya/Daily Sales",
      DEFAULT_REPORT_EXPORT_PATH,
    }
  );
};

export const StoreSettingsProvider = ({ children }) => {
  const [settingsBranchKey, setSettingsBranchKeyState] = useState(() =>
    readDefaultSettingsBranch()
  );

  const setSettingsBranchKey = useCallback((code) => {
    const next =
      String(code || "KUD")
        .trim()
        .toUpperCase() || "KUD";
    setSettingsBranchKeyState((prev) => (prev === next ? prev : next));
    try {
      const role = localStorage.getItem("role");
      if (role === "SUPER ADMIN") {
        localStorage.setItem("sahitya_settings_branch", next);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const [stallName, setStallName] = useState("");
  const [excelExportPath, setExcelExportPath] = useState(DEFAULT_EXCEL_PATH);
  const [salesPrintCopyPath1, setSalesPrintCopyPath1] = useState("");
  const [backupEmail, setBackupEmail] = useState("");
  const [entryPin, setEntryPin] = useState(DEFAULT_ENTRY_PIN);
  const [allowNegativeStock, setAllowNegativeStock] = useState(false);
  const [openingSilakMode, setOpeningSilakMode] = useState("custom");
  const [openingSilakFixedValue, setOpeningSilakFixedValue] = useState(10000);
  const [selectedFolderName, setSelectedFolderName] = useState("");
  const [directoryHandle, setDirectoryHandle] = useState(null);
  const [reportExportDirectoryHandle, setReportExportDirectoryHandle] =
    useState(null);
  const [settingsLoading, setSettingsLoading] = useState(false);

  const fetchSettings = useCallback(async () => {
    setSettingsLoading(true);
    try {
      const { data } = await storeSettingsService.getStoreSettings(
        settingsBranchKey
      );
      if (data) {
        setStallName(data.stallName || "");
        setExcelExportPath(data.excelExportPath || DEFAULT_EXCEL_PATH);
        setSalesPrintCopyPath1(
          data.salesPrintCopyPath1 || DEFAULT_REPORT_EXPORT_PATH
        );
        setBackupEmail(data.backupEmail || "");
        setEntryPin(data.entryPin ?? DEFAULT_ENTRY_PIN);
        setAllowNegativeStock(data.allowNegativeStock === true);
        setOpeningSilakMode(
          data.openingSilakMode === "fixed" ? "fixed" : "custom"
        );
        const fv = Number(data.openingSilakFixedValue);
        setOpeningSilakFixedValue(Number.isFinite(fv) ? fv : 10000);
        setSelectedFolderName(data.excelExportPath || "");
      }
    } catch (error) {
      console.error("Failed to load store settings:", error);
    } finally {
      setSettingsLoading(false);
    }
  }, [settingsBranchKey]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const saveAllowNegativeStock = async (value) => {
    try {
      const res = await storeSettingsService.updateStoreSettings(
        {
          allowNegativeStock: !!value,
        },
        settingsBranchKey
      );
      const data = res?.data;
      if (!data) {
        return false;
      }
      setAllowNegativeStock(data.allowNegativeStock === true);
      return true;
    } catch (error) {
      console.error("Failed to save allowNegativeStock:", error);
      return false;
    }
  };

  const saveSettings = async (stall, path, printPaths = {}) => {
    try {
      const p1 =
        printPaths.salesPrintCopyPath1 !== undefined
          ? printPaths.salesPrintCopyPath1
          : salesPrintCopyPath1;
      const be =
        printPaths.backupEmail !== undefined
          ? printPaths.backupEmail
          : backupEmail;
      const neg =
        printPaths.allowNegativeStock !== undefined
          ? !!printPaths.allowNegativeStock
          : allowNegativeStock;
      const ep =
        printPaths.entryPin !== undefined ? printPaths.entryPin : entryPin;
      const osm =
        printPaths.openingSilakMode !== undefined
          ? printPaths.openingSilakMode
          : openingSilakMode;
      const osv =
        printPaths.openingSilakFixedValue !== undefined
          ? printPaths.openingSilakFixedValue
          : openingSilakFixedValue;
      const modeStr = osm === "fixed" ? "fixed" : "custom";
      const fixedNum = Number(osv);
      const openingSilakFixedValueSafe = Number.isFinite(fixedNum)
        ? Math.min(999999999999, Math.max(0, Math.floor(fixedNum)))
        : 10000;
      await storeSettingsService.updateStoreSettings(
        {
          stallName: stall,
          excelExportPath: path || DEFAULT_EXCEL_PATH,
          salesPrintCopyPath1: p1 ?? "",
          backupEmail: (be ?? "").trim(),
          entryPin: ep ?? "",
          allowNegativeStock: neg,
          openingSilakMode: modeStr,
          openingSilakFixedValue: openingSilakFixedValueSafe,
        },
        settingsBranchKey
      );
      setStallName(stall);
      setExcelExportPath(path || DEFAULT_EXCEL_PATH);
      setSalesPrintCopyPath1(p1 ?? "");
      setBackupEmail((be ?? "").trim());
      setEntryPin(ep ?? "");
      setAllowNegativeStock(neg);
      setOpeningSilakMode(modeStr);
      setOpeningSilakFixedValue(openingSilakFixedValueSafe);
      return true;
    } catch (error) {
      console.error("Failed to save settings:", error);
      return false;
    }
  };

  const selectFolder = async () => {
    if (!("showDirectoryPicker" in window)) {
      return {
        success: false,
        message:
          "Folder selection is not supported in this browser. Please use Chrome or Edge.",
      };
    }
    try {
      const handle = await window.showDirectoryPicker();
      setDirectoryHandle(handle);
      setSelectedFolderName(handle.name);
      setExcelExportPath(handle.name);
      return { success: true, folderName: handle.name };
    } catch (err) {
      if (err.name === "AbortError") {
        return { success: false, message: null };
      }
      return {
        success: false,
        message: err.message || "Failed to select folder",
      };
    }
  };

  /** Chrome/Edge: pick a folder for client-side report/PDF/file exports (paired with path in Settings). */
  const selectReportExportFolder = async () => {
    if (!("showDirectoryPicker" in window)) {
      return {
        success: false,
        message:
          "Folder selection is not supported in this browser. Please use Chrome or Edge.",
      };
    }
    try {
      const handle = await window.showDirectoryPicker();
      setReportExportDirectoryHandle(handle);
      return { success: true, folderName: handle.name };
    } catch (err) {
      if (err.name === "AbortError") {
        return { success: false, message: null };
      }
      return {
        success: false,
        message: err.message || "Failed to select folder",
      };
    }
  };

  const value = {
    stallName,
    setStallName,
    excelExportPath,
    setExcelExportPath,
    salesPrintCopyPath1,
    setSalesPrintCopyPath1,
    backupEmail,
    setBackupEmail,
    entryPin,
    setEntryPin,
    allowNegativeStock,
    setAllowNegativeStock,
    openingSilakMode,
    setOpeningSilakMode,
    openingSilakFixedValue,
    setOpeningSilakFixedValue,
    selectedFolderName,
    directoryHandle,
    setDirectoryHandle,
    reportExportDirectoryHandle,
    setReportExportDirectoryHandle,
    settingsLoading,
    settingsBranchKey,
    setSettingsBranchKey,
    fetchSettings,
    saveSettings,
    saveAllowNegativeStock,
    selectFolder,
    selectReportExportFolder,
    DEFAULT_EXCEL_PATH,
    DEFAULT_REPORT_EXPORT_PATH,
  };

  return (
    <StoreSettingsContext.Provider value={value}>
      {children}
    </StoreSettingsContext.Provider>
  );
};
