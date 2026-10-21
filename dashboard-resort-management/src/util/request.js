import axios from "axios";
import config from "./config";
import { getToken, clearAdminSession, isAuthApiPath } from "./auth";

const getLang = () => {
  try {
    const store = JSON.parse(localStorage.getItem("solara_admin_lang"));
    return store?.state?.language || "km";
  } catch {
    return "km";
  }
};

let handlingSessionExpiry = false;

function handleSessionExpired(requestUrl, hadToken) {
  if (!hadToken || isAuthApiPath(requestUrl)) {
    return;
  }
  if (handlingSessionExpiry) {
    return;
  }
  handlingSessionExpiry = true;

  clearAdminSession();
  window.dispatchEvent(new CustomEvent("admin:session-expired"));

  const path = window.location.pathname || "";
  const onLoginRoute = path === "/login" || path.endsWith("/login");
  if (!onLoginRoute) {
    const next = `${window.location.pathname}${window.location.search}`;
    const from = next && next !== "/" ? `&from=${encodeURIComponent(next)}` : "";
    window.location.assign(`/login?session=expired${from}`);
  }

  window.setTimeout(() => {
    handlingSessionExpiry = false;
  }, 1500);
}

export const request = (url = "", method = "", data = {}) => {
  const token = getToken();
  const currentLang = getLang();
  let headers = {
    Accept: "application/json",
    "Accept-Language": currentLang,
  };
  if (!(data instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const isLargeUpload = data instanceof FormData;
  return axios({
    url: config.base_url + url,
    method,
    data,
    headers,
    timeout: isLargeUpload ? 0 : 30000,
  })
    .then((res) => res.data)
    .catch((error) => {
      const response = error.response;
      if (response) {
        const { status, data } = response;
        if (status === 401) {
          handleSessionExpired(url, Boolean(token));
        }
        let errors = {};
        if (status === 401) errors.message = data?.message ?? "Invalid email or password.";
        if (status === 403) errors.message = data?.message ?? "Forbidden. You do not have permission to perform this action.";
        if (status === 422) errors.message = data?.message ?? "Validation failed.";
        if (status === 429) errors.message = data?.message ?? "Too many requests. Please wait before trying again.";
        if (status === 503) errors.message = data?.message ?? "Service unavailable. Please try again later.";
        if (status === 500) errors.message = data?.message ?? "Server Error. Please try again later.";
        if (data?.error) {
          errors.message = data.error === "Unauthorized" ? "Invalid email or password." : data.error;
        }
        if (data?.message && !errors.message) errors.message = data.message;
        if (data?.errors) {
          Object.keys(data.errors).forEach((key) => {
            errors[key] = { help: data.errors[key][0], validateStatus: "warning" };
          });
        }
        return { status, errors };
      }
      return { status: 0, errors: { message: "Cannot connect to server. Please make sure the server is running." } };
    });
};
