import React from "react";
import { Route, Routes } from "react-router-dom";
import Login from "../login/LoginIndex";
import Dashboard from "./dashboard/DashboardIndex";
import AdminHome from "./adminhome/AdminHomeIndex";
import Product from "./product/ProductIndex";
// import ReportPage from "./report_page/ReportPageIndex";
import ReportScreen from "./report_page/ReportScreen";
import Home from "../user_panel/home/HomeIndex";
import PurchaseReport from "../report/PurchaseReport";


const AdminIndex = () => {
  return (
    
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard component={<AdminHome />} />} />
      <Route path="/product" element={<Dashboard component={<Product />} />} />
      <Route path="/stock" element={<Home/>}/>
      <Route path="/report" element={<ReportScreen/>}  />
              <Route path="/purchaseReport" element={<PurchaseReport />} />
      
    </Routes>
  );
};

export default AdminIndex;
