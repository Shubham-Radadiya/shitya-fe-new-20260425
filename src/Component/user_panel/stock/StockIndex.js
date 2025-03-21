import React, { useState } from "react";
import Bills from "../../user_panel/bills/BillIndex";
import AddList from "../../user_panel/add_list/AddListIndex";
import MenuVariety from "../../user_panel/menu_variety/MenuVariety";
import Menu from "../../user_panel/menu/MenuIndex";
import { useInvoice } from "../../../store/invoice/InvoiceReducer";

const StockIndex = () => {
  const { invoiceData } = useInvoice();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState(null);
  const [returnMode, setReturnMode] = useState(false);
  const [name, setName] = useState("");
  const [product, setProduct] = useState({
    name: "",
    payload: {
      products: [],
    },
  });
  const [main, setMain] = useState({
    subCategory: [],
  });
  
  const updateName = (newName) => {
    setName(newName);
  };
  
  
  const updateProduct = (newProduct) => {
    setProduct({ ...product, name: newProduct.name, payload: newProduct });
  };

  const sendData = (data) => {
    setMain(data);
  };

  return (
    <>
      <div className="container_flex" style={{ height: "100vh" }}>
        <Menu
          name={name}
          updateName={updateName}
          sendData={sendData}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
        />
        <div className="card-content">
          <h2
            className="swaminarayan"
          >
            જય સ્વામિનારાયણ
          </h2>
          <div style={{ height: "3.5rem" }}>
            <MenuVariety
              name={name}
              updateProduct={updateProduct}
              selectedCategory={selectedCategory}
              setSelectedSubCategory={setSelectedSubCategoryId}
            />
          </div>
          <AddList
            main={main}
            selectedSubCategoryId={selectedSubCategoryId}
          />
        </div>
        <Bills returnMode={returnMode} setReturnMode={setReturnMode} invoice={invoiceData} />
      </div>
    </>
  );
};

export default StockIndex;
