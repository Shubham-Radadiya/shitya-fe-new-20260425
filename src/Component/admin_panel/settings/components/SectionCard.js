import React from "react";

const SectionCard = ({
  title,
  icon,
  danger = false,
  /** No title bar — body only (e.g. single setting row). */
  noHeader = false,
  children,
}) => (
  <section
    className={`st-card${danger ? " st-card--danger" : ""}${
      noHeader ? " st-card--no-header" : ""
    }`.trim()}
  >
    {!noHeader ? (
      <div className="st-card__head">
        <div className="st-card__head-main">
          {icon ? <span className="st-card__icon">{icon}</span> : null}
          <h2 className="st-card__title">{title}</h2>
        </div>
      </div>
    ) : null}
    <div className="st-card__body">
      <div className="st-card__body-inner">{children}</div>
    </div>
  </section>
);

export default SectionCard;
