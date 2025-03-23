import React, { useRef } from "react";
import { useReactToPrint } from "react-to-print";

const ExcelBillPrint = ({ excelBill, onClose }) => {
  const printRef = useRef();

  console.log("Excel Bill Data:", excelBill);
  console.log("Print Ref:", printRef.current); // Debugging log

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
  });

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
      <div className="bg-white p-6 rounded-lg w-3/4">
        <h2 className="text-xl font-bold mb-4">Excel Bill Preview</h2>

        {/* Ensure ref is set */}
        <div ref={printRef} className="p-4 border">
          {Array.isArray(excelBill) && excelBill.length > 0 ? (
            excelBill.map((item, index) => (
              <div key={index} className="border-b p-2">
                <p>Product: {item.productName}</p>
                <p>Quantity: {item.quantity}</p>
                <p>Price: {item.price}</p>
              </div>
            ))
          ) : (
            <p>No bill data available.</p>
          )}
        </div>

        <div className="flex justify-between mt-4">
          <button
            onClick={onClose}
            className="bg-red-500 text-white px-4 py-2 rounded"
          >
            Close
          </button>
          <button
            onClick={() => {
              console.log("Print Triggered");
              handlePrint();
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Print
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExcelBillPrint;
