import React, { useEffect, useState, useRef } from "react";
import "./index.css";
import { useDispatch, useSelector } from "react-redux";
import { REQUEST_CATEGORY } from "../../../store/category/categoryActionType";
import { useLocation } from "react-router-dom";

const MenuVariety = ({ selectedCategory, setSelectedSubCategory }) => {
  const dispatch = useDispatch();
  const currentLocation = useLocation();
  const [names, setNames] = useState("");
  const scrollContainerRef = useRef(null);

  const categories = useSelector((state) => state.category.categories);

  useEffect(() => {
    if (selectedCategory && selectedCategory._id) {
      dispatch({ type: REQUEST_CATEGORY, categoryId: selectedCategory._id });
      setSelectedSubCategory(null);
    }
  }, [dispatch, selectedCategory, setSelectedSubCategory]);

  const selectedCategoryData = categories.find(
    (category) => category._id === selectedCategory?._id
  );

  const handleSubCategoryClick = (subCat) => {
    setNames(subCat.name);
    setSelectedSubCategory(subCat._id);
    localStorage.setItem("selectedSubCategoryName", subCat.name);
  };

  return (
    <div
      style={{
        height: "6vh",
        width: "68.6vw",
        alignItems: "center",
        justifyContent: "left",
        display: "flex",
        textAlign: "center",
        position: "relative",
      }}
    >
      <div className="scroll-container" ref={scrollContainerRef}>
        {selectedCategoryData?.subCategory?.map((subcategory) => (
          <div
            key={subcategory._id}
            className={
              currentLocation.pathname === "/stock"
                ? `purchase_subcategory_contain ${
                    subcategory.name === names ? "active" : ""
                  }`
                : currentLocation.pathname === "/bhet" ? `bhet_subcategory_contain ${
                    subcategory.name === names ? "active" : ""
                  }` : `subcategory_contain ${
                    subcategory.name === names ? "active" : ""
                  }`
            }
            style={{ padding: "1rem" }}
            onClick={() => handleSubCategoryClick(subcategory)}
          >
            <h4 className="subcategory_name" style={{ userSelect: "none" }}>
              {subcategory.name}
            </h4>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MenuVariety;
