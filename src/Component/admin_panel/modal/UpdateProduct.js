import React, { useState, useEffect } from "react";
import "./modalstyle.css";
import { REQUEST_UPDATE_PRODUCT } from "../../../store/product/ProductAction";
import { useDispatch, useSelector } from "react-redux";
import { REQUEST_CATEGORY } from "../../../store/category/categoryActionType";
import { REQUEST_SUBCATEGORY } from "../../../store/subcategory/SubCategoryAction";
import { toast } from "react-toastify";

const UpdateProduct = ({ closeModal, product, productId }) => {
  const dispatch = useDispatch();
  const [productData, setProductData] = useState(product || {});
  const [subCategoryData, setSubCategoryData] = useState({});
  const categories = useSelector((state) => state.category.categories);

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (name === 'categoryId') {
      const selectedCategory = categories.find((category) => category._id === value);
      setSubCategoryData(selectedCategory); 
    } else {
      setProductData({
        ...productData,
        [name]: value,
      });
    }
  };

  const handleUpdateProduct = async () => {
    try {
      const updateData = { name: productData.name, subCategoryId: productData.subCategoryId, price:productData.price, productId: productData.productId };
      await dispatch({ type: REQUEST_UPDATE_PRODUCT, payload: { data: updateData, id: productId } });
      closeModal();
    } catch (error) {
      toast.error("Error updating product:", error);
    }
  };

  useEffect(() => {
    dispatch({ type: REQUEST_CATEGORY });
    dispatch({ type: REQUEST_SUBCATEGORY });
  }, [dispatch]);

  return (
    <div className="admin-modal show">
      <div className="admin-modal-content">
        <div className="flexbtw">
          <h3 className="modal-title">Update Product</h3>
          <span className="closeicon" onClick={closeModal}>&times;</span>
        </div>
        <div className="modal-form">
          <div className="modal-label">
          <label className="modal-label">
              Category:
              <select
                className="modal-input"
                id="categoryId"
                name="categoryId"
                value={productData.categoryId || ''}
                onChange={handleChange}
              >
                <option value="" disabled>Select Category</option>
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
                value={productData.subCategoryId || ''}
                onChange={handleChange}
              >
                <option value="" disabled>Select Sub Category</option>
                {subCategoryData?.subCategory?.map((subCategory) => (
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
                value={productData.productId || ''}
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
                value={productData.name || ''}
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
                value={productData.price || ''}
                onChange={handleChange}
              />
            </label>
          </div>
          <div className="modal-bottom-btn">
            <button className="modal-btn" type="button" onClick={handleUpdateProduct}>Submit</button>
            <button className="modal-btn" type="button" onClick={closeModal}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateProduct;
