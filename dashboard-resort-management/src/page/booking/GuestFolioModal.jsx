import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Form, Input, InputNumber, Modal, Select, message } from "antd";
import { MdReceipt, MdClose } from "react-icons/md";
import { request } from "../../util/request";
import { fmtAmt } from "../Payment/paymentHelpers";
import { fmtDateTime } from "../../util/fmtDateTime";

const CHARGE_TYPES = [
  { value: "minibar", label: "Minibar" },
  { value: "laundry", label: "Laundry" },
  { value: "spa", label: "Spa" },
  { value: "restaurant", label: "Restaurant" },
  { value: "transportation", label: "Transportation" },
  { value: "extra_bed", label: "Extra bed" },
  { value: "service", label: "Service" },
  { value: "adjustment", label: "Adjustment" },
  { value: "discount", label: "Credit / discount" },
];

export default function GuestFolioModal({ booking, open, onClose, dark }) {
  const [folio, setFolio] = useState(null);
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [voidingId, setVoidingId] = useState(null);
  const [voidReason, setVoidReason] = useState("");
  const [form] = Form.useForm();

  const load = useCallback(async () => {
    if (!booking?.id) return;
    setLoading(true);
    const res = await request(`admin/bookings/${booking.id}/folio`, "get");
    setLoading(false);
    if (res?.data) {
      setFolio(res.data);
    } else {
      message.error(res?.errors?.message ?? "Could not load guest folio");
    }
  }, [booking?.id]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const totals = folio?.totals ?? {};
  const incidentals = folio?.incidental_charges ?? [];
  const canPost = folio?.folio?.status === "open" && ["confirmed", "checked_in", "checked_out"].includes(booking?.status);

  const onPost = async (values) => {
    setPosting(true);
    const res = await request(`admin/bookings/${booking.id}/folio/charges`, "post", {
      ...values,
      idempotency_key: values.idempotency_key || `staff-${booking.id}-${Date.now()}`,
    });
    setPosting(false);
    if (res?.folio) {
      setFolio(res.folio);
      form.resetFields();
      message.success("Charge posted");
    } else {
      message.error(res?.errors?.message ?? res?.errors?.amount?.[0] ?? "Failed to post charge");
    }
  };

  const onVoid = async (chargeId) => {
    if (!voidReason.trim()) {
      message.warning("Enter a void reason");
      return;
    }
    setVoidingId(chargeId);
    const res = await request(`admin/folio-charges/${chargeId}/void`, "post", { void_reason: voidReason });
    setVoidingId(null);
    if (res?.folio) {
      setFolio(res.folio);
      setVoidReason("");
      message.success("Charge voided");
    } else {
      message.error(res?.errors?.message ?? "Void failed");
    }
  };

  const downloadPdf = async () => {
    const token = localStorage.getItem("token");
    const base = import.meta.env.VITE_API_URL || "";
    const url = `${base}/api/admin/bookings/${booking.id}/folio/pdf`;
    try {
      const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!resp.ok) {
        message.error("Invoice PDF not available");
        return;
      }
      const blob = await resp.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `folio-${booking.booking_code || booking.id}.pdf`;
      link.click();
    } catch {
      message.error("Download failed");
    }
  };

  const panel = dark ? "bg-gray-800 text-gray-100" : "bg-white text-[#102A43]";
  const sub = dark ? "text-gray-400" : "text-[#486581]";
  const border = dark ? "border-gray-700" : "border-[#D9E2EC]";

  const activeCharges = useMemo(
    () => incidentals.filter((c) => !c.voided_at),
    [incidentals]
  );

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={920}
      title={
        <span className="inline-flex items-center gap-2">
          <MdReceipt className="text-[#FF6B00]" /> Guest folio — {booking?.booking_code}
        </span>
      }
      destroyOnClose
    >
      {loading && !folio ? (
        <p className={sub}>Loading folio…</p>
      ) : (
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className={`grid sm:grid-cols-2 gap-3 p-3 rounded-lg border ${border} ${panel}`}>
            <div>
              <p className={`text-xs uppercase ${sub}`}>Guest</p>
              <p className="font-semibold">{folio?.booking?.guest?.name ?? booking?.user?.name}</p>
              <p className={`text-sm ${sub}`}>{folio?.booking?.guest?.email ?? booking?.user?.email}</p>
            </div>
            <div>
              <p className={`text-xs uppercase ${sub}`}>Stay</p>
              <p className="text-sm">{fmtDateTime(folio?.booking?.check_in)} → {fmtDateTime(folio?.booking?.check_out)}</p>
              <p className={`text-sm ${sub}`}>Status: {folio?.booking?.status ?? booking?.status}</p>
            </div>
          </div>

          <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2`}>
            {[
              ["Lodging", totals.lodging_total],
              ["Incidentals", totals.incidentals_total],
              ["Paid", totals.net_paid],
              ["Balance", totals.balance_due],
            ].map(([label, val]) => (
              <div key={label} className={`p-2 rounded-lg border ${border} ${panel}`}>
                <p className={`text-xs ${sub}`}>{label}</p>
                <p className="font-bold text-[#FF6B00]">{fmtAmt(val)}</p>
              </div>
            ))}
          </div>

          <section>
            <h4 className="font-semibold mb-2">Room charges</h4>
            <div className={`rounded-lg border overflow-hidden ${border}`}>
              <table className="w-full text-sm">
                <thead className={dark ? "bg-gray-700/50" : "bg-[#F5F8FC]"}>
                  <tr>
                    <th className="text-left p-2">Description</th>
                    <th className="text-right p-2">Qty</th>
                    <th className="text-right p-2">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {(folio?.room_charges ?? []).map((line, i) => (
                    <tr key={i} className={`border-t ${border}`}>
                      <td className="p-2">{line.description}</td>
                      <td className="p-2 text-right">{line.quantity}</td>
                      <td className="p-2 text-right">{fmtAmt(line.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h4 className="font-semibold mb-2">Incidental charges</h4>
            <div className={`rounded-lg border overflow-hidden ${border}`}>
              <table className="w-full text-sm">
                <thead className={dark ? "bg-gray-700/50" : "bg-[#F5F8FC]"}>
                  <tr>
                    <th className="text-left p-2">Type</th>
                    <th className="text-left p-2">Description</th>
                    <th className="text-right p-2">Amount</th>
                    <th className="p-2 w-28">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {incidentals.length === 0 ? (
                    <tr><td colSpan={4} className={`p-3 ${sub}`}>No incidental charges yet.</td></tr>
                  ) : (
                    incidentals.map((c) => (
                      <tr key={c.id} className={`border-t ${border} ${c.voided_at ? "opacity-50" : ""}`}>
                        <td className="p-2 capitalize">{c.charge_type?.replace("_", " ")}</td>
                        <td className="p-2">
                          {c.description}
                          {c.voided_at && <span className={`block text-xs ${sub}`}>Voided: {c.void_reason}</span>}
                        </td>
                        <td className="p-2 text-right">{fmtAmt(c.amount)}</td>
                        <td className="p-2">
                          {!c.voided_at && canPost && (
                            <Button
                              size="small"
                              danger
                              loading={voidingId === c.id}
                              onClick={() => onVoid(c.id)}
                              icon={<MdClose />}
                            >
                              Void
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {canPost && activeCharges.length > 0 && (
              <Input.TextArea
                className="mt-2"
                rows={2}
                placeholder="Void reason (required before voiding a charge)"
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
              />
            )}
          </section>

          {canPost && (
            <section className={`p-3 rounded-lg border ${border}`}>
              <h4 className="font-semibold mb-2">Post charge</h4>
              <Form form={form} layout="vertical" onFinish={onPost} initialValues={{ quantity: 1 }}>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Form.Item name="charge_type" label="Type" rules={[{ required: true }]}>
                    <Select options={CHARGE_TYPES} />
                  </Form.Item>
                  <Form.Item name="description" label="Description" rules={[{ required: true }]}>
                    <Input maxLength={255} />
                  </Form.Item>
                  <Form.Item name="quantity" label="Quantity" rules={[{ required: true }]}>
                    <InputNumber min={0.01} className="w-full" />
                  </Form.Item>
                  <Form.Item name="unit_price" label="Unit price (USD)" rules={[{ required: true }]}>
                    <InputNumber min={0} step={0.01} className="w-full" />
                  </Form.Item>
                </div>
                <Form.Item name="note" label="Note">
                  <Input.TextArea rows={2} />
                </Form.Item>
                <Button type="primary" htmlType="submit" loading={posting} className="bg-[#FF6B00]">
                  Post charge
                </Button>
              </Form>
            </section>
          )}

          <div className="flex flex-wrap gap-2 justify-end">
            <Button onClick={load} loading={loading}>Refresh</Button>
            <Button onClick={downloadPdf}>Download invoice PDF</Button>
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
