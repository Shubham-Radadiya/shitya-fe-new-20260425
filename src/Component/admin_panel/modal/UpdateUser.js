import React, { useState, useEffect } from "react";
import "./modalstyle.css";
import { REQUEST_UPDATE_USER } from "../../../store/auth/AuthAction";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";

const UpdateUser = ({ closeModal, user }) => {
  const dispatch = useDispatch();
  const [userData, setUserData] = useState({
    fullName: user?.fullName || "",
    userName: user?.userName || "",
    password: user?.password || "",
    userType: user?.userType || "manager",
  });

  useEffect(() => {
    if (user) {
      setUserData({
        fullName: user.fullName,
        userName: user.userName,
        password: user.password,
        userType: user.userType,
      });
    }
  }, [user]);

  const handleChange = (event) => {
    setUserData({
      ...userData,
      [event.target.name]: event.target.value,
    });
  };

  const handleUpdateUser = async () => {
    try {
      await dispatch({ type: REQUEST_UPDATE_USER, payload: { data: userData, id: user._id } });
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
              Full Name:
              <input
                id="fullName"
                type="text"
                name="fullName"
                className="modal-input"
                value={userData.fullName}
                onChange={handleChange}
              />
            </label>
            <label className="modal-label">
              Email ID:
              <input
                id="userName"
                type="text"
                name="userName"
                className="modal-input"
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
              UserType:
              <select
                id="userType"
                name="userType"
                className="modal-input"
                value={userData.userType}
                onChange={handleChange}
              >
                <option disabled>Select User Type</option>
                <option value="MANAGER">Manager</option>
                <option value="USER">User</option>
              </select>
            </label>
          </div>
          <div className="modal-bottom-btn">
            <button className="modal-btn" type="submit" onClick={handleUpdateUser}>
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