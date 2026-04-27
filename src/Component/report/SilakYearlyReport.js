import React, { useState, useEffect } from "react";
import { API_URL } from "../../constant/config";
import "./index.css";
import download from "../images/download.png";
import { ReportTablesLoaderWrap } from "./ReportTableLoader";
import {
  silakCategoryTotalAmount,
  silakVadGhatDelta,
  getSilakVadGhatColorStyle,
} from "../../utils/silakReportHelpers";
import { buildDateRangeReportTitleRows } from "../../utils/reportDomExcelExport";
import { reportExcelBlobFromAoa } from "../../utils/reportExcelStyled";
import { useStoreSettings } from "../../context/StoreSettingsContext";
import { useAdminReportBranch } from "../../context/AdminReportBranchContext";
import { saveReportExcelWithToast } from "../../utils/excelExport";
import { toast } from "react-toastify";

/** Must match POST body below so export header matches loaded data. */
const SILAK_YEARLY_API_START = "2023-06-20T07:17:42.511+00:00";
const SILAK_YEARLY_API_END = "2025-09-02T07:17:42.511+00:00";

const SilakYearlyReport = () => {
  const { reportExportDirectoryHandle } = useStoreSettings();
  const adminBranch = useAdminReportBranch();
  const [reportData, setReportData] = useState(null);
  const [silakLoading, setSilakLoading] = useState(true);

  const fetchYearlyReport = async () => {
    setSilakLoading(true);
    try {
      const token = localStorage.getItem("access_token");

      const response = await fetch(
        `${API_URL}/report/silak/yearly`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: token,
          },
          body: JSON.stringify({
            startDate: SILAK_YEARLY_API_START,
            endDate: SILAK_YEARLY_API_END,
            ...(adminBranch?.reportBranchName
              ? { branchName: adminBranch.reportBranchName }
              : {}),
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to fetch yearly report data");

      const data = await response.json();
      setReportData(data.mergedDataForNotBhet);
    } catch (error) {
      console.error("Error fetching yearly report:", error);
    } finally {
      setSilakLoading(false);
    }
  };

  useEffect(() => {
    fetchYearlyReport();
  }, [adminBranch?.reportBranchName]);
  useEffect(() => {
    console.log(reportData?.[0]?.silkData?.openSilak ?? 0, "reportData");
    reportData?.map((p) => {
      console.log(p, "data");
      console.log(reportData.silkData?.closeSilak, "data");
    });
  }, [reportData]);

  const exportToExcel = async () => {
    try {
      const table = document.querySelector(".userreport-table");
      if (!table) return;

      const tableClone = table.cloneNode(true);
      const rows = tableClone.querySelectorAll("tr");

      rows.forEach((row) => {
        if (row.querySelector(".tfootgroup")) {
          row.parentNode.removeChild(row);
        }
      });

      const titleAndDate = buildDateRangeReportTitleRows(
        "Silak Yearly Report",
        new Date(SILAK_YEARLY_API_START),
        new Date(SILAK_YEARLY_API_END)
      );

      const tableData = Array.from(tableClone.querySelectorAll("tr")).map((row) =>
        Array.from(row.querySelectorAll("th, td")).map((cell) => cell.textContent.trim())
      );
      const fullAoa = [...titleAndDate, ...tableData];
      const blob = await reportExcelBlobFromAoa(fullAoa, "Report");
      await saveReportExcelWithToast(
        blob,
        "SilakyearlyReport.xlsx",
        reportExportDirectoryHandle
      );
    } catch (e) {
      console.error(e);
      toast.error("Could not create Excel.");
    }
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

  const totalVadGhatSum = Array.isArray(reportData)
    ? reportData.reduce((acc, silak) => acc + silakVadGhatDelta(silak), 0)
    : 0;

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
            <img style={{width:"50px"}} src={download} atl="down" />
              </div>
              {/* <button className="userreprt-button" onClick={exportToExcel}>
                Export to Excel
              </button> */}
            </div>
          </div>

          <ReportTablesLoaderWrap
            loading={silakLoading}
            label="Loading report…"
            className="userreport-table-wrapper"
            minHeight={200}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "20px",
              }}
            >
              <>
                <table className="userreport-table" style={{ width: "100%", maxWidth: "100%" }}>
                  <thead style={{fontSize:"17px"}}>
                    <tr>
                      <th
                        className="silakM"
                        style={{ textAlign: "center", border:"1px solid #000000" }}
                      >
                        મહિનો
                      </th>
                      <th
                        className="silakM"
                        style={{ textAlign: "center", border:"1px solid #000000" }}
                      >
                        ખુલતી સીલક
                      </th>
                      <th
                        className="silakM"
                        style={{ textAlign: "center", border:"1px solid #000000" }}
                      >
                        મુર્તિ
                      </th>
                      <th
                        className="silakM"
                        style={{ textAlign: "center", border:"1px solid #000000" }}
                      >
                        વાઘા
                      </th>
                      <th
                        className="silakM"
                        style={{ textAlign: "center", border:"1px solid #000000" }}
                      >
                        ઘરેણા
                      </th>
                      <th
                        className="silakM"
                        style={{ textAlign: "center", border:"1px solid #000000" }}
                      >
                        પુજા
                      </th>
                      <th
                        className="silakM"
                        style={{ textAlign: "center", border:"1px solid #000000" }}
                      >
                        પુસ્તક
                      </th>
                      <th
                        className="silakM"
                        style={{ textAlign: "center", border:"1px solid #000000" }}
                      >
                        જનરલ
                      </th>
                      <th
                        className="silakM"
                        style={{ textAlign: "center", border:"1px solid #000000" }}
                      >
                        કુલ વેચાણ
                      </th>
                      <th
                        className="silakM"
                        style={{ textAlign: "center", border:"1px solid #000000" }}
                      >
                        જમા રકમ
                      </th>
                      <th
                        className="silakM"
                        style={{ textAlign: "center", border:"1px solid #000000" }}
                      >
                        બંધ સીલક
                      </th>
                      <th
                        className="silakM"
                        style={{ textAlign: "center", border:"1px solid #000000" }}
                      >
                        ભેટ
                      </th>
                      <th
                        className="silakM"
                        style={{ textAlign: "center", border:"1px solid #000000" }}
                      >
                        ખર્ચ
                      </th>
                      <th
                        className="silakM"
                        style={{ textAlign: "center",border:"1px solid #000000" }}
                      >
                        વધ/ઘટ
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {!silakLoading &&
                    (!Array.isArray(reportData) || reportData.length === 0) ? (
                      <tr>
                        <td
                          colSpan={14}
                          className="report-table-empty-message"
                        >
                          No data found
                        </td>
                      </tr>
                    ) : (
                    reportData?.map((silak, index) => {
                        const {
                          murtiAmount,
                          vaghaAmount,
                          gharenaAmount,
                          pujaAmount,
                          pustakAmount,
                          generalAmount,
                          totalAmount,
                        } = silakCategoryTotalAmount(silak);

                        const vadGhatDeltaRow = silakVadGhatDelta(silak);

                        return (
                          <tr key={index}>
                            <td style={{border:"1px solid #000000"}}>{`${new Date(silak.createdAt).toLocaleString(
                              "en-US",
                              { month: "short" }
                            )}-${silak.createdAt.split("-")[0].slice(-2)}`}</td>
                            <td style={{ textAlign: "end", border:"1px solid #000000" }}>
                              {new Intl.NumberFormat("en-IN").format(
                                silak?.silkData?.openSilak ?? 0
                              )}
                            </td>
                            <td style={{ textAlign: "end", border:"1px solid #000000" }}>
                              {new Intl.NumberFormat("en-IN").format(
                                murtiAmount ?? 0
                              )}
                            </td>
                            <td style={{ textAlign: "end", border:"1px solid #000000" }}>
                              {new Intl.NumberFormat("en-IN").format(
                                vaghaAmount ?? 0
                              )}
                            </td>
                            <td style={{ textAlign: "end", border:"1px solid #000000" }}>
                              {new Intl.NumberFormat("en-IN").format(
                                gharenaAmount ?? 0
                              )}
                            </td>
                            <td style={{ textAlign: "end", border:"1px solid #000000" }}>
                              {new Intl.NumberFormat("en-IN").format(
                                pujaAmount ?? 0
                              )}
                            </td>
                            <td style={{ textAlign: "end", border:"1px solid #000000" }}>
                              {new Intl.NumberFormat("en-IN").format(
                                pustakAmount ?? 0
                              )}
                            </td>
                            <td style={{ textAlign: "end", border:"1px solid #000000" }}>
                              {new Intl.NumberFormat("en-IN").format(
                                generalAmount ?? 0
                              )}
                            </td>
                            <td style={{ textAlign: "end", border:"1px solid #000000" }}>
                              {new Intl.NumberFormat("en-IN").format(
                                totalAmount ?? 0
                              )}
                            </td>
                            <td style={{ textAlign: "end", border:"1px solid #000000" }}>
                              {new Intl.NumberFormat("en-IN").format(
                                silak?.silkData?.jamaRakam ?? 0
                              )}
                            </td>
                            <td style={{ textAlign: "end", border:"1px solid #000000" }}>
                              {new Intl.NumberFormat("en-IN").format(
                                silak?.silkData?.closeSilak ?? 0
                              )}
                            </td>
                            <td style={{ textAlign: "end", border:"1px solid #000000" }}>
                              {new Intl.NumberFormat("en-IN").format(
                                silak?.bhetData?.totalBuyingAmount ?? 0
                              )}
                            </td>
                            <td style={{ textAlign: "end", border:"1px solid #000000" }}>
                              {new Intl.NumberFormat("en-IN").format(
                                silak?.silkData?.kharch ?? 0
                              )}
                            </td>
                            <td
                              style={{
                                textAlign: "end",
                                border: "1px solid #000000",
                                fontWeight: 600,
                                ...getSilakVadGhatColorStyle(vadGhatDeltaRow),
                              }}
                            >
                              {new Intl.NumberFormat("en-IN").format(
                                vadGhatDeltaRow
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  <tfoot style={{ borderTop: "1px solid var(--brown-color)" }}>
                    <tr>
                      <td style={{ fontWeight: "bold", border:"1px solid #000000" }}>Total:-</td>
                      <td
                        style={{
                          textAlign: "end",
                          fontWeight: "bold",
                          border:"1px solid #000000"
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
                            border:"1px solid #000000"
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
                          border:"1px solid #000000"
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
                          border:"1px solid #000000"
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
                          border:"1px solid #000000"
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
                          border:"1px solid #000000"
                        }}
                      >
                        {new Intl.NumberFormat("en-IN").format(totalBhet ?? 0)}
                      </td>
                      <td
                        style={{
                          textAlign: "end",
                          fontWeight: "bold",
                          border:"1px solid #000000"
                        }}
                      >
                        {" "}
                        {new Intl.NumberFormat("en-IN").format(
                          totalKharch ?? 0
                        )}
                      </td>
                      <td
                        style={{
                          textAlign: "end",
                          fontWeight: "bold",
                          border: "1px solid #000000",
                          ...getSilakVadGhatColorStyle(totalVadGhatSum),
                        }}
                      >
                        {new Intl.NumberFormat("en-IN").format(totalVadGhatSum)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </>
            </div>
          </ReportTablesLoaderWrap>
        </div>
      </div>
    </>
  );
};

export default SilakYearlyReport;
