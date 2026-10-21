import { useCallback, useState } from "react";
import { message } from "antd";
import { request } from "../util/request";

/**
 * Shared print / PDF receipt actions for payment UI (modal + row dropdown).
 */
export function usePaymentReceipt() {
  const [pdfBusy, setPdfBusy] = useState(false);

  const generatePdf = useCallback(async (paymentId, paymentRef, options = {}) => {
    const { download = false, messageKey = "pdf" } = options;
    if (!paymentId) return { ok: false };
    setPdfBusy(true);
    message.loading({ content: "Generating PDF…", key: messageKey });
    try {
      const res = await request(`admin/payments/${paymentId}/receipt/pdf`, "get");
      if (res?.errors) throw new Error(res.errors.message);
      message.success({ content: "Payment receipt generated successfully.", key: messageKey, duration: 3 });
      if (download && res?.url) {
        const a = document.createElement("a");
        a.href = res.url;
        a.download = res.filename ?? `${paymentRef ?? paymentId}_Payment_Receipt.pdf`;
        a.click();
      }
      return { ok: true, res };
    } catch {
      message.error({ content: "Unable to generate payment receipt. Please try again.", key: messageKey, duration: 4 });
      return { ok: false };
    } finally {
      setPdfBusy(false);
    }
  }, []);

  const printReceipt = useCallback(async (paymentId, options = {}) => {
    const { delayMs = 400, onBeforePrint } = options;
    if (paymentId) {
      await request(`admin/payments/${paymentId}/print`, "post");
    }
    onBeforePrint?.();
    setTimeout(() => window.print(), delayMs);
  }, []);

  return { pdfBusy, generatePdf, printReceipt };
}
