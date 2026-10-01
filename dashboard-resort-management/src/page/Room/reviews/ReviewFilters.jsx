import { Button, DatePicker, Input, Select } from "antd";
import { MdSearch } from "react-icons/md";
import { REVIEW_STATUS_LABELS } from "./ReviewStatusBadge";

const RATINGS = [5, 4, 3, 2, 1];

export default function ReviewFilters({
  searchInput,
  onSearchChange,
  filters,
  onFilterChange,
  resorts,
  branches,
  hasFilters,
  onReset,
}) {
  return (
    <div className="flex flex-wrap gap-2 items-center">
      <div className="relative flex-1 min-w-[200px] max-w-md">
        <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-gray-400 pointer-events-none" />
        <Input
          value={searchInput}
          onChange={(e) => onSearchChange(e.target.value)}
          allowClear
          placeholder="Search customer, room, or booking…"
          className="pl-9"
        />
      </div>
      <Select
        allowClear
        placeholder="Rating"
        className="min-w-[110px]"
        value={filters.rating}
        options={RATINGS.map((n) => ({ value: n, label: `${n} star${n === 1 ? "" : "s"}` }))}
        onChange={(value) => onFilterChange({ rating: value })}
      />
      <Select
        allowClear
        placeholder="Status"
        className="min-w-[130px]"
        value={filters.status}
        options={Object.entries(REVIEW_STATUS_LABELS).map(([value, label]) => ({ value, label }))}
        onChange={(value) => onFilterChange({ status: value })}
      />
      <Select
        allowClear
        showSearch
        optionFilterProp="label"
        placeholder="Resort"
        className="min-w-[150px]"
        value={filters.resort_id}
        options={resorts.map((r) => ({ value: r.id, label: r.name }))}
        onChange={(value) => onFilterChange({ resort_id: value, branch_id: undefined })}
      />
      <Select
        allowClear
        showSearch
        optionFilterProp="label"
        placeholder="Branch"
        className="min-w-[150px]"
        value={filters.branch_id}
        options={branches.map((b) => ({ value: b.id, label: b.name }))}
        onChange={(value) => onFilterChange({ branch_id: value })}
      />
      <DatePicker.RangePicker
        value={filters.range}
        onChange={(value) => onFilterChange({ range: value })}
        className="min-w-[230px]"
      />
      {hasFilters && (
        <Button type="link" onClick={onReset}>Reset filters</Button>
      )}
    </div>
  );
}
