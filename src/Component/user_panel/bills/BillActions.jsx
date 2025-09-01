import React from "react";

const BillActions = ({
  currentLocation,
  isButtonDisabled,
  onReset,
  onReturnClick,
  onPrintClick,
  onOpenReprint,
  itemsLength,
  bhetItemsLength,
  purchaseItemsLength,
}) => {
  const isStock = currentLocation.pathname === "/stock";
  const isBhet = currentLocation.pathname === "/bhet";

  const PrintButton = ({ disabled, label }) =>
    disabled ? (
      <p
        className={isStock ? "purchase_icon-button" : isBhet ? "bhet_icon-button" : "icon-button"}
        style={{ fontSize: "0.82rem", color: "gray", userSelect: "none" }}
      >
        {label}
      </p>
    ) : (
      <div
        className={`${isStock ? "purchase_icon-button" : isBhet ? "bhet_icon-button" : "icon-button"} ${
          isButtonDisabled ? "disabled" : ""
        }`}
        onClick={onPrintClick}
        style={isButtonDisabled ? { pointerEvents: "none", opacity: 0.6, userSelect: "none" } : {}}
      >
        {label}
      </div>
    );

  return (
    <div className="Homebuttons">
      <button
        className={isStock ? "purchase_icon-button" : isBhet ? "bhet_icon-button" : "icon-button"}
        onClick={onReset}
      >
        Reset
      </button>

      <button
        className={isStock ? "purchase_icon-button" : isBhet ? "bhet_icon-button" : "icon-button"}
        onClick={onReturnClick}
      >
        Return
      </button>

      {isStock ? (
        <PrintButton
          disabled={purchaseItemsLength <= 0}
          label="Print Invoice"
        />
      ) : isBhet ? (
        <PrintButton
          disabled={bhetItemsLength <= 0}
          label="Print bhet"
        />
      ) : (
        <PrintButton
          disabled={itemsLength <= 0}
          label="Print Bill"
        />
      )}

      {!isBhet && (
        <button
          className={isStock ? "purchase_icon-button" : "icon-button"}
          onClick={onOpenReprint}
        >
          Re Print
        </button>
      )}
    </div>
  );
};

export default BillActions;
