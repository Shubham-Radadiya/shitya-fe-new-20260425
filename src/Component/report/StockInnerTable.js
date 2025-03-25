import React, { useState } from "react";
import { MdEdit, MdOutlineDeleteOutline } from "react-icons/md";
import { SlArrowDown, SlArrowRight } from "react-icons/sl";
import "./index.css";

const StockInnerTable = ({
  subCategories,
  toggleProductState,
  showProductState,
  handleDelete,
  handleEditSubCategory,
  openRemoveSubCategoryModal,
  pageType,
  role, // Ensure this is passed as a prop
}) => {
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
            <tr
              style={{ borderBottom: "1px solid #ccc", cursor: "pointer" }}
              onClick={() => toggleProductState(subcategory._id)}
            >
              <td width={"12%"}></td>
              <td className="innercell" width={"21%"}>
                <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                  {showProductState === subcategory._id ? <SlArrowDown size={14}/> : <SlArrowRight size={14}/>}
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
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent row click
                      handleEditSubCategory(subcategory);
                    }}
                  >
                    <MdEdit className="action_icon" />
                    Edit
                  </button>
                )}
                {role === "SUPER ADMIN" && pageType === "product" && (
                  <button
                    className="product-action-btn"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent row click
                      openRemoveSubCategoryModal(subcategory._id);
                    }}
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
                      No products found
                    </td>
                  </tr>
                ) : (
                  subcategory.products.map((product) => (
                    <tr key={product._id} style={{ borderBottom: "1px solid #ccc" }}>
                      <td width={"12%"}></td>
                      <td width={"21%"}></td>
                      <td width={"13%"}>{product.productId}</td>
                      <td width={"22%"}>{product.name}</td>
                      <td width={"13%"}>
                        {pageType === "product" ? `${product.price}` : product.quantity ?? 0}
                      </td>
                    </tr>
                  ))
                )}
              </>
            )}
          </React.Fragment>
        ))
      )}
    </>
  );
};

export default StockInnerTable;
