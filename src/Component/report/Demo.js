import React, { useState, useRef } from "react";
import axios from "axios";
import Modal from "react-modal";

const BillTable = () => {
  const [bills] = useState([
    { billNumber: "12345", date: "2025-03-01" },
    { billNumber: "12346", date: "2025-03-02" },
  ]);

  const [modalOpen, setModalOpen] = useState(false);
  const [billDetails, setBillDetails] = useState(null);
  const printRef = useRef(); // Ref for printable content

  // Function to handle Print button click
  const handlePrintClick = async (billNumber) => {
    console.log("Print button clicked for Bill:", billNumber);

    try {
      // Mock API Response
      const response = {
        data: { billNumber, date: "2025-03-01", amount: "$100.00" },
      };

      setBillDetails(response.data);
      setModalOpen(true);
    } catch (error) {
      console.error("Error fetching bill details:", error);
    }
  };

  // Function to close modal
  const closeModal = () => {
    setModalOpen(false);
  };

  // Function to print only the modal content
  const printBill = () => {
    const printContent = printRef.current.innerHTML;
    const originalContent = document.body.innerHTML;

    document.body.innerHTML = printContent;
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload(); // Reload to restore the page
  };

  return (
    <div>
      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>Bill Number</th>
            <th>Date</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {bills.map((bill) => (
            <tr key={bill.billNumber}>
              <td>{bill.billNumber}</td>
              <td>{bill.date}</td>
              <td>
                <button onClick={() => handlePrintClick(bill.billNumber)}>
                  🖨 Print
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal Component */}
      <Modal
        isOpen={modalOpen}
        onRequestClose={closeModal}
        contentLabel="Bill Details"
        style={{
          content: {
            width: "400px",
            margin: "auto",
            padding: "20px",
            borderRadius: "10px",
          },
        }}
      >
        <div ref={printRef}>
          <h2>Bill Details</h2>
          {billDetails ? (
            <div>
              <p><strong>Bill Number:</strong> {billDetails.billNumber}</p>
              <p><strong>Date:</strong> {billDetails.date}</p>
              <p><strong>Total Amount:</strong> {billDetails.amount}</p>
            </div>
          ) : (
            <p>Loading...</p>
          )}
        </div>

        {/* Print & Close Buttons */}
        <button onClick={printBill}>🖨 Print Bill</button>
        <button onClick={closeModal} style={{ marginLeft: "10px" }}>Close</button>
      </Modal>
    </div>
  );
};

export default BillTable;
