import React from 'react'
import { useAuth } from '../../../store/auth/AuthReducers';

 const ReportUserlist = ({selectedUser,setSelectedUser}) => {
    const users = useAuth();
    const handleUserChange = (user) => {
        setSelectedUser(user);
        // dispatch({ type: FILTER_DAILY, payload: user ? filteredReport : dailyreport });
      };
  return (
    <>
     <div className="flexgap user-btns-box">
          <button
            className={`report-user-btn ${selectedUser === null ? "selected-user" : ""}`}
            onClick={() => handleUserChange(null)}
          >
            All
          </button>
          <div className="flexgap">
            {users.map(
              (user, index) =>
                user.userType === "USER" && (
                  <button
                    key={index}
                    className={`report-user-btn ${
                      selectedUser?.fullName === user.fullName ? "selected-user" : ""
                    }`}
                    onClick={() => handleUserChange(user)}
                  >
                    {user.fullName}
                  </button>
                )
            )}
          </div>
        </div>
    </>
  )
}

export default ReportUserlist;
