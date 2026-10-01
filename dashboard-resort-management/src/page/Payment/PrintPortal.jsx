import { createPortal } from "react-dom";

/** Renders printable content on document.body so print CSS can show it outside #root. */
export default function PrintPortal({ active, children }) {
  if (!active || !children) return null;
  return createPortal(
    <div className="invoice-print-root">{children}</div>,
    document.body
  );
}
