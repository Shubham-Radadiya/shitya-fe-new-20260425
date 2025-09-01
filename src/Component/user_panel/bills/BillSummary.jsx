import React from "react";
import { formatIN } from "./utils";

const BillSummary = ({
  isStock,
  isBhet,
  purchaseLabel,
  totalPurchaseQuantity,
  totalPurchaseAmount,
  totalBhetQuantity,
  totalBhetAmount,
  totalSaleQuantity,
  totalSaleAmount,
  returnMode,
  returnEditFlag,
}) => {
  const leftText = isStock ? purchaseLabel : isBhet ? "Total Bhet" : "Total";

  const qty = isStock
    ? formatIN(totalPurchaseQuantity)
    : isBhet
    ? formatIN(totalBhetQuantity)
    : formatIN(totalSaleQuantity);

  const amt = isStock
    ? formatIN(totalPurchaseAmount)
    : isBhet
    ? formatIN(totalBhetAmount)
    : formatIN(totalSaleAmount);

  const showMinus = returnMode || (isStock && returnEditFlag);

  return (
    <div style={{ fontWeight: "bolder", display: "flex", gap: 12 }}>
      <div style={{ width: 115, textAlign: "start" }}>{leftText}</div>
      <div style={{ width: 39 }}>{qty}</div>
      <div style={{ width: 60, textAlign: "center" }}>
        {showMinus ? "-" : ""} {amt}
      </div>
    </div>
  );
};

export default BillSummary;
