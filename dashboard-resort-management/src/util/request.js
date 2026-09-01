import axios from "axios";
import config from "./config";

const getToken = () => {
  try {
    const store = JSON.parse(localStorage.getItem("ResortProfileStore"));
    return store?.state?.access_token || null;
  } catch {
    return null;
  }
};

export const request = (url = "", method = "", data = {}) => {
  const token = getToken();
  let headers = { "Content-Type": "application/json", Accept: "application/json" };
  if (data instanceof FormData) {
    headers["Content-Type"] = "multipart/form-data";
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
    timeout: isLargeUpload ? 0 : 30000, // no timeout for file uploads, 30s for normal requests
  })
    .then((res) => res.data)
    .catch((error) => {
      const response = error.response;
      if (response) {
        const { status, data } = response;
        let errors = {};
        if (status === 401) errors.message = data?.message ?? "Invalid email or password.";
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
