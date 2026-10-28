import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchGuestFoodOrders } from '../services/api/diningApi.js';
import {
  DINING_ORDER_PLACED_EVENT,
  getDiningOrderHistory,
} from '../util/diningOrderHistory.js';

function mapApiOrder(row) {
  const items = row.order_items ?? row.orderItems ?? row.items ?? [];
  return {
    id: row.id,
    orderCode: row.order_code ?? String(row.id),
    status: row.status ?? 'pending',
    total: Number(row.total ?? 0),
    createdAt: row.created_at ?? null,
    fulfillmentType: row.fulfillment_type,
    paymentMethod: row.payment_method,
    items: items.map((line) => ({
      menuItemId: line.menu_item_id ?? line.menuItemId ?? null,
      name: line.item_name ?? line.name ?? 'Item',
      quantity: Number(line.quantity) || 1,
      unitPrice: Number(line.unit_price ?? line.unit_price ?? line.price ?? 0),
      image:
        line.image ??
        line.menu_item?.image ??
        line.menuItem?.image ??
        null,
    })),
    source: 'api',
  };
}

function mergeOrders(apiOrders, localOrders, userId) {
  const byCode = new Map();

  for (const row of localOrders) {
    byCode.set(row.orderCode, row);
  }

  for (const row of apiOrders) {
    if (userId != null && row.user_id != null && Number(row.user_id) !== Number(userId)) {
      continue;
    }
    const mapped = mapApiOrder(row);
    byCode.set(mapped.orderCode, { ...byCode.get(mapped.orderCode), ...mapped, source: 'api' });
  }

  return [...byCode.values()].sort((a, b) => {
    const ta = a.createdAt ? Date.parse(a.createdAt) : 0;
    const tb = b.createdAt ? Date.parse(b.createdAt) : 0;
    return tb - ta;
  });
}

export function useGuestFoodOrders(user) {
  const [apiRows, setApiRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [localTick, setLocalTick] = useState(0);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchGuestFoodOrders();
      setApiRows(Array.isArray(data) ? data : []);
    } catch (err) {
      setApiRows([]);
      setError(err?.message || 'load_failed');
    } finally {
      setLoading(false);
      setLocalTick((n) => n + 1);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setApiRows([]);
      setLoading(false);
      return;
    }
    reload();
  }, [user, reload]);

  useEffect(() => {
    const onPlaced = () => {
      setLocalTick((n) => n + 1);
      reload();
    };
    window.addEventListener(DINING_ORDER_PLACED_EVENT, onPlaced);
    return () => window.removeEventListener(DINING_ORDER_PLACED_EVENT, onPlaced);
  }, [reload]);

  const orders = useMemo(() => {
    void localTick;
    const local = getDiningOrderHistory();
    const userId = user?.raw?.id ?? user?.id ?? null;
    return mergeOrders(apiRows, local, userId);
  }, [apiRows, localTick, user]);

  return { orders, loading, error, reload };
}
