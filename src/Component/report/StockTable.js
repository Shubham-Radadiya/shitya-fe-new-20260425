import React, { useEffect, useState } from "react";
import { SlArrowDown } from "react-icons/sl";
import * as XLSX from "xlsx"; // Import xlsx library
import "./index.css";
import { useDispatch, useSelector } from "react-redux";
import { REQUEST_GET_STOCk } from "../../store/product/ProductAction";
import download from "../images/download.png"

const StockTable = () => {
  const [showDetailState, setShowDetailState] = useState(null);
  const [showProductState, setShowProductState] = useState(null);
  const dispatch = useDispatch();

  // Accessing stock data from redux state and ensuring it defaults to an empty array if undefined
  const stock = useSelector((state) => state.product?.stock?.data || []);

  useEffect(() => {
    dispatch({ type: REQUEST_GET_STOCk });
  }, [dispatch]);

  // Toggle category details
  const toggleDetailState = (categoryName) => {
    setShowDetailState(showDetailState === categoryName ? null : categoryName);
  };

  // Toggle subcategory details
  const toggleProductState = (subcategoryName) => {
    setShowProductState(
      showProductState === subcategoryName ? null : subcategoryName
    );
  };

  // Export to Excel function
  const exportToExcel = () => {
    const data = [];

    stock.forEach((categoryData) => {
      categoryData?.categories?.forEach((category) => {
        // Add category row
        data.push({
          Category: category.categoryName,
          "Sub Category": "",
          Product: "",
          "Product ID": "",
          Qty: category.totalBuyingCountPerCategory,
          Rate: "",
          Amount: `${category.totalBuyingAmountPerCategory}`,
        });

        category?.subCategories?.forEach((subcategory) => {
          // Add subcategory row
          data.push({
            Category: "",
            "Sub Category": subcategory.subCategoryName,
            Product: "",
            Stock: subcategory.totalBuyingCount,
            Amount: `${subcategory.totalBuyingAmount}`,
          });

          subcategory?.products?.forEach((product) => {
            // Add product row
            data.push({
              Category: "",
              "Sub Category": "",
              Product: product.name,
              Stock: product.totalBuyingCount,
              Amount: `${product.totalBuyingAmount}`,
            });
          });
        });
      });
    });

    // Create and export Excel file
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Stock Report");
    XLSX.writeFile(wb, "StockReport.xlsx");
  };

  return (
    <div className="user-template">
      <div className="user-container">
        <div className="userreport-box" style={{ justifyContent: "flex-end", width:"97.5%" }}>
          <div
            className="tfootgroup"
            style={{ justifyContent: "space-between", width: "100%" }}
          >
            <div style={{ fontWeight: "bold", fontSize: "22px" }}>
              Stock Report
            </div>
            <div className="download" onClick={exportToExcel}>
               <img style={{width:"50px"}} src={download} atl="down" />
            </div>
          </div>
        </div>
        <div className="userreport-table-wrapper">
          <table className="userreport-table">
            {/* Table Header - Display only once */}
            <thead>
              <tr style={{ width: "100%", fontSize: "16px" }}>
                <th>Category</th>
                <th>Sub Category</th>
                <th>Product ID</th>
                <th>Product</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody style={{ width: "100%" }}>
              {Array.isArray(stock) &&
                stock.map((categoryData, index) => (
                  <React.Fragment key={index}>
                    {categoryData?.categories?.map((category) => (
                      <React.Fragment key={category.categoryId}>
                        {/* Category row */}
                        <tr>
                          <td
                            onClick={() =>
                              toggleDetailState(category.categoryName)
                            }
                            style={{ cursor: "pointer", fontWeight: "bold" }}
                          >
                            <div
                              style={{
                                display: "flex",
                                gap: "1rem",
                                alignItems: "center",
                              }}
                            >
                              <SlArrowDown size={14} />
                              {category.categoryName}
                            </div>
                          </td>
                          <td colSpan="3"></td>
                          <td style={{ textAlign: "right" }}>
                            {new Intl.NumberFormat("en-IN").format(category.totalBuyingCountPerCategory)}
                          </td>
                          <td></td>
                          <td style={{ textAlign: "right" }}>
                            {new Intl.NumberFormat("en-IN").format(category.totalBuyingAmountPerCategory)}
                          </td>
                        </tr>

                        {/* Subcategory and Product rows */}
                        {showDetailState === category.categoryName &&
                          category?.subCategories?.map((subcategory) => (
                            <React.Fragment key={subcategory.subCategoryId}>
                              {/* Subcategory row */}
                              <tr>
                                <td></td>
                                <td
                                  onClick={() =>
                                    toggleProductState(
                                      subcategory.subCategoryName
                                    )
                                  }
                                  style={{
                                    cursor: "pointer",
                                    fontWeight: "bold",
                                  }}
                                >
                                  <div
                                    style={{
                                      display: "flex",
                                      gap: "1rem",
                                      alignItems: "center",
                                    }}
                                  >
                                    <SlArrowDown size={14} />
                                    {subcategory.subCategoryName}
                                  </div>
                                </td>
                                <td></td>
                                <td></td>
                                <td style={{ textAlign: "right" }}>
                                  {new Intl.NumberFormat("en-IN").format(subcategory.totalBuyingCount)}
                                </td>
                                <td></td>
                                <td style={{ textAlign: "right" }}>
                                  {new Intl.NumberFormat("en-IN").format(subcategory.totalBuyingAmount)}
                                </td>
                              </tr>

                              {/* Product rows (inside subcategory) */}
                              {showProductState ===
                                subcategory.subCategoryName &&
                                subcategory?.products?.map((product) => (
                                  <tr key={product.productId}>
                                    <td></td>
                                    <td></td>
                                    <td>{product.productId}</td>
                                    <td>{product.name}</td>
                                    <td style={{ textAlign: "right" }}>
                                      {new Intl.NumberFormat("en-IN").format(product.quantity)}
                                    </td>
                                    <td style={{ textAlign: "right" }}>
                                      {new Intl.NumberFormat("en-IN").format(product.price)}
                                    </td>
                                    <td style={{ textAlign: "right" }}>
                                      {new Intl.NumberFormat("en-IN").format(product.totalBuyingAmount)}
                                    </td>
                                  </tr>
                                ))}
                            </React.Fragment>
                          ))}
                      </React.Fragment>
                    ))}
                  </React.Fragment>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StockTable;
