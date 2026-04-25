import React from "react";
import "./reportTableLoader.css";

export function ReportTableLoadingOverlay({ show, label = "Loading…" }) {
  if (!show) return null;
  return (
    <div className="report-table-loading-overlay" aria-live="polite">
      <div className="report-table-spinner" />
      <span>{label}</span>
    </div>
  );
}

/**
 * Wraps report tables with dimmed content + spinner while `loading` is true.
 */
export function ReportTablesLoaderWrap({
  loading,
  children,
  minHeight = 120,
  label,
  className = "",
}) {
  return (
    <div
      className={`report-tables-with-loader ${className}`.trim()}
      style={{ position: "relative", minHeight: `${minHeight}px` }}
    >
      <ReportTableLoadingOverlay show={loading} label={label} />
      <div className={loading ? "report-tables-dimmed" : undefined}>{children}</div>
    </div>
  );
}
