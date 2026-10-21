import { createGuestFoodOrder } from '../services/api/diningApi.js';
import { getAccessToken } from '../store/authStore.js';

const REQUEST_ID_KEY = 'solara-food-order-request-id';

export function getOrCreateFoodOrderRequestId() {
  try {
    const existing = sessionStorage.getItem(REQUEST_ID_KEY);
    if (existing) return existing;
    const id = `fo-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(REQUEST_ID_KEY, id);
    return id;
  } catch {
    return `fo-${Date.now()}`;
  }
}

export function clearFoodOrderRequestId() {
  try {
    sessionStorage.removeItem(REQUEST_ID_KEY);
  } catch {
    // ignore
  }
}

/**
 * @param {object} options
 * @param {Array} options.cartItems
 * @param {'cash'|'khqr'|'charge_to_room'} options.paymentMethod
 * @param {'dine_in'|'room_delivery'} options.fulfillmentType
 * @param {number|null} options.bookingId
 */
export async function submitDiningCheckout({
  cartItems,
  paymentMethod,
  fulfillmentType = 'dine_in',
  bookingId = null,
}) {
  if (!getAccessToken()) {
    return { ok: false, error: 'sign_in_required' };
  }

  const items = (cartItems || [])
    .map((line) => ({
      menu_item_id: Number(line.menuItemId ?? line.id),
      quantity: Number(line.quantity) || 1,
    }))
    .filter((row) => row.menu_item_id > 0 && row.quantity > 0);

  if (items.length === 0) {
    return { ok: false, error: 'empty_cart' };
  }

  const payload = {
    client_request_id: getOrCreateFoodOrderRequestId(),
    fulfillment_type: fulfillmentType,
    payment_method: paymentMethod,
    items,
  };

  if (fulfillmentType === 'room_delivery' && bookingId) {
    payload.booking_id = bookingId;
  }

  try {
    const data = await createGuestFoodOrder(payload);
    clearFoodOrderRequestId();
    return {
      ok: true,
      order: data?.data ?? data,
      khqr: data?.khqr ?? null,
    };
  } catch (error) {
    const message =
      error?.response?.data?.message ||
      error?.response?.data?.errors?.items?.[0] ||
      error?.message ||
      'checkout_failed';
    return { ok: false, error: message };
  }
}
