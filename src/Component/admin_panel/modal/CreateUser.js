import React, { useState, useEffect } from "react";
import "./modalstyle.css";
import { CREATE_USER_REQUEST } from "../../../store/auth/AuthAction";
import { useDispatch } from "react-redux";
import { loadBranchOptionsForForms } from "../../../utils/branchOptionsClient";
import { loginUserNameHint, validateLoginUserNameMessage } from "../../../utils/loginUserName";

const CreateUser = ({ closeModal }) => {
  const dispatch = useDispatch();
  const [branchOptions, setBranchOptions] = useState(["KUD"]);
  const [userData, setUserData] = useState({
    userType: "MANAGER",
    branchName: "KUD",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const opts = await loadBranchOptionsForForms();
      if (!cancelled && opts.length) {
        setBranchOptions(opts);
        setUserData((prev) => ({
          ...prev,
          branchName: opts.includes(prev.branchName)
            ? prev.branchName
            : opts[0],
        }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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

    const userNameErr = validateLoginUserNameMessage(userData.userName);
    if (userNameErr) {
      newErrors.userName = userNameErr;
    }

    if (!userData.branchName || !String(userData.branchName).trim()) {
      newErrors.branchName = " * Branch name is required";
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
        await dispatch({
          type: CREATE_USER_REQUEST,
          payload: {
            ...userData,
            branchName: String(userData.branchName).trim().toUpperCase(),
          },
        });
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
            <div className="modal-field">
              <div className="create-user-modal-section">
                <p className="create-user-modal-section-title">Branch</p>
                <p className="create-user-modal-hint">
                  Every user belongs to one branch. They sign in with the same
                  branch and user name.
                </p>
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
                  {errors.branchName && (
                    <span className="error-message">{errors.branchName}</span>
                  )}
                </label>
              </div>

              <div className="create-user-modal-section">
                <p className="create-user-modal-section-title">
                  User under this branch
                </p>
                <div className="create-user-under-branch">
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
                    User Role:
                    <select
                      id="userType"
                      name="userType"
                      className="modal-input"
                      value={userData.userType || "MANAGER"}
                      onChange={handleChange}
                    >
                      <option value="MANAGER">Manager</option>
                      <option value="USER">User</option>
                    </select>
                  </label>
                </div>
              </div>
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
