import { useCallback, useEffect, useState } from 'react';
import { fetchWebsiteContent } from '../services/api/contentApi.js';
import { getApiErrorMessage } from '../services/api/errors.js';
import { selectMarketingLists } from '../util/marketingContent.js';

export function useWebsiteContent() {
  const [grouped, setGrouped] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWebsiteContent();
      const payload = data?.data ?? data;
      const grouped =
        payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : {};
      setGrouped(grouped);
    } catch (err) {
      setGrouped({});
      setError(getApiErrorMessage(err, 'Unable to load website content.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const lists = selectMarketingLists(grouped);

  return {
    grouped,
    ...lists,
    loading,
    error,
    reload: load,
  };
}
