import React, { useState } from "react";
import "./modalstyle.css";
import { CREATE_USER_REQUEST } from "../../../store/auth/AuthAction";
import { useDispatch } from "react-redux";

const CreateUser = ({ closeModal }) => {
  const dispatch = useDispatch();
  const [userData, setUserData] = useState({ userType: "MANAGER" });
  const [errors, setErrors] = useState({});

  const handleChange = (event) => {
    setUserData({
      ...userData,
      [event.target.name]: event.target.value,
    });
    setErrors({ ...errors, [event.target.name]: "" });
  };

  const validate = () => {
    const newErrors = {};
    const password = userData.password || "";

    if (!userData.fullName) {
      newErrors.fullName = " * Full Name is required";
    }

    if (!userData.userName) {
      newErrors.userName = " * UserName is required";
    }

    if (!password) {
      newErrors.password = " * Password is required";
    } else if (
      password.length < 6 ||
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/[0-9]/.test(password) ||
      !/[!@#$%^&*]/.test(password)
    ) {
      newErrors.password =
        " * Password must be at least 6 characters, with an uppercase, lowercase, number, and special character.";
    }

    return newErrors;
  };

  const handleCreateUser = async () => {
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
    } else {
      try {
        await dispatch({ type: CREATE_USER_REQUEST, payload: userData });
        closeModal();
      } catch (error) {
        throw error;
      }
    }
  };

  return (
    <>
      <div className="admin-modal show">
        <div className="admin-modal-content">
          <div className="flexbtw">
            <h3 className="modal-title">Create User</h3>
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
                  onChange={handleChange}
                />
                {errors.fullName && (
                  <span className="error-message">{errors.fullName}</span>
                )}
              </label>
              <label className="modal-label">
                User Name:
                <input
                  id="userName"
                  type="text"
                  name="userName"
                  className="modal-input"
                  onChange={handleChange}
                />
                {errors.userName && (
                  <span className="error-message">{errors.userName}</span>
                )}
              </label>
              <label className="modal-label">
                Password:
                <input
                  id="password"
                  type="password"
                  name="password"
                  className="modal-input"
                  onChange={handleChange}
                />
                {errors.password && (
                  <span className="error-message">{errors.password}</span>
                )}
              </label>
              <label className="modal-label">
                UserType:
                <select
                  id="userType"
                  name="userType"
                  className="modal-input"
                  onChange={handleChange}
                  defaultValue={"MANAGER"}
                >
                  <option value="MANAGER">Manager</option>
                  <option value="USER">User</option>
                </select>
              </label>
            </div>
            <div className="modal-bottom-btn">
              <button
                className="modal-btn"
                type="submit"
                onClick={handleCreateUser}
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
    </>
  );
};

export default CreateUser;
