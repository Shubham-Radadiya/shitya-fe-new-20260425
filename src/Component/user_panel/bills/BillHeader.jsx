import React from "react";

const BillHeader = ({
  notesIcon,
  onOpenNotes,
  currentLocation,
  bhetNumber,
  invoiceNumber,
  billNumber,
}) => {
  return (
    <>
      <div className="screen-list">
        <img
          src={notesIcon}
          alt="Maharaj"
          style={{ cursor: "pointer", width: 40, height: 40 }}
          onClick={onOpenNotes}
        />
        {/* your nav buttons remain in the parent (to keep route logic there) */}
      </div>
      <hr style={{ border: "1px solid #808080" }} />
      <h3
        className="bill-title"
        style={{
          userSelect: "none",
          color: currentLocation.pathname === "/stock" && "rgb(87 15 119)",
        }}
      >
        Bills
      </h3>

      <div className="bill_index">
        <h4 style={{ textAlign: "center" }}>Jay Swaminarayan</h4>
        <div className="bill_header_sub">
          <h8>Date: {new Date().toLocaleDateString("en-GB")}</h8>
          <h8>
            {currentLocation.pathname === "/bhet"
              ? `Bhet.No: ${bhetNumber || "N/A"}`
              : currentLocation.pathname === "/stock"
              ? `INV.No: ${invoiceNumber || "N/A"}`
              : `Sr.No: ${billNumber || ""}`}
          </h8>
        </div>
      </div>
    </>
  );
};

export default BillHeader;
