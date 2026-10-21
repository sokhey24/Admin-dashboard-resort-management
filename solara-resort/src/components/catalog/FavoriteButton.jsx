import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Heart } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';

export const FavoriteButton = ({
  kind,
  id,
  className = '',
  size = 'md',
}) => {
  const {
    isFavoriteResort,
    isFavoriteRoom,
    isFavoriteDish,
    toggleFavoriteResort,
    toggleFavoriteRoom,
    toggleFavoriteDish,
    t,
  } = useApp();

  if (id == null || id === '') return null;

  const active =
    kind === 'room'
      ? isFavoriteRoom(id)
      : kind === 'dish'
        ? isFavoriteDish(id)
        : isFavoriteResort(id);

  const handleClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (kind === 'room') {
      toggleFavoriteRoom(id);
    } else if (kind === 'dish') {
      toggleFavoriteDish(id);
    } else {
      toggleFavoriteResort(id);
    }
  };

  const sizeClasses =
    size === 'sm'
      ? 'w-8 h-8'
      : size === 'lg'
        ? 'w-11 h-11'
        : 'w-9 h-9';

  const iconSize =
    size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';

  const label = active
    ? t('favorites.remove', 'Remove from favorites')
    : t('favorites.add', 'Save to favorites');

  const reduced = useReducedMotion();

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      aria-pressed={active}
      aria-label={label}
      title={label}
      whileTap={reduced ? undefined : { scale: [1, 1.15, 1] }}
      transition={{ duration: 0.2 }}
      className={`inline-flex items-center justify-center rounded-full border backdrop-blur-md transition-colors duration-200 shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 ${sizeClasses} ${
        active
          ? 'bg-gold/20 border-gold/60 text-gold shadow-sm'
          : 'bg-slate-950/75 border-white/15 text-white hover:border-gold/40 hover:text-gold-light'
      } ${className}`}
    >
      <Heart
        className={`${iconSize} ${active ? 'fill-gold text-gold' : ''}`}
        strokeWidth={active ? 0 : 2}
      />
    </motion.button>
  );
};
