import React, { useState } from 'react';
import { MARKETING_IMAGES } from '../../constants/marketingImages.js';

function resolveLocalImage(src) {
  if (!src) return null;
  const str = String(src);
  if (str.startsWith('http') || str.startsWith('/') || str.includes('/assets/')) {
    return src;
  }
  return src;
}

export function ActivityCardImage({ src, alt, fallbackLabel }) {
  const [broken, setBroken] = useState(false);
  const resolved = resolveLocalImage(src);
  const fallbackSrc = MARKETING_IMAGES.hero;
  const showPlaceholder = !resolved || broken;

  if (showPlaceholder) {
    return (
      <img
        src={fallbackSrc}
        alt={alt || fallbackLabel}
        loading="lazy"
        decoding="async"
        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
        onError={() => setBroken(true)}
      />
    );
  }

  return (
    <img
      src={resolved}
      alt={alt}
      loading="lazy"
      decoding="async"
      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
      onError={() => setBroken(true)}
    />
  );
}

export function ActivityModalImage({ src, alt, fallbackLabel }) {
  const [broken, setBroken] = useState(false);
  const resolved = resolveLocalImage(src);
  const imageSrc = !resolved || broken ? MARKETING_IMAGES.hero : resolved;

  return (
    <div className="w-full aspect-[16/10] overflow-hidden rounded-[var(--radius-button)] bg-slate-900 border border-border">
      <img
        src={imageSrc}
        alt={alt || fallbackLabel}
        className="w-full h-full object-cover object-center"
        onError={() => setBroken(true)}
      />
    </div>
  );
}
