import React, { useState } from "react";
import "./index.css";
import MaharajHeader from "../../images/maharaj-header.png";
import GurujiHeader from "../../images/guruji-header.png";
import { NavLink, useLocation } from "react-router-dom";
import { LOGOUT_REQUEST } from "../../../store/auth/AuthAction";
import { CgLogOut } from "react-icons/cg";
import { useDispatch } from "react-redux";

const Header = () => {
  const dispatch = useDispatch();
  const [activeLink, setActiveLink] = useState("Home");
  const currentLocation = useLocation();
  const handleLinkClick = (link) => {
    setActiveLink(link);
  };

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
            Home
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
          {/* {currentLocation.pathname !== "/stock" && (
            <NavLink to="/stock"  className={({ isActive }) => `${isActive ? "active" : ""}`}>
              Purchase
            </NavLink>
          )} */}
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
