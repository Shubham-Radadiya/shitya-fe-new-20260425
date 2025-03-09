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

const ReportIndex = () => {
  const componentRef = useRef();
  const dispatch = useDispatch();
  const { dailyReport } = useReport();
  const [silakOpen, setSilakOpen] = useState(false);
  const [reportType, setReportType] = useState("daily");
  const printRef = useRef();
  const [billDetail, setBillDetail] = useState(null);
  const [returnbillDetail, setReturnBillDetail] = useState(null);

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
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = String(now.getFullYear()).slice(-2);

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

  useEffect(() => {
    console.log(filteredProducts, "filteredProducts");
  }, []);

  const closeModal = () => {
    setSilakOpen(false);
  };
  const OpenModel = () => {
    setSilakOpen(true);
  };

  useEffect(() => {
    const token = localStorage.getItem("access_token"); // Fetch token once

    const fetchBillDetails = async () => {
      try {
        const response = await fetch(
          "http://localhost:3010/bill?isReturned=false",
          {
            method: "GET",
            headers: {
              Authorization: token, // Use token here
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch bill details");
        }

        const data = await response.json();
        setBillDetail(data);
      } catch (error) {
        console.error("Error fetching bill details:", error);
      }
    };

    const fetchReturnBillDetails = async () => {
      try {
        const response = await fetch(
          "http://localhost:3010/bill?isReturned=true",
          {
            method: "GET",
            headers: {
              Authorization: token, // Use token here
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch return bill details");
        }

        const data = await response.json();
        setReturnBillDetail(data);
      } catch (error) {
        console.error("Error fetching return bill details:", error);
      }
    };
    fetchBillDetails();
    fetchReturnBillDetails();
  }, []);

  const [salesData, setSalesData] = useState(initialData);
  const [openSilak, setOpenSilak] = useState(0);
  const [closeSilak, setCloseSilak] = useState(0);
  const [jamaRakam, setJamaRakam] = useState(0);
  const [existingData, setExistingData] = useState([]);
  const [id, setId] = useState();

  const fetchUpdatedData = async () => {
    const token = localStorage.getItem("access_token");

    try {
      const response = await axios.get("http://localhost:3010/daily-currency", {
        headers: {
          Authorization: token,
        },
      });

      if (response.data.data.length > 0) {
        console.log(response.data.data.length, "response.data.length");

        const formattedData = response.data.data.map((item) => ({
          currency: item.currency || "",
          count: item.count || 0,
        }));

        setSalesData(formattedData);
        setExistingData(response.data.data);
        setId(response.data._id);

        setOpenSilak(response.data.openSilak || 0);
        setCloseSilak(response.data.closeSilak || 0);
        setJamaRakam(response.data.jamaRakam || 0);
      } else {
        console.log("No valid data returned from API");
        setSalesData(initialData);
        setExistingData([]);
      }
    } catch (error) {
      console.error("Error fetching data from the API", error);
      setSalesData(initialData); // Set to initial data on error
      setExistingData([]); // Clear existing data
      setOpenSilak(0);
      setCloseSilak(0);
      setJamaRakam(0);
    }
  };

  useEffect(() => {
    fetchUpdatedData();
    console.log(salesData, "SalesData");
  }, []);

  const handleValueChange = (index, value) => {
    const updatedSalesData = [...salesData];
    updatedSalesData[index].count = parseInt(value, 10) || 0; // Ensure it's a valid number
    setSalesData(updatedSalesData); // Update state with new values
  };

  const handleSubmit = () => {
    const payload = {
      data: salesData.map((cur) => ({
        currency: cur.currency,
        count: cur.count,
      })),
      openSilak: parseInt(openSilak, 10),
      closeSilak: parseInt(closeSilak, 10),
      jamaRakam: parseInt(jamaRakam, 10),
    };

    console.log("Payload to be sent:", payload);

    const token = localStorage.getItem("access_token");

    // Check the length of existingData directly
    if (existingData.length > 0) {
      axios
        .patch(`http://localhost:3010/daily-currency/${id}`, payload, {
          headers: { Authorization: token },
        })
        .then((patchResponse) => {
          console.log(
            "Data successfully updated via PATCH",
            patchResponse.data
          );
          fetchUpdatedData(); // Refresh data
        })
        .catch((error) => {
          console.error("Error in updating data via PATCH", error);
        });
    } else {
      axios
        .post("http://localhost:3010/daily-currency", payload, {
          headers: { Authorization: token },
        })
        .then((response) => {
          console.log("Data successfully sent to the API", response.data);
          fetchUpdatedData(); // Refresh data
        })
        .catch((error) => {
          console.error("Error in sending data to the API", error);
        });
    }

    closeModal();
  };

  const totalSilakAmount = billDetail?.reduce(
    (acc, cur) => acc + cur.totalAmount,
    0
  );

  const SilakCurrencyTotal = salesData?.reduce(
    (acc, cur) => acc + cur.currency * cur.count,
    0
  );

  const silakTotalAmount = salesData?.reduce(
    (acc, cur) => acc + cur.totalAmount,
    0
  );
  const totalSilakReturnAmount = returnbillDetail?.reduce(
    (acc, cur) => acc + cur.totalAmount,
    0
  );

  const midIndex = billDetail?.length ? Math.ceil(billDetail.length / 2) : 0;
  const firstHalf = billDetail?.length ? billDetail.slice(0, midIndex) : [];
  const secondHalf = billDetail?.length ? billDetail.slice(midIndex) : [];

  const midReturnIndex = returnbillDetail?.length
    ? Math.ceil(returnbillDetail.length / 2)
    : 0;
  const firstHalfReturn = returnbillDetail?.length
    ? returnbillDetail.slice(0, midReturnIndex)
    : [];
  const secondHalfReturn = returnbillDetail?.length
    ? returnbillDetail.slice(midReturnIndex)
    : [];

  return (
    <>
      <div className="user-template">
        <div className="user-container">
          <div className="userreport-box">
            <div style={{ display: "flex", gap: "35px" }}>
              <NavLink to="/dashboard">
                <div className="back-btn">
                  <IoArrowBack />
                </div>
              </NavLink>
              <div
                style={{
                  display: "flex",
                  textAlign: "center",
                  alignItems: "center",
                  gap: "15px",
                }}
              >
                {currentReport.map((data) => (
                  <p style={{ fontSize: "18px" }}>
                    User name: {data.userFullName}
                  </p>
                ))}
                <p style={{ fontSize: "18px" }}>
                  Date: {`${day}-${month}-${year}`}
                </p>
              </div>
            </div>
            <div className="tfootgroup">
              <button className="userreprt-button" onClick={OpenModel}>
                Print
              </button>
              <button className="userreprt-button" onClick={exportToExcel}>
                Export to Excel
              </button>
            </div>
          </div>
          <div className="userreport-table-wrapper">
            <div
              style={{ display: "flex", flexDirection: "column", gap: "30px" }}
            >
              {reportType === "daily" && (
                <>
                  <table className="userreport-table">
                    <thead>
                      <tr>
                        <th style={{ width: "8%" }}>Sr. No.</th>
                        <th style={{ width: "13%", textAlign: "start" }}>
                          Product ID
                        </th>
                        <th style={{ textAlign: "start" }}>Product Name</th>
                        <th style={{ width: "13%", textAlign: "end" }}>
                          Quantity
                        </th>
                        <th style={{ width: "13%", textAlign: "end" }}>
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((product, index) => (
                        <tr key={index}>
                          <td style={{ width: "8%" }}>{index + 1}</td>
                          <td style={{ width: "13%", textAlign: "start" }}>
                            {product.productId}
                          </td>
                          <td style={{ textAlign: "start" }}>
                            {product.name || "N/A"}
                          </td>
                          <td style={{ width: "13%", textAlign: "end" }}>
                            {new Intl.NumberFormat("en-IN").format(product.totalBuyingCount) || "N/A"}
                          </td>
                          <td style={{ width: "13%", textAlign: "end" }}>
                            {new Intl.NumberFormat("en-IN").format(
                              product.totalBuyingCount * product.price
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot
                      style={{ borderTop: "1px solid var(--brown-color)" }}
                    >
                      <tr>
                        <td colSpan="5">
                          <div className="tfootgroup"></div>
                        </td>
                        <td
                          style={{
                            textAlign: "end",
                            paddingLeft: "21px",
                            fontWeight: "bold",
                          }}
                        >
                          Total:{" "}
                        </td>
                        <td style={{ textAlign: "end", fontWeight: "bold" }}>
                          ₹ {new Intl.NumberFormat("en-IN").format(totalAmount)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                  <table className="userreport-table">
                    <thead>
                      <tr>
                        <th style={{ width: "8%" }}>Sr. No.</th>
                        <th style={{ width: "13%", textAlign: "start" }}>
                          Category Name
                        </th>
                        <th style={{ width: "13%", textAlign: "end" }}>
                          Total Quantity
                        </th>
                        <th style={{ width: "13%", textAlign: "end" }}>
                          Total Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCategory.map((category, index) => (
                        <tr key={category.categoryIndex}>
                          <td style={{ width: "8%" }}>{index + 1}</td>
                          <td style={{ width: "13%", textAlign: "start" }}>
                            {category.categoryName}
                          </td>
                          <td style={{ width: "13%", textAlign: "end" }}>
                            {new Intl.NumberFormat("en-IN").format(category.totalQuantity) || "N/A"}
                          </td>
                          <td style={{ width: "13%", textAlign: "end" }}>
                            {new Intl.NumberFormat("en-IN").format(
                              category.totalAmount
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot
                      style={{ borderTop: "1px solid var(--brown-color)" }}
                    >
                      <tr>
                        <td colSpan="2"></td>
                        <td
                          style={{
                            textAlign: "end",
                            paddingRight: "36px",
                            fontWeight: "bold",
                          }}
                        >
                          Total:{" "}
                        </td>
                        <td
                          style={{
                            textAlign: "end",
                            fontWeight: "bold",
                          }}
                        >
                          ₹ {new Intl.NumberFormat("en-IN").format(totalAmount)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <div ref={printRef} className="print-content">
        {/*  */}
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
          Daily Sale Report
        </h1>
        <div className="bill_header_sub">
          <p style={{ margin: 0, fontSize: "17px", fontWeight: "bold" }}>
            Date :-{" "}
            <span style={{ fontWeight: "300" }}>{currentDateTime()}</span>{" "}
          </p>
          {currentReport.map((data) => (
            <p style={{ fontSize: "17px", fontWeight: "bold" }}>
              User :-{" "}
              <span style={{ fontWeight: "300" }}>{data.userFullName}</span>
            </p>
          ))}
        </div>
        <div className="bill_header_main"></div>
        <div
          style={{
            height: "80.5%",
            overflow: "auto",
            padding: "0px 8px",
            background: "white",
            borderRadius: "0px 0px 40px 0px",
          }}
        >
          <hr style={{ borderTop: "solid 2px", margin: "5px 0px -2px 0px" }} />
          <div
            className="pavti_title_head"
            style={{
              height: "22px",
              alignItems: "center",
              justifyContent: "flex-start",
            }}
          >
            <p
              className="pavti_title"
              style={{
                width: "55px",
                textAlign: "center",
                fontWeight: "bold",
                borderRight: "1px solid",
              }}
            >
              Id
            </p>
            <p
              className="pavti_title"
              style={{
                width: "215px",
                textAlign: "left",
                fontWeight: "bold",
                borderRight: "1px solid",
                height: "20px",
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "center",
              }}
            >
              Product
            </p>
            <p
              className="pavti_title"
              style={{
                width: "40px",
                textAlign: "center",
                fontWeight: "bold",
                borderRight: "1px solid",
                height: "23px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              Qty
            </p>
            <p
              className="pavti_title"
              style={{
                width: "80px",
                textAlign: "right",
                fontWeight: "bold",
              }}
            >
              Amt-₹
            </p>
          </div>
          <hr style={{ borderTop: "solid 2px" }} />
          {filteredProducts?.map((product, index) => (
            <div key={index}>
              <div
                className="pavti_data_1"
                style={{ justifyContent: "flex-start" }}
              >
                <p
                  className="pavti_product_Id_1"
                  style={{
                    textAlign: "left",
                    width: "55px",
                    borderRight: "1px solid",
                    fontSize: "15px",
                  }}
                >
                  {product.productId}
                </p>
                <h3
                  className="pavti_product_name_1"
                  style={{
                    width: "213px",
                    borderRight: "1px solid",
                    paddingLeft: "2px",
                    fontSize: "17px",
                  }}
                >
                  {product.name}
                </h3>
                <div
                  className="pavti_data_quantity"
                  style={{ borderRight: "1px solid" }}
                >
                  <span style={{ fontSize: "15px" }}>
                    {new Intl.NumberFormat("en-IN").format(product.totalBuyingCount)}
                  </span>
                </div>
                <p
                  className="product_price_report"
                  style={{ fontSize: "15px" }}
                >
                  {new Intl.NumberFormat("en-IN").format(
                    product.totalBuyingCount * product.price
                  )}
                </p>
              </div>
            </div>
          ))}

          <hr style={{ borderTop: "solid 2px" }} />
          <hr style={{ borderTop: "solid 2px", margin: "0px" }} />
          <div
            className="pavti_total"
            style={{ height: "30px", alignItems: "center", justifyContent: "flex-start" }}
          >
            <p
              style={{
                width: "271px",
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
                borderRight: "1px solid",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {new Intl.NumberFormat("en-IN").format(totalQuantity)}
            </p>
            <p
              style={{
                width: "80px",
                margin: 0,
                textAlign: "right",
                fontWeight: "bold",
              }}
            >
              {" "}
              {new Intl.NumberFormat("en-IN").format(totalAmount)}
            </p>
          </div>

          <hr style={{ borderTop: "solid 2px" }} />
          <p className="pavti_footer_text_report" style={{ fontSize: "22px" }}>
            ... Category Wise Daily Report ...
          </p>
        </div>

        <div
          style={{
            height: "80.5%",
            overflow: "auto",
            padding: "0px 8px",
            background: "white",
            borderRadius: "0px 0px 40px 0px",
          }}
        >
          <hr style={{ borderTop: "solid 2px", margin: "5px 0px 0px 0px" }} />
          <div
            className="pavti_title_head"
            style={{
              justifyContent: "flex-start",
              alignItems: "center",
            }}
          >
            <p
              className="pavti_title"
              style={{
                width: "190px",
                textAlign: "left",
                fontWeight: "bold",
                fontSize: "20px",
                borderRight: "1px solid black",
              }}
            >
              Category
            </p>
            <p
              className="pavti_title"
              style={{
                width: "200px",
                textAlign: "end",
                fontWeight: "bold",
                fontSize: "20px",
              }}
            >
              Amt
            </p>
          </div>
          {filteredCategory.map((category, name) => (
            <div key={name}>
              <div
                className="pavti_data"
                style={{ display: "flex", justifyContent: "flex-start" }}
              >
                <h3
                  className="pavti_product_name"
                  style={{
                    fontSize: "20px",
                    width: "190px",
                    borderRight: "1px solid black", // Add border-right here
                  }}
                >
                  {category.categoryName}
                </h3>
                <p
                  className="product_price_report_1"
                  style={{
                    fontSize: "20px",
                    width: "200px",
                    textAlign: "end",
                  }}
                >
                  {new Intl.NumberFormat("en-IN").format(category.totalAmount)}
                </p>
              </div>
            </div>
          ))}

          <hr style={{ borderTop: "solid 2px" }} />
          <hr style={{ borderTop: "solid 2px", margin: "0px" }} />
          <div
            className="pavti_total"
            style={{
              height: "27px",
              alignItems: "center",
              display: "flex",
              justifyContent: "flex-start  ",
            }}
          >
            <p
              style={{
                width: "190px",
                margin: 0,
                textAlign: "left",
                fontWeight: "bold",
                fontSize: "20px",
                borderRight: "1px solid black",
              }}
            >
              Total
            </p>
            <p
              style={{
                width: "200px",
                margin: 0,
                textAlign: "right",
                fontWeight: "bold",
                fontSize: "20px",
              }}
            >
              {new Intl.NumberFormat("en-IN").format(totalAmount)}
            </p>
          </div>
          <hr style={{ borderTop: "solid 2px" }} />
          <hr style={{ borderTop: "solid 2px", margin: "0px" }} />
        </div>

        <h2
          style={{
            padding: "0px 0px",
            fontSize: "22px",
            textAlign: "center",
            margin: "20px 0px",
            background: "white",
            borderRadius: "0px 25px 0px 0px",
          }}
        >
          -: Bill Detail :-
        </h2>
        <hr style={{ borderTop: "solid 2px", margin: "5px 0px 0px 0px" }} />
        <div
          className="pavti_title_head"
          style={{
            display: "flex",
            justifyContent: "center",
            height: "auto",
            width: "390px",
            marginLeft: "6px",
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  width: "188px",
                }}
              >
                <p
                  className="pavti_title"
                  style={{
                    textAlign: "left",
                    fontWeight: "bold",
                    fontSize: "20px",
                  }}
                >
                  Bill
                </p>
                <p
                  className="pavti_title"
                  style={{
                    textAlign: "left",
                    fontWeight: "bold",
                    fontSize: "20px",
                  }}
                >
                  Amt
                </p>
              </div>
              {firstHalf.map((bill, index) => (
                <div
                  key={index}
                  className="pavti_data"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <h3
                    className="pavti_product_name"
                    style={{
                      fontSize: "20px",
                      width: "90px",
                      fontWeight: 500,
                    }}
                  >
                    {bill.billId}
                  </h3>
                  <p
                    className="product_price_report_1"
                    style={{ fontSize: "20px", width: "92px", fontWeight: 500 }}
                  >
                    {new Intl.NumberFormat("en-IN").format(bill.totalAmount)}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div
            style={{
              borderLeft: "1px solid black",
              height: "auto",
              margin: "0 5px",
            }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  width: "188px",
                }}
              >
                <p
                  className="pavti_title"
                  style={{
                    textAlign: "left",
                    fontWeight: "bold",
                    fontSize: "20px",
                  }}
                >
                  Bill
                </p>
                <p
                  className="pavti_title"
                  style={{
                    textAlign: "left",
                    fontWeight: "bold",
                    fontSize: "20px",
                  }}
                >
                  Amt
                </p>
              </div>
              {secondHalf.map((bill, index) => (
                <div
                  key={index}
                  className="pavti_data"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <h3
                    className="pavti_product_name"
                    style={{
                      fontSize: "20px",
                      width: "90px",
                      fontWeight: 500,
                    }}
                  >
                    {bill.billId}
                  </h3>
                  <p
                    className="product_price_report_1"
                    style={{ fontSize: "20px", width: "92px" }}
                  >
                    {new Intl.NumberFormat("en-IN").format(bill.totalAmount)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <hr style={{ borderTop: "solid 2px", margin: "5px 0px 0px 0px" }} />
        <div
          className="pavti_total"
          style={{ height: "27px", alignItems: "center", display: "flex", justifyContent: "flex-start" }}
        >
          <p
            style={{
              width: "195px",
              margin: 0,
              textAlign: "left",
              fontWeight: "bold",
              fontSize: "20px",
              borderRight: "1px solid black", // Add border-right here
              marginLeft: "5px",
            }}
          >
            Total
          </p>
          <p
            style={{
              width: "200px",
              margin: 0,
              textAlign: "right",
              fontWeight: "bold",
              fontSize: "20px",
              paddingRight: "10px",
            }}
          >
            {new Intl.NumberFormat("en-IN").format(totalSilakAmount)}
          </p>
        </div>
        <hr style={{ borderTop: "solid 2px", margin: "0px 0px 0px 0px" }} />

        {firstHalfReturn.length > 0 && (
          <>
            <h2
              style={{
                padding: "0px 0px",
                fontSize: "22px",
                textAlign: "center",
                margin: "20px 0px",
                background: "white",
                borderRadius: "0px 25px 0px 0px",
              }}
            >
              -: Return Bill Detail :-
            </h2>
            <hr style={{ borderTop: "solid 2px", margin: "5px 0px 0px 0px" }} />
            <div
              className="pavti_title_head"
              style={{
                display: "flex",
                justifyContent: "flex-start",
                height: "auto",
                width: "400px",
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      width: "188px",
                    }}
                  >
                    <p
                      className="pavti_title"
                      style={{
                        textAlign: "left",
                        fontWeight: "bold",
                        fontSize: "20px",
                      }}
                    >
                      Return
                    </p>
                    <p
                      className="pavti_title"
                      style={{
                        textAlign: "left",
                        fontWeight: "bold",
                        fontSize: "20px",
                      }}
                    >
                      Amt
                    </p>
                  </div>
                  {firstHalfReturn.map((bill, index) => (
                    <div
                      key={index}
                      className="pavti_data"
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <h3
                        className="pavti_product_name"
                        style={{
                          fontSize: "20px",
                          width: "100px",
                          fontWeight: 500,
                        }}
                      >
                        {bill.billId}
                      </h3>
                      <p
                        className="product_price_report_1"
                        style={{ fontSize: "20px", width: "95px", fontWeight: 500 }}
                      >
                        {new Intl.NumberFormat("en-IN").format(bill.totalAmount)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <div
                style={{
                  borderLeft: "1px solid black",
                  height: "auto",
                  margin: "0 7px",
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      width: "193px",
                    }}
                  >
                    <p
                      className="pavti_title"
                      style={{
                        textAlign: "left",
                        fontWeight: "bold",
                        fontSize: "20px",
                      }}
                    >
                      Return
                    </p>
                    <p
                      className="pavti_title"
                      style={{
                        textAlign: "left",
                        fontWeight: "bold",
                        fontSize: "20px",
                      }}
                    >
                      Amt
                    </p>
                  </div>
                  {secondHalfReturn.map((bill, index) => (
                    <div
                      key={index}
                      className="pavti_data"
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <h3
                        className="pavti_product_name"
                        style={{
                          fontSize: "20px",
                          width: "100px",
                          fontWeight: 500,
                        }}
                      >
                        {bill.billId}
                      </h3>
                      <p
                        className="product_price_report_1"
                        style={{ fontSize: "20px", width: "95px" }}
                      >
                        {new Intl.NumberFormat("en-IN").format(bill.totalAmount)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <hr style={{ borderTop: "solid 2px", margin: "5px 0px 0px 0px" }} />
            <div
              className="pavti_total"
              style={{ height: "27px", alignItems: "center", display: "flex", justifyContent: "flex-start" }}
            >
              <p
                style={{
                  width: "200px",
                  margin: 0,
                  textAlign: "left",
                  fontWeight: "bold",
                  fontSize: "20px",
                  borderRight: "1px solid black",
                }}
              >
                Total
              </p>
              <p
                style={{
                  width: "196px",
                  margin: 0,
                  textAlign: "right",
                  fontWeight: "bold",
                  fontSize: "20px",
                  paddingRight: "10px",
                }}
              >
                {new Intl.NumberFormat("en-IN").format(totalSilakReturnAmount)}
              </p>
            </div>
            <hr style={{ borderTop: "solid 2px", margin: "0px 0px 0px 0px" }} />
          </>
        )}

        <h2
          style={{
            padding: "0px 0px",
            fontSize: "22px",
            textAlign: "center",
            margin: "20px 0px",
            background: "white",
            borderRadius: "0px 25px 0px 0px",
          }}
        >
          -: આજનો હિસાબ :-
        </h2>
        <div
          style={{
            height: "80.5%",
            overflow: "auto",
            padding: "0px 8px",
            background: "white",
            borderRadius: "0px 0px 40px 0px",
          }}
        >
          <hr style={{ borderTop: "solid 2px", margin: "5px 0px 0px 0px" }} />
          <div
            className="pavti_data"
            style={{ display: "flex", justifyContent: "flex-start" }}
          >
            <h3
              className="pavti_product_name"
              style={{
                fontSize: "18px",
                width: "280px",
                borderRight: "1px solid black",
                fontWeight: 500,
                lineHeight: "28px",
              }}
            >
              આજની ખુલતી સીલક
            </h3>
            <p
              className="product_price_report_1"
              style={{
                fontSize: "18px",
                width: "111px",
                textAlign: "end",
                paddingRight: "7px",
                lineHeight: "28px",
              }}
            >
              {new Intl.NumberFormat("en-IN").format(openSilak)}
            </p>
          </div>
          <div
            className="pavti_data"
            style={{ display: "flex", justifyContent: "flex-start" }}
          >
            <h3
              className="pavti_product_name"
              style={{
                fontSize: "18px",
                width: "280px",
                borderRight: "1px solid black",
                fontWeight: 500,
                lineHeight: "28px",
              }}
            >
              આજનુ વેચાણ
            </h3>
            <p
              className="product_price_report_1"
              style={{
                fontSize: "18px",
                width: "111px",
                textAlign: "end",
                paddingRight: "7px",
                lineHeight: "28px",
              }}
            >
              {new Intl.NumberFormat("en-IN").format(totalAmount)}
            </p>
          </div>
          <div
            className="pavti_data"
            style={{ display: "flex", justifyContent: "flex-start" }}
          >
            <h3
              className="pavti_product_name"
              style={{
                fontSize: "18px",
                width: "280px",
                borderRight: "1px solid black",
                borderTop: "2px solid black",
                borderBottom: "2px solid black",
                lineHeight: "28px",
              }}
            >
              કુલ બેલેન્સ
            </h3>
            <p
              className="product_price_report_1"
              style={{
                fontSize: "18px",
                width: "111px",
                textAlign: "end",
                paddingRight: "7px",
                borderTop: "2px solid black",
                borderBottom: "2px solid black",
                lineHeight: "28px",
                lineHeight: "28px",
                fontWeight: 700
              }}
            >
              {new Intl.NumberFormat("en-IN").format(
                parseInt(openSilak, 10) + parseInt(totalAmount, 10) || 0
              )}
            </p>
          </div>
          <div
            className="pavti_data"
            style={{ display: "flex", justifyContent: "flex-start" }}
          >
            <h3
              className="pavti_product_name"
              style={{
                fontSize: "18px",
                width: "280px",
                borderRight: "1px solid black",
                fontWeight: 500,
                lineHeight: "28px",
              }}
            >
              આજની બંધ સીલક
            </h3>
            <p
              className="product_price_report_1"
              style={{
                fontSize: "18px",
                width: "111px",
                textAlign: "end",
                paddingRight: "7px",
                lineHeight: "28px",
              }}
            >
              {new Intl.NumberFormat("en-IN").format(closeSilak)}
            </p>
          </div>
          <div
            className="pavti_data"
            style={{ display: "flex", justifyContent: "flex-start" }}
          >
            <h3
              className="pavti_product_name"
              style={{
                fontSize: "18px",
                width: "280px",
                borderRight: "1px solid black",
                fontWeight: 500,
                lineHeight: "28px",
              }}
            >
              આજની જમા કરાવેલ રકમ નીચે મુજબ
            </h3>
            <p
              className="product_price_report_1"
              style={{
                fontSize: "18px",
                width: "111px",
                textAlign: "end",
                paddingRight: "7px",
                lineHeight: "28px",
              }}
            >
              {new Intl.NumberFormat("en-IN").format(SilakCurrencyTotal)}
            </p>
          </div>
          <div
            className="pavti_data"
            style={{ display: "flex", justifyContent: "flex-start" }}
          >
            <h3
              className="pavti_product_name"
              style={{
                fontSize: "18px",
                width: "280px",
                borderRight: "1px solid black",
                borderTop: "2px solid black",
                lineHeight: "28px",
              }}
            >
              {`હિસાબની ભૂલ (${parseInt(openSilak, 10) +
                  parseInt(totalAmount, 10) -
                  closeSilak -
                  SilakCurrencyTotal ===
                  0
                  ? "રાજીપો"
                  : parseInt(openSilak, 10) +
                    parseInt(totalAmount, 10) -
                    closeSilak -
                    SilakCurrencyTotal >
                    0
                    ? "વધારો"
                    : "ઘટાડો"
                })`}
            </h3>
            <p
              className="product_price_report_1"
              style={{
                fontSize: "18px",
                width: "111px",
                textAlign: "end",
                paddingRight: "7px",
                borderTop: "2px solid black",
                lineHeight: "28px",
                fontWeight: 700
              }}
            >
              {new Intl.NumberFormat("en-IN").format(
                parseInt(openSilak, 10) +
                parseInt(totalAmount, 10) -
                (parseInt(closeSilak, 10) || 0) -
                (parseInt(SilakCurrencyTotal, 10) || 0) || 0
              )}
            </p>
          </div>
          <hr style={{ borderTop: "solid 2px", margin: 0 }} />
        </div>
        <h2
          style={{
            padding: "0px 0px",
            fontSize: "22px",
            textAlign: "center",
            margin: "20px 0px",
            background: "white",
            borderRadius: "0px 25px 0px 0px",
          }}
        >
          -: Silak :-
        </h2>
        <div
          style={{
            height: "80.5%",
            overflow: "auto",
            padding: "0px 8px",
            background: "white",
            borderRadius: "0px 0px 40px 0px",
          }}
        >
          <hr style={{ borderTop: "solid 2px", margin: "5px 0px 0px 0px" }} />
          <div
            className="pavti_title_head"
            style={{
              justifyContent: "flex-start",
              alignItems: "center",
            }}
          >
            <p
              className="pavti_title"
              style={{
                width: "130px",
                textAlign: "left",
                fontWeight: "bold",
                fontSize: "20px",
              }}
            >
              Currency
            </p>
            <p
              className="pavti_title"
              style={{
                width: "130px",
                textAlign: "center",
                fontWeight: "bold",
                fontSize: "20px",
              }}
            >
              No.
            </p>
            <p
              className="pavti_title"
              style={{
                width: "130px",
                textAlign: "end",
                fontWeight: "bold",
                fontSize: "20px",
              }}
            >
              Amt
            </p>
          </div>
          {salesData && salesData.length > 0 ? (
            salesData.map((cur, index) => (
              <div key={index}>
                <div
                  className="pavti_data"
                  style={{ display: "flex", justifyContent: "flex-start" }}
                >
                  <h3
                    className="pavti_product_name"
                    style={{
                      fontSize: "20px",
                      width: "130px",
                      textAlign: "left",
                    }}
                  >
                    {new Intl.NumberFormat("en-IN").format(cur.currency)}
                  </h3>
                  <p
                    className="product_price_report_1"
                    style={{
                      fontSize: "20px",
                      width: "130px",
                      textAlign: "center",
                    }}
                  >
                    {new Intl.NumberFormat("en-IN").format(cur.count)}
                  </p>
                  <p
                    className="product_price_report_1"
                    style={{
                      fontSize: "20px",
                      width: "130px",
                      textAlign: "end",
                    }}
                  >
                    {new Intl.NumberFormat("en-IN").format(
                      cur.currency * cur.count
                    )}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div>
              <p style={{ textAlign: "center" }}>No data available</p>
            </div>
          )}

          <hr style={{ borderTop: "solid 2px" }} />
          <hr style={{ borderTop: "solid 2px", margin: "0px" }} />
          <div
            className="pavti_total"
            style={{
              height: "27px",
              alignItems: "center",
              display: "flex",
              justifyContent: "flex-start  ",
            }}
          >
            <p
              style={{
                width: "289px",
                margin: 0,
                textAlign: "left",
                fontWeight: "bold",
                fontSize: "20px",
                borderRight: "1px solid black", // Add border-right here
              }}
            >
              Total
            </p>
            <p
              style={{
                width: "100px",
                margin: 0,
                textAlign: "right",
                fontWeight: "bold",
                fontSize: "20px",
              }}
            >
              {new Intl.NumberFormat("en-IN").format(SilakCurrencyTotal)}
            </p>
          </div>
          <hr style={{ borderTop: "solid 2px", margin: "0px" }} />
          <hr style={{ borderTop: "solid 2px", margin: "0px" }} />
        </div>
        <p className="pavti_footer_text_report" style={{ fontSize: "22px" }}>
          ... Jay Swaminarayan ...
        </p>
      </div>
      {silakOpen && (
        <div className="edit-modal">
          <div className="khulti-shilak-model">
            <h3 className="khulti-shilak-model-title">આજનો હિસાબ</h3>
            <div className="silak-table-main">
              <div className="silak-table">
                <table
                  className="userreport-table-silak"
                  style={{ height: "fit-content" }}
                >
                  <thead>
                    <tr>
                      <th
                        className="silak-title-th"
                        style={{ borderBottom: "0px", fontWeight: 500 }}
                      >
                        આજની ખુલતી સીલક
                      </th>
                      <th
                        className="silak-value-th"
                        style={{ borderBottom: "0px", fontWeight: 500 }}
                      >
                        <input
                          type="text"
                          value={new Intl.NumberFormat("en-IN").format(
                            openSilak
                          )}
                          onChange={(e) => {
                            const opensilakValue = e.target.value.replace(
                              /[^0-9]/g,
                              ""
                            );
                            setOpenSilak(opensilakValue)
                          }}
                          style={{
                            width: "85%",
                            textAlign: "end",
                            height: "19px",
                            fontSize: "19px",
                          }}
                        />
                      </th>
                    </tr>
                    <tr>
                      <th
                        className="silak-title-th"
                        style={{ borderTop: "0px", fontWeight: 500 }}
                      >
                        આજનુ વેચાણ
                      </th>
                      <th
                        className="silak-value-th"
                        style={{ borderTop: "0px", fontWeight: 500 }}
                      >
                        {new Intl.NumberFormat("en-IN").format(
                          totalAmount
                        )}
                      </th>
                    </tr>
                    <tr>
                      <th
                        className="silak-title-th"
                        style={{ fontWeight: 700 }}
                      >
                        કુલ બેલેન્સ
                      </th>
                      <th
                        className="silak-value-th"
                        style={{ fontWeight: 700 }}
                      >
                        {new Intl.NumberFormat("en-IN").format(
                          (isNaN(parseInt(openSilak, 10)) ? 0 : parseInt(openSilak, 10)) +
                          (isNaN(parseInt(totalAmount, 10)) ? 0 : parseInt(totalAmount, 10))
                        )}

                      </th>
                    </tr>
                    <tr>
                      <th
                        className="silak-title-th"
                        style={{ borderBottom: "0px", fontWeight: 500 }}
                      >
                        આજની બંધ સીલક
                      </th>
                      <th
                        className="silak-value-th"
                        style={{ borderBottom: "0px", fontWeight: 500 }}
                      >
                        <input
                          type="text"
                          value={new Intl.NumberFormat("en-IN").format(
                            closeSilak
                          )}
                          onChange={(e) => {
                            const closesilakValue = e.target.value.replace(
                              /[^0-9]/g,
                              ""
                            );
                            setCloseSilak(closesilakValue)
                          }}
                          style={{
                            width: "85%",
                            textAlign: "end",
                            height: "19px",
                            fontSize: "19px",
                          }}
                        />
                      </th>
                    </tr>
                    <tr>
                      <th
                        className="silak-title-th"
                        style={{ borderTop: "0px", fontWeight: 500 }}
                      >
                        આજની જમા કરાવેલ રકમ નીચે મુજબ
                      </th>
                      <th
                        className="silak-value-th"
                        style={{ borderTop: "0px", fontWeight: 500 }}
                      >
                         {new Intl.NumberFormat("en-IN").format(
                          (isNaN(parseInt(SilakCurrencyTotal, 10)) ? 0 : parseInt(SilakCurrencyTotal, 10))
                        )}
                      </th>
                    </tr>
                    <tr>
                      <th
                        className="silak-title-th"
                        style={{ fontWeight: 700 }}
                      >
                        {`હિસાબની ભૂલ (${parseInt(openSilak, 10) +
                            parseInt(totalAmount, 10) -
                            closeSilak -
                            SilakCurrencyTotal ===
                            0
                            ? "રાજીપો"
                            : parseInt(openSilak, 10) +
                              parseInt(totalAmount, 10) -
                              closeSilak -
                              SilakCurrencyTotal >
                              0
                              ? "ઘટાડો"
                              : "વધારો"
                          })`}
                      </th>
                      <th className="silak-value-th">
                        {new Intl.NumberFormat("en-IN").format(
                          parseInt(openSilak, 10) +
                          parseInt(totalAmount, 10) -
                          (parseInt(closeSilak, 10) || 0) -
                          (parseInt(SilakCurrencyTotal, 10) || 0) || 0
                        )}
                      </th>
                    </tr>
                  </thead>
                </table>
              </div>
              <table className="userreport-table">
                <thead>
                  <tr>
                    <th style={{ width: "8%", padding: ".1rem" }}>Currency</th>
                    <th
                      style={{
                        width: "13%",
                        textAlign: "center",
                        padding: ".1rem",
                      }}
                    >
                      No.
                    </th>
                    <th
                      style={{
                        width: "13%",
                        textAlign: "end",
                        padding: ".1rem",
                      }}
                    >
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {salesData && salesData.length > 0 ? (
                    salesData.map((cur, index) => (
                      <tr key={index}>
                        <td style={{ width: "8%", padding: ".1rem" }}>
                          {cur.currency}
                        </td>
                        <td
                          style={{
                            width: "13%",
                            textAlign: "center",
                            padding: ".1rem",
                          }}
                        >
                          <input
                            type="text"
                            value={new Intl.NumberFormat("en-IN").format(
                              cur.count
                            )}
                            onChange={(e) => {
                              const numericValue = e.target.value.replace(
                                /[^0-9]/g,
                                ""
                              );

                              // Allow the user to input more numbers and handle change
                              handleValueChange(index, numericValue);
                            }}
                            style={{
                              width: "85%",
                              textAlign: "center",
                              height: "19px",
                              fontSize: "19px",
                            }}
                            min="0"
                          />
                        </td>
                        <td
                          style={{
                            width: "13%",
                            textAlign: "end",
                            padding: ".1rem",
                          }}
                        >
                          {new Intl.NumberFormat("en-IN").format(
                            cur.currency * cur.count
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" style={{ textAlign: "center" }}>
                        No data available
                      </td>
                    </tr>
                  )}
                </tbody>

                <tfoot
                  style={{
                    borderTop: "1px solid var(--brown-color)",
                    position: "relative",
                  }}
                >
                  <tr>
                    <td colSpan="2"></td>
                    <td style={{ textAlign: "end", fontWeight: "bold" }}>
                      Total:{" "}
                    </td>
                    <td
                      style={{
                        textAlign: "end",
                        fontWeight: "bold",
                        border: "0px",
                        width: "35%",
                      }}
                    >
                      ₹{" "}
                      {new Intl.NumberFormat("en-IN").format(
                        SilakCurrencyTotal
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div className="flexrow edit-btn">
              <ReactToPrint
                trigger={() => (
                  <button
                    className="icon-button"
                    style={{ fontSize: "19px", padding: ".3rem .8rem" }}
                  >
                    Print
                  </button>
                )}
                content={() => {
                  handleSubmit(); // Call handleSubmit before printing
                  return printRef.current;
                }}
              />
              <button
                className="icon-button"
                onClick={closeModal}
                style={{ fontSize: "19px", padding: ".3rem .8rem" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ReportIndex;