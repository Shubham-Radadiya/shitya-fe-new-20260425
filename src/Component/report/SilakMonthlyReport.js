import React, { useState, useEffect, useMemo } from "react";
import * as XLSX from "xlsx";
import "./index.css";
import download from "../images/download.png";

const SilakMonthlyReport = () => {
  const [reportData, setReportData] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [financialYear, setFinancialYear] = useState("");
  const [months, setMonths] = useState([]);
  const [startYear, setStartYear] = useState(null);
  const [endYear, setEndYear] = useState(null);

  useEffect(() => {
    const today = new Date();
    let start = today.getFullYear();
    let end = start + 1;

    if (today.getMonth() < 3) {
      start -= 1;
      end -= 1;
    }

    setStartYear(start);
    setEndYear(end);
    setFinancialYear(`${start}-${end}`);

    const monthList = [];
    let defaultMonth = null;

    for (let i = 3; i < 15; i++) {
      const date = new Date(start, i, 1);
      const monthObj = {
        label: date.toLocaleString("default", {
          month: "long",
          year: "2-digit",
        }),
        value: date,
      };

      monthList.push(monthObj);

      // Set the default month to the current month if it exists in the list
      if (
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
      ) {
        defaultMonth = date;
      }
    }

    setMonths(monthList);
    setSelectedMonth(defaultMonth || monthList[0].value); // Default to current month or April
  }, []);

  useEffect(() => {
    if (selectedMonth && startYear && endYear) {
      fetchFinancialYearData(startYear, endYear);
    }
  }, [selectedMonth, startYear, endYear]);

  const fetchFinancialYearData = async (start, end) => {
    try {
      const token = localStorage.getItem("access_token");

      if (!start || !end) {
        console.warn("Skipping fetch, startYear or endYear is undefined");
        return;
      }

      const startDate = `${start}-04-01`;
      const endDate = `${end}-03-31`;

      console.log(
        "Fetching financial year data from:",
        startDate,
        "to",
        endDate
      );

      const response = await fetch(
        "http://localhost:3010/report/silak/monthly",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: token,
          },
          body: JSON.stringify({ startDate, endDate }),
        }
      );

      if (!response.ok) throw new Error("Failed to fetch report data");

      const data = await response.json();
      setReportData(data.mergedDataForNotBhet);
    } catch (error) {
      console.error("Error fetching report data:", error);
    }
  };

  // Filter report data based on selected month
  const filteredReportData = reportData?.filter((silak) => {
    const silakDate = new Date(silak.createdAt);
    return (
      silakDate.getFullYear() === selectedMonth.getFullYear() &&
      silakDate.getMonth() === selectedMonth.getMonth()
    );
  });

  useEffect(() => {
    console.log(reportData, "data");
  }, [reportData]);

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
      ["Silak Monthly Report"], // First row: Title
      [`Date: ${currentDate}`], // Second row: Date
    ];

    // Add the title and date to the worksheet at the top
    XLSX.utils.sheet_add_aoa(worksheet, titleAndDate, { origin: "A1" });

    const tableData = Array.from(tableClone.querySelectorAll("tr")).map((row) =>
      Array.from(row.querySelectorAll("th, td")).map((cell) => cell.textContent)
    );
    XLSX.utils.sheet_add_aoa(worksheet, tableData, { origin: "A3" });

    // const totalRow = ["", "", "", "Total:", `${Amount.toFixed(2)}`];s
    // XLSX.utils.sheet_add_aoa(worksheet, [totalRow], { origin: -1 });

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
    a.download = "SilakMonthlyreport.xlsx";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const getCategoryTotal = (categoryName) => {
    return filteredReportData?.reduce((acc, user) => {
      const { categories } = user;
      const categoryTotal = categories
        .filter((category) => category.categoryName === categoryName)
        ?.reduce(
          (sum, category) => sum + category.totalBuyingAmountPerCategory,
          0
        );
      return acc + categoryTotal;
    }, 0);
  };

  const totalJamaRakam = filteredReportData?.reduce((acc, user) => {
    return acc + (user.silkData?.jamaRakam ?? 0);
  }, 0);

  const totalBhet = filteredReportData?.reduce((acc, user) => {
    return acc + (user.bhetData?.totalBuyingAmount ?? 0);
  }, 0);

  const totalKharch = filteredReportData?.reduce((acc, user) => {
    return acc + (user.silkData?.kharch ?? 0);
  }, 0);

  const totalBuyingAmount = filteredReportData?.reduce((acc, user) => {
    acc += user.categories?.reduce(
      (sum, category) => sum + category.totalBuyingAmountPerCategory,
      0
    );
    return acc;
  }, 0);

  return (
    <>
      <div className="user-template">
        <div className="user-container">
          <div
            className="userreport-box"
            style={{ justifyContent: "space-between" }}
          >
            <div className="tfootgroup" style={{width:"100%"}}>
              <div style={{display:"flex", gap:"10px", alignItems:"center"}}>
                <label>Financial Year: {financialYear}</label>
                <select
                  value={selectedMonth?.toISOString()}
                  onChange={(e) => setSelectedMonth(new Date(e.target.value))}
                  style={{width:"130px", height: "32px", borderRadius: "8px" }}
                >
                  {months.map((month, index) => (
                    <option key={index} value={month.value?.toISOString()}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="download" onClick={exportToExcel}>
                <img style={{ width: "50px" }} src={download} atl="down" />
              </div>
              {/* <button className="userreprt-button" onClick={exportToExcel}>
                Export to Excel
              </button> */}
            </div>
          </div>

          <div className="userreport-table-wrapper">
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "30px",
                maxHeight: "80.5vh",
              }}
            >
              <>
                <table className="userreport-table" style={{ width: "106%" }}>
                  <thead style={{ fontSize: "17px" }}>
                    <tr>
                      <th
                        className="silakM"
                        style={{
                          textAlign: "center",
                          border: "1px solid #000000",
                        }}
                      >
                        તારીખ
                      </th>
                      <th
                        className="silakM"
                        style={{
                          textAlign: "center",
                          border: "1px solid #000000",
                        }}
                      >
                        ખુલતી સીલક
                      </th>
                      <th
                        className="silakM"
                        style={{
                          textAlign: "center",
                          border: "1px solid #000000",
                        }}
                      >
                        મુર્તિ
                      </th>
                      <th
                        className="silakM"
                        style={{
                          textAlign: "center",
                          border: "1px solid #000000",
                        }}
                      >
                        વાઘા
                      </th>
                      <th
                        className="silakM"
                        style={{
                          textAlign: "center",
                          border: "1px solid #000000",
                        }}
                      >
                        ઘરેણા
                      </th>
                      <th
                        className="silakM"
                        style={{
                          textAlign: "center",
                          border: "1px solid #000000",
                        }}
                      >
                        પુજા
                      </th>
                      <th
                        className="silakM"
                        style={{
                          textAlign: "center",
                          border: "1px solid #000000",
                        }}
                      >
                        પુસ્તક
                      </th>
                      <th
                        className="silakM"
                        style={{
                          textAlign: "center",
                          border: "1px solid #000000",
                        }}
                      >
                        જનરલ
                      </th>
                      <th
                        className="silakM"
                        style={{
                          textAlign: "center",
                          border: "1px solid #000000",
                        }}
                      >
                        કુલ વેચાણ
                      </th>
                      <th
                        className="silakM"
                        style={{
                          textAlign: "center",
                          border: "1px solid #000000",
                        }}
                      >
                        જમા રકમ
                      </th>
                      <th
                        className="silakM"
                        style={{
                          textAlign: "center",
                          border: "1px solid #000000",
                        }}
                      >
                        બંધ સીલક
                      </th>
                      <th
                        className="silakM"
                        style={{
                          textAlign: "center",
                          border: "1px solid #000000",
                        }}
                      >
                        ભેટ
                      </th>
                      <th
                        className="silakM"
                        style={{
                          textAlign: "center",
                          border: "1px solid #000000",
                        }}
                      >
                        ખર્ચ
                      </th>
                      <th
                        className="silakM"
                        style={{
                          textAlign: "center",
                          border: "1px solid #000000",
                        }}
                      >
                        વધ/ઘટ
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReportData?.map((silak, index) => {
                      let murtiAmount = 0,
                        vaghaAmount = 0,
                        gharenaAmount = 0,
                        pujaAmount = 0,
                        pustakAmount = 0,
                        generalAmount = 0;

                      silak.categories?.forEach((category) => {
                        switch (category.categoryName) {
                          case "મુર્તિ":
                            murtiAmount = category.totalBuyingAmountPerCategory;
                            break;
                          case "વાઘા":
                            vaghaAmount = category.totalBuyingAmountPerCategory;
                            break;
                          case "ઘરેણા":
                            gharenaAmount =
                              category.totalBuyingAmountPerCategory;
                            break;
                          case "પુજા":
                            pujaAmount = category.totalBuyingAmountPerCategory;
                            break;
                          case "પુસ્તક":
                            pustakAmount =
                              category.totalBuyingAmountPerCategory;
                            break;
                          case "જનરલ":
                            generalAmount =
                              category.totalBuyingAmountPerCategory;
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
                        <tr key={index}>
                          <td style={{ border: "1px solid #000000" }}>{`${
                            silak.createdAt.split("-")[2]
                          }-${silak.createdAt.split("-")[1]}-${silak.createdAt
                            .split("-")[0]
                            .slice(-2)}`}</td>
                          <td
                            style={{
                              textAlign: "end",
                              border: "1px solid #000000",
                            }}
                          >
                            {new Intl.NumberFormat("en-IN").format(
                              silak?.silkData?.openSilak ?? 0
                            )}
                          </td>
                          <td
                            style={{
                              textAlign: "end",
                              border: "1px solid #000000",
                            }}
                          >
                            {new Intl.NumberFormat("en-IN").format(
                              murtiAmount ?? 0
                            )}
                          </td>
                          <td
                            style={{
                              textAlign: "end",
                              border: "1px solid #000000",
                            }}
                          >
                            {new Intl.NumberFormat("en-IN").format(
                              vaghaAmount ?? 0
                            )}
                          </td>
                          <td
                            style={{
                              textAlign: "end",
                              border: "1px solid #000000",
                            }}
                          >
                            {new Intl.NumberFormat("en-IN").format(
                              gharenaAmount ?? 0
                            )}
                          </td>
                          <td
                            style={{
                              textAlign: "end",
                              border: "1px solid #000000",
                            }}
                          >
                            {new Intl.NumberFormat("en-IN").format(
                              pujaAmount ?? 0
                            )}
                          </td>
                          <td
                            style={{
                              textAlign: "end",
                              border: "1px solid #000000",
                            }}
                          >
                            {new Intl.NumberFormat("en-IN").format(
                              pustakAmount ?? 0
                            )}
                          </td>
                          <td
                            style={{
                              textAlign: "end",
                              border: "1px solid #000000",
                            }}
                          >
                            {new Intl.NumberFormat("en-IN").format(
                              generalAmount ?? 0
                            )}
                          </td>
                          <td
                            style={{
                              textAlign: "end",
                              border: "1px solid #000000",
                            }}
                          >
                            {new Intl.NumberFormat("en-IN").format(
                              totalAmount ?? 0
                            )}
                          </td>
                          <td
                            style={{
                              textAlign: "end",
                              border: "1px solid #000000",
                            }}
                          >
                            {new Intl.NumberFormat("en-IN").format(
                              silak?.silkData?.jamaRakam ?? 0
                            )}
                          </td>
                          <td
                            style={{
                              textAlign: "end",
                              border: "1px solid #000000",
                            }}
                          >
                            {new Intl.NumberFormat("en-IN").format(
                              silak?.silkData?.closeSilak ?? 0
                            )}
                          </td>
                          <td
                            style={{
                              textAlign: "end",
                              border: "1px solid #000000",
                            }}
                          >
                            {new Intl.NumberFormat("en-IN").format(
                              silak?.bhetData?.totalBuyingAmount ?? 0
                            )}
                          </td>
                          <td
                            style={{
                              textAlign: "end",
                              border: "1px solid #000000",
                            }}
                          >
                            {new Intl.NumberFormat("en-IN").format(
                              silak?.silkData?.kharch ?? 0
                            )}
                          </td>
                          <td
                            style={{
                              textAlign: "end",
                              border: "1px solid #000000",
                            }}
                          >
                            {new Intl.NumberFormat("en-IN").format(
                              (silak?.silkData?.openSilak ?? 0) +
                                (totalAmount ?? 0) -
                                (silak?.silkData?.closeSilak ?? 0) -
                                (silak?.silkData?.jamaRakam ?? 0)
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot style={{ borderTop: "1px solid var(--brown-color)" }}>
                    <tr>
                      <td
                        style={{
                          fontWeight: "bold",
                          border: "1px solid #000000",
                        }}
                      >
                        Total:-
                      </td>
                      <td
                        style={{
                          textAlign: "end",
                          fontWeight: "bold",
                          border: "1px solid #000000",
                        }}
                      >
                        {new Intl.NumberFormat("en-IN").format(
                          filteredReportData?.[0]?.silkData?.openSilak ?? 0
                        )}
                      </td>
                      {[
                        "મુર્તિ",
                        "વાઘા",
                        "ઘરેણા",
                        "પુજા",
                        "પુસ્તક",
                        "જનરલ",
                      ].map((category, index) => (
                        <td
                          key={index}
                          style={{
                            textAlign: "end",
                            fontWeight: "bold",
                            border: "1px solid #000000",
                          }}
                        >
                          {new Intl.NumberFormat("en-IN").format(
                            getCategoryTotal(category)
                          )}
                        </td>
                      ))}
                      <td
                        style={{
                          textAlign: "end",
                          fontWeight: "bold",
                          border: "1px solid #000000",
                        }}
                      >
                        {new Intl.NumberFormat("en-IN").format(
                          totalBuyingAmount
                        )}
                      </td>
                      <td
                        style={{
                          textAlign: "end",
                          fontWeight: "bold",
                          border: "1px solid #000000",
                        }}
                      >
                        {new Intl.NumberFormat("en-IN").format(
                          totalJamaRakam ?? 0
                        )}
                      </td>
                      <td
                        style={{
                          textAlign: "end",
                          fontWeight: "bold",
                          border: "1px solid #000000",
                        }}
                      >
                        {new Intl.NumberFormat("en-IN").format(
                          reportData?.[reportData.length - 1]?.silkData
                            ?.closeSilak ?? 0
                        )}
                      </td>
                      <td
                        style={{
                          textAlign: "end",
                          fontWeight: "bold",
                          border: "1px solid #000000",
                        }}
                      >
                        {new Intl.NumberFormat("en-IN").format(totalBhet ?? 0)}
                      </td>
                      <td
                        style={{
                          textAlign: "end",
                          fontWeight: "bold",
                          border: "1px solid #000000",
                        }}
                      >
                        {" "}
                        {new Intl.NumberFormat("en-IN").format(
                          totalKharch ?? 0
                        )}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SilakMonthlyReport;
