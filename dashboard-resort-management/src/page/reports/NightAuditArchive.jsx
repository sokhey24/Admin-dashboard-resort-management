import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, DatePicker, Select, Modal, message, Tag, Empty } from "antd";
import dayjs from "dayjs";
import { FaMoon, FaPlay } from "react-icons/fa";
import { request } from "../../util/request";
import { fmtAmt } from "../Payment/paymentHelpers";
import { fmtDateTime } from "../../util/fmtDateTime";

const STATUS_COLOR = {
  completed: "success",
  failed: "error",
  running: "processing",
  pending: "default",
};

export default function NightAuditArchive({ dark, resortId, branches }) {
  const [dateFrom, setDateFrom] = useState(dayjs().subtract(30, "day"));
  const [dateTo, setDateTo] = useState(dayjs());
  const [branchId, setBranchId] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [runOpen, setRunOpen] = useState(false);
  const [runDate, setRunDate] = useState(dayjs().subtract(1, "day"));
  const [runBranch, setRunBranch] = useState(null);
  const [running, setRunning] = useState(false);

  const branchOptions = useMemo(() => {
    const list = Array.isArray(branches) ? branches : [];
    const filtered = resortId
      ? list.filter((b) => String(b.resort_id) === String(resortId))
      : list;
    return filtered.map((b) => ({ value: b.id, label: b.name }));
  }, [branches, resortId]);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (dateFrom) params.set("date_from", dateFrom.format("YYYY-MM-DD"));
    if (dateTo) params.set("date_to", dateTo.format("YYYY-MM-DD"));
    if (branchId) params.set("branch_id", String(branchId));
    if (resortId) params.set("resort_id", String(resortId));
    params.set("per_page", "25");

    request(`admin/reports/night-audits?${params}`, "get")
      .then((res) => {
        if (res?.success) {
          setRows(res.data?.rows ?? []);
        } else {
          setRows([]);
          message.error(res?.errors?.message ?? "Failed to load night audits");
        }
      })
      .finally(() => setLoading(false));
  }, [dateFrom, dateTo, branchId, resortId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRun = () => {
    setRunning(true);
    request("admin/reports/night-audits/run", "post", {
      date: runDate?.format("YYYY-MM-DD"),
      branch_id: runBranch || undefined,
      confirm: true,
    })
      .then((res) => {
        if (res?.success) {
          message.success("Night audit finished");
          setRunOpen(false);
          load();
        } else {
          message.error(res?.errors?.message ?? res?.message ?? "Night audit failed");
        }
      })
      .catch(() => message.error("Night audit request failed"))
      .finally(() => setRunning(false));
  };

  const border = dark ? "border-gray-700" : "border-[#D9E2EC]";
  const head = dark ? "text-gray-100" : "text-[#102A43]";
  const muted = dark ? "text-gray-400" : "text-[#829AB1]";

  return (
    <div className={`rounded-xl border overflow-hidden mt-8 ${dark ? "bg-gray-800" : "bg-white shadow-sm"} ${border}`}>
      <div className={`px-5 py-4 border-b flex flex-wrap items-center justify-between gap-3 ${border}`}>
        <div>
          <h3 className={`text-sm font-semibold flex items-center gap-2 ${head}`}>
            <FaMoon className="opacity-80" /> Night Audit Archive
          </h3>
          <p className={`text-xs mt-0.5 ${muted}`}>
            End-of-day snapshots (occupancy, earned room revenue, incidentals). Re-runs update the same branch/date record.
          </p>
        </div>
        <Button type="primary" icon={<FaPlay />} onClick={() => setRunOpen(true)}>
          Run night audit
        </Button>
      </div>

      <div className="px-5 py-4 flex flex-wrap gap-3 items-end">
        <div>
          <span className={`text-xs block mb-1 ${muted}`}>From</span>
          <DatePicker value={dateFrom} onChange={setDateFrom} />
        </div>
        <div>
          <span className={`text-xs block mb-1 ${muted}`}>To</span>
          <DatePicker value={dateTo} onChange={setDateTo} />
        </div>
        <div>
          <span className={`text-xs block mb-1 ${muted}`}>Branch</span>
          <Select
            allowClear
            placeholder="All branches"
            style={{ minWidth: 180 }}
            options={branchOptions}
            value={branchId}
            onChange={setBranchId}
          />
        </div>
        <Button onClick={load} loading={loading}>Refresh</Button>
      </div>

      <div className="overflow-x-auto px-5 pb-5">
        {loading && !rows.length ? (
          <p className={`text-sm py-8 text-center ${muted}`}>Loading…</p>
        ) : rows.length === 0 ? (
          <Empty description="No night audit reports yet" className="py-8" />
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className={muted}>
                <th className="text-left py-2 pr-2">Date</th>
                <th className="text-left py-2 pr-2">Branch</th>
                <th className="text-right py-2 pr-2">Occ %</th>
                <th className="text-right py-2 pr-2">Occ / Sell</th>
                <th className="text-right py-2 pr-2">Room rev.</th>
                <th className="text-right py-2 pr-2">Incidentals</th>
                <th className="text-right py-2 pr-2">ADR</th>
                <th className="text-right py-2 pr-2">RevPAR</th>
                <th className="text-right py-2 pr-2">No-shows</th>
                <th className="text-left py-2 pr-2">Status</th>
                <th className="text-left py-2">Generated</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className={`border-t ${border}`}>
                  <td className={`py-2 pr-2 tabular-nums ${head}`}>{r.operational_date}</td>
                  <td className={`py-2 pr-2 ${head}`}>{r.branch?.name ?? r.branch_name ?? "—"}</td>
                  <td className="py-2 pr-2 text-right tabular-nums">{Number(r.occupancy_rate).toFixed(1)}%</td>
                  <td className="py-2 pr-2 text-right tabular-nums">
                    {r.occupied_rooms}/{r.sellable_rooms}
                  </td>
                  <td className="py-2 pr-2 text-right tabular-nums">{fmtAmt(r.room_revenue)} {r.currency}</td>
                  <td className="py-2 pr-2 text-right tabular-nums">{fmtAmt(r.incidental_revenue)}</td>
                  <td className="py-2 pr-2 text-right tabular-nums">{fmtAmt(r.adr)}</td>
                  <td className="py-2 pr-2 text-right tabular-nums">{fmtAmt(r.revpar)}</td>
                  <td className="py-2 pr-2 text-right tabular-nums">{r.no_show_count}</td>
                  <td className="py-2 pr-2">
                    <Tag color={STATUS_COLOR[r.status] ?? "default"}>{r.status}</Tag>
                    {r.status === "failed" && r.error_message && (
                      <span className={`block text-[10px] mt-0.5 max-w-[140px] truncate ${muted}`} title={r.error_message}>
                        {r.error_message}
                      </span>
                    )}
                  </td>
                  <td className={`py-2 text-[10px] ${muted}`}>
                    {r.generated_at ? fmtDateTime(r.generated_at) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        title="Run night audit"
        open={runOpen}
        onCancel={() => !running && setRunOpen(false)}
        onOk={handleRun}
        okText="Confirm run"
        confirmLoading={running}
      >
        <p className="text-sm mb-4 text-gray-600">
          Processes eligible no-shows for the operational date and refreshes the daily snapshot.
          Safe to re-run; side effects are deduplicated.
        </p>
        <div className="space-y-3">
          <div>
            <span className="text-xs text-gray-500 block mb-1">Operational date</span>
            <DatePicker className="w-full" value={runDate} onChange={setRunDate} />
          </div>
          <div>
            <span className="text-xs text-gray-500 block mb-1">Branch (optional)</span>
            <Select
              allowClear
              className="w-full"
              placeholder="All active branches"
              options={branchOptions}
              value={runBranch}
              onChange={setRunBranch}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
