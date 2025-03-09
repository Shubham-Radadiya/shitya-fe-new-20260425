import React, { useState } from "react";
import "./modalstyle.css";

const ReportSelector = ({ closeModal }) => {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleCategoryChange = (event) => {
    setSelectedCategory(event.target.value);
  };

  const handleStartDateChange = (event) => {
    setStartDate(event.target.value);
  };

  const handleEndDateChange = (event) => {
    setEndDate(event.target.value);
  };

  return (
    <div className="admin-modal show">
      <div className="admin-modal-content">
        <div className="flexbtw">
          <h3 className="modal-title">Select Report Method</h3>
          <span className="closeicon" onClick={closeModal}>
            &times;
          </span>
        </div>
        <div className="modal-form">
          <div>
            <label className="modal-label">
              Select Report Method:
              <select
                id="categoryName"
                name="categoryName"
                className="modal-input"
                value={selectedCategory}
                onChange={handleCategoryChange}
              >
                <option value="" disabled>
                  Select Report Method
                </option>
                <option value="daily">Daily</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
                <option value="custom">Custom Report</option>
              </select>
            </label>
          </div>
          {selectedCategory === "custom" && (
            <div className="date-range-picker">
              <label className="modal-label">
                Start Date:
                <input
                  type="date"
                  value={startDate}
                  onChange={handleStartDateChange}
                  className="modal-input"
                />
              </label>
              <label className="modal-label">
                End Date:
                <input
                  type="date"
                  value={endDate}
                  onChange={handleEndDateChange}
                  className="modal-input"
                />
              </label>
            </div>
          )}
          <div className="modal-bottom-btn">
            <button className="modal-btn" type="button" onClick={closeModal}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportSelector;
