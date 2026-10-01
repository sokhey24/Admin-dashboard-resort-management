import { docVal, fmtAmt, fmtDocDate, collectRoomAmenities } from "./invoiceDocumentHelpers";

function Section({ title, children, dark, className = "" }) {
  return (
    <div
      className={`rounded-lg border p-3 mb-3 ${
        dark ? "border-gray-700 bg-gray-800/60" : "border-[#D9E2EC] bg-[#F5F8FC]"
      } ${className}`}
    >
      <p
        className={`text-[11px] font-semibold uppercase tracking-wider mb-2 ${
          dark ? "text-gray-400" : "text-[#829AB1]"
        }`}
      >
        {title}
      </p>
      {children}
    </div>
  );
}

function InfoRow({ label, value, dark }) {
  return (
    <div className="flex items-start justify-between py-1 gap-3 text-xs">
      <span className={`shrink-0 ${dark ? "text-gray-400" : "text-[#829AB1]"}`}>{label}</span>
      <span className={`font-medium text-right break-words ${dark ? "text-gray-200" : "text-[#102A43]"}`}>
        {value ?? "—"}
      </span>
    </div>
  );
}

export function InvoiceRoomTable({ rooms, dark }) {
  if (!rooms?.length) {
    return <p className={`text-xs ${dark ? "text-gray-400" : "text-[#829AB1]"}`}>No room data available.</p>;
  }

  const th = `px-2 py-2 text-left text-[10px] uppercase tracking-wide font-semibold ${
    dark ? "text-gray-400 bg-gray-700/50" : "text-[#829AB1] bg-white/80"
  }`;
  const td = `px-2 py-2 text-xs align-top ${dark ? "text-gray-200" : "text-[#102A43]"}`;
  const rowBorder = dark ? "border-t border-gray-700" : "border-t border-[#D9E2EC]";

  return (
    <div className="overflow-x-auto -mx-1">
      <table className="min-w-full w-full border-collapse">
        <thead>
          <tr>
            {["Room", "Room Type", "View", "Rate/Night", "Nights", "Amount"].map((h) => (
              <th key={h} className={th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rooms.map((r, i) => (
            <tr key={`${r.room_number}-${i}`} className={rowBorder}>
              <td className={td}>{docVal(r.room_number)}</td>
              <td className={td}>{docVal(r.room_type, "—")}</td>
              <td className={td}>{docVal(r.view, "—")}</td>
              <td className={td}>{fmtAmt(r.price_per_night)}</td>
              <td className={td}>{r.nights ?? "—"}</td>
              <td className={`${td} font-medium`}>{fmtAmt(r.net_subtotal ?? r.subtotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function InvoiceRoomMetaCards({ rooms, dark }) {
  if (!rooms?.length) return null;

  return (
    <div className="space-y-3 mt-3">
      {rooms.map((r, i) => (
        <div
          key={`meta-${r.room_number}-${i}`}
          className={`rounded-md border p-2.5 text-xs ${
            dark ? "border-gray-600 bg-gray-900/40" : "border-[#D9E2EC] bg-white"
          }`}
        >
          <p className={`font-semibold mb-1.5 ${dark ? "text-gray-100" : "text-[#102A43]"}`}>
            Room {docVal(r.room_number)}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5">
            <InfoRow label="Room Type" value={docVal(r.room_type, "—")} dark={dark} />
            <InfoRow label="Resort" value={docVal(r.resort, "—")} dark={dark} />
            <InfoRow label="Branch" value={docVal(r.branch, "—")} dark={dark} />
            <InfoRow label="Floor" value={docVal(r.floor, "—")} dark={dark} />
            <InfoRow label="View" value={docVal(r.view, "—")} dark={dark} />
            <InfoRow label="Bed Type" value={docVal(r.bed_type, "—")} dark={dark} />
            <InfoRow
              label="Capacity"
              value={r.capacity ? `${r.capacity} Guest${Number(r.capacity) === 1 ? "" : "s"}` : "—"}
              dark={dark}
            />
            <InfoRow label="Price / Night" value={fmtAmt(r.price_per_night)} dark={dark} />
            {r.room_status && <InfoRow label="Room Status" value={titleCase(r.room_status)} dark={dark} />}
          </div>
        </div>
      ))}
    </div>
  );
}

function titleCase(s) {
  return String(s).replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function InvoiceRoomFeatures({ rooms, dark }) {
  const amenities = collectRoomAmenities(rooms);
  if (!amenities.length) return null;

  return (
    <Section title="Room Features" dark={dark}>
      <ul className={`text-xs space-y-1 list-disc pl-4 ${dark ? "text-gray-300" : "text-[#486581]"}`}>
        {amenities.map((a) => (
          <li key={a}>{a}</li>
        ))}
      </ul>
    </Section>
  );
}

export function InvoiceRoomAccommodationSection({ rooms, dark, showMeta = true }) {
  return (
    <Section title="Room / Accommodation Details" dark={dark}>
      <InvoiceRoomTable rooms={rooms} dark={dark} />
      {showMeta && <InvoiceRoomMetaCards rooms={rooms} dark={dark} />}
    </Section>
  );
}

export function InvoicePrintDocument({ doc, dark }) {
  const inv = doc?.invoice ?? {};
  const booking = doc?.booking ?? {};
  const guest = doc?.guest ?? {};
  const stay = doc?.stay ?? {};
  const bd = doc?.breakdown ?? {};
  const rooms = doc?.rooms ?? [];
  const payments = doc?.payments ?? [];

  const resort = booking.resort ?? {};

  return (
    <div
      className={`invoice-print-document max-w-3xl mx-auto p-6 text-sm ${
        dark ? "bg-white text-gray-900" : "bg-white text-gray-900"
      }`}
    >
      <header className="text-center border-b-2 border-gray-900 pb-4 mb-4">
        <h1 className="text-xl font-bold">{docVal(resort.name, "Resort Invoice")}</h1>
        {resort.address && <p className="text-xs text-gray-500 mt-1">{resort.address}</p>}
        {(resort.phone || resort.email) && (
          <p className="text-xs text-gray-500">
            {[resort.phone, resort.email].filter(Boolean).join(" · ")}
          </p>
        )}
        <p className="text-sm font-extrabold tracking-widest mt-3 uppercase">Invoice</p>
        <p className="text-base font-semibold">{docVal(inv.invoice_number)}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <h2 className="text-[10px] font-bold uppercase text-gray-400 border-b mb-2">Guest Information</h2>
          <InfoRow label="Guest Name" value={docVal(guest.name, "—")} dark={false} />
          <InfoRow label="Email" value={docVal(guest.email, "—")} dark={false} />
          <InfoRow label="Phone" value={docVal(guest.phone, "—")} dark={false} />
        </div>
        <div>
          <h2 className="text-[10px] font-bold uppercase text-gray-400 border-b mb-2">Booking Information</h2>
          <InfoRow label="Invoice Number" value={docVal(inv.invoice_number)} dark={false} />
          <InfoRow label="Booking Code" value={docVal(booking.booking_code)} dark={false} />
          <InfoRow label="Booking Status" value={titleCase(booking.status)} dark={false} />
          <InfoRow label="Issued Date" value={fmtDocDate(inv.issued_at)} dark={false} />
        </div>
      </div>

      <div className="mb-4">
        <h2 className="text-[10px] font-bold uppercase text-gray-400 border-b mb-2">Stay Details</h2>
        <InfoRow label="Check-in" value={fmtDocDate(stay.check_in)} dark={false} />
        <InfoRow label="Check-out" value={fmtDocDate(stay.check_out)} dark={false} />
        <InfoRow label="Nights" value={stay.nights ?? "—"} dark={false} />
        <InfoRow
          label="Guests"
          value={
            stay.adults != null || stay.children != null
              ? `${stay.adults ?? 0} Adults, ${stay.children ?? 0} Children`
              : "—"
          }
          dark={false}
        />
      </div>

      <div className="mb-4">
        <h2 className="text-[10px] font-bold uppercase text-gray-400 border-b mb-2">Room / Accommodation Details</h2>
        <InvoiceRoomTable rooms={rooms} dark={false} />
        <InvoiceRoomMetaCards rooms={rooms} dark={false} />
        {collectRoomAmenities(rooms).length > 0 && (
          <ul className="text-xs mt-2 list-disc pl-5 text-gray-600">
            {collectRoomAmenities(rooms).map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="mb-4">
        <h2 className="text-[10px] font-bold uppercase text-gray-400 border-b mb-2">Payment Summary</h2>
        <InfoRow label="Subtotal" value={fmtAmt(bd.subtotal)} dark={false} />
        {Number(bd.room_discount_total) > 0 && (
          <InfoRow label="Room Discount" value={`-${fmtAmt(bd.room_discount_total)}`} dark={false} />
        )}
        {Number(bd.coupon_discount) > 0 && (
          <InfoRow
            label={`Coupon${bd.coupon_code ? ` (${bd.coupon_code})` : ""}`}
            value={`-${fmtAmt(bd.coupon_discount)}`}
            dark={false}
          />
        )}
        {Number(bd.discount) > 0 && !bd.room_discount_total && (
          <InfoRow label="Discount" value={`-${fmtAmt(bd.discount)}`} dark={false} />
        )}
        <InfoRow label="Tax" value={fmtAmt(bd.tax)} dark={false} />
        <InfoRow label="Service Charge" value={fmtAmt(bd.service_charge)} dark={false} />
        <div className="border-t border-gray-200 my-1" />
        <InfoRow label="Total" value={fmtAmt(bd.total)} dark={false} />
        <InfoRow label="Paid" value={fmtAmt(bd.paid)} dark={false} />
        <InfoRow label="Balance Due" value={fmtAmt(bd.balance)} dark={false} />
      </div>

      {payments.length > 0 && (
        <div className="mb-4">
          <h2 className="text-[10px] font-bold uppercase text-gray-400 border-b mb-2">Payment Information</h2>
          {payments.map((pay) => (
            <div key={pay.id ?? pay.payment_id} className="mb-2 pb-2 border-b border-gray-100 last:border-0">
              <InfoRow label="Payment ID" value={docVal(pay.payment_id)} dark={false} />
              <InfoRow label="Payment Method" value={docVal(pay.payment_method, "—")} dark={false} />
              <InfoRow label="Payment Status" value={titleCase(pay.status)} dark={false} />
              <InfoRow label="Payment Date" value={fmtDocDate(pay.paid_at)} dark={false} />
              <InfoRow label="Amount Paid" value={fmtAmt(pay.amount)} dark={false} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
