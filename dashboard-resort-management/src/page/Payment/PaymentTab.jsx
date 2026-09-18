import PaymentListPage, { StatusBadge } from "./PaymentRecords";
import { fmtAmt } from "./paymentHelpers";

export function fmtCurrency(v, currency = "USD") {
  const sym = currency === "USD" ? "$" : currency + " ";
  return sym + Number(v ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export { StatusBadge };
export { fmtAmt };

export default function PaymentTab() {
  return <PaymentListPage source="all" title="Payment Records" embedded />;
}
