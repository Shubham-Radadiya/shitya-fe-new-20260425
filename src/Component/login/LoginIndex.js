import React, { useState } from "react";
import "./index.css";
import loginghanu from "../images/login-ghanu.png"
import loginguruji from "../images/login-guruji.png"
import { useDispatch } from "react-redux";
import { LOGIN_REQUEST } from "../../store/auth/AuthAction";

const Login = () => {
  const dispatch = useDispatch();
  const [loginData, setLoginData] = useState({});
   const handleChange = (event) => {
       setLoginData({
          ...loginData,
          [event.target.name]: event.target.value
     });
  };
  const SubmitLogin = async () => {
      try {
          await dispatch({ type: LOGIN_REQUEST, payload: loginData });
      } catch (error) {
          throw error;
      }
  };

  return (
    <div className="background-image">
      <div className="overlay">
        <img src={loginghanu} alt="Ghanu" className="right-image" />
        <img src={loginguruji} alt="Guruji" className="left-image" />
        <div className="login-container">
          <h2 className="login-title">જય સ્વામિનારાયણ</h2>
          <div className="form-container">
            <div className="form-group">
              <label>User Name:</label>
              <input
              id="userName"
              name="userName"
                type="text"
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Passward:</label>
              <input
              id="password"
              name="password"
                type="password"
                onChange={handleChange}
                required
              />
            </div>
            <button className="login-btn"
              type="submit" onClick={SubmitLogin}>
              Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;