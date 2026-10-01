/**
 * Single-page resort payment / invoice view (modal body).
 */
import defaultLogo from "../../assets/image/LogoResort.jpg";
import config from "../../util/config";
import {
  fmtAmt,
  docVal,
  fmtDocDate,
  guestCountLabel,
  titleCaseStatus,
  normalizeDocumentRooms,
} from "./invoiceDocumentHelpers";
import { fmtDateTime } from "../../util/fmtDateTime";

function resolveLogoUrl(resort) {
  if (!resort) return defaultLogo;
  const raw = resort.logo_url ?? resort.logo;
  if (!raw) return defaultLogo;
  if (String(raw).startsWith("http")) return raw;
  const path = String(raw).replace(/^\//, "");
  return `${config.image_path}${path}`;
}

function statusBadge(status) {
  const s = String(status ?? "pending").toLowerCase();
  const map = {
    paid: "bg-green-100 text-green-800 ring-green-200",
    pending: "bg-amber-100 text-amber-800 ring-amber-200",
    partial: "bg-blue-100 text-blue-800 ring-blue-200",
    refunded: "bg-orange-100 text-orange-800 ring-orange-200",
    failed: "bg-red-100 text-red-800 ring-red-200",
    cancelled: "bg-gray-100 text-gray-600 ring-gray-200",
  };
  return map[s] ?? map.pending;
}

export default function PaymentDetailResortInvoice({ payment }) {
  if (!payment) return null;

  const ref = payment.reference ?? {};
  const resort = ref.resort ?? {};
  const guest = payment.guest ?? {};
  const bd = payment.breakdown ?? {};
  const rooms = normalizeDocumentRooms({
    referenceRooms: ref.rooms,
    booking: ref,
  });

  const logoSrc = resolveLogoUrl(resort);
  const resortName = docVal(resort.name, "Resort");
  const phone = resort.phone ?? "—";
  const email = resort.email ?? "—";
  const address = [resort.address, resort.city, resort.country].filter(Boolean).join(", ") || "—";

  const createdAt = payment.paid_at ?? ref.created_at ?? payment.created_at;
  const dueAt = payment.invoice?.due_at ?? ref.check_in;

  const lineItems = rooms.length
    ? rooms.map((r) => {
        const nights = Number(r.nights ?? ref.nights ?? 1) || 1;
        const unit = Number(r.price_per_night ?? 0);
        const amount = Number(r.net_subtotal ?? r.subtotal ?? unit * nights);
        const typeName = r.room_type ?? "Room";
        return {
          key: r.room_number ?? typeName,
          title: `${typeName} — ${r.room_number ?? "—"}`,
          description: [
            resortName,
            r.branch,
            r.view ? `View: ${r.view}` : null,
            fmtDateTime(ref.check_in) !== "—" ? `Stay: ${fmtDocDate(ref.check_in)} → ${fmtDocDate(ref.check_out)}` : null,
          ].filter(Boolean).join(" · ") || "Accommodation",
          qty: nights,
          unitPrice: unit || (nights ? amount / nights : amount),
          amount,
        };
      })
    : [{
      key: "stay",
      title: `Accommodation — ${ref.booking_code ?? payment.payment_id}`,
      description: guestCountLabel(ref) !== "—"
        ? `${guestCountLabel(ref)} · ${titleCaseStatus(ref.status)}`
        : titleCaseStatus(ref.status),
      qty: Number(ref.nights ?? 1) || 1,
      unitPrice: Number(bd.subtotal ?? payment.amount ?? 0) / (Number(ref.nights ?? 1) || 1),
      amount: Number(bd.subtotal ?? payment.amount ?? 0),
    }];

  const subtotal = Number(bd.subtotal ?? bd.discounted_subtotal ?? payment.amount ?? 0);
  const roomDisc = Number(bd.room_discount_total ?? 0);
  const couponDisc = Number(bd.coupon_discount ?? 0);
  const otherDisc = Number(bd.discount ?? 0);
  const discountTotal = roomDisc + couponDisc + (roomDisc || couponDisc ? 0 : otherDisc);
  const tax = Number(bd.tax ?? 0);
  const service = Number(bd.service_charge ?? 0);
  const total = Number(bd.total ?? payment.amount ?? 0);

  const discountPct = subtotal > 0 && discountTotal > 0
    ? Math.round((discountTotal / subtotal) * 100)
    : null;

  return (
    <div
      className="bg-white text-[#102A43] rounded-lg border border-[#D9E2EC] shadow-sm overflow-hidden"
      style={{ fontFamily: "Inter, Poppins, sans-serif" }}
    >
      {/* Top band */}
      <div className="bg-[#F5F8FC] border-b border-[#D9E2EC] px-6 py-4 flex items-center justify-between gap-4">
        <img
          src={logoSrc}
          alt=""
          className="h-14 w-14 rounded-lg object-cover border border-[#D9E2EC] bg-white shrink-0"
        />
        <h2 className="text-xl font-semibold tracking-tight text-[#486581]">Payment receipt</h2>
      </div>

      <div className="px-6 py-5 border-b border-[#D9E2EC] flex flex-col sm:flex-row sm:justify-between gap-6">
        <div className="min-w-0">
          <p className="text-base font-bold text-[#102A43]">{resortName}</p>
          <p className="text-sm text-[#486581] mt-1">{phone}</p>
          <p className="text-sm text-[#486581]">{email}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-[#829AB1] uppercase tracking-wide">Payment ID</p>
          <p className="text-sm font-mono font-semibold mt-0.5">{payment.payment_id}</p>
          <span className={`inline-flex mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ${statusBadge(payment.status)}`}>
            {titleCaseStatus(payment.status)}
          </span>
        </div>
      </div>

      {/* Meta row */}
      <div className="px-6 py-4 grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-[#D9E2EC]">
        <div>
          <p className="text-xs text-[#829AB1]">Customer</p>
          <p className="text-sm font-semibold mt-1">{docVal(guest.name, "—")}</p>
          {guest.email && <p className="text-xs text-[#486581] mt-0.5 truncate">{guest.email}</p>}
        </div>
        <div>
          <p className="text-xs text-[#829AB1]">Payment date</p>
          <p className="text-sm font-semibold mt-1">{fmtDocDate(createdAt)}</p>
        </div>
        <div>
          <p className="text-xs text-[#829AB1]">Booking / due</p>
          <p className="text-sm font-semibold mt-1">{docVal(ref.booking_code, fmtDocDate(dueAt))}</p>
        </div>
      </div>

      {/* Line items */}
      <div className="px-6 py-4 border-b border-[#D9E2EC]">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-[#829AB1] uppercase tracking-wide border-b border-[#D9E2EC]">
              <th className="pb-2 font-semibold">Product / service</th>
              <th className="pb-2 font-semibold text-center w-14">Qty</th>
              <th className="pb-2 font-semibold text-right w-24">Unit price</th>
              <th className="pb-2 font-semibold text-right w-24">Amount</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((row) => (
              <tr key={row.key} className="border-b border-[#EEF2F6] align-top">
                <td className="py-3 pr-2">
                  <p className="font-medium text-[#102A43]">{row.title}</p>
                  <p className="text-xs text-[#829AB1] mt-1">
                    <span className="font-medium text-[#486581]">Description</span>
                    <br />
                    {row.description}
                  </p>
                </td>
                <td className="py-3 text-center tabular-nums text-[#486581]">{row.qty}</td>
                <td className="py-3 text-right tabular-nums text-[#486581]">{fmtAmt(row.unitPrice)}</td>
                <td className="py-3 text-right tabular-nums font-medium">{fmtAmt(row.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="px-6 py-4 flex justify-end border-b border-[#D9E2EC]">
        <div className="w-full max-w-xs space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-[#829AB1]">Subtotal</span>
            <span className="tabular-nums font-medium">{fmtAmt(subtotal)}</span>
          </div>
          {discountTotal > 0 && (
            <div className="flex justify-between gap-4">
              <span className="text-[#829AB1]">
                Discount{discountPct != null ? ` (${discountPct}%)` : ""}
              </span>
              <span className="tabular-nums text-[#FF6B00]">−{fmtAmt(discountTotal)}</span>
            </div>
          )}
          {tax > 0 && (
            <div className="flex justify-between gap-4">
              <span className="text-[#829AB1]">Tax</span>
              <span className="tabular-nums">{fmtAmt(tax)}</span>
            </div>
          )}
          {service > 0 && (
            <div className="flex justify-between gap-4">
              <span className="text-[#829AB1]">Service charge</span>
              <span className="tabular-nums">{fmtAmt(service)}</span>
            </div>
          )}
          <div className="flex justify-between gap-4 pt-2 border-t border-[#D9E2EC]">
            <span className="font-bold text-[#102A43]">Total</span>
            <span className="tabular-nums font-bold text-lg">{fmtAmt(total)}</span>
          </div>
          <div className="flex justify-between gap-4 text-xs">
            <span className="text-[#829AB1]">Paid</span>
            <span className="tabular-nums text-green-700 font-medium">{fmtAmt(bd.paid ?? payment.amount)}</span>
          </div>
          {Number(bd.balance ?? 0) > 0.009 && (
            <div className="flex justify-between gap-4 text-xs">
              <span className="text-[#829AB1]">Balance due</span>
              <span className="tabular-nums text-amber-700 font-medium">{fmtAmt(bd.balance)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Payment meta + message */}
      <div className="px-6 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-[#486581]">
        <div className="space-y-1">
          <p><span className="text-[#829AB1]">Method:</span> {docVal(payment.payment_method ?? payment.method, "—")}</p>
          <p><span className="text-[#829AB1]">Gateway:</span> {docVal(payment.gateway, "—")}</p>
          {/* {payment.transaction_id && (
            <p className="break-all"><span className="text-[#829AB1]">Transaction:</span> {payment.transaction_id}</p>
          )} */}
        </div>
        <div>
          <p className="text-[#829AB1] font-semibold uppercase tracking-wide text-[10px] mb-1">Message</p>
          <p className="text-sm text-[#486581] leading-relaxed">
            {payment.notes
              || `Thank you for choosing ${resortName}. We look forward to welcoming you.`}
          </p>
        </div>
      </div>

      <div className="px-6 py-4 bg-[#F5F8FC] border-t border-[#D9E2EC] flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <p className="text-base font-bold text-[#102A43]">Thank you!</p>
        <p className="text-[10px] text-[#829AB1] max-w-md text-right sm:text-right">{address}</p>
      </div>
    </div>
  );
}
