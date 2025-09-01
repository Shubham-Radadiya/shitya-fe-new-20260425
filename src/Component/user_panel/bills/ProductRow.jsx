import React from "react";
import { formatIN, getEffectivePrice } from "./utils";

const ProductRow = ({
  product,
  returnMode,
  customPrices,
  onIncrement,
  onDecrement,
  onOpenQtyModal,
  onCustomPriceChange,
}) => {
  const effectivePrice = getEffectivePrice(product, customPrices);

  return (
    <tr key={product._id}>
      <td title={product.productId} style={{ width: 48, padding: 0 }}>
        {String(product.productId || "").slice(0, 8)}
      </td>

      <td title={product.name} style={{ width: 100, padding: 0 }}>
        {String(product.name || "").slice(0, 15)}
        {String(product.name || "").length > 15 ? ".." : ""}
      </td>

      <td style={{ padding: 0 }}>
        <div className="quantity_control">
          <button onClick={() => onIncrement(product)}>+</button>

          <span
            onClick={() => onOpenQtyModal(product)}
            style={{ cursor: "pointer" }}
            title="Edit quantity"
          >
            {returnMode ? "-" : ""}
            {formatIN(product.quantity)}
          </span>

          <button onClick={() => onDecrement(product)}>-</button>
        </div>
      </td>

      {/* Amount / Price column */}
      <td style={{ fontWeight: "bolder", textAlign: "center", padding: 0 }}>
        {product.priceType === "CUSTOM" ? (
          <input
            type="number"
            placeholder="Enter Amt"
            value={
              customPrices[product._id] !== undefined
                ? customPrices[product._id] || ""
                : product.price || ""
            }
            style={{
              width: 70,
              textAlign: "right",
              fontWeight: "bold",
              marginBottom: 4,
            }}
            onChange={(e) => {
              const val = e.target.value;
              const numericVal = val === "" ? 0 : Number(val);
              onCustomPriceChange(product, numericVal);
            }}
          />
        ) : (
          <>
            {returnMode ? "-" : null}
            {formatIN(effectivePrice * Number(product.quantity || 0))}
          </>
        )}
      </td>
    </tr>
  );
};

export default ProductRow;
