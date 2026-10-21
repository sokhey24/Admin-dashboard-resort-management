import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Banknote, BedDouble, Minus, Plus, QrCode, ShoppingBag, X } from 'lucide-react';
import { Button } from '../../components/ui/Button.jsx';
import { Pagination } from '../../components/common/Pagination.jsx';
import { paginateItems } from '../../util/paginateList.js';
import { formatCurrency } from '../../util/currency.js';
import { formatKhqrAmount, mountKhqrQr, normalizeKhqrPayment } from '../../util/khqr.js';
import { verifyKhqrByMd5 } from '../../services/api/paymentApi.js';

const PAYMENT_CASH = 'cash';
const PAYMENT_KHQR = 'khqr';
const PAYMENT_ROOM = 'charge_to_room';
const CART_PANEL_PAGE_SIZE = 3;
const CONFIRM_MODAL_PAGE_SIZE = 5;

export function CardlistSummaryOrder({
  items,
  currency,
  t,
  onIncrement,
  onDecrement,
  onRemove,
  onCheckoutConfirm,
  onCartClear,
  checkoutLoading = false,
  canChargeToRoom = false,
  total,
  totalCount,
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [cartFocused, setCartFocused] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_CASH);
  const [cartPage, setCartPage] = useState(1);
  const [confirmListPage, setConfirmListPage] = useState(1);
  const [khqrPayment, setKhqrPayment] = useState(null);
  const [orderCode, setOrderCode] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const qrHostRef = useRef(null);

  const cartPagination = useMemo(
    () => paginateItems(items, cartPage, CART_PANEL_PAGE_SIZE),
    [items, cartPage]
  );

  const confirmPagination = useMemo(
    () => paginateItems(items, confirmListPage, CONFIRM_MODAL_PAGE_SIZE),
    [items, confirmListPage]
  );

  useEffect(() => {
    if (!confirmOpen) {
      setPaymentMethod(PAYMENT_CASH);
      setConfirmListPage(1);
      setKhqrPayment(null);
      setOrderCode('');
    }
  }, [confirmOpen]);

  useEffect(() => {
    if (!khqrPayment || !qrHostRef.current) return;
    mountKhqrQr(qrHostRef.current, khqrPayment);
  }, [khqrPayment, confirmOpen]);

  useEffect(() => {
    setCartPage(1);
    setConfirmListPage(1);
  }, [items.length]);

  useEffect(() => {
    if (cartPage > cartPagination.totalPages) {
      setCartPage(cartPagination.totalPages);
    }
  }, [cartPage, cartPagination.totalPages]);

  useEffect(() => {
    if (confirmListPage > confirmPagination.totalPages) {
      setConfirmListPage(confirmPagination.totalPages);
    }
  }, [confirmListPage, confirmPagination.totalPages]);

  useEffect(() => {
    if (!cartFocused || confirmOpen) return undefined;
    const onDocPointerDown = (e) => {
      const el = e.target.closest?.('[data-dining-order-summary]');
      if (!el) setCartFocused(false);
    };
    document.addEventListener('pointerdown', onDocPointerDown);
    return () => document.removeEventListener('pointerdown', onDocPointerDown);
  }, [cartFocused, confirmOpen]);

  useEffect(() => {
    const onBlurCart = () => setCartFocused(false);
    window.addEventListener('solara:dining-cart-blur', onBlurCart);
    return () => window.removeEventListener('solara:dining-cart-blur', onBlurCart);
  }, []);

  if (items.length === 0 && !confirmOpen) {
    return null;
  }

  const handleBuyNowClick = () => {
    setCartFocused(true);
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    const fulfillmentType =
      paymentMethod === PAYMENT_ROOM ? 'room_delivery' : 'dine_in';
    const result = await onCheckoutConfirm?.({
      paymentMethod,
      fulfillmentType,
    });
    if (!result?.ok) return;

    const code = result.order?.order_code ?? '';
    setOrderCode(code);

    if (paymentMethod === PAYMENT_KHQR && result.khqr) {
      setKhqrPayment(normalizeKhqrPayment(result.khqr));
      return;
    }

    setConfirmOpen(false);
  };

  const handleVerifyKhqr = async () => {
    if (!khqrPayment?.khqrMd5) return;
    setVerifyLoading(true);
    try {
      const res = await verifyKhqrByMd5(khqrPayment.khqrMd5);
      if (res?.paid) {
        onCartClear?.();
        setConfirmOpen(false);
      }
    } finally {
      setVerifyLoading(false);
    }
  };

  const paymentOptions = [
    {
      id: PAYMENT_CASH,
      icon: Banknote,
      title: t('dining.payCash', 'Cash'),
      desc: t('dining.payCashDesc', 'Pay at the table when your meal is served.'),
    },
    {
      id: PAYMENT_KHQR,
      icon: QrCode,
      title: t('dining.payKhqr', 'Pay with QR code'),
      desc: t(
        'dining.payKhqrDesc',
        'Scan with ABA, ACLEDA, Wing, or any Bakong-enabled banking app.'
      ),
    },
    ...(canChargeToRoom
      ? [
          {
            id: PAYMENT_ROOM,
            icon: BedDouble,
            title: t('dining.chargeToRoom', 'Charge to room'),
            desc: t(
              'dining.chargeToRoomDesc',
              'Add this order to your in-house folio (pay at checkout).'
            ),
          },
        ]
      : []),
  ];

  return (
    <>
      <aside
        className={`fixed right-3 sm:right-6 w-[min(calc(100vw-1.5rem),22rem)] transition-[top,z-index] duration-200 ${
          cartFocused && !confirmOpen ? 'z-[45] top-[7.25rem] sm:top-[7.75rem]' : 'z-[35] top-[5.75rem] sm:top-[6.25rem]'
        }`}
        aria-label={t('dining.orderSummary', 'Order summary')}
        onPointerDown={() => setCartFocused(true)}
        data-dining-order-summary
      >
        <div className="bg-surface border border-border rounded-[var(--radius-card)] shadow-2xl overflow-hidden flex flex-col max-h-[min(70vh,32rem)]">
          <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border bg-surface-elevated/80">
            <div className="flex items-center gap-2 min-w-0">
              <ShoppingBag className="w-4 h-4 text-gold shrink-0" aria-hidden />
              <h2 className="text-sm font-serif font-bold text-text truncate">
                {t('dining.orderSummary', 'Order summary')}
              </h2>
              <span className="text-[10px] font-semibold uppercase tracking-wide bg-gold/15 text-gold px-2 py-0.5 rounded-full shrink-0">
                {totalCount}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              className="text-xs text-muted hover:text-text px-2 py-1 cursor-pointer"
              aria-expanded={!collapsed}
            >
              {collapsed ? t('dining.showCart', 'Show') : t('dining.hideCart', 'Hide')}
            </button>
          </div>

          {!collapsed && (
            <>
              {cartPagination.total > CART_PANEL_PAGE_SIZE && (
                <p className="px-3 pt-2 text-[10px] text-muted tabular-nums">
                  {cartPagination.startIndex}–{cartPagination.endIndex} of {cartPagination.total}
                </p>
              )}
              <ul className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
                {cartPagination.items.map((line) => {
                  const lineTotal = line.price * line.quantity;
                  return (
                    <li
                      key={line.id}
                      className="flex gap-3 p-2 rounded-lg border border-border/80 bg-bg/50"
                    >
                      <img
                        src={line.image}
                        alt=""
                        className="w-14 h-14 rounded-md object-cover shrink-0 border border-border"
                      />
                      <div className="flex-1 min-w-0 space-y-2">
                        <p className="text-xs font-serif font-bold text-text line-clamp-2 leading-snug">
                          {line.name}
                        </p>
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="inline-flex items-center border border-border rounded-[var(--radius-button)] overflow-hidden">
                            <button
                              type="button"
                              onClick={() => onDecrement?.(line.id)}
                              className="p-1.5 hover:bg-surface-hover text-text cursor-pointer"
                              aria-label={t('dining.decreaseQty', 'Decrease quantity')}
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="px-2 text-xs font-semibold min-w-[2rem] text-center tabular-nums">
                              {line.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => onIncrement?.(line.id)}
                              className="p-1.5 hover:bg-surface-hover text-text cursor-pointer"
                              aria-label={t('dining.increaseQty', 'Increase quantity')}
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => onRemove?.(line.id)}
                            className="text-[10px] uppercase tracking-wide text-error hover:underline cursor-pointer inline-flex items-center gap-0.5"
                          >
                            <X className="w-3 h-3" aria-hidden />
                            {t('common.cancel', 'Cancel')}
                          </button>
                        </div>
                        <p className="text-xs font-semibold text-primary tabular-nums">
                          {formatCurrency(lineTotal, currency)}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>

              {cartPagination.showPagination && (
                <Pagination
                  className="px-3 pb-2"
                  page={cartPagination.page}
                  totalPages={cartPagination.totalPages}
                  onPageChange={setCartPage}
                />
              )}

              <div className="border-t border-border p-4 space-y-3 bg-surface-elevated/40">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">{t('dining.cartTotal', 'Total')}</span>
                  <span className="font-serif font-bold text-text tabular-nums">
                    {formatCurrency(total, currency)}
                  </span>
                </div>
                <Button variant="gold" size="md" type="button" className="w-full" onClick={handleBuyNowClick}>
                  {t('dining.buyNow', 'Buy Now')}
                </Button>
              </div>
            </>
          )}
        </div>
      </aside>

      {confirmOpen && (
        <div
          className="fixed inset-0 z-[100] overflow-y-auto bg-slate-950/75 backdrop-blur-sm"
          data-dining-order-summary
          role="dialog"
          aria-modal="true"
          aria-labelledby="dining-order-confirm-title"
        >
          <div className="flex min-h-[100dvh] items-center justify-center p-4 sm:p-6 py-8">
            <div
              className="w-full max-w-4xl max-h-[calc(100dvh-2rem)] flex flex-col bg-surface border border-border rounded-[var(--radius-modal)] shadow-2xl overflow-hidden"
            >
              <div className="flex-1 overflow-y-auto p-5 sm:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
                  {/* Left: order summary */}
                  <div className="flex flex-col gap-4 min-w-0">
                    <div>
                      <h3
                        id="dining-order-confirm-title"
                        className="text-xl sm:text-2xl font-serif font-bold text-text"
                      >
                        {t('dining.confirmOrderTitle', 'Confirm your order?')}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted leading-relaxed mt-2">
                        {t(
                          'dining.confirmOrderDesc',
                          'We will hold these dishes for your table reservation. You can adjust seating details on the next step.'
                        )}
                      </p>
                    </div>

                    {confirmPagination.total > CONFIRM_MODAL_PAGE_SIZE && (
                      <p className="text-xs text-muted tabular-nums">
                        Showing {confirmPagination.startIndex}–{confirmPagination.endIndex} of{' '}
                        {confirmPagination.total} items
                      </p>
                    )}

                    <ul className="text-xs sm:text-sm space-y-2 border border-border rounded-[var(--radius-card)] p-4 bg-bg/40">
                      {confirmPagination.items.map((line) => (
                        <li
                          key={line.id}
                          className="flex flex-row items-center justify-between gap-3 py-2 border-b border-border/60 last:border-0"
                        >
                          <div className="flex flex-row items-center gap-3 min-w-0 flex-1">
                            <img
                              src={line.image}
                              alt=""
                              className="w-12 h-12 rounded-md object-cover shrink-0 border border-border"
                            />
                            <span className="text-text-secondary line-clamp-2">
                              {line.name} × {line.quantity}
                            </span>
                          </div>
                          <span className="font-medium text-text tabular-nums shrink-0">
                            {formatCurrency(line.price * line.quantity, currency)}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {confirmPagination.showPagination && (
                      <Pagination
                        page={confirmPagination.page}
                        totalPages={confirmPagination.totalPages}
                        onPageChange={setConfirmListPage}
                      />
                    )}

                    <div className="flex flex-row items-center justify-between text-base font-semibold pt-2 border-t border-border">
                      <span>{t('dining.cartTotal', 'Total')}</span>
                      <span className="text-gold tabular-nums text-lg font-serif">
                        {formatCurrency(total, currency)}
                      </span>
                    </div>
                  </div>

                  {/* Right: payment */}
                  <div className="flex flex-col gap-4 min-w-0">
                    <p className="text-xs font-semibold text-text uppercase tracking-wide">
                      {t('dining.paymentMethod', 'Payment method')}
                    </p>
                    <div className="flex flex-row gap-3">
                      {paymentOptions.map((option) => {
                        const Icon = option.icon;
                        const selected = paymentMethod === option.id;
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => setPaymentMethod(option.id)}
                            className={`flex-1 text-left p-3 sm:p-4 rounded-[var(--radius-card)] border-2 transition-colors cursor-pointer min-w-0 ${
                              selected
                                ? 'border-gold bg-gold/10 shadow-sm'
                                : 'border-border bg-bg/40 hover:border-gold/40'
                            }`}
                          >
                            <div className="flex flex-row items-center gap-2 mb-1.5">
                              <Icon
                                className={`w-4 h-4 shrink-0 ${selected ? 'text-gold' : 'text-muted'}`}
                              />
                              <span className="text-xs font-semibold text-text">{option.title}</span>
                            </div>
                            <p className="text-[10px] sm:text-[11px] text-muted leading-relaxed">
                              {option.desc}
                            </p>
                          </button>
                        );
                      })}
                    </div>

                    {paymentMethod === PAYMENT_CASH && (
                      <p className="text-xs text-muted bg-bg/50 border border-border rounded-[var(--radius-card)] p-4 leading-relaxed flex-1">
                        {t(
                          'dining.payCashNote',
                          'Your order will be sent to the kitchen. Please pay in cash to your server.'
                        )}
                      </p>
                    )}

                    {paymentMethod === PAYMENT_KHQR && !khqrPayment && (
                      <p className="text-xs text-muted bg-bg/50 border border-border rounded-[var(--radius-card)] p-4 leading-relaxed">
                        {t(
                          'dining.payKhqrHold',
                          'Confirm to create your order and generate a Bakong KHQR for the exact total from our kitchen system.'
                        )}
                      </p>
                    )}

                    {khqrPayment && (
                      <div className="rounded-[var(--radius-card)] border border-border bg-bg/50 p-4 sm:p-6 space-y-3 text-center flex-1 flex flex-col justify-center">
                        {orderCode && (
                          <p className="text-xs font-semibold text-text">
                            {t('dining.orderRef', 'Order')} {orderCode}
                          </p>
                        )}
                        <p className="text-[10px] uppercase tracking-wider text-gold font-semibold">
                          {t('payment.nbcBakong', 'National Bank of Cambodia · Bakong')}
                        </p>
                        <div
                          ref={qrHostRef}
                          className="inline-flex p-3 bg-white rounded-lg border border-border shadow-inner mx-auto min-h-[12rem] min-w-[12rem] items-center justify-center"
                        />
                        <p className="text-lg font-serif font-bold text-gold tabular-nums">
                          {formatKhqrAmount(khqrPayment.amount, khqrPayment.currency)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="shrink-0 border-t border-border bg-surface-elevated/80 px-5 sm:px-8 py-4 flex flex-row gap-3">
                <Button
                  variant="outline"
                  size="md"
                  type="button"
                  className="flex-1"
                  onClick={() => {
                    if (orderCode || khqrPayment) onCartClear?.();
                    setConfirmOpen(false);
                  }}
                >
                  {t('common.cancel', 'Cancel')}
                </Button>
                <Button
                  variant="gold"
                  size="md"
                  type="button"
                  className="flex-1"
                  disabled={checkoutLoading || verifyLoading}
                  onClick={khqrPayment ? handleVerifyKhqr : handleConfirm}
                >
                  {khqrPayment
                    ? t('dining.confirmKhqrPaid', 'I have paid')
                    : checkoutLoading
                      ? t('dining.placingOrder', 'Placing order…')
                      : t('dining.confirmOrder', 'Confirm order')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
