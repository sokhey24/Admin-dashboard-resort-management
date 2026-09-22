import { useEffect, useRef, useState } from "react";
import { Modal, Spin, message } from "antd";
import { MdClose, MdPrint, MdPictureAsPdf, MdDownload, MdVisibility } from "react-icons/md";
import { request } from "../../util/request";
import { usePermission } from "../../util/usePermission";
import { fmtDateTime } from "../../util/fmtDateTime";
import PaymentReceiptPDF from "./PaymentReceiptPDF";

// ── Helpers ────────────────────────────────────────────────────
const fmtAmt = (v) =>
  `$${Number(v ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const STATUS_COLOR = {
  paid:      "text-green-500",
  pending:   "text-yellow-500",
  partial:   "text-blue-500",
  refunded:  "text-orange-500",
  cancelled: "text-gray-500",
  failed:    "text-red-500",
};

function InfoRow({ label, value, dark, colorCls }) {
  return (
    <div className="flex items-start justify-between py-1.5 gap-4">
      <span className={`text-xs shrink-0 ${dark ? "text-gray-400" : "text-[#829AB1]"}`}>{label}</span>
      <span className={`text-xs font-medium text-right break-all ${colorCls ?? (dark ? "text-gray-200" : "text-[#102A43]")}`}>
        {value ?? "—"}
      </span>
    </div>
  );
}

function Section({ title, children, dark }) {
  return (
    <div className={`rounded-lg border p-3 mb-3 ${dark ? "border-gray-700 bg-gray-800/60" : "border-[#D9E2EC] bg-[#F5F8FC]"}`}>
      <p className={`text-[11px] font-semibold uppercase tracking-wider mb-2 ${dark ? "text-gray-400" : "text-[#829AB1]"}`}>
        {title}
      </p>
      {children}
    </div>
  );
}

// ── Actions per status (plain function, not a hook) ──────────
function getActions(status, can) {
  const s = status?.toLowerCase();
  const actions = [];
  if (can("payments.view"))   actions.push({ key: "view",     label: "View Receipt",         icon: <MdVisibility size={14} /> });
  if (s === "paid") {
    if (can("payments.print")) actions.push({ key: "print",   label: "Print Receipt",        icon: <MdPrint size={14} /> });
    if (can("payments.pdf"))   actions.push({ key: "pdf",     label: "Generate PDF",         icon: <MdPictureAsPdf size={14} /> });
    if (can("payments.pdf"))   actions.push({ key: "download",label: "Download PDF",         icon: <MdDownload size={14} /> });
    if (can("payments.refund")) actions.push({ key: "refund",  label: "Refund Payment",       icon: <MdClose size={14} /> });
  }
  if (s === "partial") {
    if (can("payments.print")) actions.push({ key: "print",   label: "Print Partial Receipt", icon: <MdPrint size={14} /> });
    if (can("payments.pdf"))   actions.push({ key: "pdf",     label: "Generate Partial PDF",  icon: <MdPictureAsPdf size={14} /> });
  }
  if (s === "pending") {
    if (can("payments.print")) actions.push({ key: "print",   label: "Print",                icon: <MdPrint size={14} /> });
    if (can("payments.pdf"))   actions.push({ key: "pdf",     label: "Generate PDF",         icon: <MdPictureAsPdf size={14} /> });
  }
  if (s === "refunded") {
    if (can("payments.print")) actions.push({ key: "print",   label: "Print Refund Receipt", icon: <MdPrint size={14} /> });
    if (can("payments.pdf"))   actions.push({ key: "pdf",     label: "Generate Refund PDF",  icon: <MdPictureAsPdf size={14} /> });
    if (can("payments.pdf"))   actions.push({ key: "download",label: "Download Refund PDF",  icon: <MdDownload size={14} /> });
  }
  if (s === "cancelled") {
    if (can("payments.print")) actions.push({ key: "print",   label: "Print Cancellation",   icon: <MdPrint size={14} /> });
  }
  return actions;
}

// ── ActionDropdown (exported for table row use) ────────────────
export function ActionDropdown({ payment, dark, onView, onRefunded }) {
  const [open, setOpen]     = useState(false);
  const [pdfBusy, setPdf]   = useState(false);
  const ref                 = useRef(null);
  const { can }             = usePermission();

  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const handleAction = async (key) => {
    setOpen(false);
    if (key === "view")  { onView(payment);         return; }
    if (key === "print") { onView(payment, "print"); return; }

    if (key === "refund") {
      const amt = Number(payment?.breakdown?.paid ?? payment?.amount ?? 0);
      if (!window.confirm(`Refund ${payment.payment_id} for $${amt.toFixed(2)}?`)) return;
      message.loading({ content: "Processing refund…", key: "refund_row" });
      const res = await request(`admin/payments/${payment.id}/refund`, "post", { refund_amount: amt });
      if (res?.errors) {
        message.error({ content: res.errors.message ?? "Refund failed.", key: "refund_row" });
        return;
      }
      message.success({ content: "Refund processed.", key: "refund_row" });
      onRefunded?.();
      return;
    }

    if (key === "pdf" || key === "download") {
      setPdf(true);
      message.loading({ content: "Generating PDF…", key: "pdf_row" });
      try {
        const res = await request(`admin/payments/${payment.id}/receipt/pdf`, "get");
        if (res?.errors) throw new Error(res.errors.message);
        message.success({ content: "Payment receipt generated successfully.", key: "pdf_row", duration: 3 });
        if (key === "download" && res?.url) {
          const a = document.createElement("a");
          a.href = res.url;
          a.download = res.filename ?? `${payment.payment_id}_Payment_Receipt.pdf`;
          a.click();
        }
      } catch {
        message.error({ content: "Unable to generate payment receipt. Please try again.", key: "pdf_row", duration: 4 });
      } finally {
        setPdf(false);
      }
    }
  };

  const actions = getActions(payment?.status, can);
  if (!actions.length) return <span className={`text-xs ${dark ? "text-gray-500" : "text-[#829AB1]"}`}>—</span>;

  const btnCls = dark
    ? "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-40 transition-colors"
    : "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-[#F5F8FC] text-[#486581] hover:bg-[#E8EEF4] disabled:opacity-40 transition-colors";

  return (
    <div className="relative" ref={ref}>
      <button disabled={pdfBusy} onClick={() => setOpen((o) => !o)} className={btnCls}>
        {pdfBusy ? <span className="animate-spin inline-block">⏳</span> : "Actions"}
        <span className="ml-0.5 text-[10px]">▾</span>
      </button>

      {open && (
        <div className={`absolute right-0 z-50 mt-1 w-48 rounded-lg border shadow-xl overflow-hidden ${
          dark ? "bg-gray-800 border-gray-700" : "bg-white border-[#D9E2EC]"
        }`}>
          {actions.map((a) => (
            <button
              key={a.key}
              onClick={() => handleAction(a.key)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors ${
                dark ? "text-gray-300 hover:bg-gray-700" : "text-[#486581] hover:bg-[#F5F8FC]"
              }`}
            >
              {a.icon} {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Payment Detail Modal ───────────────────────────────────────
export default function PaymentDetailModal({ payment, open, onClose, dark, autoPrint = false }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const { can } = usePermission();

  useEffect(() => {
    if (!open) return;
    setShowReceipt(false);
    if (payment) {
      setData(payment);
      setLoading(false);
    } else {
      setLoading(true);
    }
  }, [open, payment]);

  // Auto-print after data loads (triggered from "Print" action in table row)
  useEffect(() => {
    if (autoPrint && data && !loading) {
      setShowReceipt(true);
      setTimeout(() => window.print(), 500);
    }
  }, [autoPrint, data, loading]);

  const handlePrint = async () => {
    if (data?.id) {
      await request(`admin/payments/${data.id}/print`, "post");
    }
    setShowReceipt(true);
    setTimeout(() => window.print(), 400);
  };

  const handlePdf = async () => {
    setPdfBusy(true);
    message.loading({ content: "Generating PDF…", key: "pdf_modal" });
    try {
      const res = await request(`admin/payments/${data.id}/receipt/pdf`, "get");
      if (res?.errors) throw new Error(res.errors.message);
      message.success({ content: "Payment receipt generated successfully.", key: "pdf_modal", duration: 3 });
      if (res?.url) {
        const a = document.createElement("a");
        a.href = res.url;
        a.download = res.filename ?? `${data?.payment_id}_Payment_Receipt.pdf`;
        a.click();
      }
    } catch {
      message.error({ content: "Unable to generate payment receipt. Please try again.", key: "pdf_modal", duration: 4 });
    } finally {
      setPdfBusy(false);
    }
  };

  const p          = data;
  const statusCls  = STATUS_COLOR[p?.status?.toLowerCase()] ?? "text-yellow-500";
  const divider    = dark ? "border-gray-700" : "border-[#D9E2EC]";
  const modalBg    = dark ? "bg-gray-900"     : "bg-white";
  const titleCls   = dark ? "text-gray-100"   : "text-[#102A43]";
  const subText    = dark ? "text-gray-400"   : "text-[#829AB1]";

  return (
    <>
      {/* Receipt hidden in UI, visible only on print */}
      {showReceipt && p && (
        <div className="hidden print:block">
          <PaymentReceiptPDF payment={p} />
        </div>
      )}

      <Modal
        open={open}
        onCancel={onClose}
        footer={null}
        width={700}
        destroyOnClose
        styles={{
          body:    { padding: 0 },
          content: { padding: 0, borderRadius: "12px", overflow: "hidden",
                     background: dark ? "#111827" : "#ffffff" },
        }}
      >
        <div className={`${modalBg} rounded-xl`}>
          {/* Header */}
          <div className={`flex items-center justify-between px-5 py-4 border-b ${divider}`}>
            <div>
              <h3 className={`text-base font-semibold ${titleCls}`}>Payment Detail</h3>
              {p && <p className={`text-xs mt-0.5 font-mono ${subText}`}>{p.payment_id}</p>}
            </div>
            <div className="flex items-center gap-2">
              {can("payments.print") && p && (
                <button
                  onClick={handlePrint}
                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    dark ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-[#F5F8FC] text-[#486581] hover:bg-[#E8EEF4]"
                  }`}
                >
                  <MdPrint size={14} /> Print
                </button>
              )}
              {can("payments.pdf") && p && (
                <button
                  onClick={handlePdf}
                  disabled={pdfBusy}
                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
                    dark ? "bg-blue-900/40 text-blue-400 hover:bg-blue-900/60" : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                  }`}
                >
                  <MdPictureAsPdf size={14} />
                  {pdfBusy ? "Generating…" : "Generate PDF"}
                </button>
              )}
              <button
                onClick={onClose}
                className={`p-1.5 rounded-lg transition-colors ${dark ? "hover:bg-gray-700 text-gray-400" : "hover:bg-[#F5F8FC] text-[#829AB1]"}`}
              >
                <MdClose size={18} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="px-5 py-4 max-h-[76vh] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-16"><Spin /></div>
            ) : !p ? (
              <div className={`text-center py-16 text-sm ${subText}`}>No payment data found.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* ── Left ── */}
                <div>
                  <Section title="Payment Information" dark={dark}>
                    <InfoRow label="Payment ID"      value={p.payment_id}                                                    dark={dark} />
                    <InfoRow label="Status"          value={p.status?.replace(/\b\w/g, (c) => c.toUpperCase())}              dark={dark} colorCls={statusCls} />
                    <InfoRow label="Date"            value={p.paid_at ? new Date(p.paid_at).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" }) : "—"} dark={dark} />
                    <InfoRow label="Time"            value={p.paid_at ? new Date(p.paid_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—"} dark={dark} />
                    <InfoRow label="Amount"          value={fmtAmt(p.amount)}                                                dark={dark} />
                    <InfoRow label="Currency"        value={p.currency ?? "USD"}                                             dark={dark} />
                    <InfoRow label="Payment Method"  value={p.payment_method}                                                dark={dark} />
                    <InfoRow label="Transaction ID"  value={p.transaction_id}                                                dark={dark} />
                    <InfoRow label="Gateway"         value={p.gateway}                                                       dark={dark} />
                    <InfoRow label="Reference"       value={p.payment_reference}                                             dark={dark} />
                    {p.card_last4 && (
                      <InfoRow label="Card" value={`**** **** **** ${p.card_last4}`} dark={dark} />
                    )}
                  </Section>

                  <Section title="Guest Information" dark={dark}>
                    <InfoRow label="Name"     value={p.guest?.name}                                  dark={dark} />
                    <InfoRow label="Guest ID" value={p.guest?.id ? `USR-${p.guest.id}` : "—"}        dark={dark} />
                    <InfoRow label="Phone"    value={p.guest?.phone}                                  dark={dark} />
                    <InfoRow label="Email"    value={p.guest?.email}                                  dark={dark} />
                  </Section>
                </div>

                {/* ── Right ── */}
                <div>
                  {p.source === "restaurant" ? (
                    <Section title="Restaurant Order" dark={dark}>
                      <InfoRow label="Order ID"       value={p.reference?.order_code} dark={dark} />
                      <InfoRow label="Restaurant"     value={p.reference?.restaurant?.name} dark={dark} />
                      <InfoRow label="Table"          value={p.reference?.table?.table_number} dark={dark} />
                      <InfoRow label="Location"       value={p.reference?.table?.location} dark={dark} />
                      <InfoRow label="Order Date"     value={fmtDateTime(p.reference?.created_at)} dark={dark} />
                      <InfoRow label="Order Status"   value={p.reference?.status?.replace(/\b\w/g, (c) => c.toUpperCase())} dark={dark} />
                    </Section>
                  ) : (
                    <>
                  <Section title="Booking" dark={dark}>
                    <InfoRow label="Booking ID"     value={p.reference?.booking_code} dark={dark} />
                    <InfoRow label="Guest"          value={p.guest?.name} dark={dark} />
                    <InfoRow label="Resort"         value={p.reference?.resort?.name} dark={dark} />
                    <InfoRow label="Branch"         value={p.reference?.branch?.name} dark={dark} />
                    <InfoRow label="Check-in"       value={fmtDateTime(p.reference?.check_in)} dark={dark} />
                    <InfoRow label="Check-out"      value={fmtDateTime(p.reference?.check_out)} dark={dark} />
                    <InfoRow label="Nights"         value={p.reference?.nights} dark={dark} />
                    <InfoRow label="Booking Status" value={p.reference?.status?.replace(/\b\w/g, (c) => c.toUpperCase())} dark={dark} />
                  </Section>

                  {Array.isArray(p.reference?.rooms) && p.reference.rooms.length > 0 && (
                    <Section title="Rooms" dark={dark}>
                      {p.reference.rooms.map((r, i) => (
                        <div key={`${r.room_number}-${i}`}>
                          <InfoRow
                            label={`${r.room_number} · ${r.room_type ?? "Room"}`}
                            value={`${fmtAmt(r.price_per_night)} × ${r.nights ?? 1} = ${fmtAmt(r.subtotal)}`}
                            dark={dark}
                          />
                          {Number(r.discount_percent ?? 0) > 0 && (
                            <InfoRow
                              label={`   Discount ${Number(r.discount_percent)}%`}
                              value={`-${fmtAmt(r.discount_amount)} = ${fmtAmt(r.net_subtotal)}`}
                              dark={dark}
                              colorCls="text-[#FF6B00]"
                            />
                          )}
                        </div>
                      ))}
                    </Section>
                  )}
                    </>
                  )}

                  <Section title="Payment Breakdown" dark={dark}>
                    {p.invoice?.invoice_number && (
                      <InfoRow label="Invoice" value={p.invoice.invoice_number} dark={dark} />
                    )}
                    <InfoRow label="Original Subtotal" value={fmtAmt(p.breakdown?.subtotal)} dark={dark} />
                    {Number(p.breakdown?.room_discount_total ?? 0) > 0 && (
                      <InfoRow
                        label={`Room Discount (${Number(p.breakdown?.room_discount_percent ?? 0)}%)`}
                        value={`-${fmtAmt(p.breakdown?.room_discount_total)}`}
                        dark={dark}
                        colorCls="text-[#FF6B00]"
                      />
                    )}
                    {Number(p.breakdown?.coupon_discount ?? 0) > 0 && (
                      <InfoRow
                        label={`Coupon${p.breakdown?.coupon_code ? ` (${p.breakdown.coupon_code})` : ""}`}
                        value={`-${fmtAmt(p.breakdown?.coupon_discount)}`}
                        dark={dark}
                        colorCls="text-[#FF6B00]"
                      />
                    )}
                    {p.breakdown?.room_discount_total === undefined && (
                      <InfoRow label="Discount" value={`-${fmtAmt(p.breakdown?.discount)}`} dark={dark} />
                    )}
                    {Number(p.breakdown?.discount ?? 0) > 0 && (
                      <InfoRow label="Discounted Subtotal" value={fmtAmt(p.breakdown?.discounted_subtotal)} dark={dark} />
                    )}
                    <InfoRow label="Tax"               value={fmtAmt(p.breakdown?.tax)}                                                                                    dark={dark} />
                    <InfoRow label="Service Charge"    value={fmtAmt(p.breakdown?.service_charge)}                                                                         dark={dark} />
                    <div className={`border-t my-1.5 ${divider}`} />
                    <InfoRow label="Total Amount"      value={fmtAmt(p.breakdown?.total)}       dark={dark} colorCls="text-green-500"  />
                    <InfoRow label="Paid Amount"       value={fmtAmt(p.breakdown?.paid)}        dark={dark} />
                    <InfoRow
                      label="Remaining Balance"
                      value={fmtAmt(p.breakdown?.balance)}
                      dark={dark}
                      colorCls={Number(p.breakdown?.balance) > 0 ? "text-yellow-500" : undefined}
                    />
                    {Number(p.breakdown?.refund) > 0 && (
                      <InfoRow label="Refund Amount" value={fmtAmt(p.breakdown?.refund)} dark={dark} colorCls="text-orange-500" />
                    )}
                  </Section>

                  {p.notes && (
                    <Section title="Notes" dark={dark}>
                      <p className={`text-xs ${dark ? "text-gray-300" : "text-[#486581]"}`}>{p.notes}</p>
                    </Section>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}
