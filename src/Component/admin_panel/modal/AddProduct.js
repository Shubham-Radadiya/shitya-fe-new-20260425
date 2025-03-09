import React, { useState, useEffect } from "react";
import "./modalstyle.css";
import { CREATE_PRODUCT_REQUEST } from "../../../store/product/ProductAction";
import { useDispatch, useSelector } from "react-redux";
import { REQUEST_CATEGORY } from "../../../store/category/categoryActionType";
import { REQUEST_SUBCATEGORY } from "../../../store/subcategory/SubCategoryAction";

const AddProduct = ({ closeModal }) => {
  const dispatch = useDispatch();
  const [productData, setProductData] = useState({ image: "./" });
  const [subCatgeroty, setSubcategory] = useState({});
  const categories = useSelector((state) => state.category.categories);

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (name === 'categoryId') {
      const selectedCategoryData = categories.find(
        (category) => category._id === value
      );
      setSubcategory(selectedCategoryData); 
    } else {
      setProductData({
        ...productData,
        [name]: value,
      });
    }
  };

  const HandleCreateProduct = async () => {
    try {
      await dispatch({ type: CREATE_PRODUCT_REQUEST, payload: productData });
      closeModal();
    } catch (error) {
      throw error;
    }
  };

  useEffect(() => {
    dispatch({ type: REQUEST_CATEGORY });
    dispatch({ type: REQUEST_SUBCATEGORY });
  }, [dispatch]);

  return (
    <>
      <div className="admin-modal show">
        <div className="admin-modal-content">
          <div className="flexbtw">
            <h3 className="modal-title">Add Product</h3>
            <span className="closeicon" onClick={closeModal}>
              &times;
            </span>
          </div>
          <div className="modal-form">
            <div className="modal-label">
            <label className="modal-label">
                Category:
                <select
                  className="modal-input"
                  id="categoryId"
                  name="categoryId"
                  onChange={handleChange}
                >
                  <option value="" disabled selected>
                    Category
                  </option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
            <label className="modal-label">
                Sub Category:
                <select
                  className="modal-input"
                  id="subCategoryId"
                  name="subCategoryId"
                  onChange={handleChange}
                >
                  <option value="" disabled selected>
                    Sub Category
                  </option>
                  {subCatgeroty?.subCategory?.map((subCategory) => (
                    <option key={subCategory._id} value={subCategory._id}>
                      {subCategory.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="modal-label">
                Product ID:
                <input
                  id="productId"
                  type="text"
                  name="productId"
                  className="modal-input"
                  onChange={handleChange}
                />
              </label>
              <label className="modal-label">
                Product Name:
                <input
                  id="name"
                  type="text"
                  name="name"
                  className="modal-input"
                  onChange={handleChange}
                />
              </label>
              <label className="modal-label">
                Price:
                <input
                  id="price"
                  type="number"
                  name="price"
                  className="modal-input"
                  onChange={handleChange}
                />
              </label>
            </div>
            <div className="modal-bottom-btn">
              <button
                className="modal-btn"
                type="button"
                onClick={HandleCreateProduct}
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

export default AddProduct;
