import React from "react";
import { useDispatch } from "react-redux";
import {
  ADD_TO_BHET_CART,
  ADD_TO_CART,
  ADD_TO_PURCHASE_CART,
} from "../../../store/cart/cartActionType";
import "./index.css";
import { useLocation } from "react-router-dom";

const AddList = ({
  main,
  selectedSubCategoryId,
  setShowReprintBill,
  newState,
}) => {
  const dispatch = useDispatch();
  const currentLocation = useLocation();
  const handleAddToCart = (product) => {
    if (currentLocation.pathname === "/stock") {
      dispatch({ type: ADD_TO_PURCHASE_CART, payload: product });
    } else if(currentLocation.pathname === "/bhet"){
      dispatch({ type: ADD_TO_BHET_CART, payload: product });
    } else {
      dispatch({ type: ADD_TO_CART, payload: product });
    }
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

  return (
    <div className="add-list-container">
      <div className="product-grid">
        {newState
          ? allProducts.sort(sortById).map((product, index) => (
              <div
                className="product-box"
                key={index}
                onClick={() => handleAddToCart(product)}
              >
                <p
                  className="product-price"
                  style={{
                    userSelect: "none",
                    background:
                      currentLocation.pathname === "/stock" ? "rgb(113 48 142)" : currentLocation.pathname === "/bhet" ? "rgb(34 78 8)" : "rgb(97, 37, 17)" ,
                  }}
                >
                  {new Intl.NumberFormat("en-IN").format(product.price)}
                </p>
                <div>
                  <div className="product-name" style={{ userSelect: "none"}}>
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
          : filteredProducts?.sort(sortById).map((product, index) => (
              <div
                className="product-box"
                key={index}
                onClick={() => handleAddToCart(product)}
              >
                <p
                  className="product-price"
                  style={{
                    userSelect: "none",
                    background:
                    currentLocation.pathname === "/stock" ? "rgb(113 48 142)" : currentLocation.pathname === "/bhet" ? "rgb(34 78 8)" : "rgb(97, 37, 17)",
                  }}
                >
                  ₹ {new Intl.NumberFormat("en-IN").format(product.price)}
                </p>
                <div>
                  <div
                    className="product-name"
                    style={{
                      userSelect: "none",
                      color:
                        currentLocation.pathname === "/stock" ? "rgb(113 48 142)" : currentLocation.pathname === "/bhet" ? "rgb(34 78 8)" : "rgb(97, 37, 17)",
                         background:currentLocation.pathname === "/bhet" && "rgb(34 78 8 / 2%)"
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
                      background:
                        currentLocation.pathname === "/stock" ? "rgb(113 48 142)" : currentLocation.pathname === "/bhet" ? "rgb(34 78 8)" : "rgb(97, 37, 17)"
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
