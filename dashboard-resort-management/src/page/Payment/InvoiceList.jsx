import { useEffect, useMemo, useState } from "react";
import { Button, message } from "antd";
import { MdSearch, MdPrint, MdVisibility } from "react-icons/md";
import { request } from "../../util/request";
import { useCatalogStore, withBranchScope } from "../../store/CatalogStore";
import { useDarkMode } from "../../util/DarkModeContext";
import { fmtDateTime } from "../../util/fmtDateTime";
import { fmtAmt } from "./paymentHelpers";
import InvoiceViewModal from "./InvoiceViewModal";

const PAGE_SIZE = 8;

export default function InvoiceList() {
  const dark = useDarkMode();
  const selectedBranchId = useCatalogStore((s) => s.selectedBranchId);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [viewingId, setViewingId] = useState(null);
  const [printOnOpen, setPrintOnOpen] = useState(false);

  const openView = (id, print = false) => {
    setPrintOnOpen(print);
    setViewingId(id);
  };

  const closeView = () => {
    setViewingId(null);
    setPrintOnOpen(false);
  };

  useEffect(() => {
    setLoading(true);
    request(withBranchScope("admin/invoices", selectedBranchId), "get").then((res) => {
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setRows(list);
      setLoading(false);
      if (res?.errors) message.error(res.errors.message ?? "Unable to load invoices.");
    });
  }, [selectedBranchId]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter(
      (inv) =>
        !q ||
        inv.invoice_number?.toLowerCase().includes(q) ||
        inv.booking?.booking_code?.toLowerCase().includes(q) ||
        inv.booking?.user?.name?.toLowerCase().includes(q)
    );
  }, [rows, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const card = dark ? "bg-gray-800 border-gray-700" : "bg-white border-[#D9E2EC]";
  const cardHdr = dark ? "border-gray-700" : "border-[#D9E2EC]";
  const titleCls = dark ? "text-gray-100" : "text-[#102A43]";
  const subText = dark ? "text-gray-400" : "text-[#829AB1]";
  const pageBtn = dark
    ? "px-3 py-1.5 rounded-[8px] border border-gray-600 text-xs font-semibold hover:bg-gray-700 disabled:opacity-40 text-gray-300"
    : "px-3 py-1.5 rounded-[8px] border border-[#D9E2EC] text-xs font-semibold hover:bg-[#F5F8FC] disabled:opacity-40";

  return (
    <div
      className={`min-h-full rounded-xl p-4 ${dark ? "bg-gray-900" : "bg-[#F5F8FC]"}`}
      style={{ fontFamily: "Inter, Poppins, sans-serif" }}
    >
      <h2 className={`text-[26px] font-bold mb-5 ${titleCls}`}>Invoices</h2>
      <div className={`rounded-xl border overflow-hidden ${card}`}>
        <div
          className={`px-4 sm:px-6 py-4 border-b flex flex-col sm:flex-row sm:justify-between gap-3 ${cardHdr}`}
        >
          <span className={`font-semibold ${titleCls}`}>{filtered.length} invoices</span>
          <div className="relative w-full sm:w-auto">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search invoice, booking, guest…"
              className={`w-full sm:w-56 pl-9 pr-3 py-1.5 text-sm rounded-lg border ${
                dark ? "bg-gray-700 border-gray-600 text-gray-100" : "border-[#D9E2EC]"
              }`}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className={dark ? "bg-gray-700/60 text-gray-400" : "bg-[#F5F8FC] text-[#829AB1]"}>
              <tr>
                {["No.", "Invoice", "Booking", "Guest", "Total", "Status", "Issued", "Action"].map((h) => (
                  <th
                    key={h}
                    className={`px-4 py-3 text-left text-xs uppercase whitespace-nowrap ${h === "No." ? "w-12" : ""} ${h === "Action" ? "text-center" : ""}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className={`py-12 text-center text-sm ${subText}`}>Loading…</td>
                </tr>
              ) : pageItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className={`py-12 text-center text-sm ${subText}`}>No invoices found</td>
                </tr>
              ) : (
                pageItems.map((inv, idx) => (
                  <tr key={inv.id} className={dark ? "border-t border-gray-700" : "border-t border-[#D9E2EC]"}>
                    <td className={`px-4 py-3 text-sm ${subText}`}>{(page - 1) * PAGE_SIZE + idx + 1}</td>
                    <td className={`px-4 py-3 text-sm whitespace-nowrap font-medium ${titleCls}`}>{inv.invoice_number}</td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">{inv.booking?.booking_code ?? "—"}</td>
                    <td className="px-4 py-3 text-sm">{inv.booking?.user?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">{fmtAmt(inv.total)}</td>
                    <td className="px-4 py-3 text-sm capitalize whitespace-nowrap">{inv.status}</td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                      {inv.issued_at ? fmtDateTime(inv.issued_at) : "—"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <Button onClick={() => openView(inv.id, false)} className="text-xs inline-flex items-center gap-1">
                          <MdVisibility size={14} /> View
                        </Button>
                        <Button
                          onClick={() => openView(inv.id, true)}
                          className="text-xs inline-flex items-center gap-1 bg-[#FF6B00] text-white hover:!bg-[#e05e00]"
                        >
                          <MdPrint size={14} /> Print
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className={`px-6 py-3 border-t flex items-center justify-between text-sm ${cardHdr} ${subText}`}>
          <span>Page {page} of {totalPages} · {filtered.length} records</span>
          <div className="flex items-center gap-1">
            <Button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className={pageBtn}>
              Previous
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                  page === p ? "bg-[#FF6B00] text-white" : dark ? "hover:bg-gray-700 text-gray-400" : "hover:bg-[#F5F8FC] text-[#486581]"
                }`}
              >
                {p}
              </Button>
            ))}
            <Button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className={pageBtn}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      <InvoiceViewModal
        invoiceId={viewingId}
        open={!!viewingId}
        onClose={closeView}
        dark={dark}
        autoPrint={printOnOpen}
      />
    </div>
  );
}
