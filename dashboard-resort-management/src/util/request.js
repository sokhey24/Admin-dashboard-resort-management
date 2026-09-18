import axios from "axios";
import config from "./config";
import { clearAuth } from "./auth";
import { ProfileStore } from "../store/ProfileStore";

const getToken = () => {
  try {
    const store = JSON.parse(localStorage.getItem("ResortProfileStore"));
    return store?.state?.access_token || null;
  } catch {
    return null;
  }
};

const isPublicAuthUrl = (url = "") =>
  /^(auth\/login|auth\/register|auth\/two-factor\/challenge|auth\/forgot-password)/.test(url);

const clearExpiredSession = () => {
  clearAuth();
  ProfileStore.getState().logout();
};

export const request = (url = "", method = "", data = {}) => {
  const token = getToken();
  let headers = { Accept: "application/json" };
  if (!(data instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  if (token && !isPublicAuthUrl(url)) {
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
        let errors = {};
        if (status === 401) {
          errors.message = data?.message ?? "Invalid email or password.";
          if (!isPublicAuthUrl(url)) {
            clearExpiredSession();
            const path = window.location.pathname;
            if (!["/login", "/register", "/forgot-password", "/verify-otp", "/reset-password"].includes(path)) {
              window.location.assign("/login");
            }
          }
        }
        if (status === 403) errors.message = data?.message ?? "Forbidden. You do not have permission to perform this action.";
        if (status === 422) errors.message = data?.message ?? "Validation failed.";
        if (status === 429) errors.message = data?.message ?? "Too many requests. Please wait before trying again.";
        if (status === 503) errors.message = data?.message ?? "Service unavailable. Please try again later.";
        if (status === 500) errors.message = "Server Error. Please try again later.";
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
