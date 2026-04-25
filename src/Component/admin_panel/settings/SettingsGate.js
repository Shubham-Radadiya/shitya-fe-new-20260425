import React from "react";
import { Navigate } from "react-router-dom";
import { useAdminSession } from "../../../context/AdminSessionContext";
import SettingsPage from "./SettingsPage";

/**
 * Managers need super-admin-granted `canAccessSettings` (synced via /auth/session).
 */
const SettingsGate = () => {
  const { loaded, canAccessSettings } = useAdminSession();

  if (!loaded) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>Loading…</div>
    );
  }

  if (!canAccessSettings) {
    return <Navigate to="/dashboard" replace />;
  }

  return <SettingsPage />;
};

export default SettingsGate;
