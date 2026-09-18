import { useEffect, useRef } from "react";
import { Drawer, Spin } from "antd";
import { FaFilePdf, FaPrint, FaTimes } from "react-icons/fa";
import { fmtCurrency, StatusBadge } from "./PaymentTab";
import PaymentReceiptPreview from "./PaymentReceiptPreview";

// ── info row ──────────────────────────────────────────────────
function InfoRow({ label, value, dark, highlight }) {
  return (
    <div className={`flex items-start justify-between py-2 border-b ${dark ? "border-gray-700" : "border-gray-100"}`}>
      <span className={`text-xs font-medium w-40 shrink-0 ${dark ? "text-gray-400" : "text-[#829AB1]"}`}>{label}</span>
      <span className={`text-sm text-right font-medium ${highlight ? (dark ? "text-green-400" : "text-green-700") : (dark ? "text-gray-200" : "text-[#102A43]")}`}>
        {value ?? "—"}
      </span>
    </div>
  );
}

// ── section title ─────────────────────────────────────────────
function SectionTitle({ children, dark }) {
  return (
    <h4 className={`text-xs font-bold uppercase tracking-widest mb-3 mt-5 ${dark ? "text-gray-500" : "text-[#829AB1]"}`}>
      {children}
    </h4>
  );
}

export default function PaymentDetailDrawer({
  open, payment, dark, perms,
  onClose, onPdf, onPrint, actionLoading,
}) {
  const printRef = useRef(null);

  // auto-trigger print if opened via Print action
  useEffect(() => {
    if (open && payment?._printOnOpen) {
      const timer = setTimeout(() => {
        if (printRef.current) {
          const win = window.open("", "_blank");
          if (win) {
            win.document.write(`
              <html><head><title>Receipt — ${payment.payment_id}</title>
              <style>
                body { font-family: 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 24px; color: #111; }
                @media print { body { padding: 0; } }
              </style>
              </head><body>${printRef.current.innerHTML}</body></html>
            `);
            win.document.close();
            win.focus();
            win.print();
            win.close();
          }
        }
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [open, payment]);

  if (!payment) return null;

  const p   = payment;
  const bd  = p.breakdown ?? {};
  const ref = p.reference;
  const isResort = p.source === "resort";
  const isLoading = actionLoading === p.id;

  const fmtDate = (v) => v ? new Date(v).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";
  const fmtTime = (v) => v ? new Date(v).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—";

  const cardBg  = dark ? "bg-gray-800 border-gray-700" : "bg-white border-[#D9E2EC]";
  const drawerBg = dark ? "#111827" : "#F5F8FC";

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={560}
      title={
        <div className="flex items-center justify-between">
          <div>
            <span className={`text-base font-bold ${dark ? "text-gray-100" : "text-[#102A43]"}`}>
              Payment Detail
            </span>
            <span className={`ml-2 text-sm font-mono ${dark ? "text-blue-400" : "text-blue-600"}`}>
              {p.payment_id}
            </span>
          </div>
          <StatusBadge value={p.status} />
        </div>
      }
      closeIcon={<FaTimes size={14} />}
      styles={{ body: { background: drawerBg, padding: "16px 20px" }, header: { background: dark ? "#1f2937" : "#fff", borderBottom: dark ? "1px solid #374151" : "1px solid #D9E2EC" } }}
      footer={
        <div className="flex items-center gap-2 justify-end py-2">
          {perms.canPrint && (
            <button
              onClick={() => onPrint(p)}
              disabled={isLoading}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors disabled:opacity-50 ${
                dark ? "bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600" : "bg-[#F5F8FC] border-[#D9E2EC] text-[#486581] hover:bg-[#E8EEF4]"
              }`}
            >
              <FaPrint size={13} /> Print Receipt
            </button>
          )}
          {perms.canPdf && (
            <button
              onClick={() => onPdf(p)}
              disabled={isLoading}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                dark ? "bg-blue-700 text-white hover:bg-blue-600" : "bg-[#FF6B00] text-white hover:bg-[#e05e00]"
              }`}
            >
              <FaFilePdf size={13} />
              {isLoading ? "Generating…" : "Generate PDF"}
            </button>
          )}
        </div>
      }
    >
      <Spin spinning={isLoading}>
        <div className={`rounded-xl border p-4 mb-4 ${cardBg}`}>

          {/* ── Payment Information ── */}
          <SectionTitle dark={dark}>Payment Information</SectionTitle>
          <InfoRow label="Payment ID"        value={p.payment_id}                                dark={dark} />
          <InfoRow label="Status"            value={<StatusBadge value={p.status} />}            dark={dark} />
          <InfoRow label="Payment Date"      value={fmtDate(p.paid_at)}                          dark={dark} />
          <InfoRow label="Payment Time"      value={fmtTime(p.paid_at)}                          dark={dark} />
          <InfoRow label="Amount"            value={fmtCurrency(p.amount, p.currency)}           dark={dark} highlight />
          <InfoRow label="Currency"          value={p.currency ?? "USD"}                         dark={dark} />
          <InfoRow label="Payment Method"    value={p.payment_method}                            dark={dark} />
          {p.transaction_id  && <InfoRow label="Transaction ID"   value={p.transaction_id}       dark={dark} />}
          {p.gateway         && <InfoRow label="Payment Gateway"  value={p.gateway}              dark={dark} />}
          {p.payment_reference && <InfoRow label="Reference"      value={p.payment_reference}    dark={dark} />}
          {p.card_last4      && <InfoRow label="Card"             value={`**** **** **** ${p.card_last4}`} dark={dark} />}
          {p.refunded_at     && <InfoRow label="Refunded At"      value={fmtDate(p.refunded_at)} dark={dark} />}
          {p.notes           && <InfoRow label="Notes"            value={p.notes}                dark={dark} />}

          {/* ── Guest Information ── */}
          <SectionTitle dark={dark}>Guest Information</SectionTitle>
          <InfoRow label="Guest Name"  value={p.guest?.name}                          dark={dark} />
          {p.guest?.id    && <InfoRow label="Guest ID"    value={`USR-${p.guest.id}`} dark={dark} />}
          <InfoRow label="Phone"       value={p.guest?.phone}                         dark={dark} />
          <InfoRow label="Email"       value={p.guest?.email}                         dark={dark} />

          {/* ── Source Information ── */}
          <SectionTitle dark={dark}>{isResort ? "Booking Details" : "Order Details"}</SectionTitle>
          {isResort ? (
            <>
              <InfoRow label="Booking ID"     value={ref?.booking_code}                                                                                                dark={dark} />
              <InfoRow label="Resort"         value={ref?.resort?.name}                                                                                                dark={dark} />
              <InfoRow label="Branch"         value={ref?.branch?.name}                                                                                                dark={dark} />
              <InfoRow label="Room / Villa"   value={ref?.rooms?.map(r => r.room_number).filter(Boolean).join(", ")}                                                   dark={dark} />
              <InfoRow label="Check-in"       value={ref?.check_in  ? new Date(ref.check_in).toLocaleDateString("en-GB",  { day:"2-digit", month:"short", year:"numeric" }) : "—"} dark={dark} />
              <InfoRow label="Check-out"      value={ref?.check_out ? new Date(ref.check_out).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" }) : "—"} dark={dark} />
              <InfoRow label="Booking Status" value={ref?.status ? ref.status.replace("_"," ").replace(/\b\w/g, c => c.toUpperCase()) : "—"}                          dark={dark} />
            </>
          ) : (
            <>
              <InfoRow label="Order ID"      value={ref?.order_code}                                                                                                   dark={dark} />
              <InfoRow label="Restaurant"    value={ref?.restaurant?.name}                                                                                             dark={dark} />
              <InfoRow label="Branch"        value={ref?.branch?.name}                                                                                                 dark={dark} />
              <InfoRow label="Table Number"  value={ref?.table?.table_number}                                                                                          dark={dark} />
              <InfoRow label="Order Date"    value={ref?.created_at ? new Date(ref.created_at).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" }) : "—"} dark={dark} />
              <InfoRow label="Order Status"  value={ref?.status ? ref.status.charAt(0).toUpperCase() + ref.status.slice(1) : "—"}                                     dark={dark} />
            </>
          )}

          {/* ── Payment Breakdown ── */}
          <SectionTitle dark={dark}>Payment Breakdown</SectionTitle>
          <InfoRow label="Subtotal"          value={fmtCurrency(bd.subtotal,       p.currency)} dark={dark} />
          {Number(bd.discount ?? 0) > 0 &&
            <InfoRow label="Discount"        value={`− ${fmtCurrency(bd.discount,  p.currency)}`} dark={dark} />}
          {Number(bd.tax ?? 0) > 0 &&
            <InfoRow label="Tax"             value={fmtCurrency(bd.tax,            p.currency)} dark={dark} />}
          {Number(bd.service_charge ?? 0) > 0 &&
            <InfoRow label="Service Charge"  value={fmtCurrency(bd.service_charge, p.currency)} dark={dark} />}
          <InfoRow label="Total Amount"      value={fmtCurrency(bd.total ?? p.amount, p.currency)} dark={dark} highlight />
          <InfoRow label="Paid Amount"       value={fmtCurrency(bd.paid,           p.currency)} dark={dark} />
          {Number(bd.balance ?? 0) > 0 &&
            <InfoRow label="Remaining Balance" value={fmtCurrency(bd.balance,      p.currency)} dark={dark} />}
          {Number(bd.refund ?? 0) > 0 &&
            <InfoRow label="Refund Amount"   value={fmtCurrency(bd.refund,         p.currency)} dark={dark} />}
        </div>
      </Spin>

      {/* Hidden printable receipt — rendered off-screen */}
      <div className="hidden">
        <div ref={printRef}>
          <PaymentReceiptPreview payment={p} />
        </div>
      </div>
    </Drawer>
  );
}
