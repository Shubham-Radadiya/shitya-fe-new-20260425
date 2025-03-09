import React from "react";
import "./index.css";
import Maharaj from "../../images/maharaj.png";
import Header from "../header/HeaderIndex";
import { useLocation } from "react-router-dom";

const Dashboard = ({ component }) => {
  const location = useLocation();

  return (
    <div className="flexbetween admin-dashboard">
      <div className="header">
        <Header />
      </div>
      <div className="dashboard">
        <div style={{ display: "flex" }}>
          <div className="side-maharaj">
            <img src={Maharaj} alt="Maharaj" />
          </div>
        </div>
        <div className="right-side">
          {component}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
