import axios from "axios";
import { showPopup } from "../popup/popup";
import { getUser } from "../utils/auth";
import { dbg } from '../utils/debugger';

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    dbg.log("API request:", config.method?.toUpperCase(), config.url);

    const user = getUser();
    if (user?.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
      dbg.log("API request: auth token attached");
    }

    return config;
  },
  (err) => {
    dbg.log("API request interceptor error:", err);
    return Promise.reject(err);
  }
);

api.interceptors.response.use(
  (res) => {
    dbg.log("API response success:", res.config.url, res.status);
    return res;
  },
  (err) => {
    dbg.log("API response error (raw):", err);

    let title = "Server Error";
    let message = "Unknown error occurred.";

    if (!err.response) {
      title = "Backend Unreachable";
      message =
        "Cannot connect to server.\n" +
        "Possible reasons:\n" +
        "- Backend not running\n" +
        "- Database not connected\n" +
        "- Network issue";
    } else {
      title = `Error ${err.response.status}`;
      message = JSON.stringify(err.response.data, null, 2);
    }

    showPopup({
      type: "topright",
      title,
      message,
    });

    return Promise.reject(err);
  }
);

export default api;