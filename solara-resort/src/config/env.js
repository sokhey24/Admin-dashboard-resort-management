import {
  resolveApiBaseUrl,
  resolveStorageBaseUrl,
} from './resolveBackendUrl.js';

const apiRoot = resolveApiBaseUrl(import.meta.env.VITE_API_URL);

const truthy = (value) => value === 'true' || value === '1';

export const config = {
  apiUrl: `${apiRoot}/`,
  imageUrl: resolveStorageBaseUrl(import.meta.env.VITE_IMAGE_URL),
  /** Demo catalog + simulated booking (no POST). Turn off when CMS + API are ready. */
  activitiesFrontendOnly: truthy(import.meta.env.VITE_ACTIVITIES_FRONTEND_ONLY),
};

export default config;
