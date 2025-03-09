import React, { useState } from "react";
import { IoIosAddCircle } from "react-icons/io";
import { PiExportFill } from "react-icons/pi";
import AddStockModal from "../modal/AddStockModal";
import StockTable from "./StockTable";
import * as XLSX from "xlsx";

const StockIndex = () => {
  const [showStockModal, setShowStockModal] = useState(false);
  const [tableData, setTableData] = useState([]);


  const handleExport = () => {
    if (tableData.length === 0) {
      alert("No data to export!");
      return;
    }

    const ws = XLSX.utils.json_to_sheet(tableData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Stock Data");
    XLSX.writeFile(wb, "StockData.xlsx");
  };

  return (
    <>
      <div className="product-container">
        <div className="create-buttons">
          <div className="flexgap">
            <button
              className="add-btn modalbtn"
              onClick={() => setShowStockModal(true)}
            >
              <IoIosAddCircle className="add-icon" />
              Stock
            </button>
            <button
              className="add-btn modalbtn"
              onClick={handleExport}
            >
              <PiExportFill className="add-icon" />
                Export
            </button>
          </div>
        </div>
        <StockTable setTableData={setTableData} />
      </div>
      {showStockModal && (
        <AddStockModal closeModal={() => setShowStockModal(false)} />
      )}
    </>
  );
};

export default StockIndex;
