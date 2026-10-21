/**
 * Favorites shape helpers only. Persisted favorites live in Laravel (`users.preferences`)
 * and are loaded via `/auth/me`; AppContext holds in-memory state for the active session.
 */

export function normalizeFavorites(input) {
  const src = input && typeof input === 'object' ? input : {};
  const resorts = Array.isArray(src.resorts) ? src.resorts.map(String) : [];
  const rooms = Array.isArray(src.rooms) ? src.rooms.map(String) : [];
  const dishes = Array.isArray(src.dishes) ? src.dishes.map(String) : [];
  return {
    resorts: [...new Set(resorts)].slice(0, 200),
    rooms: [...new Set(rooms)].slice(0, 200),
    dishes: [...new Set(dishes)].slice(0, 200),
  };
}

export function toggleFavoriteId(list, id) {
  const key = String(id);
  const set = new Set(Array.isArray(list) ? list.map(String) : []);
  if (set.has(key)) {
    set.delete(key);
  } else {
    set.add(key);
  }
  return [...set];
}
