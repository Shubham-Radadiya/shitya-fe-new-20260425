import React from "react";
import { MdStar } from "react-icons/md";
import SettingTooltip from "./SettingTooltip";

function TooltipInfoButton({ label }) {
  return (
    <button
      type="button"
      className="setting-row__info-btn"
      aria-label={`Help: ${label}`}
    >
      <MdStar className="setting-row__info-icon" aria-hidden />
    </button>
  );
}

const SettingRow = ({
  label,
  tooltip,
  children,
  className = "",
  tooltipPosition = "top",
  /** "before" = star then label (default). "after" = label then star. */
  tooltipPlacement = "before",
}) => (
  <div className={`setting-row ${className}`.trim()}>
    <div
      className={`setting-row__label${
        tooltipPlacement === "before" ? " setting-row__label--tooltip-before" : ""
      }`.trim()}
    >
      {tooltip && tooltipPlacement === "before" ? (
        <SettingTooltip content={tooltip} position={tooltipPosition}>
          <TooltipInfoButton label={label} />
        </SettingTooltip>
      ) : null}
      <span className="setting-row__title">{label}</span>
      {tooltip && tooltipPlacement === "after" ? (
        <SettingTooltip content={tooltip} position={tooltipPosition}>
          <TooltipInfoButton label={label} />
        </SettingTooltip>
      ) : null}
    </div>
    <div className="setting-row__control">{children}</div>
  </div>
);

export default SettingRow;
