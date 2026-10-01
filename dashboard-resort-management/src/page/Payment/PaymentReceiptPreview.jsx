/**
 * Payment receipt print preview — same layout as invoice view (ResortInvoiceReceipt).
 */
import ResortInvoiceReceipt from "./ResortInvoiceReceipt";
import { buildInvoiceDocumentFromPayment } from "./invoiceDocumentHelpers";

export default function PaymentReceiptPreview({ payment }) {
  const doc = buildInvoiceDocumentFromPayment(payment);
  if (!doc) return null;
  return <ResortInvoiceReceipt doc={doc} />;
}
