import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Spin, message } from "antd";
import { MdClose } from "react-icons/md";
import { request } from "../../util/request";
import { bookingRoomLabel, fmtAmt, methodLabel } from "./paymentHelpers";
import { fmtDateTime } from "../../util/fmtDateTime";

function renderQr(host, payment) {
  if (!host || !payment) return;
  const svg = payment.qr_svg;
  const payload = payment.qr_payload;
  if (svg && typeof svg === "string" && svg.includes("<svg")) {
    host.innerHTML = `<div class="khqr-svg-wrap" style="max-width:220px;margin:0 auto">${svg}</div>`;
    const el = host.querySelector("svg");
    if (el) {
      el.setAttribute("width", "220");
      el.setAttribute("height", "220");
    }
    return;
  }
  if (!payload) {
    host.innerHTML = "<p class=\"text-sm opacity-70\">QR unavailable</p>";
    return;
  }
  host.textContent = payload;
}

function gatewayTitle(gateway) {
  if (gateway === "acleda-khqr") return "ACLEDA KHQR";
  return "ABA KHQR";
}

function secondsUntil(iso) {
  if (!iso) return 300;
  const end = new Date(iso).getTime();
  if (Number.isNaN(end)) return 300;
  return Math.max(0, Math.floor((end - Date.now()) / 1000));
}

function normalizeKhqrPayment(raw) {
  if (!raw) return null;
  const khqr = raw.khqr ?? {};
  const md5 = raw.khqr_md5 ?? khqr.md5 ?? raw.md5;
  const expiresAt = raw.expires_at ?? khqr.expires_at ?? null;
  return {
    id: raw.id,
    payment_id: raw.payment_id,
    amount: Number(raw.amount ?? 0),
    currency: (raw.currency || khqr.currency || "USD").toUpperCase(),
    khqr_md5: md5 ? String(md5).toLowerCase() : null,
    qr_payload: raw.qr_payload ?? khqr.qr_payload ?? khqr.qr ?? null,
    qr_svg: raw.qr_svg,
    seconds_remaining: raw.seconds_remaining ?? secondsUntil(expiresAt),
    expires_at: expiresAt,
  };
}

export default function KhqrPaymentModal({
  booking,
  open,
  onClose,
  onPaid,
  dark,
  gateway = "aba-khqr",
  initialPayment = null,
}) {
  const [phase, setPhase] = useState("loading");
  const [payment, setPayment] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [countdown, setCountdown] = useState("05:00");
  const [generating, setGenerating] = useState(false);
  const qrRef = useRef(null);
  const pollRef = useRef(null);
  const timerRef = useRef(null);
  const verifyBusy = useRef(false);
  const stopped = useRef(false);

  const shell = dark ? "bg-gray-800 border border-gray-700 text-gray-100" : "bg-white";
  const sub = dark ? "text-gray-400" : "text-[#486581]";
  const bankLabel = gatewayTitle(gateway);

  const cleanup = useCallback(() => {
    stopped.current = true;
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    verifyBusy.current = false;
  }, []);

  const startTimer = useCallback((seconds) => {
    if (timerRef.current) clearInterval(timerRef.current);
    let remaining = Math.max(0, Number(seconds) || 300);
    const tick = () => {
      const m = String(Math.floor(remaining / 60)).padStart(2, "0");
      const s = String(remaining % 60).padStart(2, "0");
      setCountdown(`${m}:${s}`);
      if (remaining <= 0) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        cleanup();
        setPhase("expired");
        return;
      }
      remaining -= 1;
    };
    tick();
    timerRef.current = setInterval(tick, 1000);
  }, [cleanup]);

  const verifyOnce = useCallback(async (pay) => {
    if (stopped.current || verifyBusy.current || !pay) return;
    verifyBusy.current = true;
    try {
      const md5 = pay.khqr_md5;
      const res = md5
        ? await request("admin/khqr/verify", "post", { md5: String(md5).toLowerCase() })
        : await request(`admin/payments/${pay.id}/khqr/verify`, "post", {});
      if (stopped.current) return;
      if (res?.paid) {
        cleanup();
        setReceipt(res?.data ?? null);
        setPhase("success");
        message.success("Payment successful.");
        onPaid?.(res);
        return;
      }
      if (res?.status === "api_error") {
        return;
      }
      if (["expired", "failed", "invalid"].includes(res?.status)) {
        cleanup();
        setPhase("expired");
      }
    } finally {
      verifyBusy.current = false;
    }
  }, [cleanup, onPaid]);

  const startPoll = useCallback((pay) => {
    if (pollRef.current) clearInterval(pollRef.current);
    stopped.current = false;
    pollRef.current = setInterval(() => verifyOnce(pay), 3000);
    verifyOnce(pay);
  }, [verifyOnce]);

  const beginSession = useCallback((pay) => {
    const normalized = normalizeKhqrPayment(pay);
    if (!normalized?.qr_payload && !(normalized?.qr_svg && String(normalized.qr_svg).includes("<svg"))) {
      message.error("Unable to generate payment QR code. Please try again.");
      setPhase("expired");
      return;
    }
    setPayment(normalized);
    setPhase("waiting");
    requestAnimationFrame(() => renderQr(qrRef.current, normalized));
    startTimer(normalized.seconds_remaining || 300);
    startPoll(normalized);
  }, [startPoll, startTimer]);

  const generateQr = useCallback(async () => {
    if (generating) return;
    setGenerating(true);
    setPhase("loading");
    setReceipt(null);
    try {
      const res = await request(`admin/bookings/${booking.id}/khqr`, "post", { gateway });
      if (res?.errors) {
        message.error(res.errors.message ?? "Unable to generate payment QR code. Please try again.");
        setPhase("expired");
        return;
      }
      beginSession(res?.data ?? res);
    } finally {
      setGenerating(false);
    }
  }, [booking.id, beginSession, gateway, generating]);

  useEffect(() => {
    if (!open) {
      cleanup();
      setPayment(null);
      setReceipt(null);
      setPhase("loading");
      return undefined;
    }
    stopped.current = false;
    const resume = normalizeKhqrPayment(initialPayment);
    if (resume?.khqr_md5 && resume.seconds_remaining > 0 && (resume.qr_payload || resume.qr_svg)) {
      beginSession(resume);
    } else {
      generateQr();
    }
    return cleanup;
  }, [open, booking?.id, gateway]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (payment && qrRef.current && phase === "waiting") renderQr(qrRef.current, payment);
  }, [payment, phase]);

  if (!open) return null;

  const amountLabel = payment
    ? fmtAmt(payment.amount)
    : fmtAmt(booking.balance_due ?? booking.total_amount ?? 0);
  const receiptAmt = receipt?.amount != null ? fmtAmt(receipt.amount) : amountLabel;
  const roomLabel = bookingRoomLabel(booking);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-3 py-4" role="presentation">
      <div
        className={`rounded-xl shadow-2xl w-full max-w-md p-5 max-h-[92vh] overflow-auto ${shell}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="adminKhqrTitle"
      >
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 id="adminKhqrTitle" className="text-base font-semibold flex-1">{bankLabel}</h3>
          <Button aria-label="Close payment dialog" onClick={() => { cleanup(); onClose(); }} icon={<MdClose size={16} />} />
        </div>

        {phase === "loading" && (
          <div className="text-center py-10">
            <Spin size="large" />
            <p className={`text-sm mt-4 ${sub}`}>Generating QR code…</p>
          </div>
        )}

        {phase === "waiting" && (
          <>
            <div className="rounded-t-lg bg-[#E1232E] text-white text-center py-2 text-sm font-bold tracking-wide mb-0">
              KHQR
            </div>
            <div className={`rounded-b-lg border mb-3 p-3 ${dark ? "border-gray-600 bg-white" : "border-[#D9E2EC] bg-white"}`}>
              <p className="text-center text-xs text-gray-500 uppercase tracking-wider mb-1">
                {booking?.resort?.name ?? "Resort"}
              </p>
              <p className="text-center text-2xl font-bold text-gray-900 mb-3">{amountLabel}</p>
              <div
                ref={qrRef}
                className="flex items-center justify-center min-h-[232px]"
                aria-live="polite"
              />
            </div>
            <dl className={`text-sm space-y-2 mb-3 ${sub}`}>
              {payment?.payment_id ? (
                <div className="flex justify-between gap-3"><dt>Payment ID</dt><dd className="font-mono">#{payment.payment_id}</dd></div>
              ) : null}
              {booking?.booking_code ? (
                <div className="flex justify-between gap-3"><dt>Booking</dt><dd className="font-mono">#{booking.booking_code}</dd></div>
              ) : null}
              {roomLabel ? (
                <div className="flex justify-between gap-3"><dt>Room Number</dt><dd className="font-mono">{roomLabel}</dd></div>
              ) : null}
            </dl>
            <p className={`text-xs text-center mb-2 ${sub}`}>
              Scan with Bakong or any mobile banking app that supports KHQR.
            </p>
            <p className="text-center text-sm mb-2">
              Expires in <strong className="text-lg tracking-wide text-[#FF6B00]">{countdown}</strong>
            </p>
            <p className="text-center text-sm mb-4 flex items-center justify-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-[#FF6B00] animate-pulse" aria-hidden="true" />
              {generating ? "Generating QR…" : "Waiting for payment…"}
            </p>
            <div className="flex justify-center">
              <Button onClick={() => { cleanup(); onClose(); }} disabled={generating}>Cancel</Button>
            </div>
          </>
        )}

        {phase === "success" && (
          <div className="text-center py-2">
            <div className="w-14 h-14 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-2xl mx-auto mb-3">✓</div>
            <p className="text-lg font-semibold text-green-600 mb-1">Payment successful</p>
            <p className={`text-2xl font-bold mb-4 ${dark ? "text-[#FF6B00]" : "text-[#FF6B00]"}`}>{receiptAmt}</p>
            <div className={`text-left text-xs rounded-lg p-3 mb-4 space-y-1 ${dark ? "bg-gray-700/50" : "bg-[#F5F8FC]"}`}>
              {receipt?.payment_id && (
                <div className="flex justify-between gap-2">
                  <span className={sub}>Transaction ID</span>
                  <span className="font-mono font-medium">{receipt.payment_id}</span>
                </div>
              )}
              {receipt?.paid_at && (
                <div className="flex justify-between gap-2">
                  <span className={sub}>Date</span>
                  <span>{fmtDateTime(receipt.paid_at)}</span>
                </div>
              )}
              <div className="flex justify-between gap-2">
                <span className={sub}>Method</span>
                <span>{methodLabel(receipt?.payment_method ?? gateway)}</span>
              </div>
              {receipt?.invoice?.invoice_number && (
                <div className="flex justify-between gap-2">
                  <span className={sub}>Invoice</span>
                  <span className="font-mono">{receipt.invoice.invoice_number}</span>
                </div>
              )}
            </div>
            <Button type="primary" className="bg-[#FF6B00]" onClick={() => { cleanup(); onClose(); }}>Done</Button>
          </div>
        )}

        {phase === "expired" && (
          <div className="text-center py-4">
            <p className="text-lg font-semibold mb-2">QR code expired</p>
            <p className={`text-sm mb-4 ${sub}`}>This payment session has expired.</p>
            <div className="flex justify-center gap-2 flex-wrap">
              <Button type="primary" className="bg-[#FF6B00]" onClick={() => { stopped.current = false; generateQr(); }}>Try again</Button>
              <Button onClick={() => { cleanup(); onClose(); }}>Cancel</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
