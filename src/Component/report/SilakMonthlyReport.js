import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import "./index.css";
import download from "../images/download.png";

const SilakMonthlyReport = () => {
  const [reportData, setReportData] = useState([]); // always array
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

      if (
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
      ) {
        defaultMonth = date;
      }
    }

    setMonths(monthList);
    setSelectedMonth(defaultMonth || monthList[0].value);
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
      console.log("API response:", data);

      setReportData(
        Array.isArray(data?.mergedDataForNotBhet) ? data.mergedDataForNotBhet : []
      );
    } catch (error) {
      console.error("Error fetching report data:", error);
      setReportData([]);
    }
  };

  // Filter report data based on selected month
  const filteredReportData = Array.isArray(reportData)
    ? reportData.filter((silak) => {
        const silakDate = new Date(silak?.createdAt);
        return (
          silakDate.getFullYear() === selectedMonth?.getFullYear() &&
          silakDate.getMonth() === selectedMonth?.getMonth()
        );
      })
    : [];

  const exportToExcel = () => {
    const table = document.querySelector(".userreport-table");
    if (!table) return;

    const tableClone = table.cloneNode(true);
    const rows = tableClone.querySelectorAll("tr");

    rows.forEach((row) => {
      if (row.querySelector(".tfootgroup")) {
        row.parentNode.removeChild(row);
      }
    });

    const worksheet = XLSX.utils.aoa_to_sheet([]);
    const currentDate = new Date().toLocaleDateString();
    const titleAndDate = [["Silak Monthly Report"], [`Date: ${currentDate}`]];
    XLSX.utils.sheet_add_aoa(worksheet, titleAndDate, { origin: "A1" });

    const tableData = Array.from(tableClone.querySelectorAll("tr")).map((row) =>
      Array.from(row.querySelectorAll("th, td")).map((cell) => cell.textContent)
    );
    XLSX.utils.sheet_add_aoa(worksheet, tableData, { origin: "A3" });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");

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
      const categories = Array.isArray(user?.categories) ? user.categories : [];
      const categoryTotal = categories
        .filter((category) => category?.categoryName === categoryName)
        .reduce(
          (sum, category) => sum + (category?.totalBuyingAmountPerCategory ?? 0),
          0
        );
      return acc + categoryTotal;
    }, 0);
  };

  const totalJamaRakam = filteredReportData?.reduce(
    (acc, user) => acc + (user?.silkData?.jamaRakam ?? 0),
    0
  );

  const totalBhet = filteredReportData?.reduce(
    (acc, user) => acc + (user?.bhetData?.totalBuyingAmount ?? 0),
    0
  );

  const totalKharch = filteredReportData?.reduce(
    (acc, user) => acc + (user?.silkData?.kharch ?? 0),
    0
  );

  const totalBuyingAmount = filteredReportData?.reduce((acc, user) => {
    const categories = Array.isArray(user?.categories) ? user.categories : [];
    acc += categories.reduce(
      (sum, category) => sum + (category?.totalBuyingAmountPerCategory ?? 0),
      0
    );
    return acc;
  }, 0);

  return (
    <div className="user-template">
      <div className="user-container">
        <div
          className="userreport-box"
          style={{ justifyContent: "space-between" }}
        >
          <div className="tfootgroup" style={{ width: "100%" }}>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <label>Financial Year: {financialYear}</label>
              <select
                value={selectedMonth?.toISOString()}
                onChange={(e) => setSelectedMonth(new Date(e.target.value))}
                style={{ width: "130px", height: "32px", borderRadius: "8px" }}
              >
                {months.map((month, index) => (
                  <option key={index} value={month.value?.toISOString()}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="download" onClick={exportToExcel}>
              <img style={{ width: "50px" }} src={download} alt="download" />
            </div>
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
            <table className="userreport-table" style={{ width: "106%" }}>
              <thead style={{ fontSize: "17px" }}>
                <tr>
                  {[
                    "તારીખ",
                    "ખુલતી સીલક",
                    "મુર્તિ",
                    "વાઘા",
                    "ઘરેણા",
                    "પુજા",
                    "પુસ્તક",
                    "જનરલ",
                    "કુલ વેચાણ",
                    "જમા રકમ",
                    "બંધ સીલક",
                    "ભેટ",
                    "ખર્ચ",
                    "વધ/ઘટ",
                  ].map((h, i) => (
                    <th
                      key={i}
                      className="silakM"
                      style={{
                        textAlign: "center",
                        border: "1px solid #000000",
                      }}
                    >
                      {h}
                    </th>
                  ))}
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

                  const categories = Array.isArray(silak?.categories)
                    ? silak.categories
                    : [];

                  categories.forEach((category) => {
                    switch (category?.categoryName) {
                      case "મુર્તિ":
                        murtiAmount = category?.totalBuyingAmountPerCategory ?? 0;
                        break;
                      case "વાઘા":
                        vaghaAmount = category?.totalBuyingAmountPerCategory ?? 0;
                        break;
                      case "ઘરેણા":
                        gharenaAmount =
                          category?.totalBuyingAmountPerCategory ?? 0;
                        break;
                      case "પુજા":
                        pujaAmount = category?.totalBuyingAmountPerCategory ?? 0;
                        break;
                      case "પુસ્તક":
                        pustakAmount =
                          category?.totalBuyingAmountPerCategory ?? 0;
                        break;
                      case "જનરલ":
                        generalAmount =
                          category?.totalBuyingAmountPerCategory ?? 0;
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

                  const dateParts = silak?.createdAt
                    ? silak.createdAt.split("-")
                    : ["00", "00", "00"];

                  return (
                    <tr key={index}>
                      <td style={{ border: "1px solid #000000" }}>
                        {`${dateParts[2]}-${dateParts[1]}-${dateParts[0]?.slice(-2)}`}
                      </td>
                      <td style={{ textAlign: "end", border: "1px solid #000000" }}>
                        {new Intl.NumberFormat("en-IN").format(
                          silak?.silkData?.openSilak ?? 0
                        )}
                      </td>
                      <td style={{ textAlign: "end", border: "1px solid #000000" }}>
                        {new Intl.NumberFormat("en-IN").format(murtiAmount)}
                      </td>
                      <td style={{ textAlign: "end", border: "1px solid #000000" }}>
                        {new Intl.NumberFormat("en-IN").format(vaghaAmount)}
                      </td>
                      <td style={{ textAlign: "end", border: "1px solid #000000" }}>
                        {new Intl.NumberFormat("en-IN").format(gharenaAmount)}
                      </td>
                      <td style={{ textAlign: "end", border: "1px solid #000000" }}>
                        {new Intl.NumberFormat("en-IN").format(pujaAmount)}
                      </td>
                      <td style={{ textAlign: "end", border: "1px solid #000000" }}>
                        {new Intl.NumberFormat("en-IN").format(pustakAmount)}
                      </td>
                      <td style={{ textAlign: "end", border: "1px solid #000000" }}>
                        {new Intl.NumberFormat("en-IN").format(generalAmount)}
                      </td>
                      <td style={{ textAlign: "end", border: "1px solid #000000" }}>
                        {new Intl.NumberFormat("en-IN").format(totalAmount)}
                      </td>
                      <td style={{ textAlign: "end", border: "1px solid #000000" }}>
                        {new Intl.NumberFormat("en-IN").format(
                          silak?.silkData?.jamaRakam ?? 0
                        )}
                      </td>
                      <td style={{ textAlign: "end", border: "1px solid #000000" }}>
                        {new Intl.NumberFormat("en-IN").format(
                          silak?.silkData?.closeSilak ?? 0
                        )}
                      </td>
                      <td style={{ textAlign: "end", border: "1px solid #000000" }}>
                        {new Intl.NumberFormat("en-IN").format(
                          silak?.bhetData?.totalBuyingAmount ?? 0
                        )}
                      </td>
                      <td style={{ textAlign: "end", border: "1px solid #000000" }}>
                        {new Intl.NumberFormat("en-IN").format(
                          silak?.silkData?.kharch ?? 0
                        )}
                      </td>
                      <td style={{ textAlign: "end", border: "1px solid #000000" }}>
                        {new Intl.NumberFormat("en-IN").format(
                          (silak?.silkData?.openSilak ?? 0) +
                            totalAmount -
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
                  {["મુર્તિ", "વાઘા", "ઘરેણા", "પુજા", "પુસ્તક", "જનરલ"].map(
                    (category, index) => (
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
                    )
                  )}
                  <td
                    style={{
                      textAlign: "end",
                      fontWeight: "bold",
                      border: "1px solid #000000",
                    }}
                  >
                    {new Intl.NumberFormat("en-IN").format(totalBuyingAmount)}
                  </td>
                  <td
                    style={{
                      textAlign: "end",
                      fontWeight: "bold",
                      border: "1px solid #000000",
                    }}
                  >
                    {new Intl.NumberFormat("en-IN").format(totalJamaRakam ?? 0)}
                  </td>
                  <td
                    style={{
                      textAlign: "end",
                      fontWeight: "bold",
                      border: "1px solid #000000",
                    }}
                  >
                    {new Intl.NumberFormat("en-IN").format(
                      filteredReportData?.[filteredReportData.length - 1]
                        ?.silkData?.closeSilak ?? 0
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
                    {new Intl.NumberFormat("en-IN").format(totalKharch ?? 0)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SilakMonthlyReport;
