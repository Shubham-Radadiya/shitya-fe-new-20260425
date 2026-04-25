import React, { useState, useEffect } from "react";
import "./modalstyle.css";
import { REQUEST_UPDATE_USER } from "../../../store/auth/AuthAction";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { useAdminSession } from "../../../context/AdminSessionContext";
import { loadBranchOptionsForForms } from "../../../utils/branchOptionsClient";
import {
  loginUserNameHint,
  validateLoginUserNameMessage,
} from "../../../utils/loginUserName";

const UpdateUser = ({ closeModal, user }) => {
  const dispatch = useDispatch();
  const { role: currentRole } = useAdminSession();
  const [branchOptions, setBranchOptions] = useState(["KUD"]);
  const [userData, setUserData] = useState({
    userName: user?.userName || "",
    branchName: user?.branchName || "KUD",
    password: user?.password || "",
    userType: user?.userType || "MANAGER",
    canAccessSettings: user?.canAccessSettings === true,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const opts = await loadBranchOptionsForForms();
      if (!cancelled && opts.length) {
        setBranchOptions(opts);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (user) {
      setUserData({
        userName: user.userName,
        branchName: user.branchName || "KUD",
        password: user.password,
        userType: user.userType,
        canAccessSettings: user.canAccessSettings === true,
      });
    }
  }, [user]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setUserData({
      ...userData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleUpdateUser = async () => {
    const userNameErr = validateLoginUserNameMessage(userData.userName);
    if (userNameErr) {
      toast.error(userNameErr.replace(/^\s*\*\s*/, "").trim());
      return;
    }
    try {
      const payload = { ...userData };
      if (!payload.password || !String(payload.password).trim()) {
        delete payload.password;
      }
      payload.branchName = String(payload.branchName || "KUD")
        .trim()
        .toUpperCase();
      if (payload.userType !== "MANAGER") {
        delete payload.canAccessSettings;
      } else if (currentRole !== "SUPER ADMIN") {
        delete payload.canAccessSettings;
      }
      /* Role is fixed for super admin accounts — omit so API keeps SUPER ADMIN */
      if (user.userType === "SUPER ADMIN") {
        delete payload.userType;
      }
      await dispatch({
        type: REQUEST_UPDATE_USER,
        payload: { data: payload, id: user._id },
      });
      closeModal();
    } catch (error) {
      toast.error("Update user error:", error);
    }
  };

  return (
    <div className="admin-modal show">
      <div className="admin-modal-content">
        <div className="flexbtw">
          <h3 className="modal-title">Update User</h3>
          <span className="closeicon" onClick={closeModal}>
            &times;
          </span>
        </div>
        <div className="modal-form">
          <div className="modal-label">
            <label className="modal-label">
              Branch name:
              <select
                id="branchName"
                name="branchName"
                className="modal-input"
                value={userData.branchName || "KUD"}
                onChange={handleChange}
              >
                {branchOptions.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            </label>
            <label className="modal-label">
              Username:
              <input
                id="userName"
                type="text"
                name="userName"
                className="modal-input"
                inputMode="text"
                autoComplete="off"
                placeholder="e.g. admin or test"
                title={loginUserNameHint}
                value={userData.userName}
                onChange={handleChange}
              />
            </label>
            <label className="modal-label">
              Password:
              <input
                id="password"
                type="password"
                name="password"
                className="modal-input"
                value={userData.password}
                onChange={handleChange}
              />
            </label>
            <label className="modal-label">
              User Role:
              {user?.userType === "SUPER ADMIN" ? (
                <input
                  id="userType"
                  type="text"
                  className="modal-input"
                  value="Super admin"
                  readOnly
                  disabled
                  title="Login user name (not email); role cannot be changed here"
                />
              ) : (
                <select
                  id="userType"
                  name="userType"
                  className="modal-input"
                  value={userData.userType}
                  onChange={handleChange}
                >
                  <option disabled value="">
                    Select User Role
                  </option>
                  <option value="MANAGER">Manager</option>
                  <option value="USER">User</option>
                </select>
              )}
            </label>
            {currentRole === "SUPER ADMIN" &&
              userData.userType === "MANAGER" && (
                <label
                  className="modal-label"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    name="canAccessSettings"
                    checked={!!userData.canAccessSettings}
                    onChange={handleChange}
                  />
                  Allow Settings menu (stall, paths, backup)
                </label>
              )}
          </div>
          <div className="modal-bottom-btn">
            <button
              className="modal-btn"
              type="submit"
              onClick={handleUpdateUser}
            >
              Submit
            </button>
            <button className="modal-btn" type="button" onClick={closeModal}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateUser;
