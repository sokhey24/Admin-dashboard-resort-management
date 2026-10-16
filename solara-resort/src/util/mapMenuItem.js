import { menuItemImageUrl } from '../services/api/diningApi.js';

export function mapMenuItemFromApi(item) {
  if (!item) return null;

  const category = item.category || {};

  return {
    id: item.id,
    name: item.name || '',
    description: item.description?.trim() || '',
    price: Number(item.price) || 0,
    image: menuItemImageUrl(item),
    categoryId: item.food_category_id ?? category.id ?? null,
    categoryName: category.name || '',
    isAvailable: Boolean(item.is_available),
  };
}

export function mapMenuItemsList(rows) {
  const list = Array.isArray(rows) ? rows : [];
  return list.map(mapMenuItemFromApi).filter(Boolean);
}

export function mapFoodCategoriesList(rows) {
  const list = Array.isArray(rows) ? rows : [];
  return list
    .map((cat) => ({
      id: cat.id,
      name: cat.name || '',
      description: cat.description?.trim() || '',
    }))
    .filter((cat) => cat.id && cat.name);
}
