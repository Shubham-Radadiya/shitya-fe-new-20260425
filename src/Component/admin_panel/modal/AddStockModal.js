import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { REQUEST_STOCK_QUANTITY } from "../../../store/product/ProductAction";
import { REQUEST_CATEGORY } from "../../../store/category/categoryActionType";

const AddStockModal = ({ closeModal, isEdit = false, initialData = {} }) => {
  const dispatch = useDispatch();
  const [productData, setProductData] = useState(
    isEdit
      ? initialData
      : {
          image: "./",
          categoryId: "",
          subCategoryId: "",
          productId: "",
          quantity: "",
        }
  );
  const [subCategories, setSubCategories] = useState([]);
  const [products, setProducts] = useState([]);

  const categories = useSelector((state) => state.category.categories);

  useEffect(() => {
    dispatch({ type: REQUEST_CATEGORY });
  }, [dispatch]);

  useEffect(() => {
    console.log("Initial Data for Edit:", initialData);
    if (isEdit && initialData) {
      setProductData(initialData);

      if (initialData.categoryId) {
        const selectedCategory = categories.find(
          (category) => category._id === initialData.categoryId
        );
        setSubCategories(selectedCategory?.subCategory || []);
      }

      if (initialData.subCategoryId) {
        const selectedSubCategory = subCategories.find(
          (sub) => sub._id === initialData.subCategoryId
        );
        setProducts(selectedSubCategory?.products || []);
      }
    }
  }, [isEdit, initialData, categories, subCategories]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (name === "categoryId") {
      const selectedCategory = categories.find(
        (category) => category._id === value
      );
      setSubCategories(selectedCategory?.subCategory || []);
      setProducts([]);
      setProductData({
        ...productData,
        categoryId: value,
        subCategoryId: "",
        productId: "",
        quantity: "",
      });
    } else if (name === "subCategoryId") {
      const selectedSubCategory = subCategories.find(
        (sub) => sub._id === value
      );
      setProducts(selectedSubCategory?.products || []);
      setProductData({
        ...productData,
        subCategoryId: value,
        productId: "",
        quantity: "",
      });
    } else {
      setProductData({
        ...productData,
        [name]: value,
      });
    }
  };

  const handleUpdateStock = async () => {
    try {
      if (!productData.productId || !productData.quantity) {
        toast.error("Please select a product and enter a quantity.");
        return;
      }
      const updateData = { quantity: productData.quantity };
      await dispatch({
        type: REQUEST_STOCK_QUANTITY,
        payload: {
          data: updateData,
          id: isEdit ? productData._id : productData.productId,
        },
      });
      dispatch({ type: REQUEST_CATEGORY });
      setProductData((prev) => ({ ...prev, quantity: updateData.quantity }));
      closeModal();
    } catch (error) {
      toast.error("Error updating stock:", error);
    }
  };

  return (
    <div className="admin-modal show">
      <div className="admin-modal-content">
        <div className="flexbtw">
          <h3 className="modal-title">{isEdit ? "Edit Stock" : "Add Stock"}</h3>
          <span className="closeicon" onClick={closeModal}>
            &times;
          </span>
        </div>
        <div className="modal-form">
          <label className="modal-label">
            Category:
            <select
              className="modal-input"
              name="categoryId"
              onChange={handleChange}
              value={productData.categoryId || ""}
              disabled={isEdit}
            >
              <option value="" disabled>
                Select Category
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
              name="subCategoryId"
              onChange={handleChange}
              value={productData.subCategoryId || ""}
              disabled={isEdit}
            >
              <option value="" disabled>
                Select Sub Category
              </option>
              {subCategories.map((subCategory) => (
                <option key={subCategory._id} value={subCategory._id}>
                  {subCategory.name}
                </option>
              ))}
            </select>
          </label>
          <label className="modal-label">
            Product:
            {isEdit ? (
              <input
                type="text"
                className="modal-input"
                value={productData?.name || "N/A"}
                readOnly
              />
            ) : (
              <select
                className="modal-input"
                name="productId"
                onChange={handleChange}
              >
                <option value="" disabled selected>
                  Select Product
                </option>
                {products.map((product) => (
                  <option key={product._id} value={product._id}>
                    {product.name}
                  </option>
                ))}
              </select>
            )}
          </label>
          <label className="modal-label">
            Quantity
            <input
              type="text"
              name="quantity"
              className="modal-input"
              value={productData.quantity || ""}
              onChange={handleChange}
            />
          </label>
          <div className="modal-bottom-btn">
            <button
              className="modal-btn"
              type="button"
              onClick={handleUpdateStock}
            >
              {isEdit ? "Update" : "Submit"}
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

export default AddStockModal;
