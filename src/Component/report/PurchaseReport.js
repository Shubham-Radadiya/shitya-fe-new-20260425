import React, { useState, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import ReactToPrint from "react-to-print";
import * as XLSX from "xlsx";
import {
  GET_DAILY_REPORTS_REQUEST,
  GET_MONTHLY_REPORTS_REQUEST,
  GET_YEARLY_REPORTS_REQUEST,
} from "../../store/user_report/UserReportAction";
import { useReport } from "../../store/user_report/UserReportReducer";
import "./index.css";
import { IoArrowBack } from "react-icons/io5";
import { NavLink } from "react-router-dom";
import axios from "axios";
import { REQUEST_INVOICE_DATA } from "../../store/invoice/InvoiceAction";
import { useInvoice } from "../../store/invoice/InvoiceReducer";
import { AiOutlinePrinter } from "react-icons/ai";
import { CiEdit } from "react-icons/ci";
import { useNavigate } from "react-router-dom";
import Edit from "../images/edit.png";

const initialData = [
  { currency: "500", count: 0 },
  { currency: "200", count: 0 },
  { currency: "100", count: 0 },
  { currency: "50", count: 0 },
  { currency: "20", count: 0 },
  { currency: "10", count: 0 },
  { currency: "5", count: 0 },
  { currency: "2", count: 0 },
  { currency: "1", count: 0 },
];

const PurchaseReport = () => {
  const componentRef = useRef();
  const dispatch = useDispatch();
  const { invoiceData } = useInvoice();
  const { dailyReport } = useReport();
  const [reportType, setReportType] = useState("daily");
  const printRef = useRef();
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  const fetchInvoiceData = async (invoiceId) => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`http://localhost:3010/invoice/${invoiceId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
      });
  
      if (!response.ok) throw new Error("Failed to fetch invoice data");
  
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching invoice data:", error);
      return null;
    }
  };
  
  const fetchInvoiceDataForStock = async (invoiceId) => {
    const data = await fetchInvoiceData(invoiceId);
    if (data) {
      navigate("/stock", { state: { invoiceData: data } });
    }
  };
  
  const fetchInvoiceDataForModal = async (invoiceId) => {
    const data = await fetchInvoiceData(invoiceId);
    if (data) {
      setSelectedInvoice(data);
      setIsModalOpen(true);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  useEffect(() => {
    dispatch({ type: REQUEST_INVOICE_DATA });
  }, []);

  useEffect(() => {
    handleFetchReports(reportType);
  }, [reportType]);
  console.log("invoiceData", invoiceData);

  const handleFetchReports = (type) => {
    setReportType(type);
    if (type === "daily") {
      const startDate = new Date();
      const endDate = new Date();
      console.log(startDate, "endDate");

      dispatch({
        type: GET_DAILY_REPORTS_REQUEST,
        payload: { startDate, endDate },
      });
    }
  };

  const getCurrentReportData = () => {
    switch (reportType) {
      case "daily":
        return dailyReport;
      default:
        return [];
    }
  };

  const getTotalAmount = (categories) =>
    categories?.reduce(
      (acc, category) => acc + (category.totalBuyingAmount || 0),
      0
    ) || 0;

  const currentReport = getCurrentReportData();

  const filteredProducts = currentReport[0]?.products || [];

  const filteredCategory =
    currentReport[0]?.categories?.filter(
      (categorie) => categorie.totalQuantity > 0
    ) || [];

  const calculateTotalAmount = () => {
    if (reportType === "daily") {
      return filteredProducts.reduce((sum, item) => {
        const price = item.price || 0;
        const quantity = item.totalBuyingCount || 0;
        return sum + price * quantity;
      }, 0);
    } else {
      return filteredProducts.reduce(
        (sum, item) => sum + getTotalAmount(item.categories),
        0
      );
    }
  };

  const Amount =
    reportType === "daily" ? calculateTotalAmount() : calculateTotalAmount();
  const totalAmount = reportType === "daily" ? calculateTotalAmount() : Amount;

  const exportToExcel = () => {
    const table = document.querySelector(".userreport-table");
    const tableClone = table.cloneNode(true);
    const rows = tableClone.querySelectorAll("tr");

    // Remove footer or any other unwanted rows
    rows.forEach((row) => {
      if (row.querySelector(".tfootgroup")) {
        row.parentNode.removeChild(row);
      }
    });

    // Create a new empty worksheet
    const worksheet = XLSX.utils.aoa_to_sheet([]);

    // Add the title and date rows only
    const currentDate = new Date().toLocaleDateString();
    const titleAndDate = [
      ["Daily Report"], // First row: Title
      [`Date: ${currentDate}`], // Second row: Date
    ];

    // Add the title and date to the worksheet at the top
    XLSX.utils.sheet_add_aoa(worksheet, titleAndDate, { origin: "A1" });

    const tableData = Array.from(tableClone.querySelectorAll("tr")).map((row) =>
      Array.from(row.querySelectorAll("th, td")).map((cell) => cell.textContent)
    );
    XLSX.utils.sheet_add_aoa(worksheet, tableData, { origin: "A3" });

    const totalAmount = tableData
      .slice(1)
      .reduce((sum, row) => sum + parseFloat(row[3]) || 0, 0);

    const totalRow = ["", "", "", "Total:", `₹${Amount.toFixed(2)}`];
    XLSX.utils.sheet_add_aoa(worksheet, [totalRow], { origin: -1 });

    // Create a new workbook and append the worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");

    // Write the workbook to binary and create a Blob for download
    const workbookOut = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "binary",
    });
    const s2ab = (s) => {
      const buf = new ArrayBuffer(s.length);
      const view = new Uint8Array(buf);
      for (let i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xff;
      return buf;
    };
    const blob = new Blob([s2ab(workbookOut)], {
      type: "application/octet-stream",
    });

    // Create a download link and trigger the download
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "DailyReport.xlsx";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const now = new Date();

  const totalQuantity = filteredProducts?.reduce(
    (total, item) => total + item.totalBuyingCount,
    0
  );
  const currentDateTime = () => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0"); // getMonth() is zero-indexed
    const year = String(now.getFullYear()).slice(-2); // Last two digits of the year
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");

    return `${day}-${month}-${year} (${hours}:${minutes})`;
  };

  return (
    <>
      <div className="user-template">
        <div className="user-container">
          <div className="userreport-box">
            <div style={{ display: "flex", gap: "35px" }}>
              <NavLink to="/stock">
                <div
                  className="back-btn"
                  style={{
                    color: "rgb(87 15 119)",
                    fontSize: "xx-large",
                  }}
                >
                  <IoArrowBack />
                </div>
              </NavLink>
            </div>
            <div className="tfootgroup">
              <button className="userreprt-button" onClick={exportToExcel}>
                Export to Excel
              </button>
            </div>
          </div>

          <div className="userreport-table-wrapper">
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "30px",
              }}
            >
              <>
                <table className="userreport-table">
                  <thead>
                    <tr>
                      <th
                        className="stocktable"
                        style={{ width: "9%", textAlign: "center" }}
                      >
                        INV. No.
                      </th>
                      <th
                        className="stocktable"
                        style={{ width: "12%", textAlign: "center" }}
                      >
                        INV. Date
                      </th>
                      <th
                        className="stocktable"
                        style={{ width: "12%", textAlign: "center" }}
                      >
                        મુર્તિ
                      </th>
                      <th
                        className="stocktable"
                        style={{ width: "12%", textAlign: "center" }}
                      >
                        વાઘા
                      </th>
                      <th
                        className="stocktable"
                        style={{ width: "12%", textAlign: "center" }}
                      >
                        ઘરેણા
                      </th>
                      <th
                        className="stocktable"
                        style={{ width: "12%", textAlign: "center" }}
                      >
                        પુજા
                      </th>
                      <th
                        className="stocktable"
                        style={{ width: "12%", textAlign: "center" }}
                      >
                        પુસ્તક
                      </th>
                      <th
                        className="stocktable"
                        style={{ width: "12%", textAlign: "center" }}
                      >
                        જનરલ
                      </th>
                      <th
                        className="stocktable"
                        style={{ width: "12%", textAlign: "center" }}
                      >
                        Amount
                      </th>
                      <th
                        className="stocktable"
                        style={{ width: "12%", textAlign: "center" }}
                        colSpan={2}
                      >
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceData.map((user, userIndex) => {
                      return user.data.map((invoice, invoiceIndex) => {
                        const { invoiceId, createdAt, categories } = invoice;
                        const formattedDate = new Date(
                          createdAt
                        ).toLocaleDateString();

                        let murtiAmount = 0,
                          vaghaAmount = 0,
                          gharenaAmount = 0,
                          pujaAmount = 0,
                          pustakAmount = 0,
                          generalAmount = 0;

                        categories.forEach((category) => {
                          if (category.categoryName === "મુર્તિ") {
                            murtiAmount = category.totalBuyingAmount;
                          } else if (category.categoryName === "વાઘા") {
                            vaghaAmount = category.totalBuyingAmount;
                          } else if (category.categoryName === "ઘરેણા") {
                            gharenaAmount = category.totalBuyingAmount;
                          } else if (category.categoryName === "પુજા") {
                            pujaAmount = category.totalBuyingAmount;
                          } else if (category.categoryName === "પુસ્તક") {
                            pustakAmount = category.totalBuyingAmount;
                          } else if (category.categoryName === "જનરલ") {
                            generalAmount = category.totalBuyingAmount;
                          }
                        });

                        const totalAmount =
                          murtiAmount +
                          vaghaAmount +
                          gharenaAmount +
                          pujaAmount +
                          pustakAmount +
                          generalAmount;

                        return (
                          <tr key={`${userIndex}-${invoiceIndex}`}>
                            <td style={{ width: "9%" }}>{invoiceId}</td>
                            <td style={{ width: "12%", textAlign: "end" }}>
                              {formattedDate}
                            </td>
                            <td style={{ textAlign: "end", width: "12%" }}>
                              
                              {new Intl.NumberFormat("en-IN").format(
                                murtiAmount || 0
                              )}
                            </td>
                            <td style={{ width: "12%", textAlign: "end" }}>
                              
                              {new Intl.NumberFormat("en-IN").format(
                                vaghaAmount || 0
                              )}
                            </td>
                            <td style={{ width: "12%", textAlign: "end" }}>
                              
                              {new Intl.NumberFormat("en-IN").format(
                                gharenaAmount || 0
                              )}
                            </td>
                            <td style={{ width: "12%", textAlign: "end" }}>
                              
                              {new Intl.NumberFormat("en-IN").format(
                                pujaAmount || 0
                              )}
                            </td>
                            <td style={{ width: "12%", textAlign: "end" }}>
                              
                              {new Intl.NumberFormat("en-IN").format(
                                pustakAmount || 0
                              )}
                            </td>
                            <td style={{ width: "12%", textAlign: "end" }}>
                              
                              {new Intl.NumberFormat("en-IN").format(
                                generalAmount || 0
                              )}
                            </td>
                            <td style={{ width: "12%", textAlign: "end" }}>
                              
                              {new Intl.NumberFormat("en-IN").format(
                                totalAmount
                              ) || 0}
                            </td>
                            <td
                              style={{
                                width: "5.9%",
                                padding: "0px",
                                textAlign: "center",
                                verticalAlign: "middle",
                              }}
                            >
                              <span
                                style={{ fontSize: "26px", cursor:"pointer" }}
                                onClick={() =>
                                  fetchInvoiceDataForModal(invoice.invoiceId)
                                }
                              >
                                <AiOutlinePrinter />
                              </span>
                            </td>
                            <td
                              style={{
                                width: "5.9%",
                                padding: "0px",
                                textAlign: "center",
                                verticalAlign: "middle",
                              }}
                            >
                              <span
                                style={{ fontSize: "26px", cursor:"pointer" }}
                                onClick={() => fetchInvoiceDataForStock(invoice.invoiceId)}
                              >
                                <img style={{width:"20px"}} src={Edit} alt="edit" />
                              </span>
                            </td>
                          </tr>
                        );
                      });
                    })}
                  </tbody>
                  <tfoot style={{ borderTop: "1px solid var(--brown-color)" }}>
                    <tr>
                      <td style={{ width: "21%", fontWeight:"bold" }}>Total:-</td>
                      <td style={{ width: "0%" }}></td>
                      <td
                        style={{
                          width: "12%",
                          textAlign: "end",
                          fontWeight:"bold"
                        }}
                      >
                        
                        {new Intl.NumberFormat("en-IN").format(
                          invoiceData.reduce((acc, user) => {
                            user.data.forEach((invoice) => {
                              const { categories } = invoice;
                              const murtiAmount =
                                categories.find(
                                  (category) =>
                                    category.categoryName === "મુર્તિ"
                                )?.totalBuyingAmount || 0;
                              acc += murtiAmount;
                            });
                            return acc;
                          }, 0)
                        )}
                      </td>

                      <td style={{ width: "12%", textAlign: "end", fontWeight:"bold" }}>
                        
                        {new Intl.NumberFormat("en-IN").format(
                          invoiceData.reduce((acc, user) => {
                            user.data.forEach((invoice) => {
                              const { categories } = invoice;
                              const vaghaAmount =
                                categories.find(
                                  (category) => category.categoryName === "વાઘા"
                                )?.totalBuyingAmount || 0;
                              acc += vaghaAmount;
                            });
                            return acc;
                          }, 0)
                        )}
                      </td>

                      <td style={{ width: "12%", textAlign: "end", fontWeight:"bold" }}>
                        
                        {new Intl.NumberFormat("en-IN").format(
                          invoiceData.reduce((acc, user) => {
                            user.data.forEach((invoice) => {
                              const { categories } = invoice;
                              const gharenaAmount =
                                categories.find(
                                  (category) =>
                                    category.categoryName === "ઘરેણા"
                                )?.totalBuyingAmount || 0;
                              acc += gharenaAmount;
                            });
                            return acc;
                          }, 0)
                        )}
                      </td>

                      <td style={{ width: "12%", textAlign: "end", fontWeight:"bold" }}>
                        
                        {new Intl.NumberFormat("en-IN").format(
                          invoiceData.reduce((acc, user) => {
                            user.data.forEach((invoice) => {
                              const { categories } = invoice;
                              const pujaAmount =
                                categories.find(
                                  (category) => category.categoryName === "પુજા"
                                )?.totalBuyingAmount || 0;
                              acc += pujaAmount;
                            });
                            return acc;
                          }, 0)
                        )}
                      </td>

                      <td style={{ width: "12%", textAlign: "end", fontWeight:"bold" }}>
                        
                        {new Intl.NumberFormat("en-IN").format(
                          invoiceData.reduce((acc, user) => {
                            user.data.forEach((invoice) => {
                              const { categories } = invoice;
                              const pustakAmount =
                                categories.find(
                                  (category) =>
                                    category.categoryName === "પુસ્તક"
                                )?.totalBuyingAmount || 0;
                              acc += pustakAmount;
                            });
                            return acc;
                          }, 0)
                        )}
                      </td>

                      <td style={{ width: "12%", textAlign: "end", fontWeight:"bold" }}>
                        
                        {new Intl.NumberFormat("en-IN").format(
                          invoiceData.reduce((acc, user) => {
                            user.data.forEach((invoice) => {
                              const { categories } = invoice;
                              const generalAmount =
                                categories.find(
                                  (category) => category.categoryName === "જનરલ"
                                )?.totalBuyingAmount || 0;
                              acc += generalAmount;
                            });
                            return acc;
                          }, 0)
                        )}
                      </td>

                      <td
                        style={{
                          width: "12%",
                          textAlign: "end",
                          fontWeight: "bold",
                        }}
                      >
                        
                        {new Intl.NumberFormat("en-IN").format(
                          invoiceData.reduce((acc, user) => {
                            user.data.forEach((invoice) => {
                              const { categories } = invoice;
                              acc += categories.reduce(
                                (sum, category) =>
                                  sum + category.totalBuyingAmount,
                                0
                              );
                            });
                            return acc;
                          }, 0)
                        )}
                      </td>
                      <td style={{ width: "12%" }} colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen &&
        selectedInvoice &&
        Object.keys(selectedInvoice).length > 0 && (
          <>
            <div
              className="modal-overlay"
              onClick={() => setIsModalOpen(false)}
            ></div>
            <div className="modal">
              <div className="modal-content">
                <h2>Invoice: {selectedInvoice.invoiceId}</h2>
                <p>
                  <strong>Date:</strong>{" "}
                  {new Date(selectedInvoice.createdAt).toLocaleDateString()}
                </p>
                <p>
                  <strong>Total Amount:</strong> 
                  {selectedInvoice.totalAmount.toLocaleString("en-IN")}
                </p>

                <h3>Products:</h3>
                <table border="1" width="100%">
                  <thead>
                    <tr>
                      <th>Product Name</th>
                      <th>Price</th>
                      <th>Quantity</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice.productId.map((product, i) => (
                      <tr key={i}>
                        <td>{product._id.name}</td>
                        <td>₹ {product.price}</td>
                        <td>{product.quantity}</td>
                        <td>₹ {product.price * product.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <button onClick={handlePrint} className="print-button">
                  Print Invoice
                </button>
                <button onClick={() => setIsModalOpen(false)}>Close</button>
              </div>
            </div>
          </>
        )}
    </>
  );
};

export default PurchaseReport;
