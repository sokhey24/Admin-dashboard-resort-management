import {
  resolveApiBaseUrl,
  resolveStorageBaseUrl,
} from './resolveBackendUrl.js';

const apiRoot = resolveApiBaseUrl(import.meta.env.VITE_API_URL);

export default {
  base_url: `${apiRoot}/`,
  image_path: `${resolveStorageBaseUrl(import.meta.env.VITE_IMAGE_URL)}/`,
};
