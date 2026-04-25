import React, { useEffect, useMemo, useState, useCallback } from "react";
import { createPortal } from "react-dom";

/**
 * Excel-style column filter: search + checkbox list of unique values.
 * Renders via portal so it is not clipped by sticky table / scroll containers.
 */
export default function ProductExcelFilterPanel({
  columnKey,
  anchorRect,
  allUniqueValues,
  appliedSet,
  onApply,
  onClose,
}) {
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState(() => new Set());

  useEffect(() => {
    if (!columnKey || !allUniqueValues) return;
    const all = new Set(allUniqueValues);
    if (appliedSet == null) {
      setDraft(new Set(allUniqueValues));
    } else {
      setDraft(new Set(appliedSet));
    }
    setSearch("");
  }, [columnKey, allUniqueValues, appliedSet]);

  const filteredList = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = [...allUniqueValues];
    if (!q) return list;
    return list.filter((v) => String(v).toLowerCase().includes(q));
  }, [allUniqueValues, search]);

  const toggleValue = useCallback((v) => {
    setDraft((prev) => {
      const next = new Set(prev);
      if (next.has(v)) next.delete(v);
      else next.add(v);
      return next;
    });
  }, []);

  const selectAllVisible = useCallback(() => {
    setDraft((prev) => {
      const next = new Set(prev);
      filteredList.forEach((v) => next.add(v));
      return next;
    });
  }, [filteredList]);

  const clearVisible = useCallback(() => {
    setDraft((prev) => {
      const next = new Set(prev);
      filteredList.forEach((v) => next.delete(v));
      return next;
    });
  }, [filteredList]);

  const handleApply = useCallback(() => {
    const all = new Set(allUniqueValues);
    const full =
      all.size === draft.size && [...all].every((v) => draft.has(v));
    onApply(full ? null : draft);
    onClose();
  }, [allUniqueValues, draft, onApply, onClose]);

  useEffect(() => {
    const onDoc = (e) => {
      if (e.target.closest?.(".product-excel-filter-panel")) return;
      if (e.target.closest?.(".product-col-filter-trigger")) return;
      onClose();
    };
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  if (!columnKey || !anchorRect || typeof document === "undefined") {
    return null;
  }

  const top = anchorRect.bottom + 4;
  const left = anchorRect.left;
  const w = Math.max(anchorRect.width, 260);
  const maxLeft = window.innerWidth - w - 12;
  const safeLeft = Math.min(Math.max(8, left), Math.max(8, maxLeft));

  return createPortal(
    <div
      className="product-excel-filter-panel"
      role="dialog"
      aria-label={`Filter ${columnKey}`}
      style={{
        position: "fixed",
        top,
        left: safeLeft,
        width: w,
        zIndex: 10040,
      }}
    >
      <div className="product-excel-filter-panel-inner">
        <input
          type="search"
          className="product-excel-filter-search"
          placeholder="Search list…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />
        <div className="product-excel-filter-actions">
          <button type="button" onClick={selectAllVisible}>
            Select visible
          </button>
          <button type="button" onClick={clearVisible}>
            Clear visible
          </button>
        </div>
        <ul className="product-excel-filter-list">
          {filteredList.length === 0 ? (
            <li className="product-excel-filter-empty">No matches</li>
          ) : (
            filteredList.map((v, idx) => {
              const label = v === "" ? "(blank)" : String(v);
              return (
                <li key={`${columnKey}-f-${idx}`}>
                  <label className="product-excel-filter-row">
                    <input
                      type="checkbox"
                      checked={draft.has(v)}
                      onChange={() => toggleValue(v)}
                    />
                    <span>{label}</span>
                  </label>
                </li>
              );
            })
          )}
        </ul>
        <div className="product-excel-filter-footer">
          <button type="button" className="product-excel-filter-ok" onClick={handleApply}>
            OK
          </button>
          <button type="button" className="product-excel-filter-cancel" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
