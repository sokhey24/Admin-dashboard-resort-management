import { useEffect, useState } from "react";
import { Button, Spin, message } from "antd";
import { MdClose, MdPrint, MdVisibility } from "react-icons/md";
import { request } from "../../util/request";
import { buildInvoiceDocument } from "./invoiceDocumentHelpers";
import ResortInvoiceReceipt from "./ResortInvoiceReceipt";
import PrintPortal from "./PrintPortal";

/** View / print invoice (receipt layout) by invoice id. */
export default function InvoiceViewModal({ invoiceId, open, onClose, dark, autoPrint = false }) {
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPrint, setShowPrint] = useState(false);

  useEffect(() => {
    if (!open || !invoiceId) return;
    setShowPrint(false);
    setLoading(true);
    request(`admin/invoices/${invoiceId}`, "get").then((res) => {
      if (res?.errors) {
        message.error(res.errors.message ?? "Unable to load invoice.");
        setDoc(null);
      } else {
        const built = buildInvoiceDocument(res?.data, res?.document);
        const resort = built?.booking?.resort;
        setDoc({
          ...built,
          logoUrl: built?.logoUrl ?? resort?.logo_url ?? null,
        });
      }
      setLoading(false);
    });
  }, [open, invoiceId]);

  useEffect(() => {
    if (!autoPrint || !doc || loading) return;
    setShowPrint(true);
    const t = setTimeout(() => window.print(), 450);
    return () => clearTimeout(t);
  }, [autoPrint, doc, loading]);

  if (!open) return null;

  const print = () => {
    setShowPrint(true);
    setTimeout(() => window.print(), 400);
  };

  const shell = dark ? "bg-gray-800 border border-gray-700" : "bg-white";
  const titleCls = dark ? "text-gray-100" : "text-[#102A43]";

  return (
    <>
      <PrintPortal active={showPrint && !!doc}>
        <ResortInvoiceReceipt doc={doc} />
      </PrintPortal>

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-3 py-6 overflow-y-auto no-print">
        <div className={`rounded-xl shadow-2xl w-full max-w-md p-4 sm:p-5 ${shell}`}>
          <div className="flex items-center justify-between mb-3 gap-2">
            <h3 className={`text-base font-semibold inline-flex items-center gap-1.5 ${titleCls}`}>
              <MdVisibility size={16} /> View invoice
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
              Invoice not found.
            </p>
          ) : (
            <div className="max-h-[72vh] overflow-y-auto rounded-lg">
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
