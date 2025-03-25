import React, { useEffect, useState } from "react";
import { MdEdit, MdOutlineDeleteOutline } from "react-icons/md";
import "./index.css";
import { SlArrowDown } from "react-icons/sl";
import { useDispatch } from "react-redux";
import { REQUEST_CATEGORY } from "../../../store/category/categoryActionType";
import RemoveProduct from "../modal/RemoveProduct";
import RemoveSubcategory from "../modal/RemoveSubcategory";
import UpdateSubCategory from "../modal/UpdateSubcategory";
import UpdateProduct from "../modal/UpdateProduct";
import AddStockModal from "../modal/AddStockModal";

const InnerTable = ({
  subCategories,
  toggleProductState,
  showProductState,
  handleDelete,
  pageType,
}) => {
  const dispatch = useDispatch();
  const [showSubCategoryModal, setShowSubCategoryModal] = useState(false);
  const [showRemoveProductModal, setShowRemoveProductModal] = useState(false);
  const [showRemoveSubCategoryModal, setShowRemoveSubCategoryModal] =
    useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [deleteData, setDeleteData] = useState({ id: null, type: null });

  useEffect(() => {
    dispatch({ type: REQUEST_CATEGORY });
  }, [dispatch]);

  const openRemoveProductModal = (id) => {
    setDeleteData({ id, type: "product" });
    setShowRemoveProductModal(true);
  };

  const openRemoveSubCategoryModal = (id) => {
    setDeleteData({ id, type: "subcategory" });
    setShowRemoveSubCategoryModal(true);
  };

  const handleRemoveConfirm = () => {
    handleDelete(deleteData.id, deleteData.type);
    setShowRemoveProductModal(false);
    setShowRemoveSubCategoryModal(false);
  };

  const handleEditSubCategory = (subCategory) => {
    setShowSubCategoryModal(subCategory._id);
  };

  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setShowProductModal(true);
  };

  const role = localStorage.getItem("role");

  return (
    <>
      {subCategories.length === 0 ? (
        <tr>
          <td
            colSpan="6"
            style={{
              textAlign: "center",
              color: "#888",
              borderBottom: "1px solid #ccc",
            }}
          >
            No data found
          </td>
        </tr>
      ) : (
        subCategories.map((subcategory) => (
          <React.Fragment key={subcategory._id}>
            <tr style={{ borderBottom: "1px solid #ccc" }}>
              <td width={"12%"}></td>
              <td
                onClick={() => toggleProductState(subcategory._id)}
                className="innercell"
                width={"21%"}
              >
                <div
                  style={{ display: "flex", gap: "1rem", cursor: "pointer" }}
                >
                  <SlArrowDown />
                  {subcategory.name}
                </div>
              </td>
              <td width={"13%"}></td>
              <td width={"22%"}></td>
              <td width={"13%"}></td>
              <td className="product-action">
                {pageType === "product" && (
                  <button
                    className="product-action-btn"
                    onClick={() => handleEditSubCategory(subcategory)}
                  >
                    <MdEdit className="action_icon" />
                    Edit
                  </button>
                )}
                {role === "SUPER ADMIN" && pageType === "product" && (
                  <button
                    className="product-action-btn"
                    onClick={() => openRemoveSubCategoryModal(subcategory._id)}
                  >
                    <MdOutlineDeleteOutline className="action_icon" />
                    Delete
                  </button>
                )}
              </td>
            </tr>
            {showProductState === subcategory._id && (
              <>
                {subcategory.products.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      style={{
                        textAlign: "center",
                        color: "#888",
                        borderBottom: "1px solid #ccc",
                      }}
                    >
                      No data found
                    </td>
                  </tr>
                ) : (
                  subcategory.products.map((product) => (
                    <tr
                      key={product._id}
                      style={{ borderBottom: "1px solid #ccc" }}
                    >
                      <td width={"12%"}></td>
                      <td width={"21%"}></td>
                      <td width={"13%"}>{product.productId}</td>
                      <td width={"22%"}>{product.name}</td>
                      <td width={"13%"}>
                        {pageType === "product"
                          ? `${product.price}`
                          : product.quantity ?? 0}
                      </td>

                      <td className="product-action">
                        <button
                          className="product-action-btn"
                          onClick={() =>
                            pageType === "product"
                              ? handleEditProduct(product)
                              : (setSelectedProduct(product),
                                setShowStockModal(true))
                          }
                        >
                          <MdEdit className="action_icon" />
                          Edit
                        </button>
                        {role === "SUPER ADMIN" && pageType === "product" && (
                          <button
                            className="product-action-btn"
                            onClick={() => openRemoveProductModal(product._id)}
                          >
                            <MdOutlineDeleteOutline className="action_icon" />
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </>
            )}
          </React.Fragment>
        ))
      )}
      {showSubCategoryModal && (
        <UpdateSubCategory
          closeModal={() => setShowSubCategoryModal(false)}
          subCategory={subCategories.find(
            (sub) => sub._id === showSubCategoryModal
          )}
          subCategoryId={showSubCategoryModal}
        />
      )}
      {showProductModal && (
        <UpdateProduct
          closeModal={() => setShowProductModal(false)}
          product={selectedProduct}
          productId={selectedProduct?._id}
        />
      )}
      {showRemoveProductModal && (
        <RemoveProduct
          closeModal={() => setShowRemoveProductModal(false)}
          confirmRemove={handleRemoveConfirm}
          productId={deleteData.id}
        />
      )}
      {showRemoveSubCategoryModal && (
        <RemoveSubcategory
          closeModal={() => setShowRemoveSubCategoryModal(false)}
          confirmRemove={handleRemoveConfirm}
          subcategoryId={deleteData.id}
        />
      )}
      {showStockModal && selectedProduct && (
        <AddStockModal
          closeModal={() => setShowStockModal(false)}
          isEdit={true}
          initialData={selectedProduct}
        />
      )}
    </>
  );
};

export default InnerTable;
