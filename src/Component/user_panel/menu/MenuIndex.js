  import React, { useEffect, useRef, useState } from "react";
  import "./index.css";
  import { useDispatch, useSelector } from "react-redux";
  import { REQUEST_CATEGORY } from "../../../store/category/categoryActionType";
  import { LOGOUT_REQUEST } from "../../../store/auth/AuthAction";
  import img2 from "../../images/raja_home.png";
  import upload from "../../images/upload.png";
  import { CgLogOut } from "react-icons/cg";
  import { useLocation } from "react-router-dom";
  import { REQUEST_USER_EXCEL } from "../../../store/excel/excelAction";
  import ReactToPrint from "react-to-print";
import { fetchInvoiceNumber } from "../../../store/invoice/InvoiceAction";

  const Menu = ({ updateName, sendData, setSelectedCategory }) => {
    const dispatch = useDispatch();
    const [initialized, setInitialized] = useState(false);
    const [click, setClick] = useState("");
    const currentLocation = useLocation();
    const componentRefPurchase = useRef(null);
    const excelResponse = useSelector(
      (state) => state.excel.excelResponse || null
    );
    const [responseData, setResponseData] = useState(null);
    const categories = useSelector((state) => state.category.categories);
    const [isFileUploaded, setIsFileUploaded] = useState(false);
    const printRef = useRef(null);

    useEffect(() => {
      if (!initialized) {
        dispatch({ type: REQUEST_CATEGORY });
        setInitialized(true);
      }
    }, [dispatch, initialized]);

    useEffect(() => {
      if (categories?.length > 0 && !click) {
        setClick(categories[0].name);
        updateName(categories[0].name);
        sendData(categories[0]);
        setSelectedCategory(categories[0]);
      }
    }, [categories, click, updateName, sendData, setSelectedCategory]);

    const handleClick = (item) => {
      setClick(item.name);
      updateName(item.name);
      sendData(item);
      setSelectedCategory(item);
    };

    const handleLogout = () => {
      dispatch({ type: LOGOUT_REQUEST });
    };

    const handleFileChange = (event) => {
      const file = event.target.files[0];
      if (file) {
        event.target.value = null;
        const formData = new FormData();
        formData.append("excelFile", file);
        dispatch({ type: REQUEST_USER_EXCEL, payload: { data: formData } });

        setTimeout(() => {
          setIsFileUploaded(true);
        }, 100);
      }
    };

    useEffect(() => {
      if (
        currentLocation.pathname === "/stock" &&
        excelResponse &&
        isFileUploaded
      ) {
        console.log("Excel Response Received:", excelResponse);
        setResponseData(excelResponse);
        setTimeout(() => {
          if (printRef.current) {
            printRef.current.handlePrint();
             dispatch(fetchInvoiceNumber(false));
          }
        }, 500);
      }
    }, [excelResponse, currentLocation.pathname, isFileUploaded]);

    const reprintTotalQuantity = responseData?.productId?.reduce(
      (total, item) => total + item.quantity,
      0
    );

    useEffect(() => {
      console.log(responseData, "responseData");
      console.log(isFileUploaded, "isFileUploaded");
    }, [responseData, isFileUploaded]);

    return (
      <div className="menu-container">
        <div className="menu_list">
          <div className="menu_icon">
            <img src={img2} alt="Menu Logo" className="raja-home" />
          </div>
          <div className="menu_box">
            <div className="menu_lists">
              {categories &&
                categories.map((item, id) => (
                  <div
                    className={
                      currentLocation.pathname === "/stock"
                        ? `purchase_category_name ${
                            item.name === click ? "active" : ""
                          }`
                        : currentLocation.pathname === "/bhet"
                        ? `bhet_category_name ${
                            item.name === click ? "active" : ""
                          }`
                        : `category_name ${item.name === click ? "active" : ""}`
                    }
                    key={id}
                    onClick={() => handleClick(item)}
                  >
                    <strong style={{ userSelect: "none" }}>{item.name}</strong>
                  </div>
                ))}
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                gap: "5px",
              }}
            >
              {currentLocation.pathname === "/stock" && (
                <label className="purchase-file-upload">
                  <img
                    src={upload}
                    alt="Upload File"
                    style={{ width: "30px", cursor: "pointer" }}
                  />
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".xls,.xlsx,.csv"
                  />
                </label>
              )}
              <button
                className="logout_button"
                onClick={handleLogout}
                style={{
                  background:
                    currentLocation.pathname === "/stock"
                      ? "rgb(87 15 119)"
                      : currentLocation.pathname === "/bhet"
                      ? "rgb(34 78 8)"
                      : "rgb(97, 37, 17)",
                }}
              >
                <CgLogOut style={{ fontSize: "1rem" }} />
                Logout
              </button>
            </div>
          </div>
        </div>
        <ReactToPrint
          trigger={() => <button style={{ display: "none" }}>Print</button>}
          content={() => componentRefPurchase.current}
          onAfterPrint={() => {
            console.log("Print completed!");
            setIsFileUploaded(false);
          }}
          ref={(el) => (printRef.current = el)}
        />
        <div ref={componentRefPurchase} className="print-content">
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
              Date :- {new Date().toLocaleString()}
            </p>
            <h8
              style={{
                margin: 0,
                fontSize: "15px",
                fontWeight: "bold",
                paddingRight: "5px",
              }}
            >
              {`INV.No: ${responseData?.invoiceId || "N/A"}`}
            </h8>
          </div>
          {responseData?.productId?.length > 0 ? (
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
              {responseData.productId.map((product) => (
                <div key={product.id}>
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
                      {product.productName}
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
            </div>
          ) : (
            <p>No products found</p>
          )}
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
              {" "}
              {new Intl.NumberFormat("en-IN").format(responseData?.totalAmount)}
            </p>
          </div>
          <hr style={{ borderTop: "solid 2px" }} />
          <p className="pavti_footer_text_report">... Visit Again ...</p>
        </div>
      </div>
    );
  };

  export default Menu;
