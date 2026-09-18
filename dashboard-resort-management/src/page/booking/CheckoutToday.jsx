import { useEffect, useMemo, useState } from "react";
import { Select, InputNumber, message, Button } from "antd";
import { MdSearch, MdDelete, MdClose, MdPayment, MdLogout } from "react-icons/md";
import { request } from "../../util/request";
import { useDarkMode } from "../../util/DarkModeContext";
import ConfirmDialog from "../../components/ConfirmDialog";
import { fmtDateTime } from "../../util/fmtDateTime";
import { PAY_METHODS, fmtAmt } from "../Payment/paymentHelpers";

const PAGE_SIZE = 8;

const STATUS_STYLE = {
  pending:     { dot: "bg-yellow-500", light: "bg-yellow-50 text-yellow-700 ring-yellow-200",   dark: "bg-yellow-900/40 text-yellow-400 ring-yellow-700" },
  confirmed:   { dot: "bg-green-500",  light: "bg-green-50 text-green-700 ring-green-200",       dark: "bg-green-900/40 text-green-400 ring-green-700"   },
  checked_in:  { dot: "bg-blue-500",   light: "bg-blue-50 text-blue-700 ring-blue-200",          dark: "bg-blue-900/40 text-blue-400 ring-blue-700"      },
  checked_out: { dot: "bg-purple-500", light: "bg-purple-50 text-purple-700 ring-purple-200",    dark: "bg-purple-900/40 text-purple-400 ring-purple-700" },
  completed:   { dot: "bg-blue-500",   light: "bg-blue-50 text-blue-700 ring-blue-200",          dark: "bg-blue-900/40 text-blue-400 ring-blue-700"      },
  cancelled:   { dot: "bg-red-500",    light: "bg-red-50 text-red-700 ring-red-200",             dark: "bg-red-900/40 text-red-400 ring-red-700"         },
};

function BadgeWithDot({ status, dark }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ring-1 ${dark ? s.dark : s.light}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
    </span>
  );
}

function CollectPaymentModal({ booking, onClose, onSaved, dark }) {
  const [saving, setSaving] = useState(false);
  const remaining = Number(booking.balance_due ?? booking.total_amount ?? 0);
  const [amount, setAmount] = useState(remaining > 0 ? remaining : "");
  const [method, setMethod] = useState("cash");
  const methods = PAY_METHODS.filter((m) => m.value);

  const handleSave = async () => {
    if (remaining <= 0) {
      message.error("This booking has no remaining balance.");
      return;
    }
    setSaving(true);
    const res = await request("admin/payments", "post", {
      booking_id: booking.id,
      payment_method: method,
      amount: Number(amount),
      status: "paid",
    });
    setSaving(false);
    if (res?.errors) {
      message.error(res.errors.message ?? "Payment failed.");
      return;
    }
    message.success("Payment Successfully.");
    onSaved();
    onClose();
  };

  const modalClass = `rounded-xl shadow-2xl w-full max-w-md p-6 ${dark ? "bg-gray-800 border border-gray-700" : "bg-white"}`;
  const titleClass = `text-base font-semibold ${dark ? "text-gray-100" : "text-[#102A43]"}`;
  const labelClass = `block text-xs font-semibold mb-1 ${dark ? "text-gray-300" : "text-[#486581]"}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className={modalClass}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={titleClass}>Collect Payment</h3>
          <Button onClick={onClose}><MdClose size={14} /></Button>
        </div>
        <p className={`text-sm mb-4 ${dark ? "text-gray-300" : "text-[#486581]"}`}>
          {booking.booking_code ?? `BK-${booking.id}`} · {booking.user?.name ?? "Guest"}
        </p>
        <div className={`rounded-lg p-3 mb-4 text-xs ${dark ? "bg-gray-700/50" : "bg-[#F5F8FC]"}`}>
          <div className="flex justify-between"><span>Total</span><span>{fmtAmt(booking.total_amount)}</span></div>
          <div className="flex justify-between"><span>Paid</span><span>{fmtAmt(booking.deposit_amount)}</span></div>
          <div className="flex justify-between font-semibold"><span>Remaining</span><span>{fmtAmt(remaining)}</span></div>
        </div>
        <label className={labelClass}>Payment method</label>
        <Select className="w-full mb-3" value={method} onChange={setMethod} options={methods} />
        <label className={labelClass}>Amount (validated on server)</label>
        <InputNumber className="w-full mb-4" min={0.01} step={0.01} max={remaining} value={amount} onChange={setAmount} />
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || remaining <= 0} className="bg-[#FF6B00] text-white">
            {saving ? "Saving…" : " Payment "}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutToday() {
  const dark = useDarkMode();
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [page,     setPage]     = useState(1);
  const [confirm, setConfirm] = useState(null);
  const [paying, setPaying] = useState(null);

  const load = async () => {
    setLoading(true);
    const res = await request("admin/bookings?filter=checkout_today", "get");
    if (res?.data) setBookings(res.data);
    setLoading(false);
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  const handleConfirm = async () => {
    if (!confirm) return;
    setConfirm(c => ({ ...c, loading: true }));
    if (confirm.type === "complete") {
      const res = await request(`admin/bookings/${confirm.booking.id}`, "put", { status: "completed" });
      if (res?.errors) message.error(res.errors.message ?? res.errors.status?.[0] ?? "Cannot complete checkout.");
      else message.success("Checkout completed. Room is available.");
      setConfirm(null);
      load();
      return;
    }
    const res = await request(`admin/bookings/${confirm.booking.id}`, "delete");
    if (!res?.errors) message.success("Deleted");
    else message.error(res.errors.message ?? "Failed");
    setConfirm(null);
    load();
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return bookings.filter(b =>
      !q || b.user?.name?.toLowerCase().includes(q) ||
      b.rooms?.[0]?.room_number?.toLowerCase().includes(q) ||
      b.check_out?.includes(q) || b.status?.includes(q)
    );
  }, [bookings, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const checkedOut = bookings.filter(b => b.status === "checked_out" || b.status === "completed").length;
  const due        = bookings.filter(b => b.status !== "checked_out" && b.status !== "completed").length;

  const card      = dark ? "bg-gray-800 border-gray-700"  : "bg-white border-[#D9E2EC]";
  const cardHdr   = dark ? "border-gray-700"               : "border-[#D9E2EC]";
  const titleCls  = dark ? "text-gray-100"                 : "text-[#102A43]";
  const subText   = dark ? "text-gray-400"                 : "text-[#829AB1]";
  const thead     = dark ? "bg-gray-700/60"                : "bg-[#F5F8FC]";
  const thText    = dark ? "text-gray-400"                 : "text-[#829AB1]";
  const tbody     = dark ? "bg-gray-800 divide-gray-700"   : "bg-white divide-gray-100";
  const rowHover  = dark ? "hover:bg-gray-700/50"          : "hover:bg-[#F5F8FC]";
  const cellText  = dark ? "text-gray-300"                 : "text-[#486581]";
  const cellMuted = dark ? "text-[#829AB1]"                 : "text-[#829AB1]";
  const divider   = dark ? "divide-gray-700"               : "divide-gray-200";
  const searchCls = dark
    ? "pl-9 pr-3 py-1.5 text-sm border border-gray-600 bg-gray-700 text-gray-100 placeholder-[#829AB1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30 w-48"
    : "pl-9 pr-3 py-1.5 text-sm border border-[#D9E2EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30 w-48";
  const pageBtn   = dark
    ? "px-3 py-1.5 rounded-[8px] border border-gray-600 text-xs font-semibold hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-gray-300"
    : "px-3 py-1.5 rounded-[8px] border border-[#D9E2EC] text-xs font-semibold hover:bg-[#F5F8FC] disabled:opacity-40 disabled:cursor-not-allowed";

  const confirmConfig = {
    delete: { title: "Delete Booking", confirmText: "Yes, Delete", danger: true, sub: "This action cannot be undone." },
    complete: { title: "Complete Checkout", confirmText: "Complete", danger: false, sub: "Requires a zero balance. Room will be set available." },
  };

  return (
    <div className={`min-h-full rounded-xl p-4 transition-colors duration-200 ${dark ? "bg-gray-900" : "bg-[#F5F8FC]"}`} style={{ fontFamily: "Inter, Poppins, sans-serif" }}>
      <h2 className={`text-[26px] font-bold mb-5 ${titleCls}`}>Check-out Today</h2>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Check-outs Today", value: bookings.length, color: "#1677ff" },
          { label: "Checked Out",            value: checkedOut,      color: "#52c41a" },
          { label: "Due",                    value: due,             color: "#faad14" },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border p-4 ${card}`}>
            <p className={`text-xs font-medium uppercase tracking-wide mb-1 ${subText}`}>{s.label}</p>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className={`rounded-xl shadow-sm border overflow-hidden ${card}`}>
        <div className={`px-6 py-4 border-b flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${cardHdr}`}>
          <div className="flex items-center gap-2">
            <span className={`text-[18px] font-semibold ${titleCls}`}>Check-outs — {new Date().toDateString()}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ring-1 ${dark ? "bg-blue-900/40 text-blue-400 ring-blue-700" : "bg-blue-50 text-blue-700 ring-blue-200"}`}>
              {filtered.length} records
            </span>
          </div>
          <div className="relative">
            <MdSearch className={`absolute left-3 top-1/2 -translate-y-1/2 text-lg ${dark ? "text-gray-400" : "text-gray-400"}`} />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search guest, room…" className={searchCls} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className={`min-w-full divide-y ${divider}`}>
            <thead className={thead}>
              <tr>
                {["No.", "Guest", "Room", "Check-in", "Check-out", "Balance", "Status", "Action"].map(h => (
                  <th key={h} className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${thText} ${h === "No." ? "w-12 px-4" : ""} ${h === "Action" ? "text-center" : ""}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className={`${tbody} divide-y`}>
              {loading ? (
                <tr><td colSpan={8} className={`py-16 text-center text-sm ${subText}`}>Loading…</td></tr>
              ) : pageItems.length === 0 ? (
                <tr><td colSpan={8} className={`py-16 text-center text-sm ${subText}`}>No check-outs found</td></tr>
              ) : pageItems.map((b, idx) => (
                <tr key={b.id} className={`transition-colors ${rowHover}`}>
                  <td className={`px-4 py-4 text-sm font-medium ${cellMuted}`}>{(page - 1) * PAGE_SIZE + idx + 1}</td>
                  <td className={`px-6 py-4 text-sm font-medium ${titleCls}`}>{b.user?.name ?? "—"}</td>
                  <td className={`px-6 py-4 text-sm ${cellText}`}>{b.rooms?.[0]?.room_number ?? "—"}</td>
                  <td className={`px-6 py-4 text-sm ${cellText}`}>{fmtDateTime(b.check_in)}</td>
                  <td className={`px-6 py-4 text-sm ${cellText}`}>{fmtDateTime(b.check_out)}</td>
                  <td className={`px-6 py-4 text-sm ${cellText}`}>{fmtAmt(b.balance_due)}</td>
                  <td className="px-6 py-4 whitespace-nowrap"><BadgeWithDot status={b.status} dark={dark} /></td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-1.5">
                      <Button onClick={() => setPaying(b)}
                        disabled={Number(b.balance_due ?? 0) <= 0}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${dark ? "bg-green-900/40 text-green-400 hover:bg-green-900/70" : "bg-green-50 text-green-700 hover:bg-green-100"}`}>
                        <MdPayment size={14} /> Payment
                      </Button>
                      <Button onClick={() => setConfirm({ booking: b, type: "complete", loading: false })}
                        disabled={b.status !== "checked_in" || Number(b.balance_due ?? 0) > 0.009}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${dark ? "bg-purple-900/40 text-purple-400 hover:bg-purple-900/70" : "bg-purple-50 text-purple-700 hover:bg-purple-100"}`}>
                        <MdLogout size={14} /> Complete
                      </Button>
                      <Button onClick={() => setConfirm({ booking: b, type: "delete", loading: false })}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${dark ? "bg-red-900/40 text-red-400 hover:bg-red-900/70" : "bg-red-50 text-red-600 hover:bg-red-100"}`}>
                        <MdDelete size={14} /> Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={`px-6 py-3 border-t flex items-center justify-between text-sm ${cardHdr} ${subText}`}>
          <span>Page {page} of {totalPages} · {filtered.length} records</span>
          <div className="flex items-center gap-1">
            <Button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className={pageBtn}>Previous</Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <Button key={p} onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${page === p ? "bg-[#FF6B00] text-white" : dark ? "hover:bg-gray-700 text-gray-400" : "hover:bg-[#F5F8FC] text-[#486581]"}`}>{p}</Button>
            ))}
            <Button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className={pageBtn}>Next</Button>
          </div>
        </div>
      </div>

      {paying && <CollectPaymentModal booking={paying} onClose={() => setPaying(null)} onSaved={load} dark={dark} />}

      {confirm && (() => {
        const cfg = confirmConfig[confirm.type];
        const name = confirm.booking.user?.name ?? "this guest";
        const code = confirm.booking.booking_code ?? `BK-${confirm.booking.id}`;
        return (
          <ConfirmDialog open dark={dark} title={cfg.title}
            message={`Are you sure you want to ${confirm.type === "complete" ? "complete checkout for" : "delete"} booking ${code} for ${name}?`}
            sub={cfg.sub} confirmText={cfg.confirmText} danger={cfg.danger}
            loading={confirm.loading} onConfirm={handleConfirm} onCancel={() => setConfirm(null)} />
        );
      })()}
    </div>
  );
}
