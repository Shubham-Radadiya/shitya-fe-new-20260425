import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Dashboard from "./dashboard/DashboardIndex";
import AdminHome from "./adminhome/AdminHomeIndex";
import SettingsGate from "./settings/SettingsGate";
import Product from "./product/ProductIndex";
// import ReportPage from "./report_page/ReportPageIndex";
import ReportScreen from "./report_page/ReportScreen";
import Home from "../user_panel/home/HomeIndex";
import PurchaseReport from "../report/PurchaseReport";
const AdminIndex = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<Dashboard component={<AdminHome />} />} />
      <Route path="/settings" element={<Dashboard component={<SettingsGate />} />} />
      <Route path="/product" element={<Dashboard component={<Product />} />} />
      <Route path="/stock" element={<Home/>}/>
      <Route
        path="/report"
        element={
          <Dashboard hideSidePanel component={<ReportScreen />} />
        }
      />
      <Route path="/purchaseReport" element={<PurchaseReport />} />
      
    </Routes>
  );
};

export default AdminIndex;
