import React from "react";
import { Route, Routes } from "react-router-dom";
import Login from "../login/LoginIndex";
import Home from "./home/HomeIndex";
import PurchaseReport from "../report/PurchaseReport";
import ReportsDashboard from "../report/ReportDashboard";


const UserIndex = () => {
  return (
    <>
    <div className="main-user">
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Home />} />
        <Route path="/report" element={<ReportsDashboard />} />
        <Route path="/purchaseReport" element={<PurchaseReport />} />
        <Route path="/stock" element={<Home />}/>
        <Route path="/bhet" element={<Home />}/>
      </Routes>
      </div>
    </>
  );
};

export default UserIndex;
