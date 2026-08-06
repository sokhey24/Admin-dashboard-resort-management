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
  let headers = { "Content-Type": "application/json" };
  if (data instanceof FormData) {
    headers = { "Content-Type": "multipart/form-data" };
  }
  return axios({
    url: config.base_url + url,
    method,
    data,
    headers: { ...headers, Accept: "application/json", Authorization: `Bearer ${token}` },
  })
    .then((res) => res.data)
    .catch((error) => {
      const response = error.response;
      if (response) {
        const { status, data } = response;
        let errors = {};
        if (status === 500) errors.message = "Server Error. Please try again later.";
        if (data.error) {
          errors.message = data.error === "Unauthorized" ? "Invalid email or password." : data.error;
        }
        if (data.errors) {
          Object.keys(data.errors).forEach((key) => {
            errors[key] = { help: data.errors[key][0], validateStatus: "warning" };
          });
        }
        return { status, errors };
      }
      return { status: 0, errors: { message: "Cannot connect to server. Please make sure the server is running." } };
    });
};
