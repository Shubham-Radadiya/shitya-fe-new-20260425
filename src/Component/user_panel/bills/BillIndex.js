import React, { useEffect, useState, useRef, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import ReactToPrint, { useReactToPrint } from "react-to-print";
import notes from "../../images/notes.png";
import {
  CLEAR_CART,
  ADD_TO_UPDATEDCART,
  ADD_TO_PURCHASE_CART,
  REMOVE_FROM_PURCHASE_CART,
  CLEAR_PURCHASE_CART,
  CLEAR_BHET_CART,
  ADD_TO_CART,
  ADD_TO_UPDATEPURCHASECART,
  ADD_TO_BHET_CART,
  REMOVE_FROM_BHET_CART,
  REMOVE_FROM_CART,
  ADD_TO_UPDATEBHETCART,
} from "../../../store/cart/cartActionType";
import {
  REQUEST_CREATE_BILL,
  REQUEST_BILL_NO,
  REQUEST_RETURN_BILL,
  REPRINT_BILL,
  RETURN_BILL_NO,
  SET_BILL_NO,
  REQUEST_BHET_BILL_NO,
  RETURN_BHET_BILL_NO,
} from "../../../store/bill/billActionType";
import "./index.css";
import { useBill } from "../../../store/bill/reducer";
import {
  REQUEST_CREATE_BHET,
  REQUEST_CREATE_INVOICE,
  REQUEST_CREATE_RETURN_BHET,
  REQUEST_CREATE_RETURN_INVOICE,
  REQUEST_EDIT_INVOICE_DATA,
  REQUEST_RETURN_BHET,
  REQUEST_RETURN_PURCHASE,
} from "../../../store/invoice/InvoiceAction";
import NotesComponent from "../notes/Notes";
import { fetchInvoiceNumber } from "../../../store/invoice/InvoiceAction";
import {
  buildPrintDocumentTitle,
  getPrintTitleForBillScreen,
} from "../../../utils/salesPrintFilename";
import { useStoreSettings } from "../../../context/StoreSettingsContext";

const pinGateTitle = (gate) => {
  if (!gate) return "";
  if (gate.type === "navigate") {
    if (gate.screen === "stock") return "Purchase";
    if (gate.screen === "bhet") return "Bhet";
    return gate.screen;
  }
  return gate.isBhet ? "Bhet return" : "Purchase return";
};

/** PIN modal accent: purchase (/stock) = purple, bhet = green */
const pinPromptThemeClass = (gate) => {
  if (!gate) return "";
  if (gate.type === "navigate") {
    if (gate.screen === "bhet") return "pin-prompt--bhet";
    if (gate.screen === "stock") return "pin-prompt--purchase";
    return "";
  }
  if (gate.type === "return") {
    return gate.isBhet ? "pin-prompt--bhet" : "pin-prompt--purchase";
  }
  return "";
};

const Bills = ({ returnMode, setReturnMode }) => {
  const dispatch = useDispatch();
  const items = useSelector((state) => state.cart.items || []);
  const purchaseItems = useSelector((state) => state.cart.purchaseItems || []);
  const bhetItems = useSelector((state) => state.cart.bhetItems || []);
  const bhetNo = useSelector((state) => state.bill || []);
  const { billNo } = useBill();
  const currentLocation = useLocation();
  const reprintBill = useSelector((state) => state.bill.reprintBill);
  const excelBill = useSelector((state) => state.excel.excelResponse);
  const invoiceN = useSelector((state) => state.invoice.invoiceNumber);
  const [reportData] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [newQuantity, setNewQuantity] = useState("");
  const [reprintModalOpen, setReprintModalOpen] = useState(false);
  const [reprintField, setReprintField] = useState("");
  const [showReprintBill, setShowReprintBill] = useState(false);
  const componentRef = useRef();
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [bhetNumber, setBhetNumber] = useState("");
  const [billNumber, setBillNumber] = useState("");
  const [purchaseLabel, setPurchaseLabel] = useState("Total Purchase");
  const [showExcelTable, setShowExcelTable] = useState(false);
  const printRef = useRef();
  const { entryPin: entryPinFromSettings } = useStoreSettings();
  const effectiveEntryPin = (entryPinFromSettings || "").trim();
  const [pin, setPin] = useState("");
  /** null | { type: 'navigate', screen } | { type: 'return', isBhet } */
  const [pinGate, setPinGate] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotes, setShowNotes] = useState(false);
  const [isReturnMode, setIsReturnMode] = useState(false);
  const [customPrices, setCustomPrices] = useState({});
  const [totalPrice, setTotalPrice] = useState(0);
  const [totalPurchaseprice, setTotalPurchasePrice] = useState(0);
  const [totalBhetprice, setTotalBhetPrice] = useState(0);

  const handlePinChange = (e) => {
    setPin(e.target.value);
  };

  const toNum = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const handleButtonClick = (screen) => {
    if (location.pathname === `/${screen}`) return;
    if (!effectiveEntryPin) {
      navigate(`/${screen}`);
      return;
    }
    setPin("");
    setPinGate({ type: "navigate", screen });
  };
  useEffect(() => {
    if (currentLocation.pathname === "/bhet") {
      dispatch({ type: REQUEST_BHET_BILL_NO });
    }
  }, [currentLocation.pathname, dispatch]);

  useEffect(() => {
    console.log(customPrices, "customPrices");
  }, [customPrices]);

  useEffect(() => {
    if (currentLocation.pathname === "/bhet") {
      setBhetNumber(billNo?.bhetNo);
    } else if (currentLocation.pathname === "/dashboard") {
      setBillNumber(billNo?.billId);
    } else {
      // handle the "not ID" case here, if needed
      console.log("not ID");
    }

    console.log(billNumber, "billNumber");

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bhetNo, currentLocation.pathname, bhetNumber, billNumber]);
  useEffect(() => {
    document.querySelectorAll("input").forEach((input) => {
      input.setAttribute("autocomplete", "off");
      input.setAttribute(
        "name",
        "random-" + Math.random().toString(36).substr(2, 10)
      );
    });
  }, []);

  useEffect(() => {
    if (currentLocation.pathname === "/dashboard") {
      dispatch({ type: REQUEST_BILL_NO });
    }
  }, [currentLocation.pathname, dispatch]);

  const truncateText = (text, maxLength) => {
    if (typeof text !== "string") {
      return "";
    }

    if (text.length > maxLength) {
      return text.substring(0, maxLength) + "..";
    }
    return text;
  };

  const totalQuantity = items.reduce((total, item) => total + item.quantity, 0);
  const totalPurchaseQuantity = purchaseItems.reduce(
    (total, item) => total + item.quantity,
    0
  );
  const totalBhetQuantity = bhetItems.reduce(
    (total, item) => total + item.quantity,
    0
  );
  const priceOf = (p) => {
    const key = p.uniqueKey || p._id; 
    if (currentLocation.pathname === "/stock" && currentLocation.state?.edit) {
      return toNum(p.price);
    }
  
    if (p.priceType === "FIXED") return toNum(p.price);
    if (customPrices[key] !== undefined && customPrices[key] !== "") {
      return toNum(customPrices[key]);
    }
    if (p.price > 0) return toNum(p.price);
    return 0;
  };
  const qtyOf = (p) => toNum(p.quantity);
  const line = (p) => priceOf(p) * qtyOf(p);
  const calcTotal = (arr = [], customPrices = {}, isPurchase = false) => {
    if (isPurchase && currentLocation.pathname === "/stock" && currentLocation.state?.edit) {
      return arr.reduce((sum, p) => sum + toNum(p.price) * toNum(p.quantity), 0);
    }
    return arr.reduce((sum, p, idx) => {
      const key = p.uniqueKey || `${p._id}-${idx}`;
      const price =
        p.priceType === "FIXED"
          ? toNum(p.price)
          : customPrices[key] !== undefined && customPrices[key] !== ""
          ? toNum(customPrices[key])
          : 0;
      return sum + price * toNum(p.quantity);
    }, 0);
  };
  
  useEffect(() => {
    setTotalPrice(calcTotal(items, customPrices));
    setTotalPurchasePrice(calcTotal(purchaseItems, customPrices, true)); // ✅ pass true for purchaseItems
    setTotalBhetPrice(calcTotal(bhetItems, customPrices));
  }, [items, purchaseItems, bhetItems, customPrices, currentLocation]);
  

  const reprintTotalQuantity = reprintBill?.productId?.reduce(
    (total, item) => total + item.quantity,
    0
  );
  const excelPrintDocumentTitle = useMemo(
    () =>
      buildPrintDocumentTitle(
        "excel",
        `${Date.now().toString(36)}`,
        new Date()
      ),
    [excelBill]
  );

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: excelPrintDocumentTitle,
  });
  useEffect(() => {
    if (excelBill && excelBill.length > 0) {
      setShowExcelTable(true);

      handlePrint();
    }
  }, [excelBill]);

  const handlePrintClick = () => {
    if (isButtonDisabled) return;

    setIsButtonDisabled(true);

    printDiv(
      currentLocation.pathname === "/stock"
        ? purchaseItems
        : currentLocation.pathname === "/bhet"
        ? bhetItems
        : items
    );

    localStorage.setItem("billData", JSON.stringify(items));
    localStorage.setItem("billId", reportData);

    dispatch({
      type:
        currentLocation.pathname === "/stock"
          ? CLEAR_PURCHASE_CART
          : currentLocation.pathname === "/bhet"
          ? CLEAR_BHET_CART
          : CLEAR_CART,
    });

    setPurchaseLabel("Total Purchase");

    // Update state returnEdit to false
    if (
      currentLocation.pathname === "/stock" &&
      currentLocation.state?.returnEdit
    ) {
      navigate("/stock", {
        state: { ...currentLocation.state, returnEdit: false },
        replace: true, // Prevents pushing a new entry in history
      });
    }

    setTimeout(() => {
      setIsButtonDisabled(false);
    }, 5000);
  };

  const renderTable = () => (
    <div ref={printRef} className="p-4 border rounded bg-white">
      <h2 className="text-lg font-bold mb-2">Excel Bill</h2>
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-200">
            <th className="border border-gray-300 p-2">Product ID</th>
            <th className="border border-gray-300 p-2">Product Name</th>
            <th className="border border-gray-300 p-2">Quantity</th>
            <th className="border border-gray-300 p-2">Price</th>
          </tr>
        </thead>
        <tbody>
          {excelBill?.map((item) => (
            <tr key={item._id} className="text-center">
              <td className="border border-gray-300 p-2">{item.productId}</td>
              <td className="border border-gray-300 p-2">{item.productName}</td>
              <td className="border border-gray-300 p-2">{item.quantity}</td>
              <td className="border border-gray-300 p-2">{item.price}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
  const generateProfessionalId = () => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const hh = String(now.getHours()).padStart(2, "0");
    const min = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");
  
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  
    return `CP-${yyyy}${mm}${dd}-${hh}${min}${ss}-${rand}`;
  };
  const printDiv = (list) => {
    const payload = {
      productId: list.map((item, idx) => {
        const key = item.uniqueKey || `${item._id}-${idx}`;
        const price =
          item.priceType === "FIXED"
            ? toNum(item.price)
            : customPrices[key] !== undefined && customPrices[key] !== ""
            ? toNum(customPrices[key])
            : 0;

        return {
          _id: item._id,
          quantity: toNum(item.quantity),
          price,
          customProductId: item.customProductId || generateProfessionalId()
        };
      }),
      totalAmount:
        currentLocation.pathname === "/stock"
          ? totalPurchaseprice
          : currentLocation.pathname === "/bhet"
          ? totalBhetprice
          : totalPrice,
    };

    if (showReprintBill) return;

    if (returnMode) {
      dispatch({
        type:
          currentLocation.pathname === "/stock"
            ? REQUEST_RETURN_PURCHASE
            : currentLocation.pathname === "/bhet"
            ? REQUEST_RETURN_BHET
            : REQUEST_RETURN_BILL,
        payload,
      });
    } else {
      if (
        currentLocation.pathname === "/stock" &&
        currentLocation.state?.edit
      ) {
        dispatch({
          type: REQUEST_EDIT_INVOICE_DATA,
          payload,
          id: currentLocation.state?.id,
        });
      } else if (
        currentLocation.pathname === "/stock" &&
        currentLocation.state?.returnEdit
      ) {
        dispatch({
          type: REQUEST_CREATE_RETURN_INVOICE,
          payload,
          id: currentLocation.state?.id,
        });
      } else if (
        currentLocation.pathname === "/bhet" &&
        currentLocation.state?.returnEdit
      ) {
        dispatch({
          type: REQUEST_CREATE_RETURN_BHET,
          payload,
          id: currentLocation.state?.id,
        });
      } else {
        dispatch({
          type:
            currentLocation.pathname === "/stock"
              ? REQUEST_CREATE_INVOICE
              : currentLocation.pathname === "/bhet"
              ? REQUEST_CREATE_BHET
              : REQUEST_CREATE_BILL,
          payload,
        });
      }
    }
  };

  const handleAfterPrint = async () => {
    dispatch({ type: CLEAR_CART });
    setShowReprintBill(false);
    setIsReturnMode(false);
    setCustomPrices({});

    currentLocation.pathname === "/bhet"
      ? dispatch({ type: REQUEST_BHET_BILL_NO })
      : dispatch({ type: REQUEST_BILL_NO });

    setReturnMode(false);
    dispatch(fetchInvoiceNumber(false));

    currentLocation.pathname === "/bhet"
      ? setBhetNumber(bhetNo?.bhetNo)
      : setInvoiceNumber(invoiceN);
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
    if (currentLocation.pathname === "/stock") {
      dispatch({
        type: ADD_TO_UPDATEPURCHASECART,
        payload: purchaseItems.map((item) =>
          item._id === updatedItem._id ? updatedItem : item
        ),
      });
    } else if (currentLocation.pathname === "/bhet") {
      dispatch({
        type: ADD_TO_UPDATEBHETCART,
        payload: bhetItems.map((item) =>
          item._id === updatedItem._id ? updatedItem : item
        ),
      });
    } else {
      dispatch({
        type: ADD_TO_UPDATEDCART,
        payload: items.map((item) =>
          item._id === updatedItem._id ? updatedItem : item
        ),
      });
    }
    closeModal();
  };

  const openReprintModal = () => {
    setReprintModalOpen(true);
    setReprintField("");
  };

  const closeReprintModal = () => {
    setReprintModalOpen(false);
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
  }, [items]);

  const currentDateTime = () => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = String(now.getFullYear()).slice(-2);
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");

    return `${day}-${month}-${year} (${hours}:${minutes})`;
  };

  const [invoiceNumber, setInvoiceNumber] = useState("");

  const billPrintDocumentTitle = useMemo(
    () =>
      getPrintTitleForBillScreen({
        pathname: currentLocation.pathname,
        billNumber,
        invoiceNumber,
        bhetNumber,
        showReprintBill,
        reprintBill,
      }),
    [
      currentLocation.pathname,
      billNumber,
      invoiceNumber,
      bhetNumber,
      showReprintBill,
      reprintBill,
    ]
  );

  // useEffect(() => {
  //   console.log(invoiceNumber, invoiceN, "invoiceNumber");
  // }, [invoiceNumber, invoiceN]);

  useEffect(() => {
    if (
      currentLocation.pathname === "/stock" &&
      currentLocation.state?.invoiceId
    ) {
      setInvoiceNumber(currentLocation.state.invoiceId);
    } else {
      const fetchData = async () => {
        if (isReturnMode) {
          dispatch(fetchInvoiceNumber(true));
          setInvoiceNumber(`R${invoiceN}`);
        } else {
          dispatch(fetchInvoiceNumber(false));
          setInvoiceNumber(invoiceN);
        }
      };
      fetchData();
    }
  }, [invoiceN, currentLocation, isReturnMode]);

  const handleReturnBill = async () => {
    setIsReturnMode(true);
    dispatch({ type: CLEAR_CART });
    dispatch({
      type:
        currentLocation.pathname === "/bhet"
          ? RETURN_BHET_BILL_NO
          : RETURN_BILL_NO,
    });
    setReturnMode(true);

    setInvoiceNumber(`R${invoiceN}`);
    setPurchaseLabel("Total Purchase Return");
  };

  const handlePinSubmit = () => {
    if (!pinGate) return;
    if (pin !== effectiveEntryPin) {
      alert("Incorrect PIN");
      return;
    }
    if (pinGate.type === "navigate") {
      navigate(`/${pinGate.screen}`);
    } else {
      handleReturnBill();
    }
    setPinGate(null);
    setPin("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handlePinSubmit();
    }
  };

  const renderProductRows = (productList) => {
    if (!productList.length) {
      return (
        <tr>
          <td colSpan="5" className="no-data">
            No Data Available
          </td>
        </tr>
      );
    }

    return productList.map((product, index) => {
      const prod =
        product._id && typeof product._id === "object" ? product._id : product;
      const key = product.uniqueKey || `${prod._id}-${index}`;
      return (
        <tr key={key}>
          <td title={prod.productId} style={{ width: "48px", padding: 0 }}>
            {truncateText(prod.productId, 8)}
          </td>
          <td title={prod.name} style={{ width: "100px", padding: 0 }}>
            {truncateText(prod.name, 15)}
          </td>
          <td style={{ padding: 0 }}>
            <div className="quantity_control">
              <button
                onClick={() => {
                  dispatch({
                    type:
                      currentLocation.pathname === "/stock"
                        ? ADD_TO_PURCHASE_CART
                        : currentLocation.pathname === "/bhet"
                        ? ADD_TO_BHET_CART
                        : ADD_TO_CART,
                    payload:
                      product.priceType === "CUSTOM"
                        ? { ...product, uniqueKey: product.uniqueKey }
                        : product,
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
                  ? -new Intl.NumberFormat("en-IN").format(product.quantity)
                  : new Intl.NumberFormat("en-IN").format(product.quantity)}
              </span>

              <button
                onClick={() => {
                  dispatch({
                    type:
                      currentLocation.pathname === "/stock"
                        ? REMOVE_FROM_PURCHASE_CART
                        : currentLocation.pathname === "/bhet"
                        ? REMOVE_FROM_BHET_CART
                        : REMOVE_FROM_CART,
                    payload:
                      product.uniqueKey
                        || product._id || product.productID,
                  });
                  setShowReprintBill(false);
                }}
              >
                -
              </button>
            </div>
          </td>
          <td>
            {prod.priceType === "CUSTOM" ? (
                <input
                  type="number"
                  className="form-control"
                  value={(() => {
                    // Get unit price: either custom or fixed
                    const unitPrice =
                      customPrices[product.uniqueKey] !== undefined
                        ? toNum(customPrices[product.uniqueKey])
                        : toNum(product.price);

                    // Show total in input
                    return  unitPrice * Math.max(toNum(product.quantity), 1); 
                  })()}
                  onFocus={(e) => {
                    if (e.target.value === "0") e.target.value = "";
                  }}
                  onBlur={(e) => {
                    if (e.target.value === "") e.target.value = "0";
                  }}
                  onChange={(e) => {
                    const totalValue = toNum(e.target.value);
                    const qty = Math.max(toNum(product.quantity), 1);
                    const newUnitPrice =
                      totalValue / qty;
                      const key = product.uniqueKey || `${prod._id}-${index}-${Math.random()}`;

                    setCustomPrices((prev) => ({
                      ...prev,
                      [product.uniqueKey]: newUnitPrice,
                    }));
                    dispatch({
                      type: "UPDATE_CART_ITEM_PRICE", // you create this action
                      payload: {
                        uniqueKey: product.uniqueKey,
                        price: newUnitPrice,
                      },
                    });
                  }}
                  style={{
                    width: "100%",
                    minWidth: "70px",
                    maxWidth: "120px",
                    textAlign: "right",
                    padding: "1px 0px",
                    borderRadius: "6px",
                    border: "1px solid #ccc",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                />
            ) : (
              <span>
                {new Intl.NumberFormat("en-IN").format(
                  toNum(product.price * product.quantity)
                )}
              </span>
            )}
          </td>
        </tr>
      );
    });
  };

  return (
    <div className="bill-container">
      {showExcelTable && renderTable()}
      <div className="bills">
        <div className="screen-list">
          <img
            src={notes}
            alt="Maharaj"
            style={{ cursor: "pointer", width: "40px", height: "40px" }}
            onClick={() => setShowNotes(true)}
          />
          <NavLink to="/dashboard" className="screen-list-circle sales-circle">
            S
          </NavLink>
          <button
            className="screen-list-circle sales-report-circle"
            style={{ background: "rgb(34 78 8)" }}
            onClick={() => handleButtonClick("bhet")}
          >
            B
          </button>
          <button
            className="screen-list-circle purchase-circle"
            onClick={() => handleButtonClick("stock")}
          >
            P
          </button>
          <NavLink
            className="screen-list-circle sales-report-circle"
            to="/report"
          >
            R
          </NavLink>
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

        <div className="Homebuttons">
          <button
            className={
              currentLocation.pathname === "/stock"
                ? "purchase_icon-button"
                : currentLocation.pathname === "/bhet"
                ? "bhet_icon-button"
                : "icon-button"
            }
            onClick={() => {
              currentLocation.pathname === "/stock"
                ? dispatch({ type: CLEAR_PURCHASE_CART })
                : currentLocation.pathname === "/bhet"
                ? dispatch({ type: CLEAR_BHET_CART })
                : dispatch({ type: CLEAR_CART });

              setShowReprintBill(false);
              setReturnMode(false);
            }}
          >
            Reset
          </button>

          <button
            className={
              currentLocation.pathname === "/stock"
                ? "purchase_icon-button"
                : currentLocation.pathname === "/bhet"
                ? "bhet_icon-button"
                : "icon-button"
            }
            onClick={() => {
              if (!effectiveEntryPin) {
                handleReturnBill();
                return;
              }
              setPin("");
              setPinGate({
                type: "return",
                isBhet: currentLocation.pathname === "/bhet",
              });
            }}
          >
            Return
          </button>

          {currentLocation.pathname === "/stock" ? (
            purchaseItems.length > 0 ? (
              <div
                className={`purchase_icon-button ${
                  isButtonDisabled ? "disabled" : ""
                }`}
                onClick={handlePrintClick}
                style={
                  isButtonDisabled
                    ? {
                        pointerEvents: "none",
                        opacity: 0.6,
                        userSelect: "none",
                      }
                    : {}
                }
              >
                <ReactToPrint
                  trigger={() => (
                    <p style={{ fontSize: "0.70rem", cursor: "pointer" }}>
                      Print Invoice
                    </p>
                  )}
                  content={() => componentRef.current}
                  documentTitle={billPrintDocumentTitle}
                  onAfterPrint={handleAfterPrint}
                  removeAfterPrint={false}
                />
              </div>
            ) : (
              <p
                className="purchase_icon-button"
                style={{
                  fontSize: "0.82rem",
                  color: "gray",
                  userSelect: "none",
                }}
              >
                Print Invoice
              </p>
            )
          ) : currentLocation.pathname === "/bhet" ? (
            bhetItems.length > 0 ? (
              <div
                className={`bhet_icon-button ${
                  isButtonDisabled ? "disabled" : ""
                }`}
                onClick={handlePrintClick}
                style={
                  isButtonDisabled
                    ? {
                        pointerEvents: "none",
                        opacity: 0.6,
                        userSelect: "none",
                      }
                    : {}
                }
              >
                <ReactToPrint
                  trigger={() => (
                    <p style={{ fontSize: "0.82rem", cursor: "pointer" }}>
                      Print bhet
                    </p>
                  )}
                  content={() => componentRef.current}
                  documentTitle={billPrintDocumentTitle}
                  onAfterPrint={handleAfterPrint}
                  removeAfterPrint={false}
                />
              </div>
            ) : (
              <p
                className="bhet_icon-button"
                style={{
                  fontSize: "0.82rem",
                  color: "gray",
                  userSelect: "none",
                }}
              >
                Print bhet
              </p>
            )
          ) : items.length || reprintBill?.productId?.length > 0 ? (
            <div
              className={`
                 icon-button
               ${isButtonDisabled ? "disabled" : ""}`}
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
                documentTitle={billPrintDocumentTitle}
                onAfterPrint={handleAfterPrint}
                removeAfterPrint={false}
              />
            </div>
          ) : (
            <p
              className={
                currentLocation.pathname === "/stock"
                  ? "purchase_icon-button"
                  : currentLocation.pathname === "/bhet"
                  ? "bhet_icon-button"
                  : "icon-button"
              }
              style={{ fontSize: "0.82rem", color: "gray", userSelect: "none" }}
            >
              Print Bill
            </p>
          )}

          {currentLocation.pathname !== "/bhet" && (
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
          )}
        </div>

        <div className="bill_index">
          <h4 style={{ textAlign: "center" }}>Jay Swaminarayan</h4>
          <div className="bill_header_sub">
            <h8>Date: {new Date().toLocaleDateString("en-GB")}</h8>
            <h8>
              {currentLocation.pathname === "/bhet"
                ? `Bhet.No: ${bhetNumber || "N/A"}`
                : currentLocation.pathname === "/stock"
                ? `INV.No: ${invoiceNumber || "N/A"}`
                : `Sr.No: ${billNumber}`}
            </h8>
          </div>

          {showReprintBill ? (
            <div className="table-container">
              <table className="bill_table">
                <thead>
                  <tr>
                    <th style={{ width: "45px" }}>ID</th>
                    <th style={{ width: "107px" }}>Item</th>
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
                          width: "107px",
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
                        {new Intl.NumberFormat("en-IN").format(line(product))}
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
                        width: "74px",
                      }}
                    >
                      {currentLocation.pathname === "/stock"
                        ? { purchaseLabel }
                        : currentLocation.pathname === "/bhet"
                        ? "Total Bhet"
                        : "Total"}
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
                      {returnMode ? "-" : null}
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
                    <th style={{ width: "107px" }}>Item</th>
                    <th>Qty</th>
                    <th style={{ fontWeight: "bolder" }}>Amt</th>
                  </tr>
                </thead>
                <tbody>
                  {currentLocation.pathname === "/stock"
                    ? renderProductRows(purchaseItems)
                    : currentLocation.pathname === "/bhet"
                    ? renderProductRows(bhetItems)
                    : renderProductRows(items)}
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
                        width: "120px",
                      }}
                    >
                      {currentLocation.pathname === "/stock"
                        ? purchaseLabel
                        : currentLocation.pathname === "/bhet"
                        ? "Total Bhet"
                        : "Total"}
                    </td>
                    <td style={{ fontWeight: "bolder", width: "39px" }}>
                      {currentLocation.pathname === "/stock"
                        ? currentLocation.state?.returnEdit
                          ? -new Intl.NumberFormat("en-IN").format(
                              totalPurchaseQuantity
                            )
                          : new Intl.NumberFormat("en-IN").format(
                              totalPurchaseQuantity
                            )
                        : currentLocation.pathname === "/bhet"
                        ? new Intl.NumberFormat("en-IN").format(
                            totalBhetQuantity
                          )
                        : returnMode
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
                      {" "}
                      {returnMode || currentLocation.state?.returnEdit
                        ? "-"
                        : null}{" "}
                      {currentLocation.pathname === "/stock"
                        ? new Intl.NumberFormat("en-IN").format(
                            totalPurchaseprice
                          )
                        : currentLocation.pathname === "/bhet"
                        ? new Intl.NumberFormat("en-IN").format(totalBhetprice)
                        : new Intl.NumberFormat("en-IN").format(totalPrice)}
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
        <h1
          style={{
            padding: "9px 0px",
            fontSize: "22px",
            textAlign: "center",
            margin: "0",
            background: "white",
            borderRadius: "0px 25px 0px 0px",
          }}
        >
          Jay Swaminarayan
        </h1>
        {returnMode && currentLocation?.pathname === "/bhet" && (
          <h3
            style={{
              padding: "6px 0px",
              fontSize: "20px",
              textAlign: "center",
              margin: "0",
              background: "white",
              borderRadius: "0px 25px 0px 0px",
            }}
          >
            Bhet Return
          </h3>
        )}
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
            {currentLocation.pathname === "/bhet"
              ? `${returnMode ? "Bhet Return No." : "Bhet No."}: ${
                  bhetNumber || "N/A"
                }`
              : currentLocation.pathname === "/stock"
              ? `INV.No: ${invoiceNumber || "N/A"}`
              : `Sr.No: ${billNo?.billId || "Loading..."}`}
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
                    {new Intl.NumberFormat("en-IN").format(
                      ((customPrices?.[product._id] ?? product.price) || 0) *
                        (product.quantity || 1)
                    )}
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
                {" "}
                {new Intl.NumberFormat("en-IN").format(
                  reprintBill?.totalAmount
                )}
              </p>
            </div>

            <hr style={{ borderTop: "solid 2px" }} />
            <p className="pavti_footer_text_report">.... Visit Again .....</p>
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
            {currentLocation.pathname === "/stock"
              ? purchaseItems.length > 0
                ? purchaseItems.map((product) => (
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
                            ((customPrices?.[product._id] ?? product.price) ||
                              0) * (product.quantity || 1)
                          )}
                        </p>
                      </div>
                    </div>
                  ))
                : "no data"
              : currentLocation.pathname === "/bhet"
              ? bhetItems.length > 0
                ? bhetItems.map((product) => (
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
                              returnMode ? -product.quantity : product.quantity
                            )}
                          </span>
                        </div>
                        <p
                          className="product_price_report"
                          style={{ fontSize: "15px", textAlign: "center" }}
                        >
                          {new Intl.NumberFormat("en-IN").format(
                            returnMode
                              ? -(
                                  (customPrices?.[product._id] ??
                                    product.price) ||
                                  0
                                ) * (product.quantity || 1)
                              : ((customPrices?.[product._id] ??
                                  product.price) ||
                                  0) * (product.quantity || 1)
                          )}
                        </p>
                      </div>
                    </div>
                  ))
                : "no data"
              : items.length > 0
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
                            returnMode ? -product.quantity : product.quantity
                          )}
                        </span>
                      </div>
                      <p
                        className="product_price_report"
                        style={{ fontSize: "15px", textAlign: "center" }}
                      >
                        {new Intl.NumberFormat("en-IN").format(
                          returnMode
                            ? ((customPrices?.[product._id] ?? product.price) ||
                                0) * (product.quantity || 1)
                            : ((customPrices?.[product._id] ?? product.price) ||
                                0) * (product.quantity || 1)
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
                {currentLocation.pathname === "/stock"
                  ? new Intl.NumberFormat("en-IN").format(totalPurchaseQuantity)
                  : currentLocation.pathname === "/bhet"
                  ? new Intl.NumberFormat("en-IN").format(
                      returnMode ? -totalBhetQuantity : totalBhetQuantity
                    )
                  : new Intl.NumberFormat("en-IN").format(totalQuantity)}
              </p>
              <p
                style={{
                  width: "80px",
                  margin: 0,
                  textAlign: "center",
                  fontWeight: "bold",
                }}
              >
                {" "}
                {currentLocation.pathname === "/stock"
                  ? new Intl.NumberFormat("en-IN").format(totalPurchaseprice)
                  : currentLocation.pathname === "/bhet"
                  ? new Intl.NumberFormat("en-IN").format(
                      returnMode ? -totalBhetprice : totalBhetprice
                    )
                  : new Intl.NumberFormat("en-IN").format(totalPrice)}
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

      {pinGate && (
        <div className={`pin-prompt ${pinPromptThemeClass(pinGate)}`}>
          <div className="modal-content">
            <h3>Enter PIN for {pinGateTitle(pinGate)}</h3>
            <form autoComplete="off" onSubmit={(e) => e.preventDefault()}>
              <input
                type="text"
                inputMode="numeric"
                value={pin}
                name="custom-pin"
                onChange={handlePinChange}
                placeholder="Enter PIN"
                autoFocus
                onKeyDown={handleKeyPress}
                autoComplete="off"
                aria-hidden="true"
                style={{
                  WebkitTextSecurity: "disc",
                }}
              />
            </form>
            <p className="button-group">
              <button onClick={handlePinSubmit}>Submit</button>
              <button
                className="close-btn"
                onClick={() => {
                  setPinGate(null);
                  setPin("");
                }}
              >
                X
              </button>
            </p>
          </div>
        </div>
      )}

      {showNotes && <NotesComponent onClose={() => setShowNotes(false)} />}
    </div>
  );
};

export default Bills;
