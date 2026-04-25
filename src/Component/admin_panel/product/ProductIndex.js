import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { IoIosAddCircle } from "react-icons/io";
import { LuFilterX } from "react-icons/lu";
import AddProduct from "../modal/AddProduct";
import SubCategory from "../modal/SubCategory";
import RemoveCategory from "../modal/RemoveCategory";
import RemoveSubcategory from "../modal/RemoveSubcategory";
import UpdateCategory from "../modal/UpdateCategory";
import UpdateSubCategory from "../modal/UpdateSubcategory";
import RemoveProduct from "../modal/RemoveProduct";
import ProductTableRow from "./ProductTableRow";
import { REQUEST_CATEGORY } from "../../../store/category/categoryActionType";
import "./index.css";
import Category from "../modal/Category";
import { REQUEST_ADMIN_EXCEL } from "../../../store/excel/excelAction";
import { downloadProductExcel } from "../../../utils/productExcel";
import {
  compareCategoryNames,
  sortCategoriesForAdminDisplay,
  sortSubcategoriesForAdmin,
} from "../../../utils/productDisplayOrder";
import { toast } from "react-toastify";
import ProductExcelFilterPanel from "./ProductExcelFilterPanel";

/** Column keys for Excel-style set filters (null = all values allowed) */
const FILTER_COLUMNS = [
  { key: "categoryName", getValue: (row) => String(row.categoryName ?? "") },
  { key: "subcategoryName", getValue: (row) => String(row.subcategoryName ?? "") },
  { key: "productId", getValue: (row) => String(row.product?.productId ?? "") },
  { key: "productName", getValue: (row) => String(row.product?.name ?? "") },
  { key: "priceType", getValue: (row) => String(row.product?.priceType ?? "") },
  { key: "price", getValue: (row) => String(row.product?.price ?? "") },
  {
    key: "status",
    getValue: (row) => (row.product?.isDeActive ? "Inactive" : "Active"),
  },
];

function uniqueColumnValues(rows, getValue) {
  const s = new Set();
  rows.forEach((r) => s.add(getValue(r)));
  return [...s].sort((a, b) =>
    String(a).localeCompare(String(b), "gu", { numeric: true })
  );
}

function isPopulatedProduct(p) {
  return (
    p &&
    typeof p === "object" &&
    p._id != null &&
    (typeof p._id === "string" || typeof p._id === "object")
  );
}

/** Flat rows for Excel-style table: one row per product */
function buildProductRows(categories) {
  if (!Array.isArray(categories)) return [];
  const rows = [];
  for (const cat of categories) {
    const subs = cat.subCategory || [];
    for (const sub of subs) {
      const prods = sub.products || [];
      for (const p of prods) {
        if (!isPopulatedProduct(p)) continue;
        rows.push({
          key: `${cat._id}-${sub._id}-${p._id}`,
          categoryName: cat.name ?? "",
          subcategoryName: sub.name ?? "",
          categoryId: cat._id,
          subCategoryId: sub._id,
          product: p,
        });
      }
    }
  }
  rows.sort((a, b) => {
    const c = compareCategoryNames(a.categoryName, b.categoryName);
    if (c !== 0) return c;
    const s = String(a.subcategoryName).localeCompare(
      String(b.subcategoryName),
      "gu",
      { numeric: true }
    );
    if (s !== 0) return s;
    return String(a.product.productId ?? "").localeCompare(
      String(b.product.productId ?? ""),
      undefined,
      { numeric: true, sensitivity: "base" }
    );
  });
  return rows;
}

const Product = () => {
  const dispatch = useDispatch();
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showUpdateCategoryModal, setShowUpdateCategoryModal] = useState(false);
  const [showSubCategoryModal, setShowSubCategoryModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const [showRemoveProductModal, setShowRemoveProductModal] = useState(false);
  const [productIdToDelete, setProductIdToDelete] = useState(null);

  const [showUpdateSubModal, setShowUpdateSubModal] = useState(false);
  const [subCategoryToEdit, setSubCategoryToEdit] = useState(null);
  const [subCategoryEditId, setSubCategoryEditId] = useState(null);
  const [showRemoveSubModal, setShowRemoveSubModal] = useState(false);
  const [subcategoryIdToDelete, setSubcategoryIdToDelete] = useState(null);

  const [manageCategoryId, setManageCategoryId] = useState("");
  const [manageSubCategoryId, setManageSubCategoryId] = useState("");

  /** Per-column allowed values; null = no restriction (show all) */
  const [appliedSetFilters, setAppliedSetFilters] = useState({
    categoryName: null,
    subcategoryName: null,
    productId: null,
    productName: null,
    priceType: null,
    price: null,
    status: null,
  });

  const [openFilterKey, setOpenFilterKey] = useState(null);
  const [filterAnchorRect, setFilterAnchorRect] = useState(null);

  const categories = useSelector((state) => state.category.categories);
  const role = localStorage.getItem("role");

  const categoriesDisplayOrder = useMemo(
    () => sortCategoriesForAdminDisplay(categories),
    [categories]
  );

  const productRows = useMemo(() => buildProductRows(categories), [categories]);

  const filteredProductRows = useMemo(() => {
    return productRows.filter((row) => {
      for (const col of FILTER_COLUMNS) {
        const allowed = appliedSetFilters[col.key];
        if (allowed == null) continue;
        const val = col.getValue(row);
        if (!allowed.has(val)) return false;
      }
      return true;
    });
  }, [productRows, appliedSetFilters]);

  const clearFilters = useCallback(() => {
    setAppliedSetFilters({
      categoryName: null,
      subcategoryName: null,
      productId: null,
      productName: null,
      priceType: null,
      price: null,
      status: null,
    });
    setOpenFilterKey(null);
    setFilterAnchorRect(null);
  }, []);

  const closeFilterPanel = useCallback(() => {
    setOpenFilterKey(null);
    setFilterAnchorRect(null);
  }, []);

  const openColumnFilter = useCallback((columnKey, event) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    if (openFilterKey === columnKey) {
      closeFilterPanel();
      return;
    }
    setFilterAnchorRect(rect);
    setOpenFilterKey(columnKey);
  }, [openFilterKey, closeFilterPanel]);

  const applyColumnFilter = useCallback((columnKey, newSetOrNull) => {
    setAppliedSetFilters((prev) => ({
      ...prev,
      [columnKey]:
        newSetOrNull == null ? null : new Set(newSetOrNull),
    }));
  }, []);

  const isColumnFiltered = useCallback(
    (key) => appliedSetFilters[key] != null,
    [appliedSetFilters]
  );

  const openFilterColumnDef = useMemo(
    () => FILTER_COLUMNS.find((c) => c.key === openFilterKey),
    [openFilterKey]
  );

  const openFilterUniques = useMemo(() => {
    if (!openFilterColumnDef) return [];
    const arr = uniqueColumnValues(productRows, openFilterColumnDef.getValue);
    if (openFilterKey === "categoryName") {
      return [...arr].sort((a, b) => compareCategoryNames(a, b));
    }
    return arr;
  }, [openFilterColumnDef, openFilterKey, productRows]);

  useEffect(() => {
    if (!openFilterKey) return undefined;
    const onScroll = (e) => {
      const t = e.target;
      if (t && typeof t.closest === "function") {
        if (t.closest(".product-excel-filter-panel")) return;
      }
      closeFilterPanel();
    };
    window.addEventListener("scroll", onScroll, true);
    return () => window.removeEventListener("scroll", onScroll, true);
  }, [openFilterKey, closeFilterPanel]);

  useEffect(() => {
    if (
      showProductModal ||
      showCategoryModal ||
      showSubCategoryModal ||
      showUpdateCategoryModal ||
      showRemoveModal ||
      showUpdateSubModal ||
      showRemoveSubModal ||
      showRemoveProductModal
    ) {
      closeFilterPanel();
    }
  }, [
    showProductModal,
    showCategoryModal,
    showSubCategoryModal,
    showUpdateCategoryModal,
    showRemoveModal,
    showUpdateSubModal,
    showRemoveSubModal,
    showRemoveProductModal,
    closeFilterPanel,
  ]);

  const subcategoryOptions = useMemo(() => {
    const opts = [];
    const ordered = sortCategoriesForAdminDisplay(categories || []);
    for (const cat of ordered) {
      for (const sub of sortSubcategoriesForAdmin(cat.subCategory || [])) {
        opts.push({
          id: sub._id,
          label: `${cat.name} › ${sub.name}`,
          sub,
          cat,
        });
      }
    }
    return opts;
  }, [categories]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("excelFile", file);
    dispatch({ type: REQUEST_ADMIN_EXCEL, payload: { data: formData } });
    event.target.value = "";
  };

  const handleDownloadExcel = () => {
    if (!categories || categories.length === 0) {
      toast.info("No categories to export.");
      return;
    }
    const hasData = downloadProductExcel(categories);
    if (hasData) toast.success("Excel downloaded.");
    else toast.info("No products to export.");
  };

  useEffect(() => {
    dispatch({ type: REQUEST_CATEGORY });
  }, [dispatch]);

  const openEditCategory = () => {
    const cat = categories.find((c) => c._id === manageCategoryId);
    if (!cat) return;
    setSelectedCategory(cat);
    setShowUpdateCategoryModal(true);
  };

  const openDeleteCategory = () => {
    if (!manageCategoryId) return;
    setCategoryToDelete(manageCategoryId);
    setShowRemoveModal(true);
  };

  const openEditSubcategory = () => {
    const opt = subcategoryOptions.find((o) => o.id === manageSubCategoryId);
    if (!opt) return;
    setSubCategoryToEdit({
      ...opt.sub,
      categoryId: opt.cat?._id,
    });
    setSubCategoryEditId(opt.id);
    setShowUpdateSubModal(true);
  };

  const openDeleteSubcategory = () => {
    if (!manageSubCategoryId) return;
    setSubcategoryIdToDelete(manageSubCategoryId);
    setShowRemoveSubModal(true);
  };

  const handleRemoveSubConfirm = () => {
    setShowRemoveSubModal(false);
    setSubcategoryIdToDelete(null);
    setManageSubCategoryId("");
  };

  const handleRemoveProductConfirm = () => {
    setShowRemoveProductModal(false);
    setProductIdToDelete(null);
  };

  return (
    <div
      id="admin-product-page"
      className="product-container product-container-flat"
    >
      <header className="product-page-header" lang="en">
        <div className="product-page-header-main">
          <h1 className="product-page-title">Product catalog</h1>
          <p className="product-page-subtitle">
            Categories, sub-categories, and SKUs — edit inline; filters work like
            a spreadsheet.
          </p>
        </div>
        <div className="product-page-header-stats" aria-live="polite">
          <span className="product-stat-pill product-stat-pill--total">
            <span className="product-stat-pill__value">{productRows.length}</span>
            <span className="product-stat-pill__label">total</span>
          </span>
          <span className="product-stat-pill product-stat-pill--filtered">
            <span className="product-stat-pill__value">
              {filteredProductRows.length}
            </span>
            <span className="product-stat-pill__label">showing</span>
          </span>
        </div>
      </header>

      <div className="product-toolbar-shell" lang="gu">
        <div className="create-buttons product-toolbar-one-line flexgap">
        <button
          className="add-btn modalbtn product-toolbar-btn product-btn-primary"
          onClick={() => setShowCategoryModal(true)}
          type="button"
        >
          <IoIosAddCircle className="add-icon" />
          Category
        </button>
        <button
          className="add-btn modalbtn product-toolbar-btn product-btn-primary"
          onClick={() => setShowSubCategoryModal(true)}
          type="button"
        >
          <IoIosAddCircle className="add-icon" />
          Sub-Category
        </button>
        <button
          className="add-btn modalbtn product-toolbar-btn product-btn-primary"
          onClick={() => setShowProductModal(true)}
          type="button"
        >
          <IoIosAddCircle className="add-icon" />
          Product
        </button>
        <button
          type="button"
          className="add-btn modalbtn product-toolbar-btn product-btn-secondary"
          onClick={handleDownloadExcel}
        >
          Download Excel
        </button>
        <label className="custom-file-upload product-toolbar-upload product-btn-secondary">
          <span>Upload Excel</span>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
          />
        </label>

        <span className="product-toolbar-sep" aria-hidden="true" />

        <div className="product-manage-group product-manage-group-inline">
          <span className="product-manage-label">Category</span>
          <select
            className="product-manage-select"
            value={manageCategoryId}
            onChange={(e) => setManageCategoryId(e.target.value)}
          >
            <option value="">— Select —</option>
            {categoriesDisplayOrder.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="product-manage-btn"
            disabled={!manageCategoryId}
            onClick={openEditCategory}
          >
            Edit
          </button>
          {role === "SUPER ADMIN" && (
            <button
              type="button"
              className="product-manage-btn product-manage-btn-danger"
              disabled={!manageCategoryId}
              onClick={openDeleteCategory}
            >
              Delete
            </button>
          )}
        </div>
        <div className="product-manage-group product-manage-group-inline">
          <span className="product-manage-label">Sub-category</span>
          <select
            className="product-manage-select product-manage-select-wide"
            value={manageSubCategoryId}
            onChange={(e) => setManageSubCategoryId(e.target.value)}
          >
            <option value="">— Select —</option>
            {subcategoryOptions.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="product-manage-btn"
            disabled={!manageSubCategoryId}
            onClick={openEditSubcategory}
          >
            Edit
          </button>
          {role === "SUPER ADMIN" && (
            <button
              type="button"
              className="product-manage-btn product-manage-btn-danger"
              disabled={!manageSubCategoryId}
              onClick={openDeleteSubcategory}
            >
              Delete
            </button>
          )}
        </div>
        </div>
      </div>

      <div className="product-excel-scroll-wrap product-flat-table-wrap product-table-shell" lang="gu">
        <table className="product-table product-table-excel">
          <colgroup>
            <col className="col-cat" />
            <col className="col-sub" />
            <col className="col-pid" />
            <col className="col-name" />
            <col className="col-price-type" />
            <col className="col-price" />
            <col className="col-status" />
            <col className="col-actions" />
          </colgroup>
          <thead className="product-excel-thead">
            <tr className="product-filter-title-row">
              <th scope="col" className="col-cat product-th-title">
                <div className="product-th-title-inner">
                  <span className="product-th-text">categoryName</span>
                  <button
                    type="button"
                    className={`product-col-filter-trigger${
                      isColumnFiltered("categoryName") ? " is-active" : ""
                    }`}
                    aria-label="Filter categoryName"
                    title="Filter"
                    onClick={(e) => openColumnFilter("categoryName", e)}
                  >
                    ▼
                  </button>
                </div>
              </th>
              <th scope="col" className="col-sub product-th-title">
                <div className="product-th-title-inner">
                  <span className="product-th-text">subcategoryName</span>
                  <button
                    type="button"
                    className={`product-col-filter-trigger${
                      isColumnFiltered("subcategoryName") ? " is-active" : ""
                    }`}
                    aria-label="Filter subcategoryName"
                    title="Filter"
                    onClick={(e) => openColumnFilter("subcategoryName", e)}
                  >
                    ▼
                  </button>
                </div>
              </th>
              <th scope="col" className="col-pid product-th-title">
                <div className="product-th-title-inner">
                  <span className="product-th-text">productId</span>
                  <button
                    type="button"
                    className={`product-col-filter-trigger${
                      isColumnFiltered("productId") ? " is-active" : ""
                    }`}
                    aria-label="Filter productId"
                    title="Filter"
                    onClick={(e) => openColumnFilter("productId", e)}
                  >
                    ▼
                  </button>
                </div>
              </th>
              <th scope="col" className="col-name product-th-title">
                <div className="product-th-title-inner">
                  <span className="product-th-text">productName</span>
                  <button
                    type="button"
                    className={`product-col-filter-trigger${
                      isColumnFiltered("productName") ? " is-active" : ""
                    }`}
                    aria-label="Filter productName"
                    title="Filter"
                    onClick={(e) => openColumnFilter("productName", e)}
                  >
                    ▼
                  </button>
                </div>
              </th>
              <th scope="col" className="col-price-type product-th-title">
                <div className="product-th-title-inner">
                  <span className="product-th-text">priceType</span>
                  <button
                    type="button"
                    className={`product-col-filter-trigger${
                      isColumnFiltered("priceType") ? " is-active" : ""
                    }`}
                    aria-label="Filter priceType"
                    title="Filter"
                    onClick={(e) => openColumnFilter("priceType", e)}
                  >
                    ▼
                  </button>
                </div>
              </th>
              <th scope="col" className="col-price product-th-title">
                <div className="product-th-title-inner product-th-price-header">
                  <span className="product-th-text">price</span>
                  <button
                    type="button"
                    className={`product-col-filter-trigger${
                      isColumnFiltered("price") ? " is-active" : ""
                    }`}
                    aria-label="Filter price"
                    title="Filter"
                    onClick={(e) => openColumnFilter("price", e)}
                  >
                    ▼
                  </button>
                </div>
              </th>
              <th scope="col" className="col-status product-th-title">
                <div className="product-th-title-inner">
                  <span className="product-th-text">status</span>
                  <button
                    type="button"
                    className={`product-col-filter-trigger${
                      isColumnFiltered("status") ? " is-active" : ""
                    }`}
                    aria-label="Filter status"
                    title="Filter"
                    onClick={(e) => openColumnFilter("status", e)}
                  >
                    ▼
                  </button>
                </div>
              </th>
              <th
                scope="col"
                className="col-actions product-th-title product-th-actions-col"
              >
                <div className="product-th-title-inner product-th-actions-inner">
                  <span className="product-th-text product-th-text-actions">
                    actions
                  </span>
                  <button
                    type="button"
                    className="product-th-clear-filters-icon"
                    onClick={clearFilters}
                    title="Clear all column filters"
                    aria-label="Clear all column filters"
                  >
                    <LuFilterX aria-hidden />
                  </button>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {productRows.length === 0 ? (
              <tr>
                <td colSpan={8} className="product-table-empty-message">
                  No products found. Add categories, sub-categories, and products
                  using the buttons above.
                </td>
              </tr>
            ) : filteredProductRows.length === 0 ? (
              <tr>
                <td colSpan={8} className="product-table-empty-message">
                  No rows match the current filters.{" "}
                  <button
                    type="button"
                    className="product-inline-clear-icon"
                    onClick={clearFilters}
                    title="Clear all column filters"
                    aria-label="Clear all column filters"
                  >
                    <LuFilterX aria-hidden />
                  </button>
                </td>
              </tr>
            ) : (
              filteredProductRows.map((row) => (
                <ProductTableRow
                  key={row.key}
                  row={row}
                  sortedCategories={categoriesDisplayOrder}
                  role={role}
                  onDeleteClick={(id) => {
                    setProductIdToDelete(id);
                    setShowRemoveProductModal(true);
                  }}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {openFilterKey && filterAnchorRect && openFilterColumnDef ? (
        <ProductExcelFilterPanel
          columnKey={openFilterKey}
          anchorRect={filterAnchorRect}
          allUniqueValues={openFilterUniques}
          appliedSet={appliedSetFilters[openFilterKey]}
          onApply={(setOrNull) => applyColumnFilter(openFilterKey, setOrNull)}
          onClose={closeFilterPanel}
        />
      ) : null}

      {showProductModal && (
        <AddProduct closeModal={() => setShowProductModal(false)} />
      )}
      {showCategoryModal && (
        <Category closeModal={() => setShowCategoryModal(false)} />
      )}
      {showSubCategoryModal && (
        <SubCategory closeModal={() => setShowSubCategoryModal(false)} />
      )}
      {showUpdateCategoryModal && (
        <UpdateCategory
          closeModal={() => setShowUpdateCategoryModal(false)}
          category={selectedCategory}
          categoryID={selectedCategory ? selectedCategory._id : null}
        />
      )}
      {showRemoveModal && (
        <RemoveCategory
          closeModal={() => setShowRemoveModal(false)}
          confirmRemove={() => setShowRemoveModal(false)}
          categoryId={categoryToDelete}
        />
      )}
      {showRemoveProductModal && (
        <RemoveProduct
          closeModal={() => setShowRemoveProductModal(false)}
          confirmRemove={handleRemoveProductConfirm}
          productId={productIdToDelete}
        />
      )}
      {showUpdateSubModal && subCategoryToEdit && (
        <UpdateSubCategory
          closeModal={() => {
            setShowUpdateSubModal(false);
            setSubCategoryToEdit(null);
            setSubCategoryEditId(null);
          }}
          subCategory={subCategoryToEdit}
          subCategoryId={subCategoryEditId}
        />
      )}
      {showRemoveSubModal && (
        <RemoveSubcategory
          closeModal={() => {
            setShowRemoveSubModal(false);
            setSubcategoryIdToDelete(null);
          }}
          confirmRemove={handleRemoveSubConfirm}
          subcategoryId={subcategoryIdToDelete}
        />
      )}
    </div>
  );
};

export default Product;
