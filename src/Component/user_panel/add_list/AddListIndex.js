import React from "react";
import { useDispatch } from "react-redux";
import {
  ADD_TO_BHET_CART,
  ADD_TO_CART,
  ADD_TO_PURCHASE_CART,
} from "../../../store/cart/cartActionType";
import "./index.css";
import { useLocation } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { formatInr } from "../../../utils/formatInr";

const AddList = ({
  main,
  selectedSubCategoryId,
  setShowReprintBill,
  newState,
}) => {
  const dispatch = useDispatch();
  const currentLocation = useLocation();

  const handleAddToCart = (product) => {
    if (product.isDeActive) return;

    let productToAdd = { ...product };

  if (product.priceType === "CUSTOM") {
    if (!productToAdd.uniqueKey) {
      productToAdd.uniqueKey = uuidv4(); // generate once
    }
    productToAdd.quantity = 1;
  }

  const actionType =
    currentLocation.pathname === "/stock"
      ? ADD_TO_PURCHASE_CART
      : currentLocation.pathname === "/bhet"
      ? ADD_TO_BHET_CART
      : ADD_TO_CART;

  dispatch({ type: actionType, payload: productToAdd });
  setShowReprintBill(false);
};


  function sortBySubId(a, b) {
    return a.productId - b.productId;
  }

  const allProducts = main.subCategory.flatMap(
    (sub) => sub.products?.sort(sortBySubId) || []
  );

  const filteredProducts = selectedSubCategoryId
    ? main.subCategory
        ?.filter((sub) => sub._id === selectedSubCategoryId)
        .flatMap((sub) => sub.products?.sort(sortBySubId) || [])
    : allProducts;

  const truncateText = (text, maxLength) => {
    if (text.length > maxLength) {
      return text.substring(0, maxLength) + "...";
    }
    return text;
  };

  function sortById(a, b) {
    if (a.productId > b.productId) {
      return 1;
    }
    if (a.productId < b.productId) {
      return -1;
    }
    return 0;
  }

  /* Active products first, deactive at the bottom; within each group sort by productId */
  function sortActiveFirstThenById(a, b) {
    const aDeactive = !!a.isDeActive;
    const bDeactive = !!b.isDeActive;
    if (aDeactive !== bDeactive) return aDeactive ? 1 : -1;
    return sortById(a, b);
  }

  return (
    <div className="add-list-container">
      <div className="product-grid">
        {newState
          ? allProducts.sort(sortActiveFirstThenById).map((product, index) => (
              <div
                className={`product-box ${product.isDeActive ? "product-box--deactive" : ""}`}
                key={index}
                onClick={() => handleAddToCart(product)}
              >
                {product.isDeActive && <div className="deactive-overlay" />}
                <p
                  className="product-price"
                  style={{
                    userSelect: "none",
                    color:
                      currentLocation.pathname === "/stock" &&
                      "rgb(113, 48, 142)",
                    borderBottom:
                      currentLocation.pathname === "/stock" &&
                      "1px solid rgb(113, 48, 142)",
                    background:
                      currentLocation.pathname === "/stock"
                        ? "rgb(206 169 223 / 48%)"
                        : currentLocation.pathname === "/bhet"
                        ? "rgb(34 78 8)"
                        : "rgb(97, 37, 17)",
                    width: "102px",
                    display: "inline-block",
                  }}
                >
                  {product.priceType === "CUSTOM"
                    ? "\u00A0"
                    : new Intl.NumberFormat("en-IN").format(product.price)}
                </p>
                <div>
                  <div className="product-name" style={{ userSelect: "none" }}>
                    <p
                      title={product.name}
                      style={{
                        fontSize: product.name.length > 14 ? "14px" : "inherit",
                      }}
                    >
                      {product.name}
                    </p>
                  </div>
                  <p
                    className="product-id"
                    title={product.productId}
                    style={{ userSelect: "none" }}
                  >
                    {truncateText(product.productId, 10)}
                  </p>
                </div>
              </div>
            ))
          : filteredProducts?.sort(sortActiveFirstThenById).map((product, index) => (
              <div
                className={`product-box ${product.isDeActive ? "product-box--deactive" : ""}`}
                style={{
                  border:
                    currentLocation.pathname === "/stock"
                      ? "1px solid rgb(113, 48, 142)"
                      : currentLocation.pathname === "/bhet"
                      ? "1px solid rgb(34, 78, 8)"
                      : "1px solid rgb(97, 37, 17)",
                }}
                key={index}
                onClick={() => handleAddToCart(product)}
              >
                {product.isDeActive && <div className="deactive-overlay" />}
                <p
                  className="product-price"
                  style={{
                    userSelect: "none",
                    color:
                      currentLocation.pathname === "/stock"
                        ? "rgb(113, 48, 142)"
                        : currentLocation.pathname === "/bhet"
                        ? "rgb(34, 78, 8)"
                        : "rgb(97, 37, 17)",
                    borderBottom:
                      currentLocation.pathname === "/stock"
                        ? "1px solid rgb(113, 48, 142)"
                        : currentLocation.pathname === "/bhet"
                        ? "1px solid rgb(34, 78, 8)"
                        : "1px solid rgb(97, 37, 17)",
                    background:
                      currentLocation.pathname === "/stock"
                        ? "rgb(206 169 223 / 25%)"
                        : currentLocation.pathname === "/bhet"
                        ? "rgb(34 78 8 / 25%)"
                        : "rgb(198 129 106 / 25%)",
                    width: "102px",
                    display: "inline-block",
                  }}
                >
                  {product.priceType === "CUSTOM"
                    ? "\u00A0" // hide for custom
                    : `₹ ${formatInr(product.price, {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2,
                      })}`}
                </p>
                <div>
                  <div
                    className="product-name"
                    style={{
                      userSelect: "none",
                      color:
                        currentLocation.pathname === "/stock"
                          ? "rgb(113 48 142)"
                          : currentLocation.pathname === "/bhet"
                          ? "rgb(34 78 8)"
                          : "rgb(97, 37, 17)",
                      background:
                        currentLocation.pathname === "/bhet" &&
                        "rgb(34 78 8 / 2%)",
                    }}
                  >
                    <p
                      title={product.name}
                      style={{
                        fontSize: product.name.length > 18 ? "14px" : "inherit",
                      }}
                    >
                      {product.name}
                    </p>
                  </div>
                  <p
                    className="product-id"
                    title={product.productId}
                    style={{
                      userSelect: "none",
                      color: "white",
                      borderTop:
                        currentLocation.pathname === "/stock"
                          ? "1px solid rgb(113, 48, 142)"
                          : currentLocation.pathname === "/bhet"
                          ? "1px solid rgb(34, 78, 8)"
                          : "1px solid rgb(97, 37, 17)",
                      background:
                        currentLocation.pathname === "/stock"
                          ? "rgb(113, 48, 142)"
                          : currentLocation.pathname === "/bhet"
                          ? "rgb(34, 78, 8)"
                          : "rgb(97, 37, 17)",
                    }}
                  >
                    {truncateText(product.productId, 10)}
                  </p>
                </div>
              </div>
            ))}
      </div>
    </div>
  );
};

export default AddList;
