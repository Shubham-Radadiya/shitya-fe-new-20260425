import React, { useState } from "react";
import Bills from "../../user_panel/bills/BillIndex";
import AddList from "../../user_panel/add_list/AddListIndex";
import "./home.css";
import MenuVariety from "../../user_panel/menu_variety/MenuVariety";
import Menu from "../../user_panel/menu/MenuIndex";
import { useLocation } from "react-router-dom";

const Home = () => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const currentLocation = useLocation();
  console.log("currentLocation", currentLocation);

  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState(null);
  const [showReprintBill, setShowReprintBill] = useState(false);
  const [returnMode, setReturnMode] = useState(false);
  const [name, setName] = useState("");
  const [newState, setNewState] = useState(false);
  const invoiceData = currentLocation.state?.invoiceData;
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

  const stateUpdate = (state) => {
    setNewState(state);
  };
  console.log("invoiceData", invoiceData);

  return (
    <>
      <div className="container_flex" style={{ height: "100vh" }}>
        <Menu
          name={name}
          updateName={updateName}
          sendData={sendData}
          stateUpdate={stateUpdate}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
        />
        <div className="card-content">
          <h2
            className="swaminarayan"
            style={{
              color:
                currentLocation.pathname === "/stock"
                  ? "rgb(87 15 119)"
                  : "rgb(97, 37, 17)",
            }}
          >
            જય સ્વામિનારાયણ
          </h2>
          <div style={{ height: "3.5rem" }}>
            <MenuVariety
              name={name}
              updateProduct={updateProduct}
              stateUpdate={stateUpdate}
              selectedCategory={selectedCategory}
              setSelectedSubCategory={setSelectedSubCategoryId}
            />
          </div>
          <AddList
            main={main}
            // product={product}
            selectedSubCategoryId={selectedSubCategoryId}
            setShowReprintBill={setShowReprintBill}
          />
        </div>
        <Bills
          returnMode={returnMode}
          setReturnMode={setReturnMode}
          invoice={invoiceData}
        />
      </div>
    </>
  );
};

export default Home;
