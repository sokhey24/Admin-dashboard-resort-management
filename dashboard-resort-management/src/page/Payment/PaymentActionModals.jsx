import ConfirmDialog from "../../components/ConfirmDialog";
import PaymentDetailModal from "./PaymentDetailModal";

/**
 * Payment detail + destructive confirm dialogs for the records page.
 */
export default function PaymentActionModals({
  dark,
  detailId,
  detailData,
  autoPrint,
  onCloseDetail,
  onPaymentUpdated,
  deleteTarget,
  deleting,
  onConfirmDelete,
  onCancelDelete,
}) {
  return (
    <>
      {detailId && (
        <PaymentDetailModal
          payment={detailData}
          open={!!detailId}
          onClose={onCloseDetail}
          dark={dark}
          autoPrint={autoPrint}
          onUpdated={onPaymentUpdated}
        />
      )}
      <ConfirmDialog
        open={!!deleteTarget}
        dark={dark}
        title="Delete payment"
        message={
          deleteTarget
            ? `Delete ${deleteTarget.payment_id ?? `PAY-${deleteTarget.id}`}? This cannot be undone.`
            : ""
        }
        sub="The payment record will be removed from the system."
        confirmText="Delete"
        loading={deleting}
        onConfirm={onConfirmDelete}
        onCancel={onCancelDelete}
      />
    </>
  );
}
