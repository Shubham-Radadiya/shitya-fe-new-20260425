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

const AdminHome = () => {
  const dispatch = useDispatch();
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
        <table className="user-table">
          <thead>
            <tr>
              <th style={{ width: "8%" }}>Sr. No.</th>
              <th>Name</th>
              <th style={{ width: "25%" }}>Email ID</th>
              <th>User Type</th>
              <th>Password</th>
              <th style={{ width: "8%" }}>Action</th>
            </tr>
          </thead>
          <tbody style={{ maxHeight: "70vh", overflowY: "auto" }}>
            {users.map((user, index) => (
              <tr
                key={user._id}
                className={index % 2 === 0 ? "even-row" : "odd-row"}
              >
                <td className="serial-no" style={{ width: "8%" }}>
                  {index + 1}
                </td>
                <td>{user.fullName}</td>
                <td style={{ width: "25%" }}>{user.userName}</td>
                <td>{user.userType}</td>
                <td className="flexgap">
                  <div>
                    {visiblePasswords[user._id] ? user.password : "******"}
                  </div>
                  {visiblePasswords[user._id] ? (
                    <LuEye
                      onClick={() => handleTogglePassword(user._id)}
                      style={{
                        fontSize: "1.2rem",
                        position: "relative",
                        top: "0.1rem",
                        cursor:"pointer" 
                      }}
                    />
                  ) : (
                    <LuEyeOff
                      onClick={() => handleTogglePassword(user._id)}
                      style={{ fontSize: "1rem",cursor:"pointer" }}
                    />
                  )}
                </td>
                <td style={{ width: "8%" }}>
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
