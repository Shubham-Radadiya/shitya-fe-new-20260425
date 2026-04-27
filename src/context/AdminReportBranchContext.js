import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { loadBranchOptionsForForms } from "../utils/branchOptionsClient";

const AdminReportBranchContext = createContext(null);

const STORAGE_KEY = "sahitya_report_branch";

function readInitialBranch() {
  try {
    return String(
      localStorage.getItem(STORAGE_KEY) ||
        localStorage.getItem("branchName") ||
        "KUD"
    )
      .trim()
      .toUpperCase();
  } catch {
    return "KUD";
  }
}

export function AdminReportBranchProvider({ children }) {
  const [reportBranchOptions, setReportBranchOptions] = useState([]);
  const [reportBranchName, setReportBranchNameState] = useState(readInitialBranch);

  useEffect(() => {
    let cancelled = false;
    loadBranchOptionsForForms()
      .then((opts) => {
        if (!cancelled && Array.isArray(opts) && opts.length) {
          setReportBranchOptions(opts);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (
      reportBranchOptions.length &&
      !reportBranchOptions.includes(reportBranchName)
    ) {
      setReportBranchNameState(reportBranchOptions[0]);
    }
  }, [reportBranchOptions, reportBranchName]);

  const setReportBranchName = useCallback((name) => {
    setReportBranchNameState(String(name || "").trim().toUpperCase());
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, reportBranchName);
    } catch {
      /* ignore */
    }
  }, [reportBranchName]);

  const value = useMemo(
    () => ({
      reportBranchName,
      setReportBranchName,
      reportBranchOptions,
    }),
    [reportBranchName, setReportBranchName, reportBranchOptions]
  );

  return (
    <AdminReportBranchContext.Provider value={value}>
      {children}
    </AdminReportBranchContext.Provider>
  );
}

/** @returns {null | { reportBranchName: string, setReportBranchName: (s: string) => void, reportBranchOptions: string[] }} */
export function useAdminReportBranch() {
  return useContext(AdminReportBranchContext);
}
