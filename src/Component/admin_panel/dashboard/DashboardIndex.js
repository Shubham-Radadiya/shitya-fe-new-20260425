import React from "react";
import "./index.css";
import Header from "../header/HeaderIndex";

const publicBase = (process.env.PUBLIC_URL || "").replace(/\/$/, "");
const varniPublicSrc = `${publicBase}/varni-1.png`;
const forestSideBgUrl = `url(${JSON.stringify(`${publicBase}/enchanted-forest-bg.png`)})`;

const Dashboard = ({ component, hideSidePanel = false }) => {
  return (
    <div className="flexbetween admin-dashboard">
      <div className="header">
        <Header />
      </div>
      <div
        className={`dashboard${hideSidePanel ? " dashboard--no-side" : ""}`}
      >
        {!hideSidePanel ? (
          <div className="side-maharaj-wrap">
            <div
              className="side-maharaj"
              style={{ "--side-forest-bg": forestSideBgUrl }}
            >
              <img src={varniPublicSrc} alt="Varni" />
            </div>
          </div>
        ) : null}
        <div
          className={`right-side${hideSidePanel ? " right-side--full" : ""}`}
        >
          {component}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
