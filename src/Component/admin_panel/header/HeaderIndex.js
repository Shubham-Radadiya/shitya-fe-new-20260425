import React from "react";
import "./index.css";
import MaharajHeader from "../../images/maharaj-header.png";
import GurujiHeader from "../../images/guruji-header.png";
import { NavLink } from "react-router-dom";
import { LOGOUT_REQUEST } from "../../../store/auth/AuthAction";
import { CgLogOut } from "react-icons/cg";
import { useDispatch } from "react-redux";
import { useAdminSession } from "../../../context/AdminSessionContext";
import { useServerSync } from "../../../context/ServerSyncContext";

const Header = () => {
  const dispatch = useDispatch();
  const { canAccessSettings } = useAdminSession();
  const { isOnline, canSync, syncUiPhase, lastErrorSummary } = useServerSync();

  const handleLogout = () => {
    dispatch({ type: LOGOUT_REQUEST });
  };

  return (
    <div className="dashboard-header">
      <div className="flexgap">
        <div className="flexend">
          <img src={MaharajHeader} alt="maharaj" />
        </div>
        <div className="flexcenter">
          <div className="title">Shree Swaminarayan Temple</div>
          <div style={{ color: "var(--brown-color)", fontSize: "small" }}>
            Karelibaug - Vadodara | Kundaldham
          </div>
        </div>
      </div>
      <div></div>
      <div className="header-nav">
        <div className="navlinks">
          <NavLink
            to="/dashboard"
            className={({ isActive }) => `${isActive ? "active" : ""}`}
          >
            User
          </NavLink>
          <NavLink
            to="/product"
            className={({ isActive }) => `${isActive ? "active" : ""}`}
          >
            Products
          </NavLink>
          <NavLink
            to="/report"
            className={({ isActive }) => `${isActive ? "active" : ""}`}
          >
            Report
          </NavLink>
          {canAccessSettings && (
            <NavLink
              to="/settings"
              className={({ isActive }) => `${isActive ? "active" : ""}`}
              title="Stall, Excel path, database backup"
            >
              Settings
            </NavLink>
          )}
          {canAccessSettings && (
            <NavLink
              to="/sync-report"
              className={({ isActive }) => `${isActive ? "active" : ""}`}
              title="Sync report (last sync + pending users/branches)"
            >
              Sync
            </NavLink>
          )}
        </div>

        <div className="header-sync-cluster" title={lastErrorSummary || ""}>
          <span
            className={`header-net-badge ${
              isOnline ? "header-net-badge--on" : "header-net-badge--off"
            }`}
          >
            {isOnline ? "Online" : "Offline"}
          </span>
          {canSync && syncUiPhase === "running" && (
            <span className="header-sync-running">Syncing…</span>
          )}
          {canSync && syncUiPhase === "error" && lastErrorSummary && (
            <span className="header-sync-error">Sync error</span>
          )}
        </div>

        <button className="logout-btn" onClick={handleLogout}>
          <CgLogOut style={{ fontSize: "1.2rem" }} />
          Logout
        </button>

        <div className="flexend">
          <img src={GurujiHeader} alt="guruji" />
        </div>
      </div>
    </div>
  );
};

export default Header;
