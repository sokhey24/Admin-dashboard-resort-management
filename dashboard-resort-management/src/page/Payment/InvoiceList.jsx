import { useEffect, useMemo, useState } from "react";
import { Button, message } from "antd";
import { MdSearch, MdPrint, MdClose } from "react-icons/md";
import { request } from "../../util/request";
import { useDarkMode } from "../../util/DarkModeContext";
import { fmtDateTime } from "../../util/fmtDateTime";
import { fmtAmt } from "./paymentHelpers";

function InvoiceView({ invoice, onClose, dark }) {
  const booking = invoice.booking ?? {};
  const print = () => window.print();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6 overflow-y-auto">
      <div className={`rounded-xl shadow-2xl w-full max-w-lg p-6 ${dark ? "bg-gray-800 border border-gray-700" : "bg-white"}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-base font-semibold ${dark ? "text-gray-100" : "text-[#102A43]"}`}>
            Invoice {invoice.invoice_number}
          </h3>
          <Button onClick={onClose}><MdClose size={14} /></Button>
        </div>
        <div className={`rounded-lg p-3 text-sm space-y-1 ${dark ? "bg-gray-700/50 text-gray-200" : "bg-[#F5F8FC] text-[#486581]"}`}>
          <div className="flex justify-between"><span>Booking</span><span>{booking.booking_code ?? "—"}</span></div>
          <div className="flex justify-between"><span>Guest</span><span>{booking.user?.name ?? "—"}</span></div>
          <div className="flex justify-between"><span>Stay</span><span>{fmtDateTime(booking.check_in)} → {fmtDateTime(booking.check_out)}</span></div>
          <div className="flex justify-between"><span>Subtotal</span><span>{fmtAmt(invoice.amount)}</span></div>
          <div className="flex justify-between"><span>Tax</span><span>{fmtAmt(invoice.tax)}</span></div>
          <div className="flex justify-between font-semibold"><span>Total</span><span>{fmtAmt(invoice.total)}</span></div>
          <div className="flex justify-between"><span>Paid / Balance</span><span>{fmtAmt(booking.deposit_amount)} / {fmtAmt(booking.balance_due)}</span></div>
          <div className="flex justify-between"><span>Status</span><span className="capitalize">{invoice.status}</span></div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button onClick={onClose}>Close</Button>
          <Button onClick={print} className="bg-[#FF6B00] text-white inline-flex items-center gap-1">
            <MdPrint size={14} /> Print
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function InvoiceList() {
  const dark = useDarkMode();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewing, setViewing] = useState(null);

  useEffect(() => {
    request("admin/invoices", "get").then((res) => {
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setRows(list);
      setLoading(false);
      if (res?.errors) message.error(res.errors.message ?? "Unable to load invoices.");
    });
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter((inv) =>
      !q ||
      inv.invoice_number?.toLowerCase().includes(q) ||
      inv.booking?.booking_code?.toLowerCase().includes(q) ||
      inv.booking?.user?.name?.toLowerCase().includes(q)
    );
  }, [rows, search]);

  const card = dark ? "bg-gray-800 border-gray-700" : "bg-white border-[#D9E2EC]";
  const titleCls = dark ? "text-gray-100" : "text-[#102A43]";

  return (
    <div className={`min-h-full rounded-xl p-4 ${dark ? "bg-gray-900" : "bg-[#F5F8FC]"}`} style={{ fontFamily: "Inter, Poppins, sans-serif" }}>
      <h2 className={`text-[26px] font-bold mb-5 ${titleCls}`}>Invoices</h2>
      <div className={`rounded-xl border overflow-hidden ${card}`}>
        <div className={`px-6 py-4 border-b flex justify-between ${dark ? "border-gray-700" : "border-[#D9E2EC]"}`}>
          <span className={`font-semibold ${titleCls}`}>{filtered.length} invoices</span>
          <div className="relative">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" className={`pl-9 pr-3 py-1.5 text-sm rounded-lg border ${dark ? "bg-gray-700 border-gray-600 text-gray-100" : "border-[#D9E2EC]"}`} />
          </div>
        </div>
        <table className="min-w-full">
          <thead className={dark ? "bg-gray-700/60 text-gray-400" : "bg-[#F5F8FC] text-[#829AB1]"}>
            <tr>
              {["Invoice", "Booking", "Guest", "Total", "Status", "Issued", "Action"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="py-12 text-center text-sm">Loading…</td></tr>
            ) : filtered.map((inv) => (
              <tr key={inv.id} className={dark ? "border-t border-gray-700" : "border-t border-[#D9E2EC]"}>
                <td className={`px-4 py-3 text-sm ${titleCls}`}>{inv.invoice_number}</td>
                <td className="px-4 py-3 text-sm">{inv.booking?.booking_code ?? "—"}</td>
                <td className="px-4 py-3 text-sm">{inv.booking?.user?.name ?? "—"}</td>
                <td className="px-4 py-3 text-sm">{fmtAmt(inv.total)}</td>
                <td className="px-4 py-3 text-sm capitalize">{inv.status}</td>
                <td className="px-4 py-3 text-sm">{inv.issued_at ? fmtDateTime(inv.issued_at) : "—"}</td>
                <td className="px-4 py-3">
                  <Button onClick={() => setViewing(inv)} className="text-xs">View / Print</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {viewing && <InvoiceView invoice={viewing} onClose={() => setViewing(null)} dark={dark} />}
    </div>
  );
}
