import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useDispatch } from "react-redux";
import { MdOutlineDeleteOutline } from "react-icons/md";
import { REQUEST_UPDATE_PRODUCT } from "../../../store/product/ProductAction";
import { sortSubcategoriesForAdmin } from "../../../utils/productDisplayOrder";
import { formatInr } from "../../../utils/formatInr";

function productIdStr(id) {
  if (id == null) return "";
  if (typeof id === "object" && typeof id.toString === "function") {
    return id.toString();
  }
  return String(id);
}

function toApiPayload(local) {
  const rawPrice = local.priceType === "CUSTOM" ? 0 : local.price;
  const priceNum =
    rawPrice === "" || rawPrice === null || rawPrice === undefined
      ? 0
      : Number(rawPrice) || 0;
  return {
    name: (local.name ?? "").trim(),
    subCategoryId: local.subCategoryId,
    price: priceNum,
    productId: (local.productId ?? "").trim(),
    priceType: local.priceType || "FIXED",
    isDeActive: !!local.isDeActive,
  };
}

function baselineFromServer(p, subCategoryId) {
  return toApiPayload({
    name: p.name ?? "",
    subCategoryId,
    price: p.price ?? 0,
    productId: p.productId ?? "",
    priceType: p.priceType || "FIXED",
    isDeActive: !!p.isDeActive,
  });
}

export default function ProductTableRow({ row, sortedCategories, role, onDeleteClick }) {
  const dispatch = useDispatch();
  const p = row.product;
  const pid = productIdStr(p._id);

  const [local, setLocal] = useState(() => ({
    categoryId: row.categoryId,
    subCategoryId: row.subCategoryId,
    productId: p.productId ?? "",
    name: p.name ?? "",
    price: p.price ?? 0,
    priceType: p.priceType || "FIXED",
    isDeActive: !!p.isDeActive,
  }));
  const [priceFocused, setPriceFocused] = useState(false);

  const localRef = useRef(local);
  localRef.current = local;

  useEffect(() => {
    const next = {
      categoryId: row.categoryId,
      subCategoryId: row.subCategoryId,
      productId: p.productId ?? "",
      name: p.name ?? "",
      price: p.price ?? 0,
      priceType: p.priceType || "FIXED",
      isDeActive: !!p.isDeActive,
    };
    setLocal(next);
    localRef.current = next;
  }, [
    row.categoryId,
    row.subCategoryId,
    pid,
    p.productId,
    p.name,
    p.price,
    p.priceType,
    p.isDeActive,
  ]);

  const subsForCategory = useMemo(() => {
    const cat = sortedCategories.find((c) => c._id === local.categoryId);
    return sortSubcategoriesForAdmin(cat?.subCategory || []);
  }, [sortedCategories, local.categoryId]);

  const tryPatch = useCallback(
    (nextLocal) => {
      const payload = toApiPayload(nextLocal);
      const base = baselineFromServer(p, row.subCategoryId);
      if (JSON.stringify(payload) === JSON.stringify(base)) return;
      dispatch({
        type: REQUEST_UPDATE_PRODUCT,
        payload: { id: pid, data: payload },
      });
    },
    [dispatch, pid, p, row.subCategoryId]
  );

  const flush = useCallback(() => {
    tryPatch(localRef.current);
  }, [tryPatch]);

  const applyCategoryChange = (catId) => {
    const cat = sortedCategories.find((c) => c._id === catId);
    const subs = sortSubcategoriesForAdmin(cat?.subCategory || []);
    const prevSub = localRef.current.subCategoryId;
    const keep = subs.find((s) => s._id === prevSub);
    const newSubId = keep ? keep._id : subs[0]?._id ?? "";
    const next = {
      ...localRef.current,
      categoryId: catId,
      subCategoryId: newSubId,
    };
    setLocal(next);
    localRef.current = next;
    tryPatch(next);
  };

  const applySubcategoryChange = (subId) => {
    const next = { ...localRef.current, subCategoryId: subId };
    setLocal(next);
    localRef.current = next;
    tryPatch(next);
  };

  const applyPriceTypeChange = (priceType) => {
    const next = {
      ...localRef.current,
      priceType,
      ...(priceType === "CUSTOM" ? { price: 0 } : {}),
    };
    setLocal(next);
    localRef.current = next;
    tryPatch(next);
  };

  const toggleActive = () => {
    const next = {
      ...localRef.current,
      isDeActive: !localRef.current.isDeActive,
    };
    setLocal(next);
    localRef.current = next;
    tryPatch(next);
  };

  const isActive = !local.isDeActive;

  return (
    <tr>
      <td className="col-cat">
        <select
          className="product-cell-select"
          value={local.categoryId}
          onChange={(e) => applyCategoryChange(e.target.value)}
          aria-label="Category"
        >
          {sortedCategories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
      </td>
      <td className="col-sub">
        <select
          className="product-cell-select"
          value={local.subCategoryId}
          onChange={(e) => applySubcategoryChange(e.target.value)}
          aria-label="Subcategory"
        >
          {subsForCategory.length === 0 ? (
            <option value={local.subCategoryId || ""}>
              {(row.subcategoryName && String(row.subcategoryName)) || "—"}
            </option>
          ) : (
            subsForCategory.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))
          )}
        </select>
      </td>
      <td className="col-pid product-mono">
        <input
          className="product-cell-input"
          value={local.productId}
          onChange={(e) =>
            setLocal((prev) => {
              const n = { ...prev, productId: e.target.value };
              localRef.current = n;
              return n;
            })
          }
          onBlur={flush}
          aria-label="Product ID"
        />
      </td>
      <td className="col-name">
        <input
          className="product-cell-input"
          value={local.name}
          onChange={(e) =>
            setLocal((prev) => {
              const n = { ...prev, name: e.target.value };
              localRef.current = n;
              return n;
            })
          }
          onBlur={flush}
          aria-label="Product name"
        />
      </td>
      <td className="col-price-type">
        <select
          className="product-cell-select"
          value={local.priceType}
          onChange={(e) => applyPriceTypeChange(e.target.value)}
          aria-label="Price type"
        >
          <option value="FIXED">FIXED</option>
          <option value="CUSTOM">CUSTOM</option>
        </select>
      </td>
      <td className="col-price product-num">
        <input
          className="product-cell-input product-cell-input-num"
          type="text"
          inputMode="decimal"
          value={
            local.priceType === "CUSTOM"
              ? "0"
              : local.price === "" ||
                  local.price === null ||
                  local.price === undefined
                ? ""
                : priceFocused
                  ? String(local.price)
                  : formatInr(local.price, {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    })
          }
          disabled={local.priceType === "CUSTOM"}
          onFocus={() => setPriceFocused(true)}
          onChange={(e) => {
            let raw = e.target.value.replace(/,/g, "").replace(/[^\d.]/g, "");
            const dot = raw.indexOf(".");
            if (dot !== -1) {
              raw =
                raw.slice(0, dot + 1) + raw.slice(dot + 1).replace(/\./g, "");
            }
            if (raw === "" || raw === ".") {
              setLocal((prev) => {
                const n = { ...prev, price: "" };
                localRef.current = n;
                return n;
              });
              return;
            }
            const num = Number(raw);
            if (!Number.isNaN(num)) {
              setLocal((prev) => {
                const n = { ...prev, price: num };
                localRef.current = n;
                return n;
              });
            }
          }}
          onBlur={() => {
            setPriceFocused(false);
            flush();
          }}
          aria-label="Price"
        />
      </td>
      <td className="col-status">
        <button
          type="button"
          className={`product-status-toggle${isActive ? " is-on" : " is-off"}`}
          role="switch"
          aria-checked={isActive}
          onClick={toggleActive}
          title={isActive ? "Active (click to deactivate)" : "Inactive (click to activate)"}
        >
          <span className="product-status-toggle-knob" aria-hidden />
        </button>
      </td>
      <td className="col-actions product-action">
        {role === "SUPER ADMIN" && (
          <button
            type="button"
            className="product-action-btn product-action-btn--danger"
            onClick={() => onDeleteClick(p._id)}
          >
            <MdOutlineDeleteOutline className="action_icon" aria-hidden />
            Delete
          </button>
        )}
      </td>
    </tr>
  );
}
