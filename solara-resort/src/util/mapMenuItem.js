import { menuItemImageUrl } from '../services/api/diningApi.js';

export function mapMenuItemFromApi(item) {
  if (!item) return null;

  const category = item.category || {};

  const categoryId = item.food_category_id ?? category.id ?? null;
  const description = item.description?.trim() || '';
  const ratingValue = item.rating != null ? Number(item.rating) : null;

  return {
    id: String(item.id),
    name: item.name || '',
    description,
    longDescription: description,
    price: Number(item.price) || 0,
    image: menuItemImageUrl(item),
    category: categoryId != null ? String(categoryId) : '',
    categoryId,
    categoryName: category.name || '',
    categoryLabel: category.name || '',
    isAvailable: item.is_available !== false && item.status !== 'inactive',
    rating: Number.isFinite(ratingValue) ? ratingValue : null,
    ingredients: Array.isArray(item.ingredients) ? item.ingredients : [],
    dietary: Array.isArray(item.dietary) ? item.dietary : [],
    chefNote: item.chef_note || item.chefNote || '',
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
