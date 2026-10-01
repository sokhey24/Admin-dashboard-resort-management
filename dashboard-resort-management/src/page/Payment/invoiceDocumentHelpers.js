import { fmtAmt } from "./paymentHelpers";

export { fmtAmt };

export function docVal(value, fallback = "N/A") {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "string" && ["null", "undefined"].includes(value.toLowerCase())) return fallback;
  return value;
}

export function fmtDocDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
}

export function titleCaseStatus(value) {
  if (!value) return "—";
  return String(value).replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function guestCountLabel(stay = {}) {
  const adults = Number(stay.adults ?? 0);
  const children = Number(stay.children ?? 0);
  const parts = [];
  if (adults > 0) parts.push(`${adults} Adult${adults === 1 ? "" : "s"}`);
  if (children > 0) parts.push(`${children} Child${children === 1 ? "" : "ren"}`);
  return parts.length ? parts.join(", ") : "—";
}

function roomTypeName(room) {
  return room?.room_type ?? room?.roomType?.name ?? room?.room_type?.name ?? null;
}

/** Normalize rooms from API document, payment reference, or booking relation. */
export function normalizeDocumentRooms({ documentRooms, referenceRooms, booking }) {
  if (Array.isArray(documentRooms) && documentRooms.length) {
    return documentRooms.map((r) => ({ ...r, room_type: r.room_type ?? roomTypeName(r) }));
  }
  if (Array.isArray(referenceRooms) && referenceRooms.length) {
    return referenceRooms.map((r) => ({ ...r, room_type: r.room_type ?? roomTypeName(r) }));
  }
  const raw = booking?.rooms;
  if (!Array.isArray(raw) || !raw.length) return [];

  const nights = booking?.nights ?? 0;
  return raw.map((r) => {
    const pivot = r.pivot ?? {};
    const rt = r.room_type ?? r.roomType ?? {};
    return {
      room_number: r.room_number,
      room_type: rt?.name ?? roomTypeName(r),
      resort: booking?.resort?.name,
      branch: r.branch?.name ?? r.branch_name,
      floor: r.floor,
      view: r.view,
      bed_type: rt?.bed_type,
      capacity: rt?.max_occupancy,
      room_status: r.status,
      amenities: Array.isArray(rt?.amenities) ? rt.amenities : r.amenities ?? [],
      price_per_night: Number(pivot.price_per_night ?? r.price_per_night ?? 0),
      nights: Number(pivot.nights ?? nights ?? 0),
      subtotal: Number(pivot.subtotal ?? 0),
      discount_percent: Number(pivot.discount_percent ?? 0),
      discount_amount: Number(pivot.discount_amount ?? 0),
      net_subtotal: Number(pivot.net_subtotal ?? pivot.subtotal ?? 0),
    };
  });
}

export function collectRoomAmenities(rooms) {
  const set = new Set();
  (rooms ?? []).forEach((r) => {
    const list = r.amenities ?? [];
    if (Array.isArray(list)) {
      list.forEach((a) => {
        const label = typeof a === "string" ? a : a?.name ?? a?.label;
        if (label) set.add(label);
      });
    }
  });
  return [...set];
}

/** Build a unified document shape for invoice UI from API `document` or legacy invoice row. */
export function buildInvoiceDocument(invoice, apiDocument) {
  if (apiDocument?.invoice) {
    return apiDocument;
  }

  const booking = invoice?.booking ?? {};
  const subtotal = Number(invoice?.amount ?? booking.subtotal ?? 0);
  const discount = Number(invoice?.discount ?? booking.discount ?? 0);
  const tax = Number(invoice?.tax ?? booking.tax_amount ?? 0);
  const service = Number(invoice?.service_charge ?? booking.service_charge_amount ?? 0);
  const total = Number(invoice?.total ?? booking.total_amount ?? 0);
  const paid = Number(booking.deposit_amount ?? 0);

  return {
    invoice: {
      id: invoice?.id,
      invoice_number: invoice?.invoice_number,
      status: invoice?.status,
      issued_at: invoice?.issued_at,
      due_at: invoice?.due_at,
    },
    booking: {
      booking_code: booking.booking_code,
      status: booking.status,
      resort: booking.resort,
    },
    guest: booking.user
      ? {
          id: booking.user.id,
          name: booking.user.name,
          email: booking.user.email,
          phone: booking.user.phone,
        }
      : null,
    stay: {
      check_in: booking.check_in,
      check_out: booking.check_out,
      nights: booking.nights,
      adults: booking.adults,
      children: booking.children,
    },
    rooms: normalizeDocumentRooms({ booking }),
    breakdown: {
      subtotal,
      discount,
      tax,
      service_charge: service,
      total,
      paid,
      balance: Number(booking.balance_due ?? Math.max(0, total - paid)),
      room_discount_total: booking.room_discount_total,
      coupon_discount: booking.coupon_id ? discount : undefined,
    },
    payments: booking.payments ?? [],
  };
}

/** Invoice document from a booking row (checkout list / before formal invoice id). */
export function buildInvoiceFromBooking(booking) {
  if (!booking) return null;

  const stub = booking.invoice ?? {
    invoice_number: booking.booking_code ? `INV-${booking.booking_code}` : `INV-${booking.id}`,
    status: Number(booking.balance_due ?? 0) <= 0.009 ? "paid" : "pending",
    issued_at: booking.updated_at ?? booking.created_at ?? new Date().toISOString(),
    amount: booking.subtotal,
    discount: booking.discount,
    tax: booking.tax_amount,
    service_charge: booking.service_charge_amount,
    total: booking.total_amount,
  };

  const invoiceRow = { ...stub, booking: { ...booking, user: booking.user } };
  return buildInvoiceDocument(invoiceRow);
}

/** Map payment API row to invoice receipt document (matches ResortInvoiceReceipt). */
export function buildInvoiceDocumentFromPayment(payment) {
  if (!payment) return null;

  const ref = payment.reference ?? {};
  const bd = payment.breakdown ?? {};
  const inv = payment.invoice ?? {};
  const isResort = payment.source === "resort";
  const resort = ref.resort ?? ref.restaurant ?? null;

  const guest = payment.guest
    ? {
        id: payment.guest.id,
        name: payment.guest.name,
        email: payment.guest.email,
        phone: payment.guest.phone,
      }
    : null;

  return {
    logoUrl: resort?.logo_url ?? resort?.logo ?? null,
    invoice: {
      invoice_number: inv.invoice_number ?? payment.payment_id,
      status: inv.status ?? (payment.status === "paid" ? "paid" : payment.status ?? "pending"),
      issued_at: payment.paid_at ?? new Date().toISOString(),
    },
    booking: {
      booking_code: ref.booking_code ?? ref.order_code,
      status: ref.status,
      resort,
    },
    guest,
    stay: isResort
      ? {
          check_in: ref.check_in,
          check_out: ref.check_out,
          nights: ref.nights,
          adults: ref.adults,
          children: ref.children,
        }
      : {},
    breakdown: {
      subtotal: bd.subtotal,
      room_discount_total: bd.room_discount_total,
      coupon_discount: bd.coupon_discount,
      discount: bd.discount,
      tax: bd.tax,
      service_charge: bd.service_charge,
      total: bd.total ?? payment.amount,
      paid: bd.paid ?? payment.amount,
      balance: bd.balance ?? 0,
    },
    payments: [
      {
        payment_method: payment.payment_method ?? payment.method,
        amount: payment.amount,
      },
    ],
  };
}
