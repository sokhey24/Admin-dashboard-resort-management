/**
 * Our Resorts / Branches listing — card & grid sizing.
 * Adjust these classes to change width (columns) and height (image min-height) of list cards.
 */

/** Grid on BranchesPage (main column): fewer columns = wider cards. */
export const BRANCH_LIST_GRID_CLASS =
  'grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10 items-stretch auto-rows-fr';

/** Hero image area on list cards (width 100% of column; min-height sets visual height). */
export const BRANCH_LIST_CARD_IMAGE_CLASS =
  'aspect-[16/10] w-full min-h-[220px] sm:min-h-[280px] lg:min-h-[320px]';

/** Loading skeleton image block — keep in sync with BRANCH_LIST_CARD_IMAGE_CLASS min-heights. */
export const BRANCH_LIST_SKELETON_IMAGE_CLASS =
  'w-full aspect-[16/10] min-h-[220px] sm:min-h-[280px] lg:min-h-[320px]';
