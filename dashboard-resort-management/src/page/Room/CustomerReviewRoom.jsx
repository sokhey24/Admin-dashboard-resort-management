import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Empty, Spin, message } from "antd";
import { request } from "../../util/request";
import { useDarkMode } from "../../util/DarkModeContext";
import { asList, paginationFrom } from "./roomHelpers";
import ReviewCard from "./reviews/ReviewCard";
import ReviewFilters from "./reviews/ReviewFilters";
import ReviewPagination from "./reviews/ReviewPagination";
import ReviewDetailModal from "./reviews/ReviewDetailModal";

const EMPTY_FILTERS = {
  rating: undefined,
  status: undefined,
  resort_id: undefined,
  branch_id: undefined,
  range: null,
};

export default function CustomerReviewRoom({ embedded = false }) {
  const dark = useDarkMode();
  const [reviews, setReviews] = useState([]);
  const [meta, setMeta] = useState({ current: 1, last: 1, perPage: 10, total: 0, from: 0, to: 0 });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resorts, setResorts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selected, setSelected] = useState(null);
  const requestSeq = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      const next = searchInput.trim();
      setSearch((prev) => {
        if (prev !== next) setPage(1);
        return next;
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("per_page", String(perPage));
    if (search) params.set("search", search);
    if (filters.rating != null) params.set("rating", String(filters.rating));
    if (filters.status) params.set("status", filters.status);
    if (filters.resort_id) params.set("resort_id", String(filters.resort_id));
    if (filters.branch_id) params.set("branch_id", String(filters.branch_id));
    if (filters.range?.[0]) params.set("date_from", filters.range[0].format("YYYY-MM-DD"));
    if (filters.range?.[1]) params.set("date_to", filters.range[1].format("YYYY-MM-DD"));
    return params.toString();
  }, [page, perPage, search, filters]);

  const load = useCallback(() => {
    const seq = ++requestSeq.current;
    setLoading(true);
    setError("");
    return request(`admin/reviews?${query}`, "get").then((res) => {
      if (seq !== requestSeq.current) return;
      if (res?.errors) {
        setReviews([]);
        setMeta({ current: 1, last: 1, perPage, total: 0, from: 0, to: 0 });
        setError(res.errors.message ?? "Unable to load reviews.");
        message.error(res.errors.message ?? "Unable to load reviews.");
      } else {
        setReviews(asList(res));
        setMeta(paginationFrom(res));
      }
      setLoading(false);
    });
  }, [query, perPage]);

  useEffect(() => {
    load();
    return () => { requestSeq.current += 1; };
  }, [load]);

  useEffect(() => {
    request("admin/resorts", "get").then((res) => { if (!res?.errors) setResorts(asList(res)); });
    request("admin/branches", "get").then((res) => { if (!res?.errors) setBranches(asList(res)); });
  }, []);

  const filterBranches = filters.resort_id
    ? branches.filter((b) => String(b.resort_id) === String(filters.resort_id))
    : branches;

  const hasFilters = Boolean(
    searchInput || filters.rating || filters.status || filters.resort_id || filters.branch_id || filters.range
  );

  const changeFilters = (patch) => {
    setFilters((prev) => ({ ...prev, ...patch }));
    setPage(1);
  };

  const resetFilters = () => {
    setSearchInput("");
    setSearch("");
    setFilters(EMPTY_FILTERS);
    setPage(1);
  };

  const titleCls = dark ? "text-gray-100" : "text-[#102A43]";
  const subText = dark ? "text-gray-400" : "text-[#829AB1]";
  const card = dark ? "bg-gray-800 border-gray-700" : "bg-white border-[#D9E2EC]";

  const wrapCls = embedded
    ? ""
    : `min-h-full rounded-xl p-4 transition-colors duration-200 ${dark ? "bg-gray-900" : "bg-[#F5F8FC]"}`;

  return (
    <div className={wrapCls} style={{ fontFamily: "Inter, Poppins, sans-serif" }}>
      {!embedded && (
        <div className="mb-5">
          <h2 className={`text-[26px] font-bold ${titleCls}`}>Customer Reviews</h2>
          <p className={`text-sm ${subText}`}>Manage and monitor customer feedback about resort rooms.</p>
        </div>
      )}
      {embedded && (
        <h3 className={`text-lg font-semibold mb-4 ${titleCls}`}>Customer Reviews</h3>
      )}

      <div className={`rounded-xl border shadow-sm p-4 mb-4 ${card}`}>
        <ReviewFilters
          searchInput={searchInput}
          onSearchChange={setSearchInput}
          filters={filters}
          onFilterChange={changeFilters}
          resorts={resorts}
          branches={filterBranches}
          hasFilters={hasFilters}
          onReset={resetFilters}
        />
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm flex items-center justify-between" role="alert">
          <span>{error}</span>
          <Button size="small" onClick={load}>Retry</Button>
        </div>
      )}

      {loading ? (
        <div className={`rounded-xl border min-h-[280px] flex items-center justify-center ${card}`}>
          <Spin />
        </div>
      ) : reviews.length === 0 ? (
        <div className={`rounded-xl border py-16 ${card}`}>
          <Empty
            description={hasFilters ? "No reviews match your current filters." : "No customer reviews found."}
          >
            {hasFilters && <Button onClick={resetFilters}>Reset filters</Button>}
          </Empty>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} onView={setSelected} />
            ))}
          </div>
          <ReviewPagination
            dark={dark}
            page={meta.current}
            lastPage={meta.last}
            from={meta.from}
            to={meta.to}
            total={meta.total}
            perPage={perPage}
            onPageChange={setPage}
            onPerPageChange={(n) => { setPerPage(n); setPage(1); }}
            itemLabel="reviews"
          />
        </>
      )}

      <ReviewDetailModal review={selected} open={Boolean(selected)} onClose={() => setSelected(null)} />
    </div>
  );
}
