/**
 * PaymentReceiptPreview
 * Pure HTML/CSS receipt — no Tailwind, no dashboard UI.
 * Used as the print source via printRef in PaymentDetailDrawer.
 */
export default function PaymentReceiptPreview({ payment }) {
  if (!payment) return null;

  const p   = payment;
  const bd  = p.breakdown ?? {};
  const ref = p.reference;
  const isResort  = p.source === "resort";
  const isRefund  = p.status === "refunded";
  const currency  = p.currency ?? "USD";
  const sym       = currency === "USD" ? "$" : currency + " ";
  const fmt       = (v) => sym + Number(v ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtDate   = (v) => v ? new Date(v).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";
  const fmtTime   = (v) => v ? new Date(v).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—";

  const bizName   = ref?.resort?.name ?? ref?.restaurant?.name ?? "Grand Resort & Restaurant";
  const branchName = ref?.branch?.name ?? "";

  const statusColor = {
    paid:      "#166534",
    pending:   "#854d0e",
    refunded:  "#9a3412",
    failed:    "#991b1b",
    cancelled: "#374151",
  }[p.status?.toLowerCase()] ?? "#374151";

  const statusBg = {
    paid:      "#dcfce7",
    pending:   "#fef9c3",
    refunded:  "#ffedd5",
    failed:    "#fee2e2",
    cancelled: "#f3f4f6",
  }[p.status?.toLowerCase()] ?? "#f3f4f6";

  const row = (label, value, bold = false, color = "#111827") => (
    <tr key={label}>
      <td style={{ padding: "4px 0", color: "#6b7280", fontSize: 11, width: "48%" }}>{label}</td>
      <td style={{ padding: "4px 0", color, fontSize: 11, textAlign: "right", fontWeight: bold ? 700 : 400 }}>{value ?? "—"}</td>
    </tr>
  );

  const sectionTitle = (title) => (
    <tr>
      <td colSpan={2} style={{ paddingTop: 14, paddingBottom: 4, borderBottom: "1px solid #e5e7eb" }}>
        <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#9ca3af" }}>{title}</span>
      </td>
    </tr>
  );

  return (
    <div style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif", fontSize: 12, color: "#111827", background: "#fff", padding: "36px 40px", maxWidth: 680, margin: "0 auto" }}>

      {/* ── Header ── */}
      <div style={{ textAlign: "center", borderBottom: "2.5px solid #111827", paddingBottom: 18, marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.3px" }}>{bizName}</div>
        {branchName && <div style={{ fontSize: 13, color: "#4b5563", marginTop: 2 }}>{branchName}</div>}
      </div>

      {/* ── Receipt Title ── */}
      <div style={{ textAlign: "center", marginBottom: 22 }}>
        <span style={{
          display: "inline-block",
          fontSize: 14, fontWeight: 800,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          paddingBottom: 5,
          borderBottom: `3px solid ${isRefund ? "#ea580c" : "#111827"}`,
          color: isRefund ? "#ea580c" : "#111827",
        }}>
          {isRefund ? "REFUND RECEIPT" : "PAYMENT RECEIPT"}
        </span>
      </div>

      {/* ── Two-column layout ── */}
      <div style={{ display: "flex", gap: 24, marginBottom: 16 }}>

        {/* Left: Receipt Info */}
        <div style={{ flex: 1 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              {sectionTitle("Receipt Information")}
              {row("Payment ID",      p.payment_id, true)}
              {p.transaction_id && row("Transaction ID", p.transaction_id)}
              {p.payment_reference && row("Reference",   p.payment_reference)}
              {row("Date",            fmtDate(p.paid_at))}
              {row("Time",            fmtTime(p.paid_at))}
              {row("Payment Method",  p.payment_method)}
              {p.gateway && row("Gateway", p.gateway)}
              {p.card_last4 && row("Card", `**** **** **** ${p.card_last4}`)}
              <tr>
                <td style={{ padding: "4px 0", color: "#6b7280", fontSize: 11 }}>Status</td>
                <td style={{ padding: "4px 0", textAlign: "right" }}>
                  <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700, textTransform: "uppercase", background: statusBg, color: statusColor }}>
                    {p.status ? p.status.charAt(0).toUpperCase() + p.status.slice(1) : "—"}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Right: Guest + Source */}
        <div style={{ flex: 1 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              {sectionTitle("Guest Information")}
              {row("Name",  p.guest?.name)}
              {p.guest?.id && row("Guest ID", `USR-${p.guest.id}`)}
              {row("Phone", p.guest?.phone)}
              {row("Email", p.guest?.email)}

              {isResort ? (
                <>
                  {sectionTitle("Booking Details")}
                  {row("Booking ID",     ref?.booking_code, true)}
                  {ref?.resort?.name && row("Resort",       ref.resort.name)}
                  {ref?.branch?.name && row("Branch",       ref.branch.name)}
                  {ref?.rooms?.length > 0 && row("Room / Villa", ref.rooms.map(r => r.room_number).filter(Boolean).join(", "))}
                  {row("Check-in",       fmtDate(ref?.check_in))}
                  {row("Check-out",      fmtDate(ref?.check_out))}
                  {ref?.status && row("Booking Status", ref.status.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase()))}
                </>
              ) : (
                <>
                  {sectionTitle("Order Details")}
                  {row("Order ID",       ref?.order_code, true)}
                  {ref?.restaurant?.name && row("Restaurant",  ref.restaurant.name)}
                  {ref?.branch?.name && row("Branch",          ref.branch.name)}
                  {ref?.table?.table_number && row("Table",    ref.table.table_number)}
                  {row("Order Date",     fmtDate(ref?.created_at))}
                  {ref?.status && row("Order Status", ref.status.charAt(0).toUpperCase() + ref.status.slice(1))}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Payment Breakdown ── */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
        <tbody>
          {sectionTitle("Payment Breakdown")}
          {row("Subtotal",         fmt(bd.subtotal))}
          {Number(bd.discount ?? 0) > 0 && row("Discount",       `− ${fmt(bd.discount)}`)}
          {Number(bd.tax ?? 0) > 0 && row("Tax",                 fmt(bd.tax))}
          {Number(bd.service_charge ?? 0) > 0 && row("Service Charge", fmt(bd.service_charge))}
          <tr><td colSpan={2} style={{ borderTop: "1px solid #e5e7eb", paddingTop: 6 }} /></tr>
          {row("Total Amount",     fmt(bd.total ?? p.amount), true, "#16a34a")}
          {row("Paid Amount",      fmt(bd.paid), true)}
          {Number(bd.balance ?? 0) > 0 && row("Remaining Balance", fmt(bd.balance), false, "#d97706")}
          {Number(bd.refund ?? 0) > 0 && row("Refund Amount",    fmt(bd.refund), true, "#ea580c")}
          {p.refunded_at && row("Refunded At", fmtDate(p.refunded_at))}
        </tbody>
      </table>

      {/* ── Notes ── */}
      {p.notes && (
        <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 4, padding: "8px 10px", fontSize: 11, color: "#374151", marginBottom: 16 }}>
          <strong style={{ fontSize: 10, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em" }}>Note: </strong>
          {p.notes}
        </div>
      )}

      {/* ── Footer ── */}
      <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: 16, textAlign: "center" }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Thank you for your payment.</div>
        <div style={{ fontSize: 10, color: "#9ca3af", lineHeight: 1.6 }}>
          Generated: {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}{" "}
          {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          {p.generated_by && <><br />Generated by: {p.generated_by}</>}
        </div>
        <div style={{ fontSize: 9, color: "#d1d5db", marginTop: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Resort Management System
        </div>
      </div>
    </div>
  );
}
