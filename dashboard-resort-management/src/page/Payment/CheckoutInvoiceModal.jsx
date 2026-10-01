import { useEffect, useState } from "react";
import { Button, Spin, message } from "antd";
import { MdClose, MdPrint } from "react-icons/md";
import { request } from "../../util/request";
import { buildInvoiceDocument, buildInvoiceFromBooking } from "./invoiceDocumentHelpers";
import ResortInvoiceReceipt from "./ResortInvoiceReceipt";
import PrintPortal from "./PrintPortal";

export default function CheckoutInvoiceModal({ booking, open, onClose, dark }) {
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPrint, setShowPrint] = useState(false);

  useEffect(() => {
    if (!open || !booking) return;
    setShowPrint(false);
    setLoading(true);

    const invoiceId = booking.invoice?.id;
    if (invoiceId) {
      request(`admin/invoices/${invoiceId}`, "get").then((res) => {
        if (res?.errors) {
          message.error(res.errors.message ?? "Unable to load invoice.");
          setDoc(buildInvoiceFromBooking(booking));
        } else {
          const built = buildInvoiceDocument(res?.data, res?.document);
          setDoc({
            ...built,
            logoUrl: built?.logoUrl ?? built?.booking?.resort?.logo_url ?? booking.resort?.logo_url ?? null,
          });
        }
        setLoading(false);
      });
      return;
    }

    const fromBooking = buildInvoiceFromBooking(booking);
    setDoc({
      ...fromBooking,
      logoUrl: fromBooking?.logoUrl ?? booking.resort?.logo_url ?? null,
    });
    setLoading(false);
  }, [open, booking]);

  if (!open) return null;

  const print = () => {
    setShowPrint(true);
    setTimeout(() => window.print(), 400);
  };

  const shell = dark ? "bg-gray-800 border border-gray-700" : "bg-white";

  return (
    <>
      <PrintPortal active={showPrint && !!doc}>
        <ResortInvoiceReceipt doc={doc} />
      </PrintPortal>

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-3 py-6 overflow-y-auto no-print">
        <div className={`rounded-xl shadow-2xl w-full max-w-md p-4 sm:p-5 ${shell}`}>
          <div className="flex items-center justify-between mb-4 gap-2">
            <h3 className={`text-base font-semibold ${dark ? "text-gray-100" : "text-[#102A43]"}`}>
              Invoice
            </h3>
            <Button type="text" onClick={onClose} aria-label="Close">
              <MdClose size={18} />
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Spin />
            </div>
          ) : !doc ? (
            <p className={`text-sm text-center py-12 ${dark ? "text-gray-400" : "text-[#829AB1]"}`}>
              Invoice not available.
            </p>
          ) : (
            <div className="max-h-[70vh] overflow-y-auto">
              <ResortInvoiceReceipt doc={doc} />
            </div>
          )}

          <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-gray-200/20">
            <Button onClick={onClose}>Close</Button>
            <Button
              onClick={print}
              disabled={!doc || loading}
              className="bg-[#FF6B00] text-white inline-flex items-center gap-1"
            >
              <MdPrint size={14} /> Print
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
