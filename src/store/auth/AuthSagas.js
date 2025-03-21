import { takeLatest, call, put, all } from "redux-saga/effects";
import userServices from "../../services/auth.services";
import { CREATE_USER_REQUEST, LOGIN_REQUEST, LOGOUT_REQUEST, REQUEST_UPDATE_USER, REQUEST_USER, REQUEST_USER_PASSWORD, SET_USER, SET_USER_PASSWORD } from "./AuthAction";
import { toast } from "react-toastify";

function* loginSaga(action) {
    try {
        const { data, headers } = yield call(userServices.userLogin, action.payload);
        localStorage.setItem("role", data?.userType);
        localStorage.setItem("access_token", headers["x-auth-token"]);
        if (data?.userType === "SUPER ADMIN" || data?.userType === "MANAGER") {
            window.location.href = "/dashboard";
        } else {
            window.location.href = "/dashboard";
        }
    } catch (error) {
        toast.error("enter valid userName address and password");
    }
}

function* requestUserSaga() {
    try {
        const { data } = yield call(userServices.getUser); 
        yield put({ type: SET_USER, payload: data }); 
    } catch (error) {
        toast.error("User fetch failed", error);
    }
}

function* requestUserPwdSaga(action) {
    try {
        const { data } = yield call(userServices.getUserPassword, action.payload); 
        yield put({ type: SET_USER_PASSWORD, payload: { id: action.payload, password: data.password } });
    } catch (error) {
        toast.error("Password fetch failed", error);
    }
}

function* createUserSaga(action) {
    try {
        yield call(userServices.createUser, action.payload);
        toast.success("User created successfully");
        yield call(requestUserSaga);
    } catch (error) {
        toast.error("User didn't create");
    }
}

function* updateUserSaga(action) {
    try {
      const { data, id } = action.payload;
      const response = yield call(userServices.updateUser, data, id);
      toast.success("User updated successfully", response);
      yield call(requestUserSaga);
      yield put({ type: REQUEST_UPDATE_USER });
    } catch (error) {
    //   toast.error("User didn't created");
    }
  }

function* logoutSaga() {
    try {
        yield call(userServices.userLogout);
        localStorage.removeItem("role");
        localStorage.removeItem("access_token");
        window.location.href = "/";
    } catch (error) {
        toast.error("User creation failed");
    }
}

function* authSaga() {
    yield all([
        takeLatest(LOGIN_REQUEST, loginSaga),
        takeLatest(CREATE_USER_REQUEST, createUserSaga),
        takeLatest(LOGOUT_REQUEST, logoutSaga),
        takeLatest(REQUEST_USER, requestUserSaga),
        takeLatest(REQUEST_USER_PASSWORD, requestUserPwdSaga),
        takeLatest(REQUEST_UPDATE_USER, updateUserSaga),
    ]);
}

export default authSaga;
