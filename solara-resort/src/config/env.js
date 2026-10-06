import {
  resolveApiBaseUrl,
  resolveStorageBaseUrl,
} from './resolveBackendUrl.js';

const apiRoot = resolveApiBaseUrl(import.meta.env.VITE_API_URL);

export const config = {
  apiUrl: `${apiRoot}/`,
  imageUrl: resolveStorageBaseUrl(import.meta.env.VITE_IMAGE_URL),
};

export default config;
