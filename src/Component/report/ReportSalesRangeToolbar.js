import React, { useMemo } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FaCalendarAlt } from "react-icons/fa";
import { listIndianFYOptions, getIndianFYBoundsFromStartYear } from "../../utils/reportEntryFilters";
import { formatLocalDateYMD } from "../../utils/reportPayloadDate";

const MODES = [
  { key: "entry", label: "Item Wise" },
  { key: "date", label: "Bill wise" },
  { key: "month", label: "Month-wise" },
  { key: "year", label: "Year-wise" },
];

/**
 * Controls how From/To dates are chosen for the sales / sales-return daily report merge.
 */
export default function ReportSalesRangeToolbar({
  mode,
  onModeChange,
  rangeStart,
  rangeEnd,
  onRangeChange,
  dateRangeStart,
  dateRangeEnd,
  onDateRangeChange,
  monthDate,
  onMonthDateChange,
  fyStartYear,
  onFyStartYearChange,
  disabled,
}) {
  const fyOptions = useMemo(() => listIndianFYOptions(12), []);

  return (
    <div className="report-entry-toolbar report-sales-range-toolbar">
      <div className="report-entry-toolbar-modes" role="tablist" aria-label="Sales report period">
        {MODES.map((m) => (
          <button
            key={m.key}
            type="button"
            role="tab"
            aria-selected={mode === m.key}
            className={`report-entry-mode-btn${mode === m.key ? " is-active" : ""}`}
            onClick={() => onModeChange(m.key)}
            disabled={disabled}
          >
            {m.label}
          </button>
        ))}
      </div>

      {mode === "entry" && (
        <div className="report-date-picker-wrap report-sales-range-dates">
          <FaCalendarAlt style={{ color: "var(--brown-color)" }} aria-hidden />
          <span style={{ fontSize: "17px", fontWeight: 600 }}>From:</span>
          <DatePicker
            selected={rangeStart}
            onChange={(date) => {
              if (!date) return;
              const nextEnd = date > rangeEnd ? date : rangeEnd;
              onRangeChange(date, nextEnd);
            }}
            maxDate={new Date()}
            dateFormat="dd/MM/yyyy, EEEE"
            className="report-date-picker-input"
            disabled={disabled}
            portalId="sahitya-report-datepicker-root"
            popperClassName="report-datepicker-popper"
          />
          <span style={{ fontSize: "17px", fontWeight: 600 }}>To:</span>
          <DatePicker
            selected={rangeEnd}
            onChange={(date) => {
              if (!date) return;
              const nextStart = date < rangeStart ? date : rangeStart;
              onRangeChange(nextStart, date);
            }}
            maxDate={new Date()}
            dateFormat="dd/MM/yyyy, EEEE"
            className="report-date-picker-input"
            disabled={disabled}
            portalId="sahitya-report-datepicker-root"
            popperClassName="report-datepicker-popper"
          />
        </div>
      )}

      {mode === "date" && (
        <div className="report-entry-toolbar-controls report-date-range-controls">
          <DatePicker
            selectsRange
            startDate={dateRangeStart}
            endDate={dateRangeEnd}
            onChange={(dates) => {
              const [start, end] = dates || [];
              if (start) {
                onDateRangeChange(start, end ?? null);
              }
            }}
            shouldCloseOnSelect={false}
            maxDate={new Date()}
            dateFormat="dd/MM/yyyy"
            placeholderText="Select date range"
            className="report-date-picker-input report-entry-toolbar-input report-date-range-picker-input"
            disabled={disabled}
            portalId="sahitya-report-datepicker-root"
            popperClassName="report-datepicker-popper"
          />
        </div>
      )}

      {mode === "month" && (
        <div className="report-entry-toolbar-controls">
          <DatePicker
            selected={monthDate}
            onChange={(d) => d && onMonthDateChange(d)}
            maxDate={new Date()}
            showMonthYearPicker
            dateFormat="MMMM yyyy"
            className="report-date-picker-input report-entry-toolbar-input"
            disabled={disabled}
            portalId="sahitya-report-datepicker-root"
            popperClassName="report-datepicker-popper"
          />
        </div>
      )}

      {mode === "year" && (
        <div className="report-entry-toolbar-controls">
          <select
            className="report-entry-toolbar-select"
            value={fyStartYear}
            onChange={(e) => onFyStartYearChange(Number(e.target.value))}
            disabled={disabled}
            aria-label="Financial year"
          >
            {fyOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

/** Resolve toolbar mode + pickers into [startDate, endDate] for API (local calendar). */
export function resolveSalesReportRange(
  mode,
  { rangeStart, rangeEnd, dateRangeStart, dateRangeEnd, monthDate, fyStartYear }
) {
  if (mode === "entry") {
    return { start: rangeStart, end: rangeEnd };
  }
  if (mode === "date" && dateRangeStart) {
    const end = dateRangeEnd ?? dateRangeStart;
    const a =
      dateRangeStart.getTime() <= end.getTime() ? dateRangeStart : end;
    const b =
      dateRangeStart.getTime() <= end.getTime() ? end : dateRangeStart;
    return { start: a, end: b };
  }
  if (mode === "month" && monthDate) {
    const y = monthDate.getFullYear();
    const m = monthDate.getMonth();
    const start = new Date(y, m, 1);
    const end = new Date(y, m + 1, 0, 23, 59, 59, 999);
    return { start, end };
  }
  if (mode === "year" && fyStartYear != null) {
    const { start, end } = getIndianFYBoundsFromStartYear(fyStartYear);
    return { start, end };
  }
  return { start: rangeStart, end: rangeEnd };
}

export function salesRangeDayCount(start, end) {
  const a = formatLocalDateYMD(start);
  const b = formatLocalDateYMD(end);
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  const t0 = new Date(ay, am - 1, ad).getTime();
  const t1 = new Date(by, bm - 1, bd).getTime();
  return Math.floor((t1 - t0) / 86400000) + 1;
}
