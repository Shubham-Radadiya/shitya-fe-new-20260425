import { takeLatest, call, put, all } from "redux-saga/effects";
import userServices from "../../services/auth.services";
import { CREATE_USER_REQUEST, LOGIN_REQUEST, LOGOUT_REQUEST, REQUEST_UPDATE_USER, REQUEST_USER, REQUEST_USER_PASSWORD, SET_USER, SET_USER_PASSWORD } from "./AuthAction";
import { toast } from "react-toastify";
import { getApiErrorMessage } from "../../utils/apiErrorMessage";

/** Axios 1.x may return AxiosHeaders; browser header names are lowercased. */
function readAuthTokenFromHeaders(headers) {
    if (!headers) return undefined;
    if (typeof headers.get === "function") {
        return (
            headers.get("x-auth-token") ||
            headers.get("X-Auth-Token") ||
            undefined
        );
    }
    return headers["x-auth-token"] || headers["X-Auth-Token"];
}

function* loginSaga(action) {
    try {
        const { data, headers } = yield call(userServices.userLogin, action.payload);
        const token = readAuthTokenFromHeaders(headers);
        if (!token) {
            toast.error("Login succeeded but no auth token was returned. Check API CORS exposedHeaders.");
            return;
        }
        localStorage.setItem("role", data?.userType);
        const settingsOk =
          data?.userType === "SUPER ADMIN" ||
          (data?.userType === "MANAGER" && data?.canAccessSettings === true);
        localStorage.setItem("canAccessSettings", settingsOk ? "true" : "false");
        localStorage.setItem("access_token", token);
        const branchNorm =
          String(data?.branchName ?? "")
            .trim()
            .toUpperCase() || "KUD";
        localStorage.setItem("branchName", branchNorm);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("sahitya-access-token-changed"));
        }
        if (data?.userType === "SUPER ADMIN" || data?.userType === "MANAGER") {
            window.location.href = "/dashboard";
        } else {
            window.location.href = "/dashboard";
        }
    } catch (error) {
        toast.error(
          getApiErrorMessage(
            error,
            "Enter valid user name, branch, and password"
          )
        );
    }
}

function* requestUserSaga() {
    try {
        const { data } = yield call(userServices.getUser); 
        yield put({ type: SET_USER, payload: data }); 
    } catch (error) {
        toast.error(getApiErrorMessage(error, "User fetch failed"));
    }
}

function* requestUserPwdSaga(action) {
    try {
        const { data } = yield call(userServices.getUserPassword, action.payload); 
        yield put({ type: SET_USER_PASSWORD, payload: { id: action.payload, password: data.password } });
    } catch (error) {
        toast.error(getApiErrorMessage(error, "Password fetch failed"));
    }
}

function* createUserSaga(action) {
    try {
        yield call(userServices.createUser, action.payload);
        toast.success("User created successfully");
        yield call(requestUserSaga);
    } catch (error) {
        toast.error(getApiErrorMessage(error, "User didn't create"));
    }
}

function* updateUserSaga(action) {
    try {
      const { data, id } = action.payload;
      const response = yield call(userServices.updateUser, data, id);
      toast.success("User updated successfully", response);
      yield call(requestUserSaga);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("sahitya-admin-session-refresh"));
      }
    } catch (error) {
        toast.error(getApiErrorMessage(error, "User update failed"));
    }
  }

function* logoutSaga() {
    try {
        yield call(userServices.userLogout);
        localStorage.removeItem("role");
        localStorage.removeItem("canAccessSettings");
        localStorage.removeItem("branchName");
        localStorage.removeItem("sahitya_settings_branch");
        localStorage.removeItem("access_token");
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("sahitya-access-token-changed"));
        }
        window.location.href = "/";
    } catch (error) {
        toast.error(getApiErrorMessage(error, "Logout failed"));
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
