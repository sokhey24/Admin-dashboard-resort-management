import React, { useState } from 'react';
import { MARKETING_IMAGES } from '../../constants/marketingImages.js';

export function ServiceImage({ src, alt, className = '' }) {
  const [broken, setBroken] = useState(false);
  const resolved = src && !broken ? src : MARKETING_IMAGES.spa;

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
