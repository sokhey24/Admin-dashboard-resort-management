/**
 * PaymentReceiptPDF
 * Pure inline-style receipt — no Tailwind, no dashboard UI.
 * Render hidden in DOM; call window.print() to trigger.
 * CSS in index.css hides all other elements during print.
 */

const BUSINESS = {
  name:    "Grand Resort & Restaurant",
  address: "123 Resort Boulevard, Phnom Penh, Cambodia",
  phone:   "+855 23 000 000",
  email:   "info@grandresort.com",
};

const fmtAmt = (v) =>
  `$${Number(v ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function Row({ label, value, bold, topBorder }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between",
      padding: "4px 0",
      borderTop: topBorder ? "1px solid #e5e7eb" : "none",
    }}>
      <span style={{ color: "#6b7280", fontSize: "12px", fontWeight: 400 }}>{label}</span>
      <span style={{ color: bold ? "#111827" : "#374151", fontSize: "12px", fontWeight: bold ? 700 : 400 }}>
        {value ?? "—"}
      </span>
    </div>
  );
}

function Block({ title, children }) {
  return (
    <div style={{ marginBottom: "18px" }}>
      <div style={{
        fontSize: "10px", fontWeight: 700, textTransform: "uppercase",
        letterSpacing: "0.08em", color: "#9ca3af",
        borderBottom: "1px solid #e5e7eb", paddingBottom: "4px", marginBottom: "6px",
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}

export default function PaymentReceiptPDF({ payment: p }) {
  if (!p) return null;

  const isRefund = p.status?.toLowerCase() === "refunded";
  const isResort = p.source === "resort";
  const title    = isRefund ? "REFUND RECEIPT" : "PAYMENT RECEIPT";

  const paidDate = p.paid_at ? new Date(p.paid_at) : null;
  const dateStr  = paidDate?.toLocaleDateString("en-US", { day: "2-digit", month: "long", year: "numeric" }) ?? "—";
  const timeStr  = paidDate?.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) ?? "—";

  return (
    <div style={{
      fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
      maxWidth: "560px", margin: "0 auto", padding: "36px 32px",
      background: "#ffffff", color: "#111827", fontSize: "13px", lineHeight: 1.6,
    }}>
      {/* ── Header ── */}
      <div style={{ textAlign: "center", marginBottom: "24px", borderBottom: "2px solid #111827", paddingBottom: "18px" }}>
        <div style={{ fontSize: "22px", fontWeight: 800, letterSpacing: "-0.5px" }}>
          {BUSINESS.name}
        </div>
        {p.reference?.branch?.name && (
          <div style={{ fontSize: "13px", color: "#6b7280", marginTop: "2px" }}>
            {p.reference.branch.name}
          </div>
        )}
        <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "6px" }}>{BUSINESS.address}</div>
        <div style={{ fontSize: "11px", color: "#9ca3af" }}>{BUSINESS.phone} · {BUSINESS.email}</div>
      </div>

      {/* ── Receipt Title ── */}
      <div style={{ textAlign: "center", marginBottom: "22px" }}>
        <span style={{
          fontSize: "15px", fontWeight: 800, letterSpacing: "0.12em",
          color: isRefund ? "#ea580c" : "#111827",
          borderBottom: `3px solid ${isRefund ? "#ea580c" : "#111827"}`,
          paddingBottom: "4px",
        }}>
          {title}
        </span>
      </div>

      {/* ── Receipt Info ── */}
      <Block title="Receipt Information">
        <Row label="Payment ID"     value={p.payment_id} />
        <Row label="Transaction ID" value={p.transaction_id} />
        <Row label="Date"           value={dateStr} />
        <Row label="Time"           value={timeStr} />
        <Row label="Payment Method" value={p.payment_method} />
        <Row label="Gateway"        value={p.gateway} />
        <Row label="Status"         value={p.status?.replace(/\b\w/g, (c) => c.toUpperCase())} bold />
        {p.card_last4 && <Row label="Card" value={`**** **** **** ${p.card_last4}`} />}
      </Block>

      {/* ── Guest ── */}
      <Block title="Guest Information">
        <Row label="Name"  value={p.guest?.name} />
        <Row label="Phone" value={p.guest?.phone} />
        <Row label="Email" value={p.guest?.email} />
      </Block>

      {/* ── Transaction Source ── */}
      {isResort ? (
        <Block title="Booking Details">
          <Row label="Booking ID"  value={p.reference?.booking_code} />
          <Row label="Room / Villa" value={p.reference?.rooms?.map((r) => r.room_number).join(", ")} />
          <Row label="Check-in"    value={p.reference?.check_in ? new Date(p.reference.check_in).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" }) : "—"} />
          <Row label="Check-out"   value={p.reference?.check_out ? new Date(p.reference.check_out).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" }) : "—"} />
        </Block>
      ) : (
        <Block title="Order Details">
          <Row label="Order ID"   value={p.reference?.order_code} />
          <Row label="Table"      value={p.reference?.table?.table_number} />
          <Row label="Order Date" value={p.reference?.created_at ? new Date(p.reference.created_at).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" }) : "—"} />
        </Block>
      )}

      {/* ── Amount Breakdown ── */}
      <Block title="Amount Breakdown">
        <Row label="Subtotal"          value={fmtAmt(p.breakdown?.subtotal)} />
        <Row label="Discount"          value={`-${fmtAmt(p.breakdown?.discount)}`} />
        <Row label="Tax"               value={fmtAmt(p.breakdown?.tax)} />
        <Row label="Service Charge"    value={fmtAmt(p.breakdown?.service_charge)} />
        <Row label="Total Amount"      value={fmtAmt(p.breakdown?.total)}   bold topBorder />
        <Row label="Paid Amount"       value={fmtAmt(p.breakdown?.paid)} />
        <Row label="Remaining Balance" value={fmtAmt(p.breakdown?.balance)} />
        {Number(p.breakdown?.refund) > 0 && (
          <Row label="Refund Amount"   value={fmtAmt(p.breakdown?.refund)} bold />
        )}
      </Block>

      {/* ── Footer ── */}
      <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "18px", textAlign: "center" }}>
        <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "10px" }}>
          Thank you for your payment.
        </div>
        <div style={{ fontSize: "10px", color: "#9ca3af" }}>
          Generated: {new Date().toLocaleString("en-US")}
        </div>
        {p.generated_by && (
          <div style={{ fontSize: "10px", color: "#9ca3af" }}>Generated by: {p.generated_by}</div>
        )}
        <div style={{ fontSize: "10px", color: "#9ca3af", marginTop: "2px" }}>
          Resort Management System
        </div>
      </div>
    </div>
  );
}
