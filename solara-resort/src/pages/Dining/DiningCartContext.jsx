import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { getMenuItemById } from '../../data/diningData.js';

const STORAGE_KEY = 'solara-dining-cart';

function readStoredCart() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const DiningCartContext = createContext(null);

export function DiningCartProvider({ children }) {
  const [items, setItems] = useState(readStoredCart);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addToCart = useCallback((dishOrId) => {
    const dish =
      dishOrId && typeof dishOrId === 'object'
        ? dishOrId
        : getMenuItemById(dishOrId);
    if (!dish?.id) return false;

    setItems((prev) => {
      const existing = prev.find((line) => String(line.id) === String(dish.id));
      if (existing) {
        return prev.map((line) =>
          String(line.id) === String(dish.id) ? { ...line, quantity: line.quantity + 1 } : line
        );
      }
      return [
        ...prev,
        {
          id: dish.id,
          name: dish.name,
          image: dish.image,
          price: dish.price,
          quantity: 1,
        },
      ];
    });
    return true;
  }, []);

  const increment = useCallback((dishId) => {
    setItems((prev) =>
      prev.map((line) =>
        String(line.id) === String(dishId) ? { ...line, quantity: line.quantity + 1 } : line
      )
    );
  }, []);

  const decrement = useCallback((dishId) => {
    setItems((prev) =>
      prev
        .map((line) =>
          String(line.id) === String(dishId) ? { ...line, quantity: line.quantity - 1 } : line
        )
        .filter((line) => line.quantity > 0)
    );
  }, []);

  const removeItem = useCallback((dishId) => {
    setItems((prev) => prev.filter((line) => String(line.id) !== String(dishId)));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const total = useMemo(
    () => items.reduce((sum, line) => sum + line.price * line.quantity, 0),
    [items]
  );

  const totalCount = useMemo(
    () => items.reduce((sum, line) => sum + line.quantity, 0),
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      addToCart,
      increment,
      decrement,
      removeItem,
      clearCart,
      total,
      totalCount,
    }),
    [items, addToCart, increment, decrement, removeItem, clearCart, total, totalCount]
  );

  return <DiningCartContext.Provider value={value}>{children}</DiningCartContext.Provider>;
}

export function useDiningCart() {
  const ctx = useContext(DiningCartContext);
  if (!ctx) {
    throw new Error('useDiningCart must be used within DiningCartProvider');
  }
  return ctx;
}
