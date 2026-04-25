import React from "react";
import axios from "axios";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import App from "./App";
import initStore from "./store/store";
import "./index.css";
import { BrowserRouter } from "react-router-dom";

axios.defaults.withCredentials = true;

const store = initStore();
const root = createRoot(document.getElementById("root"));

root.render(
  <Provider store={store}>
    <BrowserRouter>
      <App />
      <ToastContainer />
    </BrowserRouter>
  </Provider>
);
