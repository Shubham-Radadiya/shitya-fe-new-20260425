/**
 * Sahitya **web** UI only — all API calls go to **karelibaug-store** (REACT_APP_API_URL).
 * The Android stall app is offline and is **not** a client of that backend.
 */
import React, { useEffect, useState } from "react";
import Login from "./Component/login/LoginIndex";
import "./App.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import AdminIndex from "./Component/admin_panel/index";
import UserIndex from "./Component/user_panel/index";
import { StoreSettingsProvider } from "./context/StoreSettingsContext";
import { AdminSessionProvider } from "./context/AdminSessionContext";
import { ServerSyncProvider } from "./context/ServerSyncContext";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import authServices from "./services/auth.services";

function readRoleFromStorage() {
  try {
    const r = localStorage.getItem("role");
    if (r === null || r === undefined || r === "") return null;
    return r;
  } catch {
    return null;
  }
}

function App() {
  /** `undefined` = still checking localStorage / session */
  const [role, setRole] = useState(undefined);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let r = readRoleFromStorage();
      const token = localStorage.getItem("access_token");
      if (r == null && token) {
        try {
          const { data } = await authServices.getSession();
          if (!cancelled && data?.userType) {
            localStorage.setItem("role", data.userType);
            const settingsOk =
              data.userType === "SUPER ADMIN" ||
              (data.userType === "MANAGER" && data.canAccessSettings === true);
            localStorage.setItem(
              "canAccessSettings",
              settingsOk ? "true" : "false"
            );
            if (data.branchName != null && String(data.branchName).trim()) {
              localStorage.setItem(
                "branchName",
                String(data.branchName).trim().toUpperCase()
              );
            }
            r = data.userType;
          }
        } catch {
          localStorage.removeItem("access_token");
          localStorage.removeItem("role");
          localStorage.removeItem("canAccessSettings");
          localStorage.removeItem("branchName");
          localStorage.removeItem("sahitya_settings_branch");
          r = null;
        }
      }
      if (!cancelled) setRole(r);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (role === undefined) {
    return <div className="bg" aria-busy="true" />;
  }

  return (
    <div className="bg">
      {role == null ? (
        <Login />
      ) : role === "SUPER ADMIN" || role === "MANAGER" ? (
        <StoreSettingsProvider>
          <ServerSyncProvider>
            <AdminSessionProvider>
              <AdminIndex />
            </AdminSessionProvider>
          </ServerSyncProvider>
        </StoreSettingsProvider>
      ) : (
        <StoreSettingsProvider>
          <ServerSyncProvider>
            <UserIndex />
          </ServerSyncProvider>
        </StoreSettingsProvider>
      )}
    </div>
  );
}

export default App;
