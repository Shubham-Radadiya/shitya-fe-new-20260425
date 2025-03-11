import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import moment from "moment";
import { Link, NavLink, useLocation } from "react-router-dom";
import axios from "axios";
import ReactToPrint from "react-to-print";
import {
  ADD_TO_CART,
  REMOVE_FROM_CART,
  CLEAR_CART,
  ADD_TO_UPDATEDCART,
} from "../../../store/cart/cartActionType";
import {
  REQUEST_CREATE_BILL,
  REQUEST_BILL_NO,
  REQUEST_RETURN_BILL,
  REPRINT_BILL,
  RETURN_BILL_NO,
  SET_BILL_NO,
} from "../../../store/bill/billActionType";
import "./index.css";
import { useBill } from "../../../store/bill/reducer";
import PrintBillIndex from "./PrintBillIndex";
import { toast } from "react-toastify";

const Bills = ({ returnMode, setReturnMode }) => {
  const dispatch = useDispatch();

  const items = useSelector((state) => state.cart.items || []);
  const { billNo } = useBill();
  const currentLocation = useLocation();
  const reprintBill = useSelector((state) => state.bill.reprintBill);
  const [reportData, setReportData] = useState(null);
  const [updateBill, setUpdateBill] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [newQuantity, setNewQuantity] = useState("");
  const [reprintModalOpen, setReprintModalOpen] = useState(false);
  const [reprintField, setReprintField] = useState("");
  const [reprintDate, setReprintDate] = useState(moment().format("YYYY-MM-DD"));
  const [showReprintBill, setShowReprintBill] = useState(false);
  const [showPrintBill, setShowPrintBill] = useState(false);
  const componentRef = useRef();
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);

  useEffect(() => {
    dispatch({ type: REQUEST_BILL_NO });
  }, [dispatch]);

  const truncateText = (text, maxLength) => {
    if (text.length > maxLength) {
      return text.substring(0, maxLength) + "..";
    }
    return text;
  };

  const totalQuantity = items.reduce((total, item) => total + item.quantity, 0);
  const totalPrice = items.reduce(
    (total, item) => total + item.quantity * item.price,
    0
  );

  const reprintTotalQuantity = reprintBill?.productId?.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const handlePrintClick = () => {
    if (isButtonDisabled) return;

    setIsButtonDisabled(true);

    // Perform the print operation and set localStorage items
    printDiv(items);
    localStorage.setItem("billData", JSON.stringify(items));
    localStorage.setItem("billId", reportData);
    dispatch({ type: CLEAR_CART });
    // Re-enable the button after a few seconds (e.g., 5 seconds)
    setTimeout(() => {
      setIsButtonDisabled(false); // Re-enable the button
    }, 5000); // Adjust the time as per your requirement
  };

  const printDiv = (items) => {
    const payload = {
      productId: items.map((item) => ({
        _id: item._id,
        quantity: item.quantity,
        price: item.price,
      })),
      totalAmount: totalPrice,
    };

    if (showReprintBill) {
      return null;
    } else {
      if (returnMode) {
        dispatch({
          type: REQUEST_RETURN_BILL,
          payload,
        });
      } else {
        if (updateBill) {
          axios
            .patch(`http://localhost:3010/bill/${inputValue}`, payload)
            .then((response) => {
              toast.success("Bill updated successfully:", response.data);
            })
            .catch((error) => {
              toast.error("Error updating bill:", error);
            });
        } else {
          dispatch({
            type: REQUEST_CREATE_BILL,
            payload,
          });
        }
      }
      setShowPrintBill(true);
    }
  };

  const handleReturnBill = () => {
    dispatch({ type: CLEAR_CART });
    dispatch({ type: RETURN_BILL_NO });
    setReturnMode(true);
  };

  const handleAfterPrint = () => {
    dispatch({ type: CLEAR_CART });
    setShowReprintBill(false);
    setShowPrintBill(false);
    dispatch({ type: REQUEST_BILL_NO });
    setReturnMode(false);
  };

  const openModal = (item) => {
    setCurrentItem(item);
    setNewQuantity(item.quantity);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setCurrentItem(null);
    setNewQuantity("");
  };

  const handleQuantityChange = (e) => {
    setNewQuantity(e.target.value);
  };

  const saveNewQuantity = () => {
    const updatedItem = {
      ...currentItem,
      quantity: Number(newQuantity),
    };

    dispatch({
      type: ADD_TO_UPDATEDCART,
      payload: items.map((item) =>
        item._id === updatedItem._id ? updatedItem : item
      ),
    });
    closeModal();
  };

  const openReprintModal = () => {
    setReprintModalOpen(true);
    setReprintField("");
  };

  const closeReprintModal = () => {
    setReprintModalOpen(false);
    setReprintDate(moment().format("YYYY-MM-DD"));
  };

  const handleReprintSubmit = () => {
    setShowReprintBill(true);
    dispatch({
      type: REPRINT_BILL,
      payload: { billId: reprintField, date: new Date() },
    });
    dispatch({ type: SET_BILL_NO, payload: { billId: reprintField } });
    closeReprintModal();
  };

  useEffect(() => {
    if (reprintField.startsWith("RE")) {
      setReturnMode(true);
    } else {
      setReturnMode(false);
    }
  }, [reprintField]);

  useEffect(() => {
    setShowReprintBill(false);
    setShowPrintBill(false);
  }, [items]);

  const currentDateTime = () => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0"); // getMonth() is zero-indexed
    const year = String(now.getFullYear()).slice(-2); // Last two digits of the year
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");

    return `${day}-${month}-${year} (${hours}:${minutes})`;
  };

  return (
    <div className="bill-container">
      <div className="bills">
        <h3
          className="bill-title"
          style={{
            userSelect: "none",
            color: currentLocation.pathname === "/stock" && "rgb(87 15 119)",
          }}
        >
          Bills
        </h3>

        <div className="Homebuttons">
          <button
            className={
              currentLocation.pathname === "/stock"
                ? "purchase_icon-button"
                : "icon-button"
            }
          >
            <Link
              to={
                currentLocation.pathname === "/stock"
                  ? 
                  "/purchaseReport"
                  // "/demo"
                  : "/report"
              }
              style={{ textDecoration: "none", color: "var(--white-color)" }}
            >
              Report
            </Link>
          </button>
          <button
            className={
              currentLocation.pathname === "/stock"
                ? "purchase_icon-button"
                : "icon-button"
            }
            onClick={() => {
              dispatch({ type: CLEAR_CART });
              setShowReprintBill(false);
              setShowPrintBill(false);
              setReturnMode(false);
            }}
          >
            Reset
          </button>
          <button
            className={
              currentLocation.pathname === "/stock"
                ? "purchase_icon-button"
                : "icon-button"
            }
            onClick={handleReturnBill}
          >
            Return
          </button>
          {/* {items.length > 0 {}} */}
          {items.length || reprintBill?.productId.length > 0 ? (
            <div
              className={`icon-button ${isButtonDisabled ? "disabled" : ""}`}
              onClick={handlePrintClick}
              style={
                isButtonDisabled
                  ? { pointerEvents: "none", opacity: 0.6, userSelect: "none" }
                  : {}
              }
            >
              <ReactToPrint
                trigger={() => (
                  <p style={{ fontSize: "0.82rem", cursor: "pointer" }}>
                    Print Bill
                  </p>
                )}
                content={() => componentRef.current}
                onAfterPrint={handleAfterPrint}
                removeAfterPrint={false}
              />
            </div>
          ) : (
            <p
              className={
                currentLocation.pathname === "/stock"
                  ? "purchase_icon-button"
                  : "icon-button"
              }
              style={{ fontSize: "0.82rem", color: "gray", userSelect: "none" }}
            >
              Print Bill
            </p>
          )}
          <button
            className={
              currentLocation.pathname === "/stock"
                ? "purchase_icon-button"
                : "icon-button"
            }
            onClick={openReprintModal}
          >
            Re Print
          </button>
        </div>

        <div className="bill_index">
          <h4 style={{ textAlign: "center" }}>Jay Swaminarayan</h4>
          <div className="bill_header_sub">
            <h8>Date: {new Date().toLocaleDateString("en-GB")}</h8>
            <h8>Sr.No: {billNo && billNo?.billId}</h8>
          </div>

          {showReprintBill ? (
            <div className="table-container">
              <table className="bill_table">
                <thead>
                  <tr>
                    <th style={{ width: "45px" }}>ID</th>
                    <th style={{ width: "100px" }}>Item</th>
                    <th>Qty</th>
                    <th style={{ fontWeight: "bolder" }}>Amt</th>
                  </tr>
                </thead>
                <tbody>
                  {reprintBill?.productId?.map((product) => (
                    <tr key={product._id._id}>
                      <td
                        style={{ width: "45px", padding: 0 }}
                        title={product._id.productId}
                      >
                        {truncateText(product._id.productId, 8)}
                      </td>
                      <td
                        title={product._id.name}
                        style={{
                          width: "100px",
                          textAlign: "start",
                          padding: 0,
                        }}
                      >
                        {truncateText(product._id.name, 15)}
                      </td>
                      <td style={{ padding: 0 }}>
                        {returnMode
                          ? -new Intl.NumberFormat("en-IN").format(
                              product.quantity
                            )
                          : new Intl.NumberFormat("en-IN").format(
                              product.quantity
                            )}
                      </td>
                      <td style={{ fontWeight: "bolder", padding: 0 }}>
                        {returnMode ? "-" : null}
                        {new Intl.NumberFormat("en-IN").format(
                          product.price * product.quantity
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td
                      style={{
                        fontWeight: "bolder",
                        textAlign: "start",
                        width: "85px",
                      }}
                    >
                     {currentLocation.pathname === "/stock" ? "Total Purchase" : "Total" } 
                    </td>
                    <td></td>
                    <td>
                      {returnMode ? "-" : null}
                      {new Intl.NumberFormat("en-IN").format(
                        reprintTotalQuantity
                      )}
                    </td>
                    <td
                      style={{
                        fontWeight: "bolder",
                        textAlign: "center",
                        textWrap: "nowrap",
                        overflow: "visible  ",
                        textOverflow: "none",
                      }}
                    >
                      ₹ {returnMode ? "-" : null}
                      {new Intl.NumberFormat("en-IN").format(
                        reprintBill?.totalAmount
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
              <h3 className="visit">....Visit Again....</h3>
            </div>
          ) : (
            <div className="table-container">
              <table className="bill_table">
                <thead>
                  <tr>
                    <th style={{ width: "48px" }}>ID</th>
                    <th style={{ width: "100px" }}>Item</th>
                    <th>Qty</th>
                    <th style={{ fontWeight: "bolder" }}>Amt</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length > 0 ? (
                    items.map((product) => (
                      <tr key={product._id}>
                        <td
                          title={product.productId}
                          style={{ width: "48px", padding: 0 }}
                        >
                          {truncateText(product.productId, 8)}
                        </td>
                        <td
                          title={product.name}
                          style={{
                            width: "100px",
                            textAlign: "start",
                            width: "100px",
                            padding: 0,
                          }}
                        >
                          {truncateText(product.name, 15)}
                        </td>
                        <td style={{ padding: 0 }}>
                          <div className="quantity_control">
                            <button
                              onClick={() => {
                                dispatch({
                                  type: ADD_TO_CART,
                                  payload: product,
                                });
                                setShowReprintBill(false);
                              }}
                            >
                              +
                            </button>
                            <span
                              onClick={() => openModal(product)}
                              style={{ cursor: "pointer" }}
                            >
                              {returnMode
                                ? -new Intl.NumberFormat("en-IN").format(
                                    product.quantity
                                  )
                                : new Intl.NumberFormat("en-IN").format(
                                    product.quantity
                                  )}
                            </span>
                            <button
                              onClick={() => {
                                dispatch({
                                  type: REMOVE_FROM_CART,
                                  payload: product._id,
                                });
                                setShowReprintBill(false);
                              }}
                            >
                              -
                            </button>
                          </div>
                        </td>
                        <td
                          style={{
                            fontWeight: "bolder",
                            padding: 0,
                            textAlign: "center",
                            textWrap: "nowrap",
                            overflow: "visible  ",
                            textOverflow: "none",
                          }}
                        >
                          {returnMode ? "-" : null}
                          {new Intl.NumberFormat("en-IN").format(
                            product.price * product.quantity
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="no-data">
                        No Data Available
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot
                  style={{ display: "flex", justifyContent: "flex-start" }}
                >
                  <tr>
                    <td
                      colSpan={2}
                      style={{
                        fontWeight: "bolder",
                        textAlign: "start",
                        width: "140px",
                      }}
                    >
                      {currentLocation.pathname === "/stock" ? "Total Purchase" : "Total" } 
                    </td>
                    <td style={{ fontWeight: "bolder", width: "39px" }}>
                      {returnMode
                        ? -new Intl.NumberFormat("en-IN").format(totalQuantity)
                        : new Intl.NumberFormat("en-IN").format(totalQuantity)}
                    </td>
                    <td
                      style={{
                        fontWeight: "bolder",
                        textAlign: "center",
                        width: "60px",
                        textWrap: "nowrap",
                        overflow: "visible  ",
                        textOverflow: "none",
                      }}
                    >
                      {returnMode ? "-" : null}₹{" "}
                      {new Intl.NumberFormat("en-IN").format(totalPrice)}
                    </td>
                  </tr>
                </tfoot>
              </table>
              <h3 className="visit">....Visit Again....</h3>
            </div>
          )}
        </div>
      </div>
      <div ref={componentRef} className="print-content">
        {/*  */}
        <h1
          style={{
            padding: "11px 0px",
            fontSize: "22px",
            textAlign: "center",
            margin: "0",
            background: "white",
            borderRadius: "0px 25px 0px 0px",
          }}
        >
          Jay Swaminarayan
        </h1>
        <div className="bill_header_sub">
          <p style={{ margin: 0, fontSize: "15px", fontWeight: "bold" }}>
            Date :- {currentDateTime()}
          </p>
          <h8
            style={{
              margin: 0,
              fontSize: "15px",
              fontWeight: "bold",
              paddingRight: "5px",
            }}
          >
            Sr.No: {billNo && billNo?.billId}
          </h8>
        </div>
        <div className="bill_header_main"></div>
        {showReprintBill ? (
          <div
            style={{
              height: "80.5%",
              overflow: "auto",
              padding: "0px 12px",
              background: "white",
              borderRadius: "0px 0px 40px 0px",
            }}
          >
            <hr
              style={{ borderTop: "solid 2px", margin: "5px 0px -2px 0px" }}
            />

            <div
              className="pavti_title_head"
              style={{ height: "24px", alignItems: "center" }}
            >
              <p
                className="pavti_title"
                style={{
                  width: "52px",
                  textAlign: "left",
                  fontWeight: "bold",
                  textAlign: "center",
                  borderRight: "1px solid",
                  justifyContent: "center",
                  height: "24px",
                }}
              >
                ID
              </p>
              <p
                className="pavti_title"
                style={{
                  width: "208px",
                  textAlign: "left",
                  fontWeight: "bold",
                  borderRight: "1px solid",
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "center",
                  height: "24px",
                }}
              >
                Item
              </p>
              <p
                className="pavti_title"
                style={{
                  width: "40px",
                  textAlign: "center",
                  fontWeight: "bold",
                }}
              >
                Qty
              </p>
              <p
                className="pavti_title"
                style={{
                  width: "80px",
                  textAlign: "center",
                  fontWeight: "bold",
                }}
              >
                Amt
              </p>
            </div>
            <hr style={{ borderTop: "solid 1px" }} />
            {reprintBill?.productId?.map((product) => (
              <div key={product._id._id}>
                <div className="pavti_data_1" style={{ width: "380px" }}>
                  <p
                    className="pavti_product_Id_1"
                    style={{
                      textAlign: "left",
                      width: "52px",
                      borderRight: "1px solid",
                      fontSize: "15px",
                    }}
                  >
                    {product._id.productId}
                  </p>
                  <h3
                    className="pavti_product_name_1"
                    style={{
                      width: "208px",
                      borderRight: "1px solid",
                      paddingLeft: "4px",
                      fontSize: "15px",
                    }}
                  >
                    {" "}
                    {product._id.name}
                  </h3>
                  <div className="pavti_data_quantity">
                    <span style={{ fontSize: "15px" }}>
                      {new Intl.NumberFormat("en-IN").format(product.quantity)}
                    </span>
                  </div>
                  <p
                    className="product_price_report"
                    style={{ fontSize: "15px" }}
                  >
                    {new Intl.NumberFormat("en-IN").format(product.price)}
                  </p>
                </div>
              </div>
            ))}

            <hr style={{ borderTop: "solid 1px" }} />
            <hr style={{ borderTop: "solid 1px", margin: "0px" }} />
            <div className="pavti_total" style={{ width: "380px" }}>
              <p
                style={{
                  width: "265px",
                  margin: 0,
                  textAlign: "left",
                  fontWeight: "bold",
                  height: "32px",
                  display: "flex",
                  alignItems: "Center",
                  justifyContent: "center",
                  borderRight: "1px solid",
                }}
              >
                Total
              </p>
              <p
                style={{
                  width: "40px",
                  margin: 0,
                  textAlign: "center",
                  fontWeight: "bold",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {new Intl.NumberFormat("en-IN").format(reprintTotalQuantity)}
              </p>
              <p
                style={{
                  width: "80px",
                  margin: 0,
                  textAlign: "center",
                  fontWeight: "bold",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                }}
              >
                ₹{" "}
                {new Intl.NumberFormat("en-IN").format(
                  reprintBill?.totalAmount
                )}
              </p>
            </div>

            <hr style={{ borderTop: "solid 2px" }} />
            <p className="pavti_footer_text_report">... Visit Again ...</p>
          </div>
        ) : (
          <div
            style={{
              height: "80.5%",
              overflow: "auto",
              padding: "0px 12px",
              background: "white",
              borderRadius: "0px 0px 40px 0px",
            }}
          >
            <hr style={{ borderTop: "solid 2px", margin: "5px 0px 0px 0px" }} />

            <div
              className="pavti_title_head"
              style={{ height: "24px", alignItems: "center", width: "380px" }}
            >
              <p
                className="pavti_title"
                style={{
                  width: "52px",
                  textAlign: "center",
                  fontWeight: "bold",
                  borderRight: "1px solid",
                  height: "26px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ID
              </p>
              <p
                className="pavti_title"
                style={{
                  width: "208px",
                  textAlign: "left",
                  fontWeight: "bold",
                  borderRight: "1px solid",
                  paddingLeft: "4px",
                  height: "26px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                Item
              </p>
              <p
                className="pavti_title"
                style={{
                  width: "40px",
                  textAlign: "center",
                  fontWeight: "bold",
                }}
              >
                Qty
              </p>
              <p
                className="pavti_title"
                style={{
                  width: "80px",
                  textAlign: "center",
                  fontWeight: "bold",
                }}
              >
                Amt
              </p>
            </div>
            <hr style={{ borderTop: "solid 1px" }} />
            {items.length > 0
              ? items.map((product) => (
                  <div key={product._id}>
                    <div className="pavti_data_1" style={{ width: "380px" }}>
                      <p
                        title={product.productId}
                        className="pavti_product_Id_1"
                        style={{
                          textAlign: "left",
                          width: "52px",
                          borderRight: "1px solid",
                          fontSize: "15px",
                        }}
                      >
                        {product.productId}
                      </p>
                      <h3
                        className="pavti_product_name_1"
                        style={{
                          width: "208px",
                          borderRight: "1px solid",
                          paddingLeft: "4px",
                          fontSize: "15px",
                        }}
                      >
                        {" "}
                        {product.name}
                      </h3>
                      <div className="pavti_data_quantity">
                        <span style={{ fontSize: "15px" }}>
                          {new Intl.NumberFormat("en-IN").format(
                            product.quantity
                          )}
                        </span>
                      </div>
                      <p
                        className="product_price_report"
                        style={{ fontSize: "15px", textAlign: "center" }}
                      >
                        {new Intl.NumberFormat("en-IN").format(
                          product.price * product.quantity
                        )}
                      </p>
                    </div>
                  </div>
                ))
              : "no data"}

            <hr style={{ borderTop: "solid 1px" }} />
            <hr style={{ borderTop: "solid 1px", margin: "0px" }} />
            <div
              className="pavti_total"
              style={{ height: "30px", alignItems: "center", width: "380px" }}
            >
              <p
                style={{
                  width: "265px",
                  margin: 0,
                  textAlign: "left",
                  fontWeight: "bold",
                  height: "32px",
                  display: "flex",
                  alignItems: "Center",
                  justifyContent: "center",
                  borderRight: "1px solid",
                }}
              >
                Total
              </p>
              <p
                style={{
                  width: "40px",
                  margin: 0,
                  textAlign: "center",
                  fontWeight: "bold",
                }}
              >
                {new Intl.NumberFormat("en-IN").format(totalQuantity)}
              </p>
              <p
                style={{
                  width: "80px",
                  margin: 0,
                  textAlign: "center",
                  fontWeight: "bold",
                }}
              >
                ₹ {new Intl.NumberFormat("en-IN").format(totalPrice)}
              </p>
            </div>

            <hr style={{ borderTop: "solid 2px" }} />
            <p className="pavti_footer_text_report">... Visit Again ...</p>
          </div>
        )}
      </div>
      {modalOpen && (
        <div className="edit-modal">
          <div className="edit-modal-content">
            <h3 style={{ color: "var(--brown-color)" }}>Edit Quantity</h3>
            <input
              type="number"
              value={newQuantity}
              onChange={handleQuantityChange}
            />
            <div className="flexrow edit-btn">
              <button className="edit-save" onClick={saveNewQuantity}>
                Save
              </button>
              <button className="edit-cancle" onClick={closeModal}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {reprintModalOpen && (
        <div className="edit-modal">
          <div className="edit-modal-content">
            <h3 style={{ color: "var(--brown-color)" }}>Reprint Bill</h3>
            <input
              type="text"
              value={reprintField}
              onChange={(e) => setReprintField(e.target.value)}
              placeholder="Enter Bill ID"
            />
            <div className="flexrow edit-btn">
              <button className="edit-save" onClick={handleReprintSubmit}>
                Submit
              </button>
              <button className="edit-cancle" onClick={closeReprintModal}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bills;
