import React, { useState, useEffect } from "react";
import "./index.css";
import loginghanu from "../images/login-ghanu.png";
import loginguruji from "../images/login-guruji.png";
import { useDispatch } from "react-redux";
import { LOGIN_REQUEST } from "../../store/auth/AuthAction";
import { loadBranchOptionsForForms } from "../../utils/branchOptionsClient";
import {
  isValidLoginUserName,
  loginUserNameHint,
} from "../../utils/loginUserName";
import { toast } from "react-toastify";

const Login = () => {
  const dispatch = useDispatch();
  const [branchOptions, setBranchOptions] = useState(["KUD"]);
  const [loginData, setLoginData] = useState({
    branchName: "KUD",
    userName: "",
    password: "",
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const opts = await loadBranchOptionsForForms();
      if (!cancelled && opts.length) {
        setBranchOptions(opts);
        setLoginData((prev) => {
          if (prev.branchName === "") return prev;
          if (opts.includes(prev.branchName)) return prev;
          return { ...prev, branchName: opts[0] ?? "KUD" };
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleChange = (event) => {
    setLoginData({
      ...loginData,
      [event.target.name]: event.target.value,
    });
  };

  const SubmitLogin = async () => {
    if (!isValidLoginUserName(loginData.userName)) {
      toast.error(loginUserNameHint);
      return;
    }
    try {
      await dispatch({
        type: LOGIN_REQUEST,
        payload: {
          userName: loginData.userName,
          branchName: (loginData.branchName || "").trim().toUpperCase(),
          password: loginData.password,
        },
      });
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
              <label htmlFor="branchName">
                Branch name{" "}
                <span style={{ fontWeight: 400, fontSize: "0.85em" }}>
                  (optional for admin / manager)
                </span>
                :
              </label>
              <select
                id="branchName"
                name="branchName"
                className="login-input-select"
                value={loginData.branchName}
                onChange={handleChange}
              >
                <option value="">
                  — Skip (admin / manager only)
                </option>
                {branchOptions.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="userName">Username</label>
              <input
                id="userName"
                name="userName"
                type="text"
                inputMode="text"
                autoComplete="off"
                placeholder="e.g. admin or test"
                title={loginUserNameHint}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password:</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                onChange={handleChange}
                required
              />
            </div>
            <button
              className="login-btn"
              type="submit"
              onClick={SubmitLogin}
            >
              Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
