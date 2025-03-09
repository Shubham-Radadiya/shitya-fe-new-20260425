import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { MdEdit, MdOutlineDeleteOutline } from "react-icons/md";
import { IoIosAddCircle } from "react-icons/io";
import AddProduct from "../modal/AddProduct";
import SubCategory from "../modal/SubCategory";
import RemoveCategory from "../modal/RemoveCategory";
import UpdateCategory from "../modal/UpdateCategory";
import { REQUEST_CATEGORY } from "../../../store/category/categoryActionType";
import "./index.css";
import { SlArrowDown } from "react-icons/sl";
import InnerTable from "./InnerTable";
import Category from "../modal/Category";

const Product = () => {
  const dispatch = useDispatch();
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showUpdateCategoryModal, setShowUpdateCategoryModal] = useState(false);
  const [showSubCategoryModal, setShowSubCategoryModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [showDetailState, setShowDetailState] = useState(null);
  const [showProductState, setShowProductState] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  const toggleDetailState = (state) => {
    setShowDetailState(showDetailState === state ? null : state);
  };

  const toggleProductState = (state) => {
    setShowProductState(showProductState === state ? null : state);
  };

  const categories = useSelector((state) => state.category.categories);

  useEffect(() => {
    dispatch({ type: REQUEST_CATEGORY });
  }, [dispatch]);

  const handleRemoveConfirm = () => {
    setShowRemoveModal(false);
  };

  const handleEditCategory = (category) => {
    setSelectedCategory(category);
    setShowUpdateCategoryModal(true);
  };

  const role = localStorage.getItem("role");

  return (
    <div className="product-container">
      <div className="create-buttons">
        <div className="flexgap">
          <button
            className="add-btn modalbtn"
            onClick={() => setShowCategoryModal(true)}
          >
            <IoIosAddCircle className="add-icon" />
            Category
          </button>
          <button
            className="add-btn modalbtn"
            onClick={() => setShowSubCategoryModal(true)}
          >
            <IoIosAddCircle className="add-icon" />
            Sub-Category
          </button>
          <button
            className="add-btn modalbtn"
            onClick={() => setShowProductModal(true)}
          >
            <IoIosAddCircle className="add-icon" />
            Product
          </button>
        </div>
      </div>
      <div className="table-container">
        <table className="product-table">
          <thead>
            <tr>
              <th width={"12%"}>Category</th>
              <th width={"20%"}>Sub-Category</th>
              <th width={"13%"}>Product ID</th>
              <th width={"22%"}>Name</th>
              <th width={"13%"}>Price</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <React.Fragment key={category._id}>
                <tr style={{ borderBottom: "1px solid #ccc" }}>
                  <td
                    onClick={() => toggleDetailState(category._id)}
                    className="innercell"
                    width={"12%"}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: "1rem",
                        cursor: "pointer",
                      }}
                    >
                      <SlArrowDown />
                      {category.name}
                    </div>
                  </td>
                  <td width={"21%"}></td>
                  <td width={"13%"}></td>
                  <td width={"22%"}></td>
                  <td width={"13%"}></td>
                  <td className="product-action">
                    <button
                      className="product-action-btn"
                      onClick={() => handleEditCategory(category)}
                    >
                      <MdEdit className="action_icon" />
                      Edit
                    </button>
                    {role === "SUPER ADMIN" && (
                      <button
                        className="product-action-btn"
                        onClick={() => {
                          setCategoryToDelete(category._id);
                          setShowRemoveModal(true);
                        }}
                      >
                        <MdOutlineDeleteOutline className="action_icon" />
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
                {showDetailState === category._id && (
                  <InnerTable
                    subCategories={category.subCategory}
                    toggleProductState={toggleProductState}
                    showProductState={showProductState}
                    pageType="product"
                  />
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      {showProductModal && (
        <AddProduct closeModal={() => setShowProductModal(false)} />
      )}
      {showCategoryModal && (
        <Category closeModal={() => setShowCategoryModal(false)} />
      )}
      {showSubCategoryModal && (
        <SubCategory closeModal={() => setShowSubCategoryModal(false)} />
      )}
      {showUpdateCategoryModal && (
        <UpdateCategory
          closeModal={() => setShowUpdateCategoryModal(false)}
          category={selectedCategory}
          categoryID={selectedCategory ? selectedCategory._id : null}
        />
      )}
      {showRemoveModal && (
        <RemoveCategory
          closeModal={() => setShowRemoveModal(false)}
          confirmRemove={handleRemoveConfirm}
          categoryId={categoryToDelete}
        />
      )}
    </div>
  );
};

export default Product;
