import React from "react";
import { Route, Routes } from "react-router-dom";
import Login from "../login/LoginIndex";
import Home from "./home/HomeIndex";
import ReportTable from "../report/ReportIndex";
import PurchaseReport from "../report/PurchaseReport";
import Demo from "../report/Demo";


const UserIndex = () => {
  return (
    <>
    <div className="main-user">
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Home />} />
        <Route path="/report" element={<ReportTable />} />
        <Route path="/purchaseReport" element={<PurchaseReport />} />
        <Route path="/stock" element={<Home />}/>
        <Route path="/demo" element={<Demo />}/>
      </Routes>
      </div>
    </>
  );
};

export default UserIndex;
