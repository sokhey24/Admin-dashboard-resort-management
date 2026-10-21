import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../config/routes.js';
import { submitDiningCheckout } from '../util/diningCheckout.js';

export function useDiningCheckout({ cartItems, clearCart, addToast, t, user, bookings }) {
  const navigate = useNavigate();
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const activeBooking = (bookings || []).find((b) =>
    ['confirmed', 'checked_in'].includes(b.status)
  );

  const handleCheckoutConfirm = useCallback(
    async ({ paymentMethod, fulfillmentType = 'dine_in' } = {}) => {
      if (!user) {
        addToast?.(
          t('dining.signInToOrder', 'Sign in to place a food order.'),
          'info'
        );
        navigate(ROUTES.login);
        return { ok: false };
      }

      setCheckoutLoading(true);
      const result = await submitDiningCheckout({
        cartItems,
        paymentMethod,
        fulfillmentType,
        bookingId:
          fulfillmentType === 'room_delivery' && activeBooking
            ? activeBooking.apiId ?? activeBooking.id
            : null,
      });
      setCheckoutLoading(false);

      if (!result.ok) {
        addToast?.(
          typeof result.error === 'string'
            ? result.error
            : t('dining.checkoutFailed', 'Unable to place your order. Please try again.'),
          'error'
        );
        return result;
      }

      const code = result.order?.order_code ?? result.order?.id;

      if (paymentMethod === 'khqr' && result.khqr) {
        addToast?.(
          t('dining.orderCreatedKhqr', 'Order {{code}} created — complete Bakong payment below.', {
            code,
          }).replace('{{code}}', code ?? ''),
          'success'
        );
        return result;
      }

      clearCart?.();
      addToast?.(
        t('dining.orderCreated', 'Order {{code}} sent to the kitchen.', { code }).replace(
          '{{code}}',
          code ?? ''
        ),
        'success'
      );
      return result;
    },
    [cartItems, clearCart, addToast, t, user, navigate, activeBooking]
  );

  return {
    checkoutLoading,
    handleCheckoutConfirm,
    activeBooking,
  };
}
