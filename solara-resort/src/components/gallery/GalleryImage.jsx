import React, { useState } from 'react';
import { MARKETING_IMAGES } from '../../constants/marketingImages.js';

export function GalleryImage({ src, alt, className = '' }) {
  const [broken, setBroken] = useState(false);
  const resolved = src && !broken ? src : MARKETING_IMAGES.hero;

  return (
    <img
      src={resolved}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={className}
      onError={() => setBroken(true)}
    />
  );
}
