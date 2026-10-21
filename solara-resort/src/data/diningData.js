import { MARKETING_IMAGES } from '../constants/marketingImages.js';
import { resolveDishImage } from '../constants/diningPageImages.js';

export const DINING_RESTAURANTS = [
  { id: 'azure-wave', label: 'The Azure Wave' },
  { id: 'royal-khmer', label: 'Royal Khmer Pavilion' },
  { id: 'horizon', label: 'Horizon Starlight Lounge' },
  { id: 'botanica', label: 'Botanica Poolside Bistro' },
];

/** Popular dishes grid on `/dining` — 4 cards per page on large screens. */
export const DINING_POPULAR_PAGE_SIZE = 4;

export const DISH_CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'khmer', label: 'Khmer Food' },
  { id: 'asian', label: 'Asian' },
  { id: 'western', label: 'Western' },
  { id: 'seafood', label: 'Seafood' },
  { id: 'drinks', label: 'Drinks' },
  { id: 'desserts', label: 'Desserts' },
];

const popularDishesBase = [
  {
    id: 'dish-amok',
    name: 'Steamed Fish Amok',
    description: 'Royal Khmer curry steamed in banana leaf with coconut cream and kaffir lime.',
    category: 'khmer',
    price: 18.5,
    image: MARKETING_IMAGES.dining,
    rating: 4.9,
  },
  {
    id: 'dish-lok-lak',
    name: 'Beef Lok Lak',
    description: 'Wok-seared tenderloin, pepper-lime dip, and farm egg on jasmine rice.',
    category: 'khmer',
    price: 22,
    image: MARKETING_IMAGES.hero,
    rating: 4.7,
  },
  {
    id: 'dish-pad-thai',
    name: 'River Prawn Pad Thai',
    description: 'Tamarind noodles, charcoal prawns, and roasted peanut crumble.',
    category: 'asian',
    price: 19,
    image: MARKETING_IMAGES.villa,
    rating: 4.6,
  },
  {
    id: 'dish-ramen',
    name: 'Tonkotsu Ramen Bowl',
    description: 'Slow broth, soft egg, and bamboo shoots with chili oil.',
    category: 'asian',
    price: 16,
    image: MARKETING_IMAGES.spa,
    rating: 4.5,
  },
  {
    id: 'dish-steak',
    name: 'Angus Ribeye',
    description: 'Char-grilled with Kampot pepper jus, confit garlic, and seasonal greens.',
    category: 'western',
    price: 38,
    image: MARKETING_IMAGES.dining,
    rating: 4.8,
  },
  {
    id: 'dish-pasta',
    name: 'Truffle Tagliatelle',
    description: 'Hand-cut pasta, aged parmesan, and wild mushroom cream.',
    category: 'western',
    price: 24,
    image: MARKETING_IMAGES.hero,
    rating: 4.4,
  },
  {
    id: 'dish-crab',
    name: 'Kep Pepper Crab',
    description: 'Whole blue swimmer crab tossed in fresh Kampot pepper and garlic butter.',
    category: 'seafood',
    price: 42,
    image: MARKETING_IMAGES.villa,
    rating: 5,
  },
  {
    id: 'dish-ceviche',
    name: 'Coconut Lime Ceviche',
    description: 'Line-caught snapper, lemongrass, and chili with crispy taro.',
    category: 'seafood',
    price: 17,
    image: MARKETING_IMAGES.spa,
    rating: 4.6,
  },
  {
    id: 'dish-negroni',
    name: 'Smoked Tamarind Negroni',
    description: 'House-infused gin, bitter aperitif, and orange peel over ice.',
    category: 'drinks',
    price: 14,
    image: MARKETING_IMAGES.hero,
    rating: 4.7,
  },
  {
    id: 'dish-mango-shake',
    name: 'Golden Mango Elixir',
    description: 'Cold-pressed mango, coconut water, and lime leaf syrup.',
    category: 'drinks',
    price: 9,
    image: MARKETING_IMAGES.dining,
    rating: 4.5,
  },
  {
    id: 'dish-mango-sticky',
    name: 'Mango Sticky Rice',
    description: 'Coconut steamed rice, ripe mango, and palm sugar caramel.',
    category: 'desserts',
    price: 11,
    image: MARKETING_IMAGES.villa,
    rating: 4.9,
  },
  {
    id: 'dish-chocolate',
    name: 'Dark Chocolate Fondant',
    description: 'Warm cocoa center with salted palm caramel and berry coulis.',
    category: 'desserts',
    price: 12,
    image: MARKETING_IMAGES.spa,
    rating: 4.8,
  },
];

export const popularDishes = popularDishesBase.map((dish) => ({
  ...dish,
  image: resolveDishImage(dish.id, dish.image),
}));

const MENU_ITEM_EXTRAS = {
  'dish-amok': {
    longDescription:
      'A timeless Khmer classic: freshwater fish marinated in coconut curry, steamed in banana leaf until silky. Finished with young coconut cream and hand-torn herbs from our garden.',
    ingredients: ['Snakehead fish', 'Coconut cream', 'Kroeung paste', 'Banana leaf', 'Kaffir lime'],
    dietary: ['Gluten-free option'],
    chefNote: 'Best paired with jasmine rice and a crisp Cambodian white.',
  },
};

function defaultExtras(dish) {
  const categoryLabel = DISH_CATEGORIES.find((c) => c.id === dish.category)?.label ?? dish.category;
  return {
    longDescription: `${dish.description} Prepared à la minute in our open kitchen and served with seasonal garnishes.`,
    ingredients: ['Seasonal produce', 'House-made sauces', 'Solara spice blend'],
    dietary: [],
    chefNote: `Featured on our ${categoryLabel} menu this season.`,
  };
}

export function getCategoryLabel(categoryId) {
  return DISH_CATEGORIES.find((c) => c.id === categoryId)?.label ?? categoryId;
}

export function getMenuItemById(id) {
  const dish = popularDishes.find((item) => item.id === id);
  if (!dish) return null;
  const extras = MENU_ITEM_EXTRAS[id] ?? defaultExtras(dish);
  return { ...dish, ...extras, categoryLabel: getCategoryLabel(dish.category) };
}

export function getAllMenuItems() {
  return popularDishes.map((dish) => getMenuItemById(dish.id));
}

/** Resolve saved dish ids from user favorites (static menu catalog). */
export function getFavoriteDishesByIds(ids, catalog = popularDishes) {
  if (!ids?.length) return [];
  const set = new Set(ids.map(String));
  return (catalog || []).filter((dish) => set.has(String(dish.id)));
}

export const DINING_RATING_SUMMARY = {
  average: 4.3,
  totalReviews: 128,
  breakdown: [
    { label: 'Food', rating: 5 },
    { label: 'Service', rating: 5 },
    { label: 'Ambience', rating: 4 },
    { label: 'Value', rating: 4 },
  ],
};

export const SPACE_GALLERY = [
  {
    id: 'space-1',
    src: MARKETING_IMAGES.dining,
    alt: 'Restaurant interior with warm lighting',
    layout: 'feature',
  },
  {
    id: 'space-2',
    src: MARKETING_IMAGES.hero,
    alt: 'Sunset terrace dining',
    layout: 'wide',
  },
  {
    id: 'space-3',
    src: MARKETING_IMAGES.villa,
    alt: 'Oceanfront table setting',
    layout: 'square',
  },
  {
    id: 'space-4',
    src: MARKETING_IMAGES.spa,
    alt: 'Outdoor lounge atmosphere',
    layout: 'square',
  },
  {
    id: 'space-5',
    src: MARKETING_IMAGES.dining,
    alt: 'Chef presentation',
    layout: 'wide',
  },
  {
    id: 'space-6',
    src: MARKETING_IMAGES.hero,
    alt: 'Candlelit dining salon',
    layout: 'tall',
  },
  {
    id: 'space-7',
    src: MARKETING_IMAGES.villa,
    alt: 'Garden terrace at dusk',
    layout: 'square',
  },
];
