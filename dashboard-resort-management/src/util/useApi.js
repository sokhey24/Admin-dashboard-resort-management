import { useState, useEffect, useCallback } from "react";
import { request } from "../util/request";

export default function useApi(url, method = "get", body = null, deps = []) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    const res = await request(url, method, body || {});
    if (res?.errors) setError(res.errors.message || "Something went wrong");
    else setData(res);
    setLoading(false);
  }, [url]);

  useEffect(() => { fetch(); }, [fetch, ...deps]);

  return { data, loading, error, reload: fetch };
}
