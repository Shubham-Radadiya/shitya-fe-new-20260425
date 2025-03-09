import React, { useEffect, useState } from "react";
import InnerTable from "../product/InnerTable";
import { SlArrowDown } from "react-icons/sl";
import { MdEdit, MdOutlineDeleteOutline } from "react-icons/md";
import { REQUEST_CATEGORY } from "../../../store/category/categoryActionType";
import { useDispatch, useSelector } from "react-redux";

const StockTable = ({setTableData} ) => {
  const dispatch = useDispatch();
  const [showDetailState, setShowDetailState] = useState(null);
  const [showProductState, setShowProductState] = useState(null);

  const toggleDetailState = (state) => {
    setShowDetailState(showDetailState === state ? null : state);
  };

  const toggleProductState = (state) => {
    setShowProductState(showProductState === state ? null : state);
  };
  const role = localStorage.getItem("role");

 useEffect(() => {
    dispatch({ type: REQUEST_CATEGORY });
  }, [dispatch]);

  const categories = useSelector((state) => state.category.categories);
  
  useEffect(() => {
    if (!categories || !setTableData) return;

    const formattedData = [];
    categories.forEach((category) => {
      category.subCategory.forEach((subcategory) => {
        subcategory.products.forEach((product) => {
          formattedData.push({
            Category: category.name,
            SubCategory: subcategory.name,
            ProductID: product.productId,
            Name: product.name,
            Quantity: product.quantity ?? 0,
          });
        });
      });
    });

    setTableData(formattedData);
  }, [categories]);


  return (
    <>
      <div className="table-container">
        <table className="product-table">
          <thead>
            <tr>
              <th width="12%">Category</th>
              <th width="20%">Sub-Category</th>
              <th width="13%">Product ID</th>
              <th width="22%">Name</th>
              <th width="13%">Quantity</th>
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
                    {/* <button
                      className="product-action-btn"
                      //   onClick={() => handleEditCategory(category)}
                    >
                      <MdEdit className="action_icon" />
                      Edit
                    </button> */}
                  </td>
                </tr>
                {showDetailState === category._id && (
                  <InnerTable
                    subCategories={category.subCategory}
                    toggleProductState={toggleProductState}
                    showProductState={showProductState}
                     pageType="stock"
                  />
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default StockTable;
