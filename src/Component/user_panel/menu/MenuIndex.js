import React, { useEffect, useState } from "react";
import "./index.css";
import { useDispatch, useSelector } from "react-redux";
import { REQUEST_CATEGORY } from "../../../store/category/categoryActionType";
import { LOGOUT_REQUEST } from "../../../store/auth/AuthAction";
import img2 from "../../images/raja_home.png";
import img from "../../images/maharaj.png";
import { IoArrowBack } from "react-icons/io5";
import { CgLogOut } from "react-icons/cg";
import { useLocation, NavLink } from "react-router-dom";

const Menu = ({ updateName, sendData, stateUpdate, setSelectedCategory }) => {
  const dispatch = useDispatch();
  const [initialized, setInitialized] = useState(false);
  const [click, setClick] = useState("");
  const currentLocation = useLocation();

  const categories = useSelector((state) => state.category.categories);

  useEffect(() => {
    if (!initialized) {
      dispatch({ type: REQUEST_CATEGORY });
      setInitialized(true);
    }
  }, [dispatch, initialized]);

  useEffect(() => {
    if (categories?.length > 0 && !click) {
      setClick(categories[0].name);
      updateName(categories[0].name);
      sendData(categories[0]);
      stateUpdate(false);
      setSelectedCategory(categories[0]);
    }
  }, [
    categories,
    click,
    updateName,
    sendData,
    stateUpdate,
    setSelectedCategory,
  ]);

  const handleClick = (item) => {
    setClick(item.name);
    updateName(item.name);
    sendData(item);
    stateUpdate(false);
    setSelectedCategory(item);
  };

  const handleLogout = () => {
    dispatch({ type: LOGOUT_REQUEST });
  };

  return (
    <div className="menu-container">
      <div className="menu_list">
        <div className="menu_icon">
          {currentLocation.pathname === "/stock" ? (
            <NavLink to="/dashboard">
              <div
                className="back-btn"
                style={{
                  color: "rgb(87 15 119)",
                  height: "14vh",
                  display: "flex",
                  alignItems: "center",
                  fontSize: "xx-large",
                }}
              >
                <IoArrowBack />
              </div>
            </NavLink>
          ) : (
            <img src={img2} alt="Menu Logo" className="raja-home" />
          )}
        </div>
        <div className="menu_box">
          <div className="menu_lists">
            {categories &&
              categories.map((item, id) => (
                <div
                  className={
                    currentLocation.pathname === "/stock"
                      ? `purchase_category_name ${
                          item.name === click ? "active" : ""
                        }`
                      : `category_name ${item.name === click ? "active" : ""}`
                  }
                  key={id}
                  onClick={() => handleClick(item)}
                >
                  <strong style={{ userSelect: "none" }}>{item.name}</strong>
                </div>
              ))}
          </div>
          <div>
            <button
              className="logout_button"
              onClick={handleLogout}
              style={{
                background:
                  currentLocation.pathname === "/stock"
                    ? "rgb(87 15 119)"
                    : "rgb(97, 37, 17)",
              }}
            >
              <CgLogOut style={{ fontSize: "1rem" }} />
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Menu;
