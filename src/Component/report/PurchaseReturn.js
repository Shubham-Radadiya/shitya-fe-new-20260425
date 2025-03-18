import React, { useState, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import ReactToPrint from "react-to-print";
import * as XLSX from "xlsx";
import { GET_DAILY_REPORTS_REQUEST } from "../../store/user_report/UserReportAction";
import { useReport } from "../../store/user_report/UserReportReducer";
import "./index.css";
import { REQUEST_INVOICE_DATA } from "../../store/invoice/InvoiceAction";
import { useInvoice } from "../../store/invoice/InvoiceReducer";
import { AiOutlinePrinter } from "react-icons/ai";
import { CiEdit } from "react-icons/ci";
import { useNavigate } from "react-router-dom";
import Edit from "../images/edit.png";
import { EDIT_PURCHASE_DATA } from "../../store/cart/cartActionType";

const PurchaseReturn = () => {
  const componentRef = useRef();
  const dispatch = useDispatch();
  const { invoiceData } = useInvoice(true);
  const { dailyReport } = useReport();
  const [reportType, setReportType] = useState("daily");
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  const fetchInvoiceData = async (invoiceId) => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `http://localhost:3010/invoice/${invoiceId}?isReturned=true`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: token,
          },
        }
      );

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
    console.log("data", data);

    const transformedArray = data?.productId.map((item) => ({
      _id: item?._id?._id,
      name: item?._id?.name,
      productId: item?._id?.productId,
      price: item?.price,
      image: item?._id?.image,
      rate: item?._id?.rate,
      remark: item?._id?.remark,
      createdAt: item?._id?.createdAt,
      updatedAt: item?._id?.updatedAt,
      __v: item?._id?.__v,
      isDeActive: item?._id?.item?._id?.updatedAt,
      quantity: item?.quantity,
    }));

    if (data) {
      navigate("/stock", {
        state: { returnEdit: true, id: data?._id, invoiceId: data?.invoiceId },
      });
      dispatch({ type: EDIT_PURCHASE_DATA, payload: transformedArray });
    }
  };

  const fetchInvoiceDataForModal = async (invoiceId) => {
    const data = await fetchInvoiceData(invoiceId);
    if (data) {
      setSelectedInvoice(data);
      setIsModalOpen(true);
    }
  };

  useEffect(() => {
    dispatch({ type: REQUEST_INVOICE_DATA });
  }, []);

  useEffect(() => {
    handleFetchReports(reportType);
  }, [reportType]);

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
      ["Purchase Return Report"], // First row: Title
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

    const totalRow = ["", "", "", "Total:", `${Amount.toFixed(2)}`];
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

  const totalQuantity = filteredProducts?.reduce(
    (total, item) => total + item.totalBuyingCount,
    0
  );

  useEffect(() => {
    console.log(selectedInvoice, "selectedINV");
  }, [selectedInvoice]);
  return (
    <>
      <div className="user-template">
        <div className="user-container">
          <div
            className="userreport-box"
            style={{ justifyContent: "flex-end" }}
          >
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
                        R. INV. No.
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
                    {invoiceData
                      .map((user) => ({
                        ...user,
                        data: [...user.data].sort(
                          (a, b) => Number(b.invoiceId) - Number(a.invoiceId)
                        ),
                      }))
                      .map((user, userIndex) =>
                        user.data.map((invoice, invoiceIndex) => {
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
                            switch (category.categoryName) {
                              case "મુર્તિ":
                                murtiAmount = category.totalBuyingAmount;
                                break;
                              case "વાઘા":
                                vaghaAmount = category.totalBuyingAmount;
                                break;
                              case "ઘરેણા":
                                gharenaAmount = category.totalBuyingAmount;
                                break;
                              case "પુજા":
                                pujaAmount = category.totalBuyingAmount;
                                break;
                              case "પુસ્તક":
                                pustakAmount = category.totalBuyingAmount;
                                break;
                              case "જનરલ":
                                generalAmount = category.totalBuyingAmount;
                                break;
                              default:
                                break;
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
                              <td style={{ width: "9%" }}>R{invoiceId}</td>
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
                                  style={{
                                    fontSize: "26px",
                                    cursor: "pointer",
                                  }}
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
                                  style={{
                                    fontSize: "26px",
                                    cursor: "pointer",
                                  }}
                                  onClick={() =>
                                    fetchInvoiceDataForStock(invoice.invoiceId)
                                  }
                                >
                                  <img
                                    style={{ width: "20px" }}
                                    src={Edit}
                                    alt="edit"
                                  />
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                  </tbody>
                  <tfoot style={{ borderTop: "1px solid var(--brown-color)" }}>
                    <tr>
                      <td style={{ width: "21%", fontWeight: "bold" }}>
                        Total:-
                      </td>
                      <td style={{ width: "0%" }}></td>
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
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "20px",
                  }}
                >
                  <p>
                    <strong>Date:</strong>{" "}
                    {new Date(selectedInvoice.createdAt).toLocaleDateString()}
                  </p>
                  <h2>Invoice: R{selectedInvoice.invoiceId}</h2>

                  <p>
                    <strong>Total Amount:</strong> -
                    {selectedInvoice.totalAmount.toLocaleString("en-IN")}
                  </p>
                </div>
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
                        <td>{product.price}</td>
                        <td>-{product.quantity}</td>
                        <td>-{product.price * product.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <button
                  className="print-button"
                  style={{ marginRight: "10px" }}
                >
                  <ReactToPrint
                    trigger={() => (
                      <p style={{ fontSize: "0.82rem", cursor: "pointer" }}>
                        Print Bill
                      </p>
                    )}
                    content={() => componentRef.current}
                    removeAfterPrint={false}
                  />
                </button>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="print-button"
                >
                  Close
                </button>
              </div>
            </div>
          </>
        )}

      <div ref={componentRef} className="print-content">
        <h1
          style={{
            padding: "11px 0px",
            fontSize: "22px",
            textAlign: "center",
            margin: "0",
            background: "white",
            borderRadius: "0px 25px 0px 0px",
          }}
        >
          Jay Swaminarayan
        </h1>
        <div className="bill_header_sub">
          <p style={{ margin: 0, fontSize: "15px", fontWeight: "bold" }}>
            Date :- {new Date(selectedInvoice?.createdAt).toLocaleDateString()}
          </p>
          <h8
            style={{
              margin: 0,
              fontSize: "15px",
              fontWeight: "bold",
              paddingRight: "5px",
            }}
          >
            INV.No: R{selectedInvoice?.invoiceId}
          </h8>
        </div>
        <div className="bill_header_main"></div>
        <div
          style={{
            height: "80.5%",
            overflow: "auto",
            padding: "0px 12px",
            background: "white",
            borderRadius: "0px 0px 40px 0px",
          }}
        >
          <hr style={{ borderTop: "solid 2px", margin: "5px 0px 0px 0px" }} />

          <div
            className="pavti_title_head"
            style={{ height: "24px", alignItems: "center", width: "380px" }}
          >
            <p
              className="pavti_title"
              style={{
                width: "52px",
                textAlign: "center",
                fontWeight: "bold",
                borderRight: "1px solid",
                height: "26px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ID
            </p>
            <p
              className="pavti_title"
              style={{
                width: "208px",
                textAlign: "left",
                fontWeight: "bold",
                borderRight: "1px solid",
                paddingLeft: "4px",
                height: "26px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              Item
            </p>
            <p
              className="pavti_title"
              style={{
                width: "40px",
                textAlign: "center",
                fontWeight: "bold",
              }}
            >
              Qty
            </p>
            <p
              className="pavti_title"
              style={{
                width: "80px",
                textAlign: "center",
                fontWeight: "bold",
              }}
            >
              Amt
            </p>
          </div>
          <hr style={{ borderTop: "solid 1px" }} />
          {selectedInvoice === null ? (
            <p>Loading...</p>
          ) : selectedInvoice?.productId?.length > 0 ? (
            selectedInvoice.productId.map((product, i) => (
              <div key={i}>
                <div className="pavti_data_1" style={{ width: "380px" }}>
                  <p
                    title={product.productId}
                    className="pavti_product_Id_1"
                    style={{
                      textAlign: "left",
                      width: "52px",
                      borderRight: "1px solid",
                      fontSize: "15px",
                    }}
                  >
                    {product._id.productId}
                  </p>
                  <h3
                    className="pavti_product_name_1"
                    style={{
                      width: "208px",
                      borderRight: "1px solid",
                      paddingLeft: "4px",
                      fontSize: "15px",
                    }}
                  >
                    {" "}
                    {product._id.name}
                  </h3>
                  <div className="pavti_data_quantity">
                    <span style={{ fontSize: "15px" }}>
                      -{new Intl.NumberFormat("en-IN").format(product.quantity)}
                    </span>
                  </div>
                  <p
                    className="product_price_report"
                    style={{ fontSize: "15px", textAlign: "center" }}
                  >
                    -
                    {new Intl.NumberFormat("en-IN").format(
                      product.price * product.quantity
                    )}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p>No data available</p>
          )}

          <hr style={{ borderTop: "solid 1px" }} />
          <hr style={{ borderTop: "solid 1px", margin: "0px" }} />
          <div
            className="pavti_total"
            style={{ height: "30px", alignItems: "center", width: "380px" }}
          >
            <p
              style={{
                width: "265px",
                margin: 0,
                textAlign: "left",
                fontWeight: "bold",
                height: "32px",
                display: "flex",
                alignItems: "Center",
                justifyContent: "center",
                borderRight: "1px solid",
              }}
            >
              Total
            </p>
            <p
              style={{
                width: "40px",
                margin: 0,
                textAlign: "center",
                fontWeight: "bold",
              }}
            >
              {new Intl.NumberFormat("en-IN").format(totalQuantity)}
            </p>
            <p
              style={{
                width: "80px",
                margin: 0,
                textAlign: "center",
                fontWeight: "bold",
              }}
            >
              -
              {new Intl.NumberFormat("en-IN").format(
                selectedInvoice?.totalAmount
              )}
            </p>
          </div>

          <hr style={{ borderTop: "solid 2px" }} />
          <p className="pavti_footer_text_report">... Visit Again ...</p>
        </div>
      </div>
    </>
  );
};

export default PurchaseReturn;
