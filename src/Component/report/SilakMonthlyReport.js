import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import "./index.css";
import download from "../images/download.png";

const SilakMonthlyReport = () => {
  const [reportData, setReportData] = useState(null);

  const fetchYearlyReport = async () => {
    try {
      const token = localStorage.getItem("access_token");

      const response = await fetch(
        "http://localhost:3010/report/silak/monthly",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: token,
          },
          body: JSON.stringify({
            startDate: "2023-06-20T07:17:42.511+00:00",
            endDate: "2025-09-02T07:17:42.511+00:00",
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to fetch yearly report data");

      const data = await response.json();
      console.log(data, "......hgghv");
      setReportData(data.mergedDataForNotBhet);
    } catch (error) {
      console.error("Error fetching yearly report:", error);
    }
  };

  useEffect(() => {
    fetchYearlyReport();
  }, []);
  useEffect(() => {
    // reportData?.map((p) => {
    //   console.log(p, "data");
    //   console.log(p.silkData, "dataree");
    // });
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
    return reportData?.reduce((acc, user) => {
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

  const totalJamaRakam = reportData?.reduce((acc, user) => {
    return acc + (user.silkData?.jamaRakam ?? 0);
  }, 0);

  const totalBhet = reportData?.reduce((acc, user) => {
    return acc + (user.bhetData?.totalBuyingAmount ?? 0);
  }, 0);

  const totalKharch = reportData?.reduce((acc, user) => {
    return acc + (user.silkData?.kharch ?? 0);
  }, 0);

  const totalBuyingAmount = reportData?.reduce((acc, user) => {
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
            style={{ justifyContent: "flex-end" }}
          >
            <div className="tfootgroup">
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
                      <th className="silakM" style={{ textAlign: "center" }}>
                        તારીખ
                      </th>
                      <th className="silakM" style={{ textAlign: "center" }}>
                        ખુલતી સીલક
                      </th>
                      <th className="silakM" style={{ textAlign: "center" }}>
                        મુર્તિ
                      </th>
                      <th className="silakM" style={{ textAlign: "center" }}>
                        વાઘા
                      </th>
                      <th className="silakM" style={{ textAlign: "center" }}>
                        ઘરેણા
                      </th>
                      <th className="silakM" style={{ textAlign: "center" }}>
                        પુજા
                      </th>
                      <th className="silakM" style={{ textAlign: "center" }}>
                        પુસ્તક
                      </th>
                      <th className="silakM" style={{ textAlign: "center" }}>
                        જનરલ
                      </th>
                      <th className="silakM" style={{ textAlign: "center" }}>
                        કુલ વેચાણ
                      </th>
                      <th className="silakM" style={{ textAlign: "center" }}>
                        જમા રકમ
                      </th>
                      <th className="silakM" style={{ textAlign: "center" }}>
                        બંધ સીલક
                      </th>
                      <th className="silakM" style={{ textAlign: "center" }}>
                        ભેટ
                      </th>
                      <th className="silakM" style={{ textAlign: "center" }}>
                        ખર્ચ
                      </th>
                      <th className="silakM" style={{ textAlign: "center" }}>
                        વધ/ઘટ
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData?.map((silak, index) => {
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
                          <td>{`${silak.createdAt.split("-")[2]}-${
                            silak.createdAt.split("-")[1]
                          }-${silak.createdAt.split("-")[0].slice(-2)}`}</td>
                          <td style={{ textAlign: "end" }}>
                            {new Intl.NumberFormat("en-IN").format(
                              silak?.silkData?.openSilak ?? 0
                            )}
                          </td>
                          <td style={{ textAlign: "end" }}>
                            {new Intl.NumberFormat("en-IN").format(
                              murtiAmount ?? 0
                            )}
                          </td>
                          <td style={{ textAlign: "end" }}>
                            {new Intl.NumberFormat("en-IN").format(
                              vaghaAmount ?? 0
                            )}
                          </td>
                          <td style={{ textAlign: "end" }}>
                            {new Intl.NumberFormat("en-IN").format(
                              gharenaAmount ?? 0
                            )}
                          </td>
                          <td style={{ textAlign: "end" }}>
                            {new Intl.NumberFormat("en-IN").format(
                              pujaAmount ?? 0
                            )}
                          </td>
                          <td style={{ textAlign: "end" }}>
                            {new Intl.NumberFormat("en-IN").format(
                              pustakAmount ?? 0
                            )}
                          </td>
                          <td style={{ textAlign: "end" }}>
                            {new Intl.NumberFormat("en-IN").format(
                              generalAmount ?? 0
                            )}
                          </td>
                          <td style={{ textAlign: "end" }}>
                            {new Intl.NumberFormat("en-IN").format(
                              totalAmount ?? 0
                            )}
                          </td>
                          <td style={{ textAlign: "end" }}>
                            {new Intl.NumberFormat("en-IN").format(
                              silak?.silkData?.jamaRakam ?? 0
                            )}
                          </td>
                          <td style={{ textAlign: "end" }}>
                            {new Intl.NumberFormat("en-IN").format(
                              silak?.silkData?.closeSilak ?? 0
                            )}
                          </td>
                          <td style={{ textAlign: "end" }}>
                            {new Intl.NumberFormat("en-IN").format(
                              silak?.bhetData?.totalBuyingAmount ?? 0
                            )}
                          </td>
                          <td style={{ textAlign: "end" }}>
                            {new Intl.NumberFormat("en-IN").format(
                              silak?.silkData?.kharch ?? 0
                            )}
                          </td>
                          <td style={{ textAlign: "end" }}>
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
                      <td style={{ fontWeight: "bold" }}>Total:-</td>
                      <td
                        style={{
                          textAlign: "end",
                          fontWeight: "bold",
                        }}
                      >
                        {new Intl.NumberFormat("en-IN").format(
                          reportData?.[0]?.silkData?.openSilak ?? 0
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
                        }}
                      >
                        {new Intl.NumberFormat("en-IN").format(totalBhet ?? 0)}
                      </td>
                      <td
                        style={{
                          textAlign: "end",
                          fontWeight: "bold",
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
