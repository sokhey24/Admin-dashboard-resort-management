import { useEffect, useState } from "react";
import { DatePicker, Button, Input, Select } from "antd";
import dayjs from "dayjs";
import { FaFilter, FaSearch } from "react-icons/fa";

const EMPTY_FILTER = { date: null, month: null, year: null };

function filtersEqual(a, b) {
  return (
    (a?.date ?? null) === (b?.date ?? null) &&
    (a?.month ?? null) === (b?.month ?? null) &&
    (a?.year ?? null) === (b?.year ?? null)
  );
}

function hasFilterValue(f) {
  return Boolean(f?.date || f?.month || f?.year);
}

export function buildQS(f) {
  const p = new URLSearchParams();
  if (f.date)  p.set("date",  f.date);
  if (f.month) p.set("month", f.month);
  if (f.year)  p.set("year",  f.year);
  if (f.branchId) p.set("branch_id", String(f.branchId));
  const s = p.toString();
  return s ? `?${s}` : "";
}

export function DateFilter({ filter, onChange, dark }) {
  const applied = filter ?? EMPTY_FILTER;
  const [draft, setDraft] = useState(applied);

  useEffect(() => {
    setDraft(applied);
  }, [applied.date, applied.month, applied.year]);

  const inputCls = dark ? "[&_.ant-picker]:bg-gray-700 [&_.ant-picker]:border-gray-600 [&_.ant-picker_input>input]:text-gray-200" : "";

  const applyFilter = () => {
    onChange({ ...draft });
  };

  const clearFilter = () => {
    setDraft(EMPTY_FILTER);
    onChange(EMPTY_FILTER);
  };

  const canApply = !filtersEqual(draft, applied);
  const canClear = hasFilterValue(draft) || hasFilterValue(applied);

  return (
    <div className={`flex flex-wrap items-center gap-3 mb-5 p-3 rounded-xl border ${dark ? "bg-gray-800 border-gray-700" : "bg-white border-[#D9E2EC] shadow-sm"} ${inputCls}`}>
      <span className={`flex items-center gap-1 text-xs font-semibold uppercase tracking-wide ${dark ? "text-gray-400" : "text-[#829AB1]"}`}><FaFilter size={14} /> Filter by:</span>
      <DatePicker
        placeholder="Select Day"
        value={draft.date ? dayjs(draft.date) : null}
        onChange={(_, s) => setDraft({ date: s || null, month: null, year: null })}
        allowClear
        size="small"
      />
      <DatePicker.MonthPicker
        placeholder="Select Month"
        value={draft.month && draft.year ? dayjs(`${draft.year}-${String(draft.month).padStart(2, "0")}`) : null}
        onChange={(d) => setDraft({ date: null, month: d ? d.month() + 1 : null, year: d ? d.year() : null })}
        allowClear
        size="small"
      />
      <DatePicker.YearPicker
        placeholder="Select Year"
        value={draft.year && !draft.month ? dayjs(String(draft.year)) : null}
        onChange={(d) => setDraft({ date: null, month: null, year: d ? d.year() : null })}
        allowClear
        size="small"
      />
      <Button type="primary" size="small" onClick={applyFilter} disabled={!canApply}>
        Filter
      </Button>
      <Button danger size="small" onClick={clearFilter} disabled={!canClear}>
        Clear
      </Button>
    </div>
  );
}

// SearchBar — generic search + optional select filter
export function SearchBar({ value, onChange, placeholder = "Search…", dark, selectValue, onSelectChange, selectOptions, selectPlaceholder }) {
  return (
    <div className={`flex flex-wrap gap-2 px-4 py-3 border-b ${dark ? "border-gray-700 bg-gray-700/30" : "border-gray-100 bg-[#F5F8FC]"}`}>
      <Input
        prefix={<FaSearch size={14} className="text-gray-400" />}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        allowClear
        size="small"
        className="flex-1 min-w-[160px]"
        style={dark ? { background: "#374151", borderColor: "#4b5563", color: "#e5e7eb" } : {}}
      />
      {selectOptions && (
        <Select
          placeholder={selectPlaceholder ?? "Filter…"}
          value={selectValue}
          onChange={onSelectChange}
          allowClear
          size="small"
          style={{ minWidth: 140 }}
          options={selectOptions}
        />
      )}
    </div>
  );
}
