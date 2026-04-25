import React, { useState, useEffect, useRef, useMemo } from "react";
import { IoFolderOpen } from "react-icons/io5";
import {
  MdDownload,
  MdSave,
  MdUploadFile,
  MdDelete,
  MdOutlineBolt,
  MdOutlineStorage,
  MdOutlineFolderSpecial,
  MdOutlineLock,
  MdVisibility,
  MdVisibilityOff,
  MdAdd,
} from "react-icons/md";
import { useStoreSettings } from "../../../context/StoreSettingsContext";
import { toast } from "react-toastify";
import {
  downloadDatabaseBackup,
  purgeDatabaseAfterBackup,
  restoreDatabaseFromBackup,
} from "../../../services/databaseMaintenance.services";
import {
  importPurchaseBillFromExcel,
  importSalesBillFromExcel,
  importBhetBillFromExcel,
  importPurchaseReturnFromExcel,
  importSalesReturnFromExcel,
  importBhetReturnFromExcel,
} from "../../../services/invoice.services";
// import { buildSalesPrintWatcherScript } from "../../../utils/buildSalesPrintWatcherScript";
import SectionCard from "./components/SectionCard";
import SettingRow from "./components/SettingRow";
import "./index.css";

const WINDOWS_SCRIPT = `@echo off
set "DEST=%USERPROFILE%\\Downloads\\Sahitya\\Daily Sales"
mkdir "%DEST%" 2>nul
echo Created: %DEST%
pause
`;

/** Creates default report export folder (matches Settings default Downloads/Sahitya/Export). Run on the PC that runs the API. */
const WINDOWS_REPORT_EXPORT_SCRIPT = `@echo off
set "DEST=%USERPROFILE%\\Downloads\\Sahitya\\Export"
mkdir "%DEST%" 2>nul
echo Created: %DEST%
echo.
echo Use this folder for Report export in Settings, or run Save after setting the path.
pause
`;

/** Built-in stalls (value saved to server as `stallName`). */
const DEFAULT_STALL_CODE = "KUD";

const STALL_PRESET_OPTIONS = [
  { value: "KUD", label: "1 - KUD" },
  { value: "VDR", label: "2 - VDR" },
  { value: "VDTL", label: "3 - VDTL" },
  { value: "AHM", label: "4 - AHM" },
  { value: "MBS", label: "5 - MBS" },
  { value: "BBS", label: "6 - BBS" },
  { value: "GVS", label: "7 - GVS" },
];

const STALL_PRESET_CODES = new Set(STALL_PRESET_OPTIONS.map((o) => o.value));

const STALL_CUSTOM_STORAGE_KEY = "sahitya-custom-stalls";

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
          .filter((code) => !STALL_PRESET_CODES.has(code))
      ),
    ];
  } catch {
    return [];
  }
}

function persistCustomStallCodes(codes) {
  try {
    localStorage.setItem(STALL_CUSTOM_STORAGE_KEY, JSON.stringify(codes));
  } catch {
    /* ignore quota */
  }
}

const PURGE_TRANSACTION_OPTIONS = [
  { key: "purchaseBills", label: "Purchase Bill" },
  { key: "salesBills", label: "Sales Bill" },
  { key: "purchaseReturns", label: "Purchase Return" },
  { key: "salesReturns", label: "Sales Return" },
  { key: "bhetEntries", label: "Bhet Entry" },
  { key: "silakExpense", label: "Silak expense" },
];

const PURGE_MASTER_OPTIONS = [
  { key: "mastersCategories", label: "Categories" },
  { key: "mastersSubCategories", label: "Sub-categories" },
  { key: "mastersItems", label: "Items" },
];

const emptyScopes = () => ({
  purchaseBills: false,
  salesBills: false,
  purchaseReturns: false,
  salesReturns: false,
  bhetEntries: false,
  silakExpense: false,
  mastersCategories: false,
  mastersSubCategories: false,
  mastersItems: false,
});

const TIPS = {
  printScript:
    "Downloads a PowerShell file (.ps1) that copies sales/purchase PDFs from Downloads into your Primary/Backup folders. Run on each billing PC.",
  importPurchase:
    "Creates a purchase bill from an .xlsx spreadsheet using columns configured by your administrator.",
  importSales:
    "Creates a sales bill from an .xlsx file with the same columns as purchase import (productId, Qty, Rate, Amount). Stock is reduced.",
  importBhet:
    "Creates a bhet bill from an .xlsx file with the same columns as purchase import. Stock is reduced.",
  importPurchaseReturn:
    "Creates a purchase return invoice from an .xlsx file (same columns as purchase import). Same behaviour as entering a purchase return manually (inventory is not adjusted automatically).",
  importSalesReturn:
    "Creates a sales return from an .xlsx file (same columns as purchase import). Stock is increased back like a manual sales return.",
  importBhetReturn:
    "Creates a bhet return from an .xlsx file (same columns as purchase import). Stock is increased back like a manual bhet return.",
  backup:
    "Exports business data as JSON (user accounts are not included). If you saved a Backup mail id, the same file is emailed automatically. Downloading once this session enables Clear Database.",
  restore:
    "Replaces data from a backup JSON file. The app reloads after a successful restore.",
  clearDatabase:
    "Opens a guided dialog to remove selected data from the database. User accounts are never removed. Use only after a fresh backup.",
  negativeStock:
    "Off (recommended): sales and bhet bills cannot be saved if stock would go negative. On: allows overselling; saved immediately when toggled.",
  stallName:
    "Used where the app shows or prints a store/branch label. Use Save to persist with paths and print options.",
  exportPath:
    "Daily sales Excel files go here (API server machine, or a folder you pick in Chrome/Edge). Setup folders downloads a Windows .bat to create a suggested tree under Downloads.",
  reportExport:
    "Folder on the computer running the API where reports, Excel exports, and other files are saved (default: Downloads/Sahitya/Export). Setup downloads a Windows .bat to create that folder if it does not exist—run it on the API machine, then Save.",
  backupMailId:
    "With SMTP configured on the API server (SMTP_HOST, SMTP_PORT, SMTP_FROM, and usually SMTP_USER/SMTP_PASS): database backups are emailed here when you download backup, and each Excel/PDF (or other) export is emailed as an attachment when it is saved via the server or when it is only saved in the browser or a picked folder. Save settings after entering the email.",
  entryPin:
    "One PIN for opening Purchase, Purchase return, Bhet, and Bhet return from the billing screen. Leave empty to turn the PIN off. Super admins and managers with Settings access can change it here—use Save to apply.",
  fixedOpeningSilak:
    "On: the daily report always uses the opening silak amount you enter here (saved on the server). Off: opening silak comes from today’s saved silak entry and you can change it in the report modal. Click Save to apply.",
};

const SettingsPage = () => {
  const {
    stallName,
    selectedFolderName,
    excelExportPath,
    salesPrintCopyPath1,
    backupEmail,
    entryPin,
    allowNegativeStock,
    openingSilakMode,
    openingSilakFixedValue,
    settingsLoading,
    saveSettings,
    saveAllowNegativeStock,
    selectFolder,
    selectReportExportFolder,
    DEFAULT_EXCEL_PATH,
    DEFAULT_REPORT_EXPORT_PATH,
    settingsBranchKey,
    setSettingsBranchKey,
  } = useStoreSettings();

  const [localStallName, setLocalStallName] = useState(
    (stallName || "").trim() || DEFAULT_STALL_CODE
  );
  const [customStallCodes, setCustomStallCodes] = useState(
    readCustomStallCodesFromStorage
  );
  const [addStallModalOpen, setAddStallModalOpen] = useState(false);
  const [newStallCodeInput, setNewStallCodeInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [folderError, setFolderError] = useState("");
  const [folderSelecting, setFolderSelecting] = useState(false);
  const [reportFolderError, setReportFolderError] = useState("");
  const [reportFolderSelecting, setReportFolderSelecting] = useState(false);
  const [backupToken, setBackupToken] = useState(null);
  const [backingUp, setBackingUp] = useState(false);
  const [purging, setPurging] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const restoreInputRef = useRef(null);
  const purchaseExcelInputRef = useRef(null);
  const purchaseReturnExcelInputRef = useRef(null);
  const salesExcelInputRef = useRef(null);
  const salesReturnExcelInputRef = useRef(null);
  const bhetExcelInputRef = useRef(null);
  const bhetReturnExcelInputRef = useRef(null);
  const [purchaseImporting, setPurchaseImporting] = useState(false);
  const [purchaseReturnImporting, setPurchaseReturnImporting] = useState(false);
  const [salesImporting, setSalesImporting] = useState(false);
  const [salesReturnImporting, setSalesReturnImporting] = useState(false);
  const [bhetImporting, setBhetImporting] = useState(false);
  const [bhetReturnImporting, setBhetReturnImporting] = useState(false);
  const [localPrintPath1, setLocalPrintPath1] = useState("");
  const [localBackupEmail, setLocalBackupEmail] = useState("");
  const [localEntryPin, setLocalEntryPin] = useState("");
  const [entryPinVisible, setEntryPinVisible] = useState(false);
  const [localAllowNegativeStock, setLocalAllowNegativeStock] = useState(false);
  const [localFixedOpeningSilak, setLocalFixedOpeningSilak] = useState(false);
  const [localOpeningSilakFixedAmount, setLocalOpeningSilakFixedAmount] =
    useState("10000");
  const [allowNegativeStockSaving, setAllowNegativeStockSaving] = useState(false);

  const [purgeModalOpen, setPurgeModalOpen] = useState(false);
  const [purgeScopes, setPurgeScopes] = useState(() => emptyScopes());
  const [purgeConfirmStep, setPurgeConfirmStep] = useState(0);

  const anyPurgeSelected = useMemo(
    () => Object.values(purgeScopes).some(Boolean),
    [purgeScopes]
  );

  const stallSelectOptions = useMemo(() => {
    const map = new Map();
    STALL_PRESET_OPTIONS.forEach((o) => map.set(o.value, o.label));
    customStallCodes.forEach((code) => {
      if (!map.has(code)) map.set(code, code);
    });
    const current = (settingsBranchKey || localStallName || "").trim();
    if (current && !map.has(current)) {
      map.set(current, `${current} (saved)`);
    }
    return Array.from(map.entries()).map(([value, label]) => ({
      value,
      label,
    }));
  }, [customStallCodes, localStallName, settingsBranchKey]);

  /** Form field for saved stall label; must not drive API branch (that caused KUD↔AHM fetch loops when stallName ≠ branch row). */
  useEffect(() => {
    const s = (stallName || "").trim();
    if (!s) {
      setLocalStallName(DEFAULT_STALL_CODE);
      return;
    }
    const presetMatch = STALL_PRESET_OPTIONS.find(
      (o) => o.value.toUpperCase() === s.toUpperCase()
    );
    if (presetMatch) {
      setLocalStallName(presetMatch.value);
      return;
    }
    setLocalStallName(s.toUpperCase());
  }, [stallName]);

  useEffect(() => {
    setLocalPrintPath1(
      (salesPrintCopyPath1 || "").trim() || DEFAULT_REPORT_EXPORT_PATH
    );
  }, [salesPrintCopyPath1, DEFAULT_REPORT_EXPORT_PATH]);

  useEffect(() => {
    setLocalBackupEmail(backupEmail || "");
  }, [backupEmail]);

  useEffect(() => {
    setLocalEntryPin(
      String(entryPin || "")
        .replace(/\D/g, "")
        .slice(0, 9)
    );
  }, [entryPin]);

  useEffect(() => {
    setLocalAllowNegativeStock(allowNegativeStock === true);
  }, [allowNegativeStock]);

  useEffect(() => {
    setLocalFixedOpeningSilak(openingSilakMode === "fixed");
    const n = Number(openingSilakFixedValue);
    const base = Number.isFinite(n) ? Math.floor(n) : 10000;
    const capped = Math.min(999999999, Math.max(0, base));
    setLocalOpeningSilakFixedAmount(String(capped));
  }, [openingSilakMode, openingSilakFixedValue]);

  useEffect(() => {
    if (purgeModalOpen) return undefined;
    setPurgeScopes(emptyScopes());
    setPurgeConfirmStep(0);
    return undefined;
  }, [purgeModalOpen]);

  useEffect(() => {
    setPurgeConfirmStep(0);
  }, [purgeScopes]);

  const openAddStallModal = () => {
    setNewStallCodeInput("");
    setAddStallModalOpen(true);
  };

  const closeAddStallModal = () => {
    setAddStallModalOpen(false);
    setNewStallCodeInput("");
  };

  const submitNewStall = () => {
    const upper = newStallCodeInput.trim().toUpperCase().replace(/\s+/g, "");
    if (!upper) {
      toast.error("Enter a branch code.");
      return;
    }
    if (upper.length > 32) {
      toast.error("Branch code is too long (max 32 characters).");
      return;
    }
    if (!/^[A-Z0-9._-]+$/.test(upper)) {
      toast.error("Use letters, numbers, dot, hyphen, or underscore only.");
      return;
    }
    if (STALL_PRESET_CODES.has(upper)) {
      toast.error("That branch is already in the list.");
      return;
    }
    if (customStallCodes.includes(upper)) {
      toast.error("That branch already exists.");
      return;
    }
    const next = [...customStallCodes, upper];
    setCustomStallCodes(next);
    persistCustomStallCodes(next);
    setSettingsBranchKey(upper);
    setLocalStallName(upper);
    toast.success(
      `Branch "${upper}" added. Save settings to store it on the server.`
    );
    closeAddStallModal();
  };

  const handleSelectPath = async () => {
    setFolderError("");
    setFolderSelecting(true);
    try {
      const result = await selectFolder();
      if (result?.success) {
        setFolderError("");
      } else if (result?.message) {
        setFolderError(result.message);
      }
    } finally {
      setFolderSelecting(false);
    }
  };

  const handleSelectReportExportPath = async () => {
    setReportFolderError("");
    setReportFolderSelecting(true);
    try {
      const result = await selectReportExportFolder();
      if (result?.success && result.folderName) {
        setLocalPrintPath1(result.folderName);
        setReportFolderError("");
      } else if (result?.message) {
        setReportFolderError(result.message);
      }
    } finally {
      setReportFolderSelecting(false);
    }
  };

  /* Print copy script (.ps1 download) — disabled
  const downloadSalesPrintCopyScript = () => {
    const body = buildSalesPrintWatcherScript(
      localPrintPath1,
      ""
    );
    const blob = new Blob([body], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Copy-SalesPrintFromDownloads.ps1";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.info("Script downloaded.");
  };
  */

  const downloadWindowsSetupScript = () => {
    const blob = new Blob([WINDOWS_SCRIPT], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "create-sahitya-excel-folders.bat";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.info("Folder setup script downloaded.");
  };

  const downloadReportExportSetupScript = () => {
    const blob = new Blob([WINDOWS_REPORT_EXPORT_SCRIPT], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "create-sahitya-report-export-folder.bat";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.info("Report export folder setup script downloaded. Run it on the API PC, then Save settings.");
  };

  const handleAllowNegativeStockChange = async (nextChecked) => {
    const previous = localAllowNegativeStock;
    setLocalAllowNegativeStock(nextChecked);
    setAllowNegativeStockSaving(true);
    try {
      const ok = await saveAllowNegativeStock(nextChecked);
      if (ok) {
        toast.success("Saved");
      } else {
        setLocalAllowNegativeStock(previous);
        toast.error("Could not save. Check Settings access or use Save.");
      }
    } finally {
      setAllowNegativeStockSaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const pathToSave = selectedFolderName || excelExportPath || DEFAULT_EXCEL_PATH;
      const fixedAmt = parseInt(
        String(localOpeningSilakFixedAmount).replace(/\D/g, ""),
        10
      );
      const success = await saveSettings(localStallName, pathToSave, {
        salesPrintCopyPath1:
          localPrintPath1.trim() || DEFAULT_REPORT_EXPORT_PATH,
        backupEmail: localBackupEmail.trim(),
        entryPin: localEntryPin.trim(),
        allowNegativeStock: localAllowNegativeStock,
        openingSilakMode: localFixedOpeningSilak ? "fixed" : "custom",
        openingSilakFixedValue: Number.isFinite(fixedAmt)
          ? Math.min(999999999, Math.max(0, fixedAmt))
          : 0,
      });
      if (success) {
        toast.success("Settings saved successfully");
      } else {
        toast.error("Failed to save settings");
      }
    } finally {
      setSaving(false);
    }
  };

  const displayPath = selectedFolderName || excelExportPath || DEFAULT_EXCEL_PATH;

  const handleDownloadBackup = async () => {
    setBackupToken(null);
    setBackingUp(true);
    try {
      const {
        backup,
        backupToken: token,
        backupEmailSent,
        backupEmailMessage,
      } = await downloadDatabaseBackup();
      if (!backup || !token) {
        toast.error("Invalid backup response from server");
        return;
      }
      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: "application/json;charset=utf-8",
      });
      const dateStr = new Date().toISOString().slice(0, 10);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sahitya_database_backup_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setBackupToken(token);
      if (backupEmailSent === true) {
        toast.success("Backup downloaded and sent to your backup mail id.");
      } else {
        toast.success("Backup downloaded.");
        if (backupEmailSent === false && backupEmailMessage) {
          toast.warning(`Email not sent: ${backupEmailMessage}`);
        }
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Backup failed. Check you are logged in as admin.";
      toast.error(msg);
    } finally {
      setBackingUp(false);
    }
  };

  const handleRestoreBackup = async (e) => {
    const file = e?.target?.files?.[0];
    if (!file) return;
    setRestoring(true);
    try {
      await restoreDatabaseFromBackup(file);
      toast.success("Backup restored successfully. Reloading…");
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Restore failed.";
      toast.error(msg);
    } finally {
      setRestoring(false);
      e.target.value = "";
      if (restoreInputRef.current) restoreInputRef.current.value = "";
    }
  };

  const openPurgeModal = () => {
    if (!backupToken) {
      toast.error("Download a backup first.");
      return;
    }
    setPurgeScopes(emptyScopes());
    setPurgeConfirmStep(0);
    setPurgeModalOpen(true);
  };

  const closePurgeModal = () => {
    setPurgeModalOpen(false);
    setPurgeConfirmStep(0);
    setPurgeScopes(emptyScopes());
  };

  const togglePurgeScope = (key) => {
    setPurgeScopes((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const runPurge = async () => {
    if (!backupToken || !anyPurgeSelected) return;
    setPurging(true);
    try {
      await purgeDatabaseAfterBackup(backupToken, purgeScopes);
      setBackupToken(null);
      closePurgeModal();
      toast.success("Selected data removed. Reloading…");
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Delete failed.";
      toast.error(msg);
    } finally {
      setPurging(false);
    }
  };

  const busy = saving || settingsLoading || backingUp || purging;
  const importDisabled =
    purchaseImporting ||
    purchaseReturnImporting ||
    salesImporting ||
    salesReturnImporting ||
    bhetImporting ||
    bhetReturnImporting ||
    saving ||
    backingUp ||
    purging ||
    restoring;

  const excelAccept =
    ".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel";

  const handleExcelImport = async (e, apiFn, setImporting, label, inputRef) => {
    const file = e?.target?.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const data = await apiFn(file);
      const inv = data?.invoice ?? data?.bill;
      const no = inv?.invoiceId ?? inv?.billId ?? "";
      const lines = data?.lineCount ?? "";
      toast.success(
        data?.message ||
          `${label}${no ? ` (${no})` : ""}${lines !== "" ? `. Lines: ${lines}` : ""}`
      );
    } catch (err) {
      const msg =
        err.response?.data?.message || err.message || "Import failed.";
      toast.error(msg);
    } finally {
      setImporting(false);
      e.target.value = "";
      if (inputRef?.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="settings-page-wrap settings-page-wrap--compact">
      <div
        className="settings-page-header settings-page-header--compact"
        aria-label="Settings"
      >
        <div className="settings-header-bar settings-header-bar--column-titles">
          <div className="settings-header-col settings-header-col--common">
            <p
              className="settings-header-column-title"
              role="presentation"
            >
              Common Settings
            </p>
          </div>
          <div className="settings-header-col settings-header-col--branch">
            <p
              className="settings-header-column-title"
              role="presentation"
            >
              Branch Wise Settings
            </p>
            <div
              className="settings-quick settings-quick--in-header-bar"
              role="toolbar"
              aria-label="Save settings"
            >
              <button
                type="button"
                className="settings-quick__btn settings-quick__btn--primary"
                onClick={handleSave}
                disabled={busy}
                title="Save branch name, report export paths, daily sales folder, backup mail id, and other settings"
              >
                <MdSave className="settings-quick__icon" aria-hidden />
                <span>{saving ? "Saving…" : "Save"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="settings-page-scroll settings-page-scroll--compact">
        <div className="settings-unified settings-unified--compact">
          <input
            ref={purchaseExcelInputRef}
            type="file"
            accept={excelAccept}
            onChange={(e) =>
              handleExcelImport(
                e,
                importPurchaseBillFromExcel,
                setPurchaseImporting,
                "Purchase bill created",
                purchaseExcelInputRef
              )
            }
            style={{ display: "none" }}
          />
          <input
            ref={purchaseReturnExcelInputRef}
            type="file"
            accept={excelAccept}
            onChange={(e) =>
              handleExcelImport(
                e,
                importPurchaseReturnFromExcel,
                setPurchaseReturnImporting,
                "Purchase return created",
                purchaseReturnExcelInputRef
              )
            }
            style={{ display: "none" }}
          />
          <input
            ref={salesExcelInputRef}
            type="file"
            accept={excelAccept}
            onChange={(e) =>
              handleExcelImport(
                e,
                importSalesBillFromExcel,
                setSalesImporting,
                "Sales bill created",
                salesExcelInputRef
              )
            }
            style={{ display: "none" }}
          />
          <input
            ref={salesReturnExcelInputRef}
            type="file"
            accept={excelAccept}
            onChange={(e) =>
              handleExcelImport(
                e,
                importSalesReturnFromExcel,
                setSalesReturnImporting,
                "Sales return created",
                salesReturnExcelInputRef
              )
            }
            style={{ display: "none" }}
          />
          <input
            ref={bhetExcelInputRef}
            type="file"
            accept={excelAccept}
            onChange={(e) =>
              handleExcelImport(
                e,
                importBhetBillFromExcel,
                setBhetImporting,
                "Bhet bill created",
                bhetExcelInputRef
              )
            }
            style={{ display: "none" }}
          />
          <input
            ref={bhetReturnExcelInputRef}
            type="file"
            accept={excelAccept}
            onChange={(e) =>
              handleExcelImport(
                e,
                importBhetReturnFromExcel,
                setBhetReturnImporting,
                "Bhet return created",
                bhetReturnExcelInputRef
              )
            }
            style={{ display: "none" }}
          />
          <input
            ref={restoreInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleRestoreBackup}
            style={{ display: "none" }}
          />

          <div className="settings-cards-grid">
            <div className="settings-cards-col">
              <SectionCard
                title="Imports"
                icon={<MdOutlineBolt aria-hidden />}
                danger
              >
                {/* Print copy script — feature disabled (see commented handler + import above)
              <SettingRow label="Print copy script" tooltip={TIPS.printScript}>
                <button
                  type="button"
                  className="st-btn st-btn--secondary st-btn--sm"
                  onClick={downloadSalesPrintCopyScript}
                  disabled={saving}
                >
                  Download .ps1
                </button>
              </SettingRow>
              */}
                <SettingRow label="Purchase Import" tooltip={TIPS.importPurchase}>
                  <button
                    type="button"
                    className="st-btn st-btn--primary st-btn--sm"
                    onClick={() => purchaseExcelInputRef.current?.click()}
                    disabled={importDisabled}
                  >
                    <MdUploadFile className="st-btn__icon" aria-hidden />
                    {purchaseImporting ? "…" : "Upload .xlsx"}
                  </button>
                </SettingRow>
                <SettingRow
                  label="Purchase Return Import"
                  tooltip={TIPS.importPurchaseReturn}
                >
                  <button
                    type="button"
                    className="st-btn st-btn--primary st-btn--sm"
                    onClick={() => purchaseReturnExcelInputRef.current?.click()}
                    disabled={importDisabled}
                  >
                    <MdUploadFile className="st-btn__icon" aria-hidden />
                    {purchaseReturnImporting ? "…" : "Upload .xlsx"}
                  </button>
                </SettingRow>
                <SettingRow label="Sales Import" tooltip={TIPS.importSales}>
                  <button
                    type="button"
                    className="st-btn st-btn--primary st-btn--sm"
                    onClick={() => salesExcelInputRef.current?.click()}
                    disabled={importDisabled}
                  >
                    <MdUploadFile className="st-btn__icon" aria-hidden />
                    {salesImporting ? "…" : "Upload .xlsx"}
                  </button>
                </SettingRow>
                <SettingRow
                  label="Sales Return Import"
                  tooltip={TIPS.importSalesReturn}
                >
                  <button
                    type="button"
                    className="st-btn st-btn--primary st-btn--sm"
                    onClick={() => salesReturnExcelInputRef.current?.click()}
                    disabled={importDisabled}
                  >
                    <MdUploadFile className="st-btn__icon" aria-hidden />
                    {salesReturnImporting ? "…" : "Upload .xlsx"}
                  </button>
                </SettingRow>
                <SettingRow label="Bhet Import" tooltip={TIPS.importBhet}>
                  <button
                    type="button"
                    className="st-btn st-btn--primary st-btn--sm"
                    onClick={() => bhetExcelInputRef.current?.click()}
                    disabled={importDisabled}
                  >
                    <MdUploadFile className="st-btn__icon" aria-hidden />
                    {bhetImporting ? "…" : "Upload .xlsx"}
                  </button>
                </SettingRow>
                <SettingRow
                  label="Bhet Return Import"
                  tooltip={TIPS.importBhetReturn}
                >
                  <button
                    type="button"
                    className="st-btn st-btn--primary st-btn--sm"
                    onClick={() => bhetReturnExcelInputRef.current?.click()}
                    disabled={importDisabled}
                  >
                    <MdUploadFile className="st-btn__icon" aria-hidden />
                    {bhetReturnImporting ? "…" : "Upload .xlsx"}
                  </button>
                </SettingRow>
              </SectionCard>

              <SectionCard
                title="Report & file export"
                icon={<MdOutlineFolderSpecial aria-hidden />}
                danger
              >
                <div className="st-print-path-rows">
                  <SettingRow
                    label="Report export"
                    tooltip={TIPS.reportExport}
                    className="setting-row--tall"
                  >
                    <div className="st-report-export-controls">
                      <input
                        type="text"
                        className="st-input"
                        placeholder={DEFAULT_REPORT_EXPORT_PATH}
                        value={localPrintPath1}
                        onChange={(e) => setLocalPrintPath1(e.target.value)}
                        disabled={settingsLoading}
                        aria-label="Report export folder path"
                      />
                      <button
                        type="button"
                        className="st-btn st-btn--primary st-btn--sm st-btn--iconish"
                        onClick={handleSelectReportExportPath}
                        disabled={
                          settingsLoading || reportFolderSelecting || saving
                        }
                        title="Choose folder (Chrome or Edge)"
                      >
                        <IoFolderOpen aria-hidden />
                      </button>
                      <button
                        type="button"
                        className="st-btn st-btn--secondary st-btn--sm"
                        onClick={downloadReportExportSetupScript}
                        disabled={saving}
                        title="Download .bat to create Downloads\Sahitya\Export (run on the API server PC)"
                      >
                        Setup
                      </button>
                    </div>
                  </SettingRow>
                  {reportFolderError ? (
                    <p className="settings-path-error settings-path-error--inline">
                      {reportFolderError}
                    </p>
                  ) : null}
                  <SettingRow
                    label="Daily Sales Report"
                    tooltip={TIPS.exportPath}
                    className="setting-row--tall"
                  >
                    <div className="st-excel-controls">
                      <div
                        className="st-path st-path--truncate"
                        title={displayPath || "—"}
                      >
                        {displayPath || "—"}
                      </div>
                      <button
                        type="button"
                        className="st-btn st-btn--primary st-btn--sm st-btn--iconish"
                        onClick={handleSelectPath}
                        disabled={settingsLoading || folderSelecting || saving}
                        title="Choose folder"
                      >
                        <IoFolderOpen aria-hidden />
                      </button>
                      <button
                        type="button"
                        className="st-btn st-btn--secondary st-btn--sm"
                        onClick={downloadWindowsSetupScript}
                        disabled={saving}
                        title="Setup folders (.bat)"
                      >
                        Setup
                      </button>
                    </div>
                  </SettingRow>
                  {folderError ? (
                    <p className="settings-path-error settings-path-error--inline">
                      {folderError}
                    </p>
                  ) : null}
                  <SettingRow
                    label="Backup mail id"
                    tooltip={TIPS.backupMailId}
                  >
                    <input
                      type="email"
                      className="st-input"
                      placeholder="name@example.com"
                      value={localBackupEmail}
                      onChange={(e) => setLocalBackupEmail(e.target.value)}
                      disabled={settingsLoading}
                      autoComplete="email"
                      aria-label="Backup mail id for database backup"
                    />
                  </SettingRow>
                </div>
              </SectionCard>
            </div>

            <div className="settings-cards-col settings-cards-col--branch">
              <div className="settings-branch-block" title={TIPS.stallName}>
                <div className="settings-header-stall settings-header-stall--in-column">
                  <label
                    className="settings-header-stall__label"
                    htmlFor="settings-branch-select"
                  >
                    Branch name
                  </label>
                  <div className="settings-header-stall__controls">
                    <select
                      id="settings-branch-select"
                      className="st-input settings-header-stall__input settings-header-stall__select"
                      value={settingsBranchKey}
                      onChange={(e) => {
                        const v = e.target.value;
                        setSettingsBranchKey(v);
                        setLocalStallName(v);
                      }}
                      disabled={settingsLoading}
                    >
                      {stallSelectOptions.map(({ value, label }) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="st-btn st-btn--secondary st-btn--sm st-btn--iconish settings-header-stall__add"
                      onClick={openAddStallModal}
                      disabled={settingsLoading}
                      title="Add branch"
                      aria-label="Add new branch"
                    >
                      <MdAdd aria-hidden />
                    </button>
                  </div>
                </div>
              </div>
              <SectionCard
                title="Database backup & restore"
                icon={<MdOutlineStorage aria-hidden />}
              >
                <SettingRow label="Download backup" tooltip={TIPS.backup}>
                  <button
                    type="button"
                    className="st-btn st-btn--primary st-btn--sm st-btn--db-action"
                    onClick={handleDownloadBackup}
                    disabled={backingUp || purging || saving}
                  >
                    <MdDownload className="st-btn__icon" aria-hidden />
                    {backingUp ? "…" : "Backup"}
                  </button>
                </SettingRow>
                <SettingRow label="Restore backup" tooltip={TIPS.restore}>
                  <button
                    type="button"
                    className="st-btn st-btn--primary st-btn--sm st-btn--db-action"
                    onClick={() => restoreInputRef.current?.click()}
                    disabled={restoring || backingUp || purging || saving}
                  >
                    <MdUploadFile className="st-btn__icon" aria-hidden />
                    {restoring ? "…" : "Restore"}
                  </button>
                </SettingRow>
                <SettingRow label="Clear Database" tooltip={TIPS.clearDatabase}>
                  <button
                    type="button"
                    className="st-btn st-btn--primary st-btn--sm st-btn--db-action"
                    onClick={openPurgeModal}
                    disabled={!backupToken || purging || backingUp || saving}
                    aria-label="Clear database"
                  >
                    <MdDelete className="st-btn__icon" aria-hidden />
                    {purging ? "…" : "Clear"}
                  </button>
                </SettingRow>
              </SectionCard>

              <SectionCard
                title="Other Settings"
                icon={<MdOutlineLock aria-hidden />}
              >
                <SettingRow label="Entry PIN" tooltip={TIPS.entryPin}>
                  <div className="st-compact-value-row">
                    <input
                      type={entryPinVisible ? "text" : "password"}
                      className="st-input st-input--compact-digits"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      autoComplete="new-password"
                      placeholder="Optional (max 9 digits)"
                      value={localEntryPin}
                      onChange={(e) =>
                        setLocalEntryPin(
                          e.target.value.replace(/\D/g, "").slice(0, 9)
                        )
                      }
                      disabled={settingsLoading}
                      maxLength={9}
                      aria-label="Entry PIN for purchase, purchase return, bhet, and bhet return"
                    />
                    <button
                      type="button"
                      className="st-btn st-btn--secondary st-btn--sm st-btn--iconish"
                      onClick={() => setEntryPinVisible((v) => !v)}
                      disabled={settingsLoading}
                      aria-label={entryPinVisible ? "Hide PIN" : "Show PIN"}
                      aria-pressed={entryPinVisible}
                      title={entryPinVisible ? "Hide PIN" : "Show PIN"}
                    >
                      {entryPinVisible ? (
                        <MdVisibilityOff aria-hidden />
                      ) : (
                        <MdVisibility aria-hidden />
                      )}
                    </button>
                  </div>
                </SettingRow>
                <SettingRow
                  label="Fixed opening silak"
                  tooltip={TIPS.fixedOpeningSilak}
                >
                  {localFixedOpeningSilak ? (
                    <div className="st-compact-value-row">
                      <input
                        type="text"
                        inputMode="numeric"
                        className="st-input st-input--compact-digits"
                        value={localOpeningSilakFixedAmount}
                        onChange={(e) => {
                          const v = e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 9);
                          setLocalOpeningSilakFixedAmount(v);
                        }}
                        disabled={settingsLoading}
                        placeholder="Amount"
                        maxLength={9}
                        aria-label="Fixed opening silak amount"
                      />
                      <label className="settings-switch">
                        <input
                          type="checkbox"
                          checked={localFixedOpeningSilak}
                          onChange={(e) =>
                            setLocalFixedOpeningSilak(e.target.checked)
                          }
                          disabled={settingsLoading}
                          aria-label="Use fixed opening silak"
                        />
                        <span
                          className="settings-switch__slider"
                          aria-hidden
                        />
                      </label>
                    </div>
                  ) : (
                    <div className="st-toggle-row">
                      <label className="settings-switch">
                        <input
                          type="checkbox"
                          checked={localFixedOpeningSilak}
                          onChange={(e) =>
                            setLocalFixedOpeningSilak(e.target.checked)
                          }
                          disabled={settingsLoading}
                          aria-label="Use fixed opening silak"
                        />
                        <span
                          className="settings-switch__slider"
                          aria-hidden
                        />
                      </label>
                    </div>
                  )}
                </SettingRow>
                <SettingRow
                  label="Allow negative stock"
                  tooltip={TIPS.negativeStock}
                >
                  <div className="st-toggle-row">
                    <label className="settings-switch">
                      <input
                        type="checkbox"
                        aria-label="Allow negative stock"
                        checked={localAllowNegativeStock}
                        onChange={(e) =>
                          handleAllowNegativeStockChange(e.target.checked)
                        }
                        disabled={settingsLoading || allowNegativeStockSaving}
                      />
                      <span className="settings-switch__slider" aria-hidden />
                    </label>
                  </div>
                </SettingRow>
              </SectionCard>
            </div>
          </div>
        </div>
      </div>

      {addStallModalOpen && (
        <div
          className="settings-purge-modal-overlay"
          role="presentation"
          onClick={closeAddStallModal}
        >
          <div
            className="settings-purge-modal settings-add-stall-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-stall-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              id="add-stall-modal-title"
              className="settings-purge-modal-title"
            >
              Add branch
            </h3>
            <p className="settings-add-stall-modal__hint">
              Enter a short code for this location. Custom branches are remembered
              on this browser; choose Save to write the selected branch to the
              server.
            </p>
            <input
              type="text"
              className="st-input settings-add-stall-modal__input"
              placeholder="e.g. XYZ"
              value={newStallCodeInput}
              onChange={(e) => setNewStallCodeInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submitNewStall();
                }
              }}
              maxLength={32}
              autoFocus
              autoComplete="off"
              aria-label="New branch code"
            />
            <div className="settings-purge-modal-actions">
              <button
                type="button"
                className="settings-purge-modal-cancel"
                onClick={closeAddStallModal}
              >
                Cancel
              </button>
              <button
                type="button"
                className="settings-purge-modal-confirm1"
                onClick={submitNewStall}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {purgeModalOpen && (
        <div
          className="settings-purge-modal-overlay"
          role="presentation"
          onClick={closePurgeModal}
        >
          <div
            className="settings-purge-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="purge-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="purge-modal-title" className="settings-purge-modal-title">
              Clear database
            </h3>

            <div className="settings-purge-section">
              {PURGE_TRANSACTION_OPTIONS.map(({ key, label }) => (
                <label key={key} className="settings-purge-check-row">
                  <input
                    type="checkbox"
                    checked={purgeScopes[key]}
                    onChange={() => togglePurgeScope(key)}
                    disabled={purging}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>

            <div className="settings-purge-section settings-purge-section-masters">
              <div className="settings-purge-section-label">Masters</div>
              {PURGE_MASTER_OPTIONS.map(({ key, label }) => (
                <label key={key} className="settings-purge-check-row">
                  <input
                    type="checkbox"
                    checked={purgeScopes[key]}
                    onChange={() => togglePurgeScope(key)}
                    disabled={purging}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>

            <div className="settings-purge-modal-actions">
              <button
                type="button"
                className="settings-purge-modal-cancel"
                onClick={closePurgeModal}
                disabled={purging}
              >
                Cancel
              </button>
              {purgeConfirmStep === 0 && (
                <button
                  type="button"
                  className="settings-purge-modal-confirm1"
                  onClick={() => setPurgeConfirmStep(1)}
                  disabled={!anyPurgeSelected || purging}
                >
                  Step 1 — Confirm
                </button>
              )}
              {purgeConfirmStep === 1 && (
                <button
                  type="button"
                  className="settings-purge-modal-confirm2"
                  onClick={runPurge}
                  disabled={!anyPurgeSelected || purging}
                >
                  {purging ? "Clearing…" : "Step 2 — Clear database"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
