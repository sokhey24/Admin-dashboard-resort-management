const STORAGE_KEY = 'solara-dining-order-history';
const MAX_ENTRIES = 40;

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(entries) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
  } catch {
    // ignore quota errors
  }
}

/**
 * @param {object} order API order or checkout snapshot
 * @param {Array} [cartSnapshot] lines at checkout time
 */
export function appendDiningOrderHistory(order, cartSnapshot = []) {
  if (!order) return;

  const orderCode = order.order_code ?? order.orderCode ?? order.id;
  if (!orderCode) return;

  const entry = {
    id: order.id ?? null,
    orderCode: String(orderCode),
    status: order.status ?? 'pending',
    total: Number(order.total ?? 0),
    createdAt: order.created_at ?? order.createdAt ?? new Date().toISOString(),
    fulfillmentType: order.fulfillment_type ?? order.fulfillmentType ?? 'dine_in',
    paymentMethod: order.payment_method ?? order.paymentMethod ?? 'cash',
    items: (order.items ?? order.orderItems ?? cartSnapshot ?? []).map((line) => ({
      menuItemId: line.menu_item_id ?? line.menuItemId ?? line.id ?? null,
      name: line.item_name ?? line.name ?? 'Item',
      quantity: Number(line.quantity) || 1,
      unitPrice: Number(line.unit_price ?? line.price ?? 0),
      image: line.image ?? line.menu_item?.image ?? null,
    })),
    source: 'local',
  };

  const existing = readAll().filter((row) => row.orderCode !== entry.orderCode);
  writeAll([entry, ...existing]);
}

export function getDiningOrderHistory() {
  return readAll();
}

export function clearDiningOrderHistory() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export const DINING_ORDER_PLACED_EVENT = 'solara:dining-order-placed';
