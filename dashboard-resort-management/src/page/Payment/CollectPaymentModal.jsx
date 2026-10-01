import { useState } from "react";
import { Select, InputNumber, message, Button } from "antd";
import { MdClose } from "react-icons/md";
import { request } from "../../util/request";
import { PAY_METHODS, fmtAmt } from "./paymentHelpers";
import KhqrPaymentModal from "./KhqrPaymentModal";

const KHQR_GATEWAYS = [
  { value: "aba-khqr", label: "ABA KHQR" },
  { value: "acleda-khqr", label: "ACLEDA KHQR" },
];

export default function CollectPaymentModal({ booking, onClose, onSaved, dark }) {
  const [saving, setSaving] = useState(false);
  const [khqrOpen, setKhqrOpen] = useState(false);
  const remaining = Number(booking.balance_due ?? booking.total_amount ?? 0);
  const [amount, setAmount] = useState(remaining > 0 ? remaining : "");
  const [method, setMethod] = useState("cash");
  const [khqrGateway, setKhqrGateway] = useState("aba-khqr");
  const methods = PAY_METHODS.filter((m) => m.value);

  const handleSave = async () => {
    if (method === "qr_code") {
      setKhqrOpen(true);
      return;
    }
    if (remaining <= 0) {
      message.error("This booking has no remaining balance.");
      return;
    }
    setSaving(true);
    const res = await request("admin/payments", "post", {
      booking_id: booking.id,
      payment_method: method,
      amount: Number(amount),
      status: "paid",
    });
    setSaving(false);
    if (res?.errors) {
      message.error(res.errors.message ?? "Payment failed.");
      return;
    }
    message.success("Payment recorded successfully.");
    onSaved?.();
    onClose();
  };

  const modalClass = `rounded-xl shadow-2xl w-full max-w-md p-6 ${dark ? "bg-gray-800 border border-gray-700" : "bg-white"}`;
  const titleClass = `text-base font-semibold ${dark ? "text-gray-100" : "text-[#102A43]"}`;
  const labelClass = `block text-xs font-semibold mb-1 ${dark ? "text-gray-300" : "text-[#486581]"}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className={modalClass}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={titleClass}>Collect payment</h3>
          <Button aria-label="Close" onClick={onClose}><MdClose size={14} /></Button>
        </div>
        <p className={`text-sm mb-4 ${dark ? "text-gray-300" : "text-[#486581]"}`}>
          {booking.booking_code ?? `BK-${booking.id}`} · {booking.user?.name ?? "Guest"}
        </p>
        <div className={`rounded-lg p-3 mb-4 text-xs space-y-1 ${dark ? "bg-gray-700/50" : "bg-[#F5F8FC]"}`}>
          <div className="flex justify-between"><span>Total</span><span>{fmtAmt(booking.total_amount)}</span></div>
          <div className="flex justify-between"><span>Paid</span><span>{fmtAmt(booking.deposit_amount)}</span></div>
          <div className="flex justify-between font-semibold"><span>Remaining</span><span>{fmtAmt(remaining)}</span></div>
        </div>
        <label className={labelClass}>Payment method</label>
        <Select className="w-full mb-3" value={method} onChange={setMethod} options={methods} />
        {method === "qr_code" && (
          <>
            <label className={labelClass}>KHQR gateway</label>
            <Select className="w-full mb-3" value={khqrGateway} onChange={setKhqrGateway} options={KHQR_GATEWAYS} />
          </>
        )}
        {method !== "qr_code" && (
          <>
            <label className={labelClass}>Amount (validated on server)</label>
            <InputNumber className="w-full mb-4" min={0.01} step={0.01} max={remaining} value={amount} onChange={setAmount} />
          </>
        )}
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || remaining <= 0} className="bg-[#FF6B00] text-white">
            {saving ? "Saving…" : method === "qr_code" ? "Generate QR" : "Record payment"}
          </Button>
        </div>
      </div>
      {khqrOpen ? (
        <KhqrPaymentModal
          booking={booking}
          open={khqrOpen}
          dark={dark}
          gateway={khqrGateway}
          onClose={() => setKhqrOpen(false)}
          onPaid={() => {
            setKhqrOpen(false);
            onSaved?.();
            onClose();
          }}
        />
      ) : null}
    </div>
  );
}
