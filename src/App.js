import React, { useEffect, useState } from "react";
import Login from "./Component/login/LoginIndex";
import "./App.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import AdminIndex from "./Component/admin_panel/index";
import UserIndex from "./Component/user_panel/index"
import 'react-date-range/dist/styles.css'; 
import 'react-date-range/dist/theme/default.css'; 

function App() {
  const [role, setRole] = useState("");
  useEffect(() => {
    const role = localStorage.getItem("role");
    setRole(role);
  }, []);

  return (
    <div className="bg">
    {role === null ? (
      <Login />
    ) : role === "SUPER ADMIN" || role === "MANAGER" ? (
      <AdminIndex />
    ) : (
      <UserIndex />
    )}
  </div>
  );
}

export default App;
