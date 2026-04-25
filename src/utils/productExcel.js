import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { orderedCategoriesTreeForAdmin } from "./productDisplayOrder";

/**
 * Build flat rows from categories JSON for Excel export.
 * Column names must match backend upload API: categoryName, subcategoryName, productId, productName, price, priceType
 */
export function buildProductExcelRows(categories) {
  if (!Array.isArray(categories) || categories.length === 0) {
    return [];
  }

  const headerRow = [
    "categoryName",
    "subcategoryName",
    "productId",
    "productName",
    "price",
    "priceType",
    "productStatus",
  ];

  const dataRows = [];

  categories.forEach((category) => {
    const categoryName = category.name || "";
    const subCategories = category.subCategory || [];

    subCategories.forEach((subCat) => {
      const subCategoryName = subCat.name || "";
      const products = subCat.products || [];
      products.forEach((product) => {
        const priceType = product.priceType === "CUSTOM" ? "CUSTOM" : "FIXED";
        const price = typeof product.price === "number" ? product.price : Number(product.price) || 0;
        const productStatus = product.isDeActive ? "INACTIVE" : "ACTIVE";

        dataRows.push([
          categoryName,
          subCategoryName,
          product.productId || "",
          product.name || "",
          price,
          priceType,
          productStatus,
        ]);
      });
    });
  });

  return [headerRow, ...dataRows];
}

/**
 * Generate and download Excel file from categories data (format as per admin product Excel template).
 */
export function downloadProductExcel(categories) {
  const ordered = orderedCategoriesTreeForAdmin(categories);
  const rows = buildProductExcelRows(ordered);
  if (rows.length <= 1) {
    return false; // only header, no data
  }

  const worksheet = XLSX.utils.aoa_to_sheet(rows);

  // Column widths (approx)
  worksheet["!cols"] = [
    { wch: 20 },
    { wch: 25 },
    { wch: 14 },
    { wch: 35 },
    { wch: 12 },
    { wch: 12 },
    { wch: 14 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Products");

  const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(blob, "ProductList.xlsx");
  return true;
}
