import { useEffect, useMemo, useState } from "react";
import { request } from "../util/request";
import { buildQS } from "../page/FilterData/Filter_data";
import {
  getPreviousPeriodFilter,
  getRevenueComparison,
} from "../util/revenueComparison";

/**
 * Fetches previous-period total_revenue for the same branch scope as the current dashboard request.
 */
export function useRevenuePeriodComparison(filter, branchId, currentRevenue) {
  const { previousFilter, periodLabel, periodType } = useMemo(
    () => getPreviousPeriodFilter(filter ?? {}),
    [filter?.date, filter?.month, filter?.year]
  );

  const [previousRevenue, setPreviousRevenue] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!previousFilter) {
      setPreviousRevenue(null);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setPreviousRevenue(null);

    const qs = buildQS({ ...previousFilter, branchId });
    request(`admin/dashboard${qs}`, "get")
      .then((res) => {
        if (cancelled) return;
        if (res?.success) {
          setPreviousRevenue(res.data?.statistics?.total_revenue ?? 0);
        } else {
          setPreviousRevenue(null);
          setError(res?.errors?.message ?? "Comparison unavailable");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPreviousRevenue(null);
          setError("Comparison unavailable");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    previousFilter?.date,
    previousFilter?.month,
    previousFilter?.year,
    branchId,
  ]);

  const comparison = useMemo(() => {
    if (!previousFilter || previousRevenue === null) return null;
    return getRevenueComparison(currentRevenue, previousRevenue);
  }, [currentRevenue, previousRevenue, previousFilter]);

  return {
    periodType,
    periodLabel,
    canCompare: Boolean(previousFilter),
    comparison,
    comparisonLoading: loading,
    comparisonError: error,
    previousRevenue,
  };
}
