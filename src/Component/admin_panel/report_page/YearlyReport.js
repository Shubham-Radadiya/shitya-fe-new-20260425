import React, { useState, useEffect, useRef } from "react";
// import * as React from "react";
import { REQUEST_USER } from "../../../store/auth/AuthAction";
import { useAuth } from "../../../store/auth/AuthReducers";
import { useDispatch } from "react-redux";
import { useReport } from "../../../store/admin_report/ReportReducer";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableContainer from "@mui/material/TableContainer";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import {
  FILTER_YEARLY,
  REQUEST_YEARLY_PRODUCT,
} from "../../../store/admin_report/ReportAction";
import TableFooter from "@mui/material/TableFooter";
import { styled } from "@mui/material/styles";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  maxHeight: 540,
  overflow: "auto",
  minWidth: "100%",
}));

export default function YearlyReport() {
  const { yearlyreport } = useReport();
  const dispatch = useDispatch();
  const users = useAuth();
  const [selectedMonth, setSelectedMonth] = useState("");
  const [date, setDate] = useState({ start: "", end: "" });
  const [expandedCategories, setExpandedCategories] = React.useState(new Set());
  const [selectedUser, setSelectedUser] = React.useState(null);
  const [expandedSubCategories, setExpandedSubCategories] = React.useState(
    new Map()
  );
  const [selectedFiscalYear, setSelectedFiscalYear] = useState("");
  const componentRef = useRef();

  useEffect(() => {
    dispatch({ type: REQUEST_USER });
  }, [dispatch]);

  // Fetch daily report whenever selectedDate changes
  useEffect(() => {
    if (date.start && date.end) {
      dispatch({
        type: REQUEST_YEARLY_PRODUCT,
        payload: { startDate: date.start, endDate: date.end },
      });
    }
  }, [date, dispatch]);

  const filteredReport = selectedUser
    ? yearlyreport.filter((item) => item.userFullName === selectedUser.fullName)
    : yearlyreport;

  const getMonths = (report) => {
    return report?.flatMap((item) => item.data || []);
  };

  const productsArray = getMonths(filteredReport);

  const getUniqueDates = (data) => {
    const dates = new Set();
    data.forEach((dateData) => {
      dates.add(dateData.createdAt);
    });
    return Array.from(dates).sort();
  };

  const dates = getUniqueDates(productsArray);

  const generateDynamicColumns = (dates) => {
    const qtyColumns = dates.map((date) => ({
      id: `qty_${date}`,
      label: `${date} Qty`,
    }));
    const amountColumns = dates.map((date) => ({
      id: `amount_${date}`,
      label: `${date} Amount`,
    }));
    return [
      ...qtyColumns,
      { id: "total_qty", label: "Total Qty" },
      ...amountColumns,
      { id: "total_amount", label: "Total Amount" },
    ];
  };
  const dynamicColumns = generateDynamicColumns(dates);

  const generateRows = (data, dates) => {
    const rows = [];
    const categoryRows = new Map();
    const subCategoryRows = new Map();

    let srNo = 1;

    data.forEach((dateData) => {
      const date = dateData.createdAt;

      dateData.categories?.forEach((category) => {
        if (!categoryRows.has(category.categoryName)) {
          const categoryRow = {
            sr_no: srNo++,
            category_name: category.categoryName,
            subcategory_name: "",
            product_name: "",
            product_Id: "",
            isCategory: true,
            isSubCategory: false,
            expanded: false,
          };

          let totalQty = 0;
          let totalAmount = 0;

          dates.forEach((date) => {
            const categoryData = data
              .find((d) => d.createdAt === date)
              ?.categories.find(
                (c) => c.categoryName === category.categoryName
              );

            const qty = categoryData
              ? categoryData.totalBuyingCountPerCategory
              : 0;
            const amount = categoryData
              ? categoryData.totalBuyingAmountPerCategory
              : 0;

            categoryRow[`qty_${date}`] = qty;
            categoryRow[`amount_${date}`] = amount;

            totalQty += qty;
            totalAmount += amount;
          });

          categoryRow.total_qty = totalQty;
          categoryRow.total_amount = totalAmount;

          categoryRows.set(category.categoryName, categoryRow);
          rows.push(categoryRow);
        }

        category.subCategories?.forEach((subCategory) => {
          if (!subCategoryRows.has(category.categoryName)) {
            subCategoryRows.set(category.categoryName, new Map());
          }
          if (
            !subCategoryRows
              .get(category.categoryName)
              .has(subCategory.subCategoryName)
          ) {
            subCategoryRows
              .get(category.categoryName)
              .set(subCategory.subCategoryName, new Set());

            const subCategoryRow = {
              sr_no: srNo++,
              category_name: category.categoryName,
              subcategory_name: subCategory.subCategoryName,
              product_name: "",
              product_Id: "",
              isCategory: false,
              isSubCategory: true,
              expanded: false,
            };

            let totalQty = 0;
            let totalAmount = 0;

            const accumulatedData = dates.reduce((acc, date) => {
              const subCategoryData = data
                .find((d) => d.createdAt === date)
                ?.categories.find(
                  (c) => c.categoryName === category.categoryName
                )
                ?.subCategories.find(
                  (s) => s.subCategoryName === subCategory.subCategoryName
                );

              const qty = subCategoryData
                ? subCategoryData.totalBuyingCount
                : 0;
              const amount = subCategoryData
                ? subCategoryData.totalBuyingAmount
                : 0;

              acc[`qty_${date}`] = qty;
              acc[`amount_${date}`] = amount;

              totalQty += qty;
              totalAmount += amount;

              return acc;
            }, {});

            Object.assign(subCategoryRow, accumulatedData);
            subCategoryRow.total_qty = totalQty;
            subCategoryRow.total_amount = totalAmount;
            rows.push(subCategoryRow);
          }

          subCategory.products?.forEach((product) => {
            if (
              !subCategoryRows
                .get(category.categoryName)
                .get(subCategory.subCategoryName)
                ?.has(product.name)
            ) {
              subCategoryRows
                .get(category.categoryName)
                .get(subCategory.subCategoryName)
                ?.add(product.name);

              const productRow = {
                sr_no: srNo++,
                category_name: category.categoryName,
                subcategory_name: subCategory.subCategoryName,
                product_name: product.name,
                product_Id: product.productId,
                isCategory: false,
                isSubCategory: false,
              };

              let totalQty = 0;
              let totalAmount = 0;

              const productfuncData = dates.reduce((acc, date) => {
                const productData = data
                  .find((d) => d.createdAt === date)
                  .categories.find(
                    (c) => c.categoryName === category.categoryName
                  )
                  ?.subCategories.find(
                    (s) => s.subCategoryName === subCategory.subCategoryName
                  )
                  ?.products.find((p) => p.name === product.name);

                const qty = productData ? productData.totalBuyingCount : 0;
                const amount = productData ? productData.totalBuyingAmount : 0;

                acc[`qty_${date}`] = qty;
                acc[`amount_${date}`] = amount;

                totalQty += qty;
                totalAmount += amount;

                return acc;
              }, {});

              Object.assign(productRow, productfuncData);
              productRow.total_qty = totalQty;
              productRow.total_amount = totalAmount;

              rows.push(productRow);
            }
          });
        });
      });
    });

    // Initialize total storage for each date
    const overallTotals = dates.reduce(
      (acc, date) => {
        const qtyColumn = `qty_${date}`;
        const amountColumn = `amount_${date}`;

        const categoryTotals = {};

        rows.forEach((row) => {
          if (row.isCategory) {
            const category = row.category_name;
            const qty = parseFloat(row[qtyColumn]) || 0;
            const amount = parseFloat(row[amountColumn]) || 0;

            if (!categoryTotals[category]) {
              categoryTotals[category] = { qty: 0, amount: 0 };
            }

            categoryTotals[category].qty += qty;
            categoryTotals[category].amount += amount;
          }
        });

        acc.total_qty[date] = Object.values(categoryTotals).reduce(
          (sum, totals) => sum + totals.qty,
          0
        );
        acc.total_amount[date] = Object.values(categoryTotals).reduce(
          (sum, totals) => sum + totals.amount,
          0
        );

        return acc;
      },
      { total_qty: {}, total_amount: {} }
    );

    const grandTotals = {
      total_qty: Object.values(overallTotals.total_qty).reduce(
        (sum, value) => sum + value,
        0
      ),
      total_amount: Object.values(overallTotals.total_amount).reduce(
        (sum, value) => sum + value,
        0
      ),
    };

    return { rows, overallTotals, grandTotals };
  };

  const handleUserChange = (user) => {
    setSelectedUser(user);

    dispatch({
      type: FILTER_YEARLY,
      payload: user ? filteredReport : yearlyreport,
    });
  };

  const handleExpandCategory = (categoryName) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryName)) {
        newSet.delete(categoryName);
      } else {
        newSet.add(categoryName);
      }
      return newSet;
    });
  };

  const handleExpandSubCategory = (categoryName, subCategoryName) => {
    setExpandedSubCategories((prev) => {
      const newMap = new Map(prev);
      if (!newMap.has(categoryName)) {
        newMap.set(categoryName, new Set());
      }
      const subCategorySet = newMap.get(categoryName);
      if (subCategorySet.has(subCategoryName)) {
        subCategorySet.delete(subCategoryName);
      } else {
        subCategorySet.add(subCategoryName);
      }
      return newMap;
    });
  };

  // const getTotalAmount = (categories) => {
  //   categories.reduce(
  //     (acc, category) => acc + (category.totalBuyingAmount || 0),
  //     0
  //   );
  // };
  // const totalAmount = getTotalAmount(getCategories(filteredReport));

  const getFiscalYears = () => {
    const fiscalYears = [];
    const currentYear = new Date().getFullYear();

    for (let i = -5; i <= 0; i++) {
      const startYear = currentYear + i;
      const endYear = startYear + 1;
      const fiscalYearLabel = `${startYear}-${endYear.toString().slice(-2)}`;
      fiscalYears.push({ label: fiscalYearLabel, startYear, endYear });
    }

    return fiscalYears;
  };

  const fiscalYears = getFiscalYears();

  const handleChange = (event) => {
    const selectedValue = event.target.value;
    const [startYear, endYearSuffix] = selectedValue.split("-");
    const endYear = parseInt(startYear) + 1; // Calculate end year correctly

    // Create start and end dates
    const startDate = new Date(Date.UTC(startYear, 3, 1)); // April is month 3 (0-based index)
    const endDate = new Date(Date.UTC(endYear, 2, 31, 23, 59, 59, 999)); // March is month 2 (0-based index)

    // Check if the dates are valid
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      console.error("Invalid date value");
      return;
    }

    // Format dates to ISO 8601 format
    const formatDateToISO = (date) => {
      return date.toISOString();
    };

    setSelectedFiscalYear(selectedValue);
    setDate({
      start: formatDateToISO(startDate),
      end: formatDateToISO(endDate),
    });
  };

  const exportToExcel = () => {
    // Create a new workbook and add a worksheet
    const wb = XLSX.utils.book_new();

    // Initialize variables to track previous values
    let lastCategory = "";
    let lastSubCategory = "";

    // Prepare header row
    const wsData = [
      // Header Row
      [
        "Sr No",
        "Category",
        "Sub-Category",
        "Product",
        ...dates.map((date) => `${date}`),
        "Total Qty",
        ...dates.map((date) => `${date}`),
        "Total Amount",
      ],
      // Data Rows
      ...rows.map((row) => {
        // Check if category or sub-category has changed
        const isNewCategory = row.category_name !== lastCategory;
        const isNewSubCategory = row.subcategory_name !== lastSubCategory;

        // Update last seen values
        lastCategory = row.category_name;
        lastSubCategory = row.subcategory_name;

        return [
          row.sr_no,
          isNewCategory ? row.category_name : "",
          isNewSubCategory ? row.subcategory_name : "",
          row.product_name,
          ...dates.map((date) => row[`qty_${date}`] || 0),
          row.total_qty || 0,
          ...dates.map((date) => row[`amount_${date}`] || 0),
          row.total_amount || 0,
        ];
      }),
      // Overall Totals Row
      [
        "Overall Totals",
        "",
        "",
        "",
        ...dates.map((date) => overallTotals.total_qty[date] || 0),
        grandTotals.total_qty || 0,
        ...dates.map((date) => overallTotals.total_amount[date] || 0),
        grandTotals.total_amount || 0,
      ],
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, "Yearly Report");

    // Write the workbook and trigger download
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(
      new Blob([wbout], { type: "application/octet-stream" }),
      "yearly_report.xlsx"
    );
  };
  const { rows, overallTotals, grandTotals } = generateRows(
    productsArray,
    dates
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString + "-01"); // Adding "-01" to create a valid date
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear().toString().slice(-2); // Get the last two digits of the year
    return `${month}-${year}`;
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
          <div style={{ width: "175px", marginRight: "20px" }}>
            <label>Select a year: </label>
            <select
              onChange={handleChange}
              value={selectedFiscalYear}
              style={{ width: "55%", height: "32px", borderRadius: "8px" }}
            >
              <option value="">Year</option>
              {fiscalYears.map((fy, index) => (
                <option
                  key={index}
                  value={`${fy.startYear}-${fy.endYear.toString().slice(-2)}`}
                >
                  {fy.label}
                </option>
              ))}
            </select>
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
        <Paper
          style={{ border: "1px solid var(--brown-color)" }}
          ref={componentRef}
        >
          <StyledTableContainer sx={{ maxHeight: 475 }}>
            <Table>
              <TableHead>
                <TableRow style={{ backgroundColor: "var(--brown-color)" }}>
                  <TableCell align="center"></TableCell>
                  <TableCell align="center"></TableCell>
                  <TableCell align="center"></TableCell>
                  <TableCell
                    align="center"
                    colSpan={dynamicColumns.length / 2}
                    style={{
                      color: "white",
                      lineHeight: ".4rem",
                      border: "1px solid",
                    }}
                  >
                    Qty
                  </TableCell>

                  <TableCell
                    align="center"
                    colSpan={dynamicColumns.length / 2}
                    style={{ color: "white", lineHeight: ".4rem" }}
                  >
                    Amount
                  </TableCell>
                </TableRow>
                <TableRow
                  style={{
                    backgroundColor: "rgb(97, 37, 17)",
                    padding: "0px 4.5px",
                  }}
                >
                  <TableCell
                    style={{
                      color: "white",
                      padding: "0px 5.5px",
                      whiteSpace: "nowrap",
                      lineHeight: "2.5rem",
                      border: "1px solid",
                    }}
                    align="center"
                  >
                    Sr No
                  </TableCell>
                  <TableCell
                    style={{
                      color: "white",
                      padding: "0px 5.5px",
                      whiteSpace: "nowrap",
                      lineHeight: "2.5rem",
                      border: "1px solid",
                    }}
                    align="center"
                  >
                    Product
                  </TableCell>
                  <TableCell
                    style={{
                      color: "white",
                      padding: "0px 5.5px",
                      whiteSpace: "nowrap",
                      lineHeight: "2.5rem",
                      border: "1px solid",
                    }}
                    align="center"
                  >
                    Product ID
                  </TableCell>
                  {/* Date Quantity Columns */}
                  {dates.map((date) => (
                    <TableCell
                      key={`qty_${date}`}
                      style={{
                        color: "white",
                        padding: "0px 5.5px",
                        whiteSpace: "nowrap",
                        lineHeight: "2.5rem",
                        border: "1px solid",
                      }}
                      align="center"
                    >
                      {formatDate(`${date}`)}
                    </TableCell>
                  ))}
                  {/* Total Quantity Column */}
                  <TableCell
                    style={{
                      color: "white",
                      padding: "0px 5.5px",
                      whiteSpace: "nowrap",
                      lineHeight: "2.5rem",
                      border: "1px solid",
                    }}
                    align="center"
                  >
                    Total Qty
                  </TableCell>
                  {/* Date Amount Columns */}
                  {dates.map((date) => (
                    <TableCell
                      key={`amount_${date}`}
                      style={{
                        color: "white",
                        padding: "0px 5.5px",
                        whiteSpace: "nowrap",
                        lineHeight: "2.5rem",
                        border: "1px solid",
                      }}
                      align="center"
                    >
                      {formatDate(`${date}`)}
                    </TableCell>
                  ))}
                  {/* Total Amount Column */}
                  <TableCell
                    style={{
                      color: "white",
                      padding: "0px 5.5px",
                      whiteSpace: "nowrap",
                      lineHeight: "2.5rem",
                      border: "1px solid",
                    }}
                    align="center"
                  >
                    Total Amount
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {rows.map((row) => (
                  <React.Fragment key={row.sr_no}>
                    {row.isCategory && (
                      <React.Fragment>
                        <TableRow
                          style={{ background: "rgba(196, 164, 132, 0.7)" }}
                        >
                          <TableCell
                            style={{ border: "1px solid white" }}
                            align="center"
                          >
                            {row.sr_no}
                          </TableCell>
                          <TableCell
                            style={{ border: "1px solid white" }}
                            align="center"
                          >
                            <span
                              style={{
                                cursor: "pointer",
                              }}
                              onClick={() =>
                                handleExpandCategory(row.category_name)
                              }
                            >
                              {row.category_name}
                            </span>
                          </TableCell>
                          <TableCell
                            style={{ border: "1px solid white" }}
                            align="center"
                          ></TableCell>
                          {/* Date Quantity Columns */}
                          {dates.map((date) => (
                            <TableCell
                              key={`qty_${date}`}
                              style={{ border: "1px solid white" }}
                              align="center"
                            >
                              {Intl.NumberFormat("en-IN").format(
                                row[`qty_${date}`] || 0
                              )}
                            </TableCell>
                          ))}
                          <TableCell
                            style={{
                              border: "1px solid white",
                              fontWeight: "bolder",
                            }}
                            align="center"
                          >
                            {row.total_qty || 0}
                          </TableCell>
                          {/* Date Amount Columns */}
                          {dates.map((date) => (
                            <TableCell
                              key={`amount_${date}`}
                              style={{ border: "1px solid white" }}
                              align="center"
                            >
                              {Intl.NumberFormat("en-IN").format(
                                row[`amount_${date}`]
                              ) || 0}
                            </TableCell>
                          ))}
                          <TableCell
                            style={{
                              border: "1px solid white",
                              fontWeight: "bolder",
                            }}
                            align="center"
                          >
                            {" "}
                            {Intl.NumberFormat("en-IN").format(
                              row.total_amount
                            ) || 0}
                          </TableCell>
                        </TableRow>
                        {expandedCategories.has(row.category_name) &&
                          rows
                            .filter(
                              (subRow) =>
                                subRow.isSubCategory &&
                                subRow.category_name === row.category_name
                            )
                            .map((subRow) => (
                              <React.Fragment key={subRow.sr_no}>
                                <TableRow
                                  style={{
                                    background: "rgb(193, 154, 107, 0.2)",
                                  }}
                                >
                                  <TableCell
                                    style={{ border: "1px solid white" }}
                                    align="center"
                                  >
                                    {subRow.sr_no}
                                  </TableCell>

                                  <TableCell
                                    style={{ border: "1px solid white" }}
                                    align="center"
                                  >
                                    <span
                                      style={{
                                        cursor: "pointer",
                                      }}
                                      onClick={() =>
                                        handleExpandSubCategory(
                                          subRow.category_name,
                                          subRow.subcategory_name
                                        )
                                      }
                                    >
                                      {subRow.subcategory_name}
                                    </span>
                                  </TableCell>
                                  <TableCell
                                    style={{ border: "1px solid white" }}
                                    align="center"
                                  ></TableCell>
                                  {/* Date Quantity Columns */}
                                  {dates.map((date) => (
                                    <TableCell
                                      key={`qty_${date}`}
                                      style={{ border: "1px solid white" }}
                                      align="center"
                                    >
                                      {subRow[`qty_${date}`] || 0}
                                    </TableCell>
                                  ))}
                                  <TableCell
                                    style={{
                                      border: "1px solid white",
                                      fontWeight: "bolder",
                                    }}
                                    align="center"
                                  >
                                    {Intl.NumberFormat("en-IN").format(
                                      subRow.total_qty || 0
                                    )}
                                  </TableCell>
                                  {/* Date Amount Columns */}
                                  {dates.map((date) => (
                                    <TableCell
                                      key={`amount_${date}`}
                                      style={{ border: "1px solid white" }}
                                      align="center"
                                    >
                                      {Intl.NumberFormat("en-IN").format(
                                        subRow[`amount_${date}`]
                                      ) || 0}
                                    </TableCell>
                                  ))}
                                  <TableCell
                                    style={{
                                      border: "1px solid white",
                                      fontWeight: "bolder",
                                    }}
                                    align="center"
                                  >
                                    {Intl.NumberFormat("en-IN").format(
                                      subRow.total_amount
                                    ) || 0}
                                  </TableCell>
                                </TableRow>
                                {expandedSubCategories
                                  .get(subRow.category_name)
                                  ?.has(subRow.subcategory_name) &&
                                  rows
                                    .filter(
                                      (productRow) =>
                                        !productRow.isCategory &&
                                        !productRow.isSubCategory &&
                                        productRow.category_name ===
                                          subRow.category_name &&
                                        productRow.subcategory_name ===
                                          subRow.subcategory_name
                                    )
                                    .map((productRow) => (
                                      <TableRow
                                        style={{ background: "#f0f0f0" }}
                                        key={productRow.sr_no}
                                      >
                                        <TableCell
                                          style={{ border: "1px solid white" }}
                                          align="center"
                                        >
                                          {productRow.sr_no}
                                        </TableCell>
                                        <TableCell
                                          style={{ border: "1px solid white" }}
                                          align="center"
                                        >
                                          {productRow.product_name}
                                        </TableCell>
                                        <TableCell
                                          style={{ border: "1px solid white" }}
                                          align="center"
                                        >
                                          {productRow.product_Id}
                                        </TableCell>
                                        {/* Date Quantity Columns */}
                                        {dates.map((date) => (
                                          <TableCell
                                            key={`qty_${date}`}
                                            style={{
                                              border: "1px solid white",
                                            }}
                                            align="center"
                                          >
                                            {Intl.NumberFormat("en-IN").format(
                                              productRow[`qty_${date}`] || 0
                                            )}
                                          </TableCell>
                                        ))}
                                        <TableCell
                                          style={{
                                            border: "1px solid white",
                                            fontWeight: "bolder",
                                          }}
                                          align="center"
                                        >
                                          {Intl.NumberFormat("en-IN").format(
                                            productRow.total_qty || 0
                                          )}
                                        </TableCell>
                                        {/* Date Amount Columns */}
                                        {dates.map((date) => (
                                          <TableCell
                                            key={`amount_${date}`}
                                            style={{
                                              border: "1px solid white",
                                            }}
                                            align="center"
                                          >
                                            {Intl.NumberFormat("en-IN").format(
                                              productRow[`amount_${date}`]
                                            ) || 0}
                                          </TableCell>
                                        ))}
                                        <TableCell
                                          style={{
                                            border: "1px solid white",
                                            color: "black",
                                            fontWeight: "bolder",
                                          }}
                                          align="center"
                                        >
                                          {Intl.NumberFormat("en-IN").format(
                                            productRow.total_amount
                                          ) || 0}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                              </React.Fragment>
                            ))}
                      </React.Fragment>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>

              <TableFooter>
                <TableRow>
                  <TableCell
                    colSpan={3}
                    style={{
                      border: "1px solid white",
                      backgroundColor: "#ededed",
                      fontWeight: "bolder",
                      color: "black",
                      fontSize: "16px",
                    }}
                    align="center"
                  >
                    Overall Totals
                  </TableCell>
                  {/* Date Quantity Columns */}
                  {dates.map((date) => (
                    <TableCell
                      key={`overall_qty_${date}`}
                      style={{
                        border: "1px solid white",
                        backgroundColor: "#ededed",
                        fontWeight: "bolder",
                        color: "black",
                        fontSize: "16px",
                      }}
                      align="center"
                    >
                      {Intl.NumberFormat("en-IN").format(
                        overallTotals.total_qty[date] || 0
                      )}
                    </TableCell>
                  ))}
                  {/* Total Quantity Column */}
                  <TableCell
                    style={{
                      border: "1px solid white",
                      backgroundColor: "#ededed",
                      fontWeight: "bolder",
                      color: "black",
                      fontSize: "16px",
                    }}
                    align="center"
                  >
                    {Intl.NumberFormat("en-IN").format(
                      grandTotals.total_qty || 0
                    )}
                  </TableCell>
                  {/* Date Amount Columns */}
                  {dates.map((date) => (
                    <TableCell
                      key={`overall_amount_${date}`}
                      style={{
                        border: "1px solid white",
                        backgroundColor: "#ededed",
                        fontWeight: "bolder",
                        color: "black",
                        fontSize: "16px",
                      }}
                      align="center"
                    >
                      {Intl.NumberFormat("en-IN").format(
                        overallTotals.total_amount[date]
                      ) || 0}
                    </TableCell>
                  ))}
                  {/* Total Amount Column */}
                  <TableCell
                    style={{
                      border: "1px solid white",
                      backgroundColor: "#ededed",
                      fontWeight: "bolder",
                      color: "black",
                      fontSize: "16px",
                    }}
                    align="center"
                  >
                    {" "}
                    {Intl.NumberFormat("en-IN").format(
                      grandTotals.total_amount
                    ) || 0}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </StyledTableContainer>
        </Paper>
        <div className="flexgap">
          {/* <ReactToPrint
            trigger={() => (
              <button className="print-btn" style={{ cursor: "pointer" }}>
                Print
              </button>
            )}
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
      </div>
    </div>
  );
}
