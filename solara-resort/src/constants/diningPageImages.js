import wokBeefChili from '../assets/images/dining/wok_beef_chili.png';
import thaiRedCurry from '../assets/images/dining/thai_red_curry.png';
import goldenHerbSoup from '../assets/images/dining/golden_herb_soup.png';
import savoryCongee from '../assets/images/dining/savory_congee.png';
import latteArt from '../assets/images/dining/latte_art.png';
import tropicalBlueCocktail from '../assets/images/dining/tropical_blue_cocktail.png';

/** Hero + gallery + dish card photos used on `/dining`. */
export const DINING_PAGE_IMAGES = {
  hero: thaiRedCurry,
  wokBeefChili,
  thaiRedCurry,
  goldenHerbSoup,
  savoryCongee,
  latteArt,
  tropicalBlueCocktail,
};

/** Maps menu dish ids to resort dining photography. */
export const DINING_DISH_IMAGE_BY_ID = {
  'dish-amok': savoryCongee,
  'dish-lok-lak': wokBeefChili,
  'dish-pad-thai': thaiRedCurry,
  'dish-ramen': goldenHerbSoup,
  'dish-steak': wokBeefChili,
  'dish-pasta': goldenHerbSoup,
  'dish-crab': thaiRedCurry,
  'dish-ceviche': tropicalBlueCocktail,
  'dish-negroni': tropicalBlueCocktail,
  'dish-mango-shake': latteArt,
  'dish-mango-sticky': savoryCongee,
  'dish-chocolate': latteArt,
};

export function resolveDishImage(dishId, fallback) {
  return DINING_DISH_IMAGE_BY_ID[dishId] ?? fallback;
}

export function withDiningPhoto(dish) {
  return {
    ...dish,
    image: resolveDishImage(dish.id, dish.image),
  };
}

export const DINING_SPACE_GALLERY = [
  {
    id: 'dining-photo-curry',
    src: thaiRedCurry,
    alt: 'Signature Thai red curry with coconut cream and fresh basil',
    layout: 'feature',
  },
  {
    id: 'dining-photo-beef',
    src: wokBeefChili,
    alt: 'Wok-seared beef with chili, herbs, and lime',
    layout: 'wide',
  },
  {
    id: 'dining-photo-soup',
    src: goldenHerbSoup,
    alt: 'Golden herb broth with garden vegetables',
    layout: 'square',
  },
  {
    id: 'dining-photo-congee',
    src: savoryCongee,
    alt: 'Savory rice porridge with fresh greens and chili',
    layout: 'square',
  },
  {
    id: 'dining-photo-latte',
    src: latteArt,
    alt: 'Artisan latte served in the morning lounge',
    layout: 'wide',
  },
  {
    id: 'dining-photo-cocktail',
    src: tropicalBlueCocktail,
    alt: 'Tropical blue refreshment by the pool terrace',
    layout: 'tall',
  },
];
