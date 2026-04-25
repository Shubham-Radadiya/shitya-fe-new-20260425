/**
 * Run: node scripts/generate-product-excel.js
 * Output: ProductList.xlsx in project root
 *
 * Paste your categories JSON into the DATA variable below, or pass path: node scripts/generate-product-excel.js path/to/categories.json
 */

const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

// Paste your categories JSON here, or leave empty to load from file
const DATA = [];

function buildProductExcelRows(categories) {
  if (!Array.isArray(categories) || categories.length === 0) return [];

  const headerRow = ["categoryName", "subcategoryName", "productId", "productName", "price", "priceType", "productStatus"];
  const dataRows = [];

  categories.forEach((category) => {
    const categoryName = category.name || "";
    (category.subCategory || []).forEach((subCat) => {
      const subCategoryName = subCat.name || "";
      (subCat.products || []).forEach((product) => {
        const priceType = product.priceType === "CUSTOM" ? "CUSTOM" : "FIXED";
        const price = typeof product.price === "number" ? product.price : Number(product.price) || 0;
        const productStatus = product.isDeActive ? "INACTIVE" : "ACTIVE";
        dataRows.push([categoryName, subCategoryName, product.productId || "", product.name || "", price, priceType, productStatus]);
      });
    });
  });

  return [headerRow, ...dataRows];
}

function main() {
  let categories = DATA;
  const jsonPath = process.argv[2];
  if (jsonPath && fs.existsSync(jsonPath)) {
    categories = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  } else if (DATA.length === 0) {
    console.log("Usage: node scripts/generate-product-excel.js [path/to/categories.json]");
    console.log("Or paste categories JSON into DATA in this script.");
    process.exit(1);
  }

  const rows = buildProductExcelRows(categories);
  if (rows.length <= 1) {
    console.log("No products to export.");
    process.exit(0);
  }

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = [{ wch: 20 }, { wch: 25 }, { wch: 14 }, { wch: 35 }, { wch: 12 }, { wch: 12 }, { wch: 14 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Products");

  const outPath = path.join(__dirname, "..", "ProductList.xlsx");
  XLSX.writeFile(wb, outPath);
  console.log("Created:", outPath);
}

main();
