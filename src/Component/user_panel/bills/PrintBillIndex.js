import React from "react";

const PrintBillIndex = ({
  showReprintBill,
  reprintBill,
  items,
  totalQuantity,
  totalPrice,
  reprintTotalQuantity,
  billNo,
  componentRef,
}) => {
  
  return (
    <div ref={componentRef} className="bill_index">
      <h4 style={{ textAlign: "center" }}>Jay Swaminarayan</h4>
      <div className="bill_header_sub">
        <h8>Date: {new Date().toLocaleDateString("en-GB")}</h8>
        <h8>Sr.No: {billNo && billNo?.billId}</h8>
      </div>
      {showReprintBill ? (
        <table className="bill_table" >
          <thead style={{textAlign:"left"}}>
            <tr >
              <th>Pr.Id</th>
              <th>Item</th>
              <th>Qty</th>
              <th>Amt</th>
            </tr>
          </thead>
          <tbody>
            {reprintBill?.productId?.map((product) => (
              <tr key={product._id._id}>
                <td>{product.productId}</td>
                <td>{product._id.name.length > 6 ? product._id.name.substring(0, 8) + "..." : product._id.name}</td>
                <td>{product.quantity}</td>
                <td>{new Intl.NumberFormat("en-IN").format(product.price)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr >
              <td>Total</td>
              <td></td>
              <td>{reprintTotalQuantity}</td>
              <td>
              ₹ {new Intl.NumberFormat("en-IN").format(
                  reprintBill?.totalAmount
                )}
              </td>
            </tr>
            <h2>....Visit Again....</h2>
          </tfoot>
        </table>
      ) : (
        <div className="table-container">
          <table className="bill_table">
            <thead>
              <tr>
                <th>Pr.Id</th>
                <th>Item</th>
                <th className="bill_qty">Qty</th>
                <th>Amt</th>
              </tr>
            </thead>
            <tbody>
              {items.map((product) => (
                <tr key={product._id}>
                  <td title={product.productId}>{product.productId}</td>
                  <td title={product.name}>{product.name.length > 6 ? product.name.substring(0, 8) + "..." : product.name}</td>
                  <td style={{ width: "10%" }} className="bill_qty">{product.quantity}</td>
                  <td className="bill_amt">
                    {new Intl.NumberFormat("en-IN").format(
                      product.price * product.quantity
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td>Total</td>
                <td></td>
                <td className="bill_qty">{totalQuantity}</td>
                <td>{new Intl.NumberFormat("en-IN").format(totalPrice)}</td>
              </tr>
            </tfoot>
          </table>
          <h3 className="visit">....Visit Again....</h3>
        </div>
      )}
    </div>
  );
};

export default PrintBillIndex;
