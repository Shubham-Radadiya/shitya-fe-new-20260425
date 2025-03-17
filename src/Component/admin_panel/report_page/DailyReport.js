import React, { useState, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import {
  FILTER_DAILY,
  REQUEST_TODAY_PRODUCT,
} from "../../../store/admin_report/ReportAction";
import { REQUEST_USER } from "../../../store/auth/AuthAction";
import { useAuth } from "../../../store/auth/AuthReducers";
import ReactToPrint from "react-to-print";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FaCalendarAlt } from "react-icons/fa";
import { useReport } from "../../../store/admin_report/ReportReducer";

const DailyReport = () => {
  const { dailyreport } = useReport();
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const dispatch = useDispatch();
  const users = useAuth();
  const componentRef = useRef();

  // Fetch users on component mount
  useEffect(() => {
    dispatch({ type: REQUEST_USER });
  }, [dispatch]);

  // Fetch daily report whenever selectedDate changes
  useEffect(() => {
    getDailyReport();
  }, [selectedDate, dispatch]);

  const getProducts = (report) => {
    return report?.flatMap((item) =>
      item?.data?.flatMap((dataItem) => dataItem.products || [])
    );
  };

  const getTotalAmount = (products) =>
    products.reduce(
      (acc, product) => acc + (product.price * product.totalBuyingCount || 0),
      0
    );

  const filteredReport = selectedUser
    ? dailyreport.filter((item) => item.userFullName === selectedUser.fullName)
    : dailyreport;

  const productsArray = getProducts(filteredReport);
  console.log(productsArray, dailyreport, "productsArray");

  const isDataAvailable = productsArray.length > 0;

  const handleUserChange = (user) => {
    console.log(user, "user");

    setSelectedUser(user);
    dispatch({
      type: FILTER_DAILY,
      payload: user ? filteredReport : dailyreport,
    });
  };

  const getDailyReport = () => {
    const data = {
      startDate: selectedDate,
      endDate: selectedDate,
    };
    dispatch({ type: REQUEST_TODAY_PRODUCT, payload: data });
  };

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();
    const sheetData = [];

    // Add the "Daily Report" text in the first row
    sheetData.push(["Daily Report"]);

    // Add the current date in the second row
    const currentDate = new Date().toLocaleDateString();
    sheetData.push([`Date: ${currentDate}`]);

    // Add the table headers in the third row
    sheetData.push(["Sr. No.", "Product ID", "Product", "Quantity", "Price"]);

    // Start the serial number at 1 and add the product data
    let serialNumber = 1;
    productsArray.forEach((product) => {
      sheetData.push([
        serialNumber++,
        product.productId || "N/A",
        product.name || "N/A",
        product.totalBuyingCount || "N/A",
        (product.price * product.totalBuyingCount || 0).toFixed(2),
      ]);
    });

    // Calculate the total amount
    const getTotalAmount = (products) => {
      return products.reduce((acc, product) => {
        return acc + (product.price * product.totalBuyingCount || 0);
      }, 0);
    };

    // Add the total row at the end
    const totalAmount = getTotalAmount(productsArray);
    const totalRow = [
      "",
      "",
      "",
      "Total:",
      `${new Intl.NumberFormat("en-IN").format(totalAmount.toFixed(2))}`,
    ];
    sheetData.push(totalRow);

    // Create the worksheet from the sheetData array
    const ws = XLSX.utils.aoa_to_sheet(sheetData);

    // Append the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, "Daily Report");

    // Generate binary data and convert it to a Blob for download
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "binary" });
    const buf = new ArrayBuffer(wbout.length);
    const view = new Uint8Array(buf);
    for (let i = 0; i < wbout.length; i++) view[i] = wbout.charCodeAt(i) & 0xff;

    // Create a Blob and trigger the download
    const blob = new Blob([buf], { type: "application/octet-stream" });
    saveAs(blob, "DailyReport.xlsx");
  };

  const uniqueUsers = Array.from(
    new Map(
      users
        .filter((user) => user.userType === "USER")
        .map((user) => [user.fullName, user])
    ).values()
  );

  return (
    <div>
      <div className="report-box">
        <div className="flexgap user-btns-box">
          <div className="date-picker-container">
            <FaCalendarAlt className="calendar-icon" />
            <DatePicker
              selected={selectedDate}
              onChange={(date) => setSelectedDate(date)}
              dateFormat="dd/MM/yyyy, EEEE"
              className="date-picker"
              popperPlacement="bottom-start"
            />
          </div>
          <div style={{ width: "200px" }}>
            <label>Select a user: </label>
            <select
              onChange={(e) => {
                const selected = users.find(
                  (user) => user.fullName === e.target.value
                );
                handleUserChange(selected || null);
              }}
              value={selectedUser ? selectedUser.fullName : ""}
              style={{ width: "70%", height: "32px", borderRadius: "8px" }}
            >
              <option value="">All</option>
              {uniqueUsers.map((user, index) => (
                <option key={index} value={user.fullName}>
                  {user.fullName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div ref={componentRef}>
          <div className="print-header">
            <h1 style={{ textAlign: "center" }}>જય સ્વામિનારાયણ</h1>
            <h3>
              Date: {selectedDate ? selectedDate.toLocaleDateString() : "N/A"}
            </h3>
          </div>
          <table className="report-table">
            <thead className="tab-header">
              <tr className="first-row" style={{ width: "100%" }}>
                <th style={{ width: "18%" }}>Sr. No.</th>
                <th style={{ textAlign: "center", width: "18%" }}>
                  Product ID
                </th>
                <th style={{ textAlign: "left", width: "32%" }}>Product</th>
                <th style={{ textAlign: "center", width: "18%" }}>Quantity</th>
                <th
                  style={{
                    textAlign: "right",
                    width: "17%",
                    paddingLeft: "18px",
                    paddingRight: "19px",
                  }}
                >
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="tab-body">
              {isDataAvailable ? (
                productsArray.map((product, index) => {
                  const currentSerialNumber = index + 1;
                  return (
                    <tr
                      key={product.productId + index}
                      style={{ width: "100%" }}
                    >
                      <td style={{ width: "18%" }}>{currentSerialNumber}</td>
                      <td style={{ textAlign: "center", width: "18%" }}>
                        {product.productId}
                      </td>
                      <td style={{ textAlign: "left", width: "32%" }}>
                        {product.name || "N/A"}
                      </td>
                      <td style={{ textAlign: "center", width: "18%" }}>
                        {new Intl.NumberFormat("en-IN").format(
                          product.totalBuyingCount || "N/A"
                        )}
                      </td>
                      <td style={{ textAlign: "right", width: "18%" }}>
                        {new Intl.NumberFormat("en-IN").format(
                          product.totalBuyingCount * product.price
                        ) || 0}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="no-data-cell">
                    No Data Found
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot className="tab-footer">
              <tr>
                <td colSpan="5">
                  <div className="flexgap">
                    {/* <ReactToPrint
                      trigger={() => <button className="print-btn" style={{ cursor: "pointer" }}>Print</button>}
                      content={() => componentRef.current}
                    /> */}
                    <button
                      className="print-btn"
                      style={{ cursor: "pointer" }}
                      onClick={exportToExcel}
                    >
                      Export
                    </button>
                  </div>
                </td>
                <td></td>
                <td></td>
                <td
                  className="total-amount"
                  style={{ textAlign: "right", paddingRight: "16px" }}
                >
                  Total Amount:{" "}
                  {new Intl.NumberFormat("en-IN").format(
                    getTotalAmount(productsArray).toFixed(2)
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DailyReport;
