/**
 * PaymentReceiptPDF
 * Pure inline-style receipt — no Tailwind, no dashboard UI.
 * Render hidden in DOM; call window.print() to trigger.
 * CSS in index.css hides all other elements during print.
 */

import { collectRoomAmenities, docVal, fmtAmt, fmtDocDate, guestCountLabel, normalizeDocumentRooms } from "./invoiceDocumentHelpers";

const BUSINESS = {
  name:    "Grand Resort & Restaurant",
  address: "123 Resort Boulevard, Phnom Penh, Cambodia",
  phone:   "+855 23 000 000",
  email:   "info@grandresort.com",
};

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

function RoomTable({ rooms }) {
  if (!rooms?.length) return null;
  const th = {
    fontSize: "9px", textTransform: "uppercase", color: "#9ca3af",
    textAlign: "left", padding: "6px 4px", borderBottom: "1px solid #e5e7eb",
  };
  const td = { fontSize: "11px", padding: "6px 4px", verticalAlign: "top", color: "#374151" };

  return (
    <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "10px" }}>
      <thead>
        <tr>
          {["Room", "Type", "View", "Rate/Night", "Nights", "Amount"].map((h) => (
            <th key={h} style={th}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rooms.map((r, i) => (
          <tr key={`${r.room_number}-${i}`} style={{ borderTop: "1px solid #f3f4f6" }}>
            <td style={td}>{docVal(r.room_number)}</td>
            <td style={td}>{docVal(r.room_type, "—")}</td>
            <td style={td}>{docVal(r.view, "—")}</td>
            <td style={td}>{fmtAmt(r.price_per_night)}</td>
            <td style={td}>{r.nights ?? "—"}</td>
            <td style={{ ...td, fontWeight: 600 }}>{fmtAmt(r.net_subtotal ?? r.subtotal)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function PaymentReceiptPDF({ payment: p }) {
  if (!p) return null;

  const isRefund = p.status?.toLowerCase() === "refunded";
  const isResort = p.source === "resort";
  const title    = isRefund ? "REFUND RECEIPT" : "PAYMENT RECEIPT";
  const rooms    = isResort ? normalizeDocumentRooms({ referenceRooms: p.reference?.rooms }) : [];
  const amenities = collectRoomAmenities(rooms);
  const bd = p.breakdown ?? {};

  const paidDate = p.paid_at ? new Date(p.paid_at) : null;
  const dateStr  = paidDate?.toLocaleDateString("en-US", { day: "2-digit", month: "long", year: "numeric" }) ?? "—";
  const timeStr  = paidDate?.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) ?? "—";

  const bizName = p.reference?.resort?.name ?? BUSINESS.name;
  const bizPhone = p.reference?.resort?.phone ?? BUSINESS.phone;
  const bizEmail = p.reference?.resort?.email ?? BUSINESS.email;

  return (
    <div style={{
      fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
      maxWidth: "560px", margin: "0 auto", padding: "36px 32px",
      background: "#ffffff", color: "#111827", fontSize: "13px", lineHeight: 1.6,
    }}>
      <div style={{ textAlign: "center", marginBottom: "24px", borderBottom: "2px solid #111827", paddingBottom: "18px" }}>
        <div style={{ fontSize: "22px", fontWeight: 800, letterSpacing: "-0.5px" }}>
          {bizName}
        </div>
        {p.reference?.branch?.name && (
          <div style={{ fontSize: "13px", color: "#6b7280", marginTop: "2px" }}>
            {p.reference.branch.name}
          </div>
        )}
        <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "6px" }}>{BUSINESS.address}</div>
        <div style={{ fontSize: "11px", color: "#9ca3af" }}>{bizPhone} · {bizEmail}</div>
      </div>

      <div style={{ textAlign: "center", marginBottom: "22px" }}>
        <span style={{
          fontSize: "15px", fontWeight: 800, letterSpacing: "0.12em",
          color: isRefund ? "#ea580c" : "#111827",
          borderBottom: `3px solid ${isRefund ? "#ea580c" : "#111827"}`,
          paddingBottom: "4px",
        }}>
          {title}
        </span>
        {p.invoice?.invoice_number && (
          <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "8px" }}>
            Invoice: {p.invoice.invoice_number}
          </div>
        )}
      </div>

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

      <Block title="Guest Information">
        <Row label="Name"  value={p.guest?.name} />
        <Row label="Phone" value={p.guest?.phone} />
        <Row label="Email" value={p.guest?.email} />
      </Block>

      {isResort ? (
        <>
          <Block title="Booking Information">
            <Row label="Booking Code"   value={p.reference?.booking_code} />
            <Row label="Resort"         value={p.reference?.resort?.name} />
            <Row label="Branch"         value={p.reference?.branch?.name} />
            <Row label="Booking Status" value={p.reference?.status?.replace(/\b\w/g, (c) => c.toUpperCase())} />
          </Block>

          <Block title="Stay Details">
            <Row label="Check-in"  value={fmtDocDate(p.reference?.check_in)} />
            <Row label="Check-out" value={fmtDocDate(p.reference?.check_out)} />
            <Row label="Nights"    value={p.reference?.nights} />
            <Row label="Guests"    value={guestCountLabel(p.reference)} />
          </Block>

          {rooms.length > 0 && (
            <Block title="Room / Accommodation Details">
              <RoomTable rooms={rooms} />
              {rooms.map((r, i) => (
                <div key={`detail-${i}`} style={{ fontSize: "10px", color: "#6b7280", marginBottom: "8px", paddingLeft: "2px" }}>
                  <strong style={{ color: "#374151" }}>Room {docVal(r.room_number)}</strong>
                  {" — "}
                  {[
                    r.room_type && `Type: ${r.room_type}`,
                    r.floor != null && r.floor !== "" && `Floor: ${r.floor}`,
                    r.bed_type && `Bed: ${r.bed_type}`,
                    r.capacity && `Capacity: ${r.capacity}`,
                    r.branch && `Branch: ${r.branch}`,
                  ].filter(Boolean).join(" · ")}
                </div>
              ))}
              {amenities.length > 0 && (
                <div style={{ fontSize: "10px", color: "#6b7280", marginTop: "4px" }}>
                  <div style={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>
                    Room Features
                  </div>
                  {amenities.map((a) => (
                    <div key={a}>• {a}</div>
                  ))}
                </div>
              )}
            </Block>
          )}
        </>
      ) : (
        <Block title="Order Details">
          <Row label="Order ID"   value={p.reference?.order_code} />
          <Row label="Table"      value={p.reference?.table?.table_number} />
          <Row label="Order Date" value={p.reference?.created_at ? new Date(p.reference.created_at).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" }) : "—"} />
        </Block>
      )}

      <Block title="Payment Summary">
        <Row label="Subtotal" value={fmtAmt(bd.subtotal)} />
        {Number(bd.room_discount_total) > 0 && (
          <Row label={`Room Discount (${bd.room_discount_percent ?? 0}%)`} value={`-${fmtAmt(bd.room_discount_total)}`} />
        )}
        {Number(bd.coupon_discount) > 0 && (
          <Row label={`Coupon${bd.coupon_code ? ` (${bd.coupon_code})` : ""}`} value={`-${fmtAmt(bd.coupon_discount)}`} />
        )}
        {Number(bd.discount) > 0 && !bd.room_discount_total && (
          <Row label="Discount" value={`-${fmtAmt(bd.discount)}`} />
        )}
        <Row label="Tax"               value={fmtAmt(bd.tax)} />
        <Row label="Service Charge"    value={fmtAmt(bd.service_charge)} />
        <Row label="Total Amount"      value={fmtAmt(bd.total)}   bold topBorder />
        <Row label="Paid Amount"       value={fmtAmt(bd.paid)} />
        <Row label="Remaining Balance" value={fmtAmt(bd.balance)} />
        {Number(bd.refund) > 0 && (
          <Row label="Refund Amount"   value={fmtAmt(bd.refund)} bold />
        )}
      </Block>

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
