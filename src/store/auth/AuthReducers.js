import { useSelector } from "react-redux";
import { ERROR_USER, REQUEST_USER, SET_USER, SET_USER_PASSWORD } from "./AuthAction";

const initialState = {
  users: [],
  busy: false,
  message: "",
};

const authReducer = (state = initialState, action) => {
  switch (action.type) {
    case REQUEST_USER:
      return {
        ...state,
        message: "",
        busy: true,
      };

    case SET_USER:
      return {
        ...state,
        busy: false,
        message: "",
        users: action.payload, 
      };

    case SET_USER_PASSWORD:
      return {
        ...state,
        busy: false,
        message: "",
        users: state.users.map((user) =>
          user._id === action.payload.id
            ? { ...user, password: action.payload.password }
            : user
        ),
      };  

    case ERROR_USER:
      return {
        ...state,
        busy: false,
        message: action.payload,
      };

    default:
      return state;
  }
};

export default authReducer;

export function useAuth() {
  return useSelector((state) => state.auth.users);
}
