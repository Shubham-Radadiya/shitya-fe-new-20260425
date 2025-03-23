import { combineReducers } from "redux";
import category from "./category/reducer";
import cartReducer from "./cart/reducer";
import useBill from "./bill/reducer";
import SubCategoryReducers from "./subcategory/SubCategoryReducers";
import ProductReducer from "./product/ProductReducer";
import authReducer from "./auth/AuthReducers";
import ReportReducers from "./admin_report/ReportReducer"
import UserReportReducers from "./user_report/UserReportReducer";
import invoiceReducer from "./invoice/InvoiceReducer";
import excelReducer from "./excel/excelReducer";

export default combineReducers({
  category,
  cart: cartReducer,
  bill: useBill,
  SubCategoryReducers,
  product: ProductReducer,
  auth: authReducer,
  report: ReportReducers,
  userReport:UserReportReducers,
  invoice:invoiceReducer,
  excel: excelReducer
});
