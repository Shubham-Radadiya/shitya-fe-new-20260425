import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import authServices from "../services/auth.services";

const AdminSessionContext = createContext(null);

/**
 * Syncs role + manager settings permission from GET /auth/session (source of truth after login).
 */
export const AdminSessionProvider = ({ children }) => {
  const [loaded, setLoaded] = useState(false);
  const [role, setRole] = useState(() => localStorage.getItem("role") || "");
  const [canAccessSettings, setCanAccessSettings] = useState(() => {
    if (localStorage.getItem("role") === "SUPER ADMIN") return true;
    return localStorage.getItem("canAccessSettings") === "true";
  });

  const refresh = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setLoaded(true);
      return;
    }
    try {
      const { data } = await authServices.getSession();
      if (data?.userType) {
        localStorage.setItem("role", data.userType);
        setRole(data.userType);
      }
      if (data?.branchName != null && String(data.branchName).trim()) {
        localStorage.setItem(
          "branchName",
          String(data.branchName).trim().toUpperCase()
        );
      }
      const settingsOk =
        data?.userType === "SUPER ADMIN" ||
        (data?.userType === "MANAGER" && data?.canAccessSettings === true);
      localStorage.setItem("canAccessSettings", settingsOk ? "true" : "false");
      setCanAccessSettings(settingsOk);
    } catch {
      // keep previous localStorage values
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const onRefresh = () => refresh();
    window.addEventListener("sahitya-admin-session-refresh", onRefresh);
    return () =>
      window.removeEventListener("sahitya-admin-session-refresh", onRefresh);
  }, [refresh]);

  const value = useMemo(
    () => ({
      loaded,
      role,
      canAccessSettings,
      refresh,
    }),
    [loaded, role, canAccessSettings, refresh]
  );

  return (
    <AdminSessionContext.Provider value={value}>
      {children}
    </AdminSessionContext.Provider>
  );
};

export const useAdminSession = () => {
  const ctx = useContext(AdminSessionContext);
  if (!ctx) {
    return {
      loaded: true,
      role: localStorage.getItem("role") || "",
      canAccessSettings:
        localStorage.getItem("role") === "SUPER ADMIN" ||
        localStorage.getItem("canAccessSettings") === "true",
      refresh: () => {},
    };
  }
  return ctx;
};
