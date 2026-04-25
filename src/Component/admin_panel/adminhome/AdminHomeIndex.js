import React, { useEffect, useState } from "react";
import "./index.css";
import { IoIosAddCircle } from "react-icons/io";
import CreateUser from "../modal/CreateUser";
import UpdateUser from "../modal/UpdateUser";
import { useDispatch } from "react-redux";
import {
  REQUEST_USER,
  REQUEST_USER_PASSWORD,
} from "../../../store/auth/AuthAction";
import { useAuth } from "../../../store/auth/AuthReducers";
import { LuEyeOff, LuEye } from "react-icons/lu";
import { MdEdit } from "react-icons/md";
import { useAdminSession } from "../../../context/AdminSessionContext";
import { loginUserNameHint } from "../../../utils/loginUserName";

const AdminHome = () => {
  const dispatch = useDispatch();
  const { role: currentRole } = useAdminSession();
  const [showUserModal, setShowUserModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const users = useAuth();

  useEffect(() => {
    dispatch({ type: REQUEST_USER });
  }, [dispatch]);

  const handleTogglePassword = (userId) => {
    if (visiblePasswords[userId]) {
      setVisiblePasswords((prev) => ({
        ...prev,
        [userId]: !prev[userId],
      }));
    } else {
      dispatch({ type: REQUEST_USER_PASSWORD, payload: userId });
      setVisiblePasswords((prev) => ({
        ...prev,
        [userId]: true,
      }));
    }
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setShowUpdateModal(true);
  };

  return (
    <div className="admin-container">
      <div className="user-box">
        <button
          className="create-user-btn "
          onClick={() => setShowUserModal(true)}
        >
          <IoIosAddCircle className="add-icon" />
          Create User
        </button>
        <div className="user-table-scroll">
          <table
            className={`user-table ${
              currentRole === "SUPER ADMIN" ? "user-table--7" : "user-table--6"
            }`}
          >
            <colgroup>
              <col />
              <col />
              <col />
              <col />
              {currentRole === "SUPER ADMIN" && <col />}
              <col />
              <col />
            </colgroup>
            <thead>
              <tr>
                <th scope="col">Sr. No.</th>
                <th scope="col">Branch name</th>
                <th scope="col" title={loginUserNameHint}>
                  Username
                </th>
                <th scope="col">User Role</th>
                {currentRole === "SUPER ADMIN" && (
                  <th scope="col" title="Allow Settings menu (stall, paths, backup)">
                    Settings
                  </th>
                )}
                <th scope="col">Password</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <tr
                  key={user._id}
                  className={index % 2 === 0 ? "even-row" : "odd-row"}
                >
                  <td className="serial-no">{index + 1}</td>
                  <td>{user.branchName || "KUD"}</td>
                  <td>{user.userName}</td>
                  <td>{user.userType}</td>
                  {currentRole === "SUPER ADMIN" && (
                    <td>
                      {user.userType === "MANAGER"
                        ? user.canAccessSettings
                          ? "Yes"
                          : "No"
                        : "—"}
                    </td>
                  )}
                  <td>
                    <div className="user-table-password-cell">
                      <div className="user-table-password-mask">
                        {visiblePasswords[user._id] ? user.password : "******"}
                      </div>
                      {visiblePasswords[user._id] ? (
                        <LuEye
                          onClick={() => handleTogglePassword(user._id)}
                          style={{
                            fontSize: "1.2rem",
                            flexShrink: 0,
                            cursor: "pointer",
                          }}
                        />
                      ) : (
                        <LuEyeOff
                          onClick={() => handleTogglePassword(user._id)}
                          style={{
                            fontSize: "1rem",
                            flexShrink: 0,
                            cursor: "pointer",
                          }}
                        />
                      )}
                    </div>
                  </td>
                  <td>
                    <button
                      className="action_btn"
                      onClick={() => handleEditUser(user)}
                    >
                      <MdEdit className="action_icon" />
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {showUserModal && (
        <CreateUser closeModal={() => setShowUserModal(false)} />
      )}
      {showUpdateModal && (
        <UpdateUser
          closeModal={() => setShowUpdateModal(false)}
          user={selectedUser}
        />
      )}
    </div>
  );
};

export default AdminHome;
