import React, { useState, useEffect } from "react";
import "./modalstyle.css";
import { useDispatch } from "react-redux";
import { REQUEST_UPDATE_CATEGORY } from "../../../store/category/categoryActionType";
import { toast } from "react-toastify";

const UpdateCategory = ({ closeModal, category, categoryID }) => {
  const dispatch = useDispatch();
  const [categoryName, setCategoryName] = useState(category?.name || "");

  const handleChange = (event) => {
    const { value } = event.target;
    setCategoryName(value);
  };

  const handleUpdateCategory = async () => {
    try {
      const updateData = { name: categoryName };
      await dispatch({
        type: REQUEST_UPDATE_CATEGORY,
        payload: { data: updateData, id: categoryID },
      });
      closeModal();
    } catch (error) {
      toast.error(error);
    }
  };

  useEffect(() => {
    if (category) {
      setCategoryName(category.name);
    }
  }, [category]);

  return (
    <div className="admin-modal show">
      <div className="admin-modal-content">
        <div className="flexbtw">
          <h3 className="modal-title">Update Category</h3>
          <span className="closeicon" onClick={closeModal}>
            &times;
          </span>
        </div>
        <div className="modal-form">
          <div>
            <label className="modal-label">
              Category Name:
              <input
                id="categoryName"
                type="text"
                name="categoryName"
                className="modal-input"
                value={categoryName}
                onChange={handleChange}
              />
            </label>
          </div>
          <div className="modal-bottom-btn">
            <button
              className="modal-btn"
              type="button"
              onClick={handleUpdateCategory}
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

export default UpdateCategory;
