import React from "react";
import ProductRow from "./ProductRow";

const ProductTable = ({
  items,
  returnMode,
  customPrices,
  onIncrement,
  onDecrement,
  onOpenQtyModal,
  onCustomPriceChange,
  footerLeftLabel,
  footerQty,
  footerAmt,
  showMinusSign,
}) => {
  const renderBody = (list) =>
    list.length ? (
      list.map((p) => (
        <ProductRow
          key={p._id}
          product={p}
          returnMode={returnMode}
          customPrices={customPrices}
          onIncrement={onIncrement}
          onDecrement={onDecrement}
          onOpenQtyModal={onOpenQtyModal}
          onCustomPriceChange={onCustomPriceChange}
        />
      ))
    ) : (
      <tr>
        <td colSpan="4" className="no-data">
          No Data Available
        </td>
      </tr>
    );

  return (
    <div className="table-container">
      <table className="bill_table">
        <thead>
          <tr>
            <th style={{ width: 48 }}>ID</th>
            <th style={{ width: 100 }}>Item</th>
            <th>Qty</th>
            <th style={{ fontWeight: "bolder" }}>Amt</th>
          </tr>
        </thead>

        <tbody>{renderBody(items)}</tbody>

        <tfoot style={{ display: "flex", justifyContent: "flex-start" }}>
          <tr>
            <td
              colSpan={2}
              style={{
                fontWeight: "bolder",
                textAlign: "start",
                width: 115,
              }}
            >
              {footerLeftLabel}
            </td>
            <td style={{ fontWeight: "bolder", width: 39 }}>{footerQty}</td>
            <td
              style={{
                fontWeight: "bolder",
                textAlign: "center",
                width: 60,
                textWrap: "nowrap",
              }}
            >
              {showMinusSign ? "-" : null} {footerAmt}
            </td>
          </tr>
        </tfoot>
      </table>
      <h3 className="visit">....Visit Again....</h3>
    </div>
  );
};

export default ProductTable;
