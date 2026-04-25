import React, { useMemo } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FaCalendarAlt } from "react-icons/fa";
import {
  listIndianFYOptions,
} from "../../utils/reportEntryFilters";

const MODES = [
  { key: "entry", label: "Item Wise" },
  { key: "date", label: "Bill wise" },
  { key: "month", label: "Month-wise" },
  { key: "year", label: "Year-wise" },
];

/**
 * Four-way filter for purchase / purchase return / bhet / bhet return entry lists.
 */
export default function ReportEntryModeToolbar({
  mode,
  onModeChange,
  dateRangeStart,
  dateRangeEnd,
  onDateRangeChange,
  monthDate,
  onMonthDateChange,
  fyStartYear,
  onFyStartYearChange,
  disabled = false,
  /** Shown in Item Wise mode; distinguishes purchase/bhet from generic wording */
  entryHint,
  /** When true, Item Wise shows From/To pickers (purchase / purchase return, like sales Item Wise). */
  showPurchaseItemWiseDateRange = false,
  entryItemWiseStart,
  entryItemWiseEnd,
  onEntryItemWiseRangeChange,
}) {
  const fyOptions = useMemo(() => listIndianFYOptions(12), []);

  return (
    <div className="report-entry-toolbar">
      <div className="report-entry-toolbar-modes" role="tablist" aria-label="Report period">
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
      <div className="report-entry-toolbar-controls">
        {mode === "date" && (
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
        )}
        {mode === "month" && (
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
        )}
        {mode === "year" && (
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
        )}
        {mode === "entry" && showPurchaseItemWiseDateRange && onEntryItemWiseRangeChange && (
          <div className="report-date-picker-wrap report-sales-range-dates report-entry-itemwise-dates">
            <FaCalendarAlt style={{ color: "var(--brown-color)" }} aria-hidden />
            <span style={{ fontSize: "17px", fontWeight: 600 }}>From:</span>
            <DatePicker
              selected={entryItemWiseStart}
              onChange={(date) => {
                if (!date) return;
                const end = entryItemWiseEnd ?? date;
                const nextEnd = date > end ? date : end;
                onEntryItemWiseRangeChange(date, nextEnd);
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
              selected={entryItemWiseEnd}
              onChange={(date) => {
                if (!date) return;
                const start = entryItemWiseStart ?? date;
                const nextStart = date < start ? date : start;
                onEntryItemWiseRangeChange(nextStart, date);
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
        {mode === "entry" && !showPurchaseItemWiseDateRange && (
          <span className="report-entry-toolbar-hint report-entry-toolbar-hint--reserve">
            {entryHint && String(entryHint).trim() ? entryHint : "\u00a0"}
          </span>
        )}
      </div>
    </div>
  );
}
