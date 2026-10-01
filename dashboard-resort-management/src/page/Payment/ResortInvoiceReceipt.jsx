/**
 * Resort invoice / receipt — English, screen + print.
 */
import { docVal, fmtAmt, guestCountLabel, titleCaseStatus } from "./invoiceDocumentHelpers";
import defaultLogo from "../../assets/image/LogoResort.jpg";

const NAVY = "#0b1a2e";
const GOLD = "#c9a227";
const GOLD_LIGHT = "#faf3d4";
const LINE = "#e2c96b";

function fmtDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  const date = d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
  const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${date} • ${time}`;
}

function fmtDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

function ReceiptRow({ label, value, bold, valueColor = "#0f172a" }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        padding: "7px 0",
        borderBottom: `1px solid ${LINE}55`,
      }}
    >
      <span style={{ fontSize: 12, color: "#1e293b", fontWeight: 500 }}>{label}</span>
      <span
        style={{
          fontSize: 12,
          fontWeight: bold ? 700 : 500,
          color: valueColor,
          textAlign: "right",
          wordBreak: "break-word",
        }}
      >
        {value ?? "—"}
      </span>
    </div>
  );
}

function SectionBar({ title }) {
  return (
    <div
      style={{
        background: "#f8fafc",
        margin: "14px -20px 6px",
        padding: "8px 20px",
        fontSize: 11,
        fontWeight: 600,
        color: "#64748b",
        borderTop: "1px solid #e2e8f0",
        borderBottom: "1px solid #e2e8f0",
        textTransform: "uppercase",
        letterSpacing: "0.06em",
      }}
    >
      {title}
    </div>
  );
}

function paidStatusLabel(status) {
  const s = String(status ?? "").toLowerCase();
  if (s === "paid") return "PAID";
  if (s === "partial") return "PARTIAL";
  if (s === "pending") return "PENDING";
  return titleCaseStatus(status).toUpperCase();
}

function statusColor(status) {
  const s = String(status ?? "").toLowerCase();
  if (s === "paid") return "#15803d";
  if (s === "pending" || s === "partial") return "#a16207";
  return "#475569";
}

export default function ResortInvoiceReceipt({ doc }) {
  if (!doc) return null;

  const inv = doc.invoice ?? {};
  const booking = doc.booking ?? {};
  const guest = doc.guest ?? {};
  const stay = doc.stay ?? {};
  const bd = doc.breakdown ?? {};
  const resort = booking.resort ?? {};
  const payments = doc.payments ?? [];
  const lastPay = payments.length ? payments[payments.length - 1] : null;

  const brand = docVal(resort.name, "Resort").toUpperCase();
  const total = fmtAmt(bd.total);
  const status = inv.status ?? (Number(bd.balance ?? 0) <= 0.009 ? "paid" : "pending");
  const paidBefore = Math.max(0, Number(bd.paid ?? 0) - Number(lastPay?.amount ?? 0));
  const supportEmail = resort.email ?? "info@resort.com";

  const accountLabel = guest.name
    ? `${guest.name}${guest.id ? ` - ID ${guest.id}` : ""}`
    : "—";

  const payMethod = lastPay
    ? docVal(lastPay.payment_method ?? lastPay.method, "—")
    : "—";

  const logoSrc = doc.logoUrl || resort.logo_url || defaultLogo;

  return (
    <div
      className="resort-invoice-receipt"
      style={{
        fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
        maxWidth: 400,
        margin: "0 auto",
        background: "#fff",
        borderRadius: 10,
        overflow: "hidden",
        boxShadow: "0 2px 16px rgba(11,26,46,0.1)",
        color: "#0f172a",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      <div
        className="receipt-header-print"
        style={{
          background: NAVY,
          padding: "14px 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <img
            src={logoSrc}
            alt=""
            style={{
              width: 42,
              height: 42,
              borderRadius: 8,
              objectFit: "cover",
              border: "2px solid rgba(201, 162, 39, 0.45)",
              flexShrink: 0,
            }}
          />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: GOLD, letterSpacing: "0.04em" }}>{brand}</div>
            <div style={{ fontSize: 9, color: "#cbd5e1", marginTop: 4, letterSpacing: "0.12em" }}>
              INVOICE RECEIPT
            </div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 10, color: "#94a3b8" }}>Amount</div>
          <div style={{ fontSize: 21, fontWeight: 800, color: GOLD, lineHeight: 1.15 }}>{total}</div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 18px 4px",
          borderBottom: `1px solid ${LINE}66`,
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>Invoice</span>
        <span style={{ fontSize: 11, fontWeight: 800, color: statusColor(status), letterSpacing: "0.02em" }}>
          {paidStatusLabel(status)}
        </span>
      </div>

      <div style={{ padding: "4px 18px 18px" }}>
        <SectionBar title="Transaction details" />
        <ReceiptRow label="Transaction no." value={docVal(inv.invoice_number)} bold />
        <ReceiptRow label="Transaction type" value="Stay / Accommodation" />
        <ReceiptRow label="Date & time" value={fmtDateTime(inv.issued_at)} />
        <ReceiptRow label="Account" value={accountLabel} />
        <ReceiptRow label="Booking code" value={docVal(booking.booking_code)} />
        <ReceiptRow label="Payment method" value={payMethod} />

        {(stay.check_in || stay.check_out) && (
          <>
            <SectionBar title="Stay details" />
            <ReceiptRow label="Check-in" value={fmtDate(stay.check_in)} />
            <ReceiptRow label="Check-out" value={fmtDate(stay.check_out)} />
            <ReceiptRow label="Nights" value={stay.nights ?? "—"} />
            <ReceiptRow label="Guests" value={guestCountLabel(stay)} />
          </>
        )}

        <SectionBar title="Payment summary" />
        <ReceiptRow label="Subtotal" value={fmtAmt(bd.subtotal)} />
        {Number(bd.room_discount_total) > 0 && (
          <ReceiptRow label="Room discount" value={`-${fmtAmt(bd.room_discount_total)}`} />
        )}
        {Number(bd.coupon_discount) > 0 && (
          <ReceiptRow label="Coupon" value={`-${fmtAmt(bd.coupon_discount)}`} />
        )}
        {Number(bd.discount) > 0 && !Number(bd.room_discount_total) && (
          <ReceiptRow label="Discount" value={`-${fmtAmt(bd.discount)}`} />
        )}
        <ReceiptRow label="Tax" value={fmtAmt(bd.tax)} />
        <ReceiptRow label="Service charge" value={fmtAmt(bd.service_charge)} />
        <ReceiptRow label="Service fee" value={fmtAmt(0)} />
        <div style={{ borderBottom: "2px solid #0f172a", margin: "8px 0 4px" }} />
        <ReceiptRow label="Total" value={total} bold />

        <SectionBar title="Balance" />
        <ReceiptRow label="Previous balance" value={fmtAmt(paidBefore)} />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "11px 12px",
            marginTop: 6,
            background: GOLD_LIGHT,
            borderRadius: 6,
            border: `1px solid ${LINE}99`,
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 700, color: NAVY }}>Current balance</span>
          <span style={{ fontSize: 17, fontWeight: 800, color: GOLD }}>{fmtAmt(bd.balance)}</span>
        </div>
        <ReceiptRow label="Total paid" value={fmtAmt(bd.paid)} />

        <div
          style={{
            marginTop: 18,
            paddingTop: 12,
            borderTop: "1px dashed #cbd5e1",
            textAlign: "center",
            fontSize: 10,
            color: "#94a3b8",
            lineHeight: 1.65,
          }}
        >
          <div>Questions? Contact support at {supportEmail}</div>
          <div style={{ marginTop: 6, fontStyle: "italic" }}>
            Computer generated receipt — no signature required
          </div>
        </div>
      </div>
    </div>
  );
}
