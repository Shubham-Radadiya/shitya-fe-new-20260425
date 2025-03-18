import React, { useState } from "react";
import { SlArrowDown } from "react-icons/sl";
import * as XLSX from "xlsx"; // Import xlsx library
import { StockData } from "./StockMockData"; // Import stock data
import "./index.css";

const StockTable = () => {
  const [showDetailState, setShowDetailState] = useState(null);
  const [showProductState, setShowProductState] = useState(null);

  const toggleDetailState = (categoryName) => {
    setShowDetailState(showDetailState === categoryName ? null : categoryName);
  };

  const toggleProductState = (subcategoryName) => {
    setShowProductState(showProductState === subcategoryName ? null : subcategoryName);
  };

  const exportToExcel = () => {
    const data = [];

    StockData.forEach((category) => {
      data.push({
        Category: category.category,
        "Sub Category": "",
        Product: "",
        Stock: category.quantity,
        Amount: `₹${category.amount}`,
      });

      category.subcategory.forEach((subcategory) => {
        data.push({
          Category: "",
          "Sub Category": subcategory.name,
          Product: "",
          Stock: subcategory.quantity,
          Amount: `₹${subcategory.amount}`,
        });

        subcategory.products.forEach((product) => {
          data.push({
            Category: "",
            "Sub Category": "",
            Product: product.name,
            Stock: product.quantity,
            Amount: `₹${product.amount}`,
          });
        });
      });
    });

    // Convert JSON to worksheet
    const ws = XLSX.utils.json_to_sheet(data);

    // Create a new workbook and append worksheet
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Stock Report");

    // Save as an Excel file
    XLSX.writeFile(wb, "StockReport.xlsx");
  };

  return (
    <div className="user-template">
      <div className="user-container">
        <div className="userreport-box" style={{ justifyContent: "flex-end" }}>
          <button className="userreprt-button" onClick={exportToExcel}>
            Export to Excel
          </button>
        </div>
        <div className="userreport-table-wrapper">
          <table className="userreport-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Sub Category</th>
                <th>Product</th>
                <th>Stock</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {StockData.map((category) => (
                <React.Fragment key={category.category}>
                  <tr>
                    <td onClick={() => toggleDetailState(category.category)}>
                      <div style={{ display: "flex", gap: "1rem", cursor: "pointer", alignItems:"center" }}>
                        <SlArrowDown size={14}/> {category.category}
                      </div>
                    </td>
                    <td></td>
                    <td></td>
                    <td>{category.quantity}</td>
                    <td>₹{category.amount}</td>
                  </tr>
                  {showDetailState === category.category &&
                    category.subcategory.map((subcategory) => (
                      <React.Fragment key={subcategory.name}>
                        <tr>
                          <td></td>
                          <td onClick={() => toggleProductState(subcategory.name)}>
                            <div style={{ display: "flex", gap: "1rem", cursor: "pointer",  alignItems:"center" }}>
                              <SlArrowDown size={14}/> {subcategory.name}
                            </div>
                          </td>
                          <td></td>
                          <td>{subcategory.quantity}</td>
                          <td>₹{subcategory.amount}</td>
                        </tr>
                        {showProductState === subcategory.name &&
                          subcategory.products.map((product) => (
                            <tr key={product.name}>
                              <td></td>
                              <td></td>
                              <td>{product.name}</td>
                              <td>{product.quantity}</td>
                              <td>₹{product.amount}</td>
                            </tr>
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
