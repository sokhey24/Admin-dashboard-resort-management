import axios from 'axios';
import config from '../../config/env.js';
import { getAccessToken, clearAccessToken } from '../../store/authStore.js';

let unauthorizedHandler = () => {};

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = typeof handler === 'function' ? handler : () => {};
}

export const axiosClient = axios.create({
  baseURL: config.apiUrl,
  timeout: 30000,
  headers: {
    Accept: 'application/json',
  },
});

axiosClient.interceptors.request.use((req) => {
  const token = getAccessToken();
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  if (req.data && !(req.data instanceof FormData) && !req.headers['Content-Type']) {
    req.headers['Content-Type'] = 'application/json';
  }
  return req;
});

axiosClient.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url ?? '';
    const isAuthMe = url.includes('auth/me');
    const isLogin = url.includes('auth/login');
    const isRegister = url.includes('auth/register');
    const isTwoFactor = url.includes('auth/two-factor');
    const isForgotPassword = url.includes('auth/forgot-password');
    const isPasswordReset = url.includes('auth/reset');

    if (
      status === 401 &&
      !isLogin &&
      !isRegister &&
      !isTwoFactor &&
      !isForgotPassword &&
      !isPasswordReset &&
      getAccessToken()
    ) {
      clearAccessToken();
      unauthorizedHandler({ from: isAuthMe ? 'bootstrap' : 'request' });
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
