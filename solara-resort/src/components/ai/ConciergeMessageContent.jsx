import React from 'react';
import { Link } from 'react-router-dom';

const LINK_PATTERN = /\[([^\]]+)\]\(([^)]+)\)/g;

/**
 * Renders concierge text with internal markdown links [label](/path).
 */
export function ConciergeMessageContent({ text, className = '', onInternalNavigate }) {
  if (!text) return null;

  const nodes = [];
  let lastIndex = 0;
  let match;

  const re = new RegExp(LINK_PATTERN.source, 'g');
  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    const label = match[1];
    const href = match[2];
    const isInternal = href.startsWith('/');

    if (isInternal) {
      nodes.push(
        <Link
          key={`${match.index}-${href}`}
          to={href}
          onClick={() => onInternalNavigate?.(href)}
          className="text-gold font-semibold underline underline-offset-2 hover:text-gold-light"
        >
          {label}
        </Link>,
      );
    } else {
      nodes.push(
        <a
          key={`${match.index}-${href}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gold font-semibold underline underline-offset-2 hover:text-gold-light"
        >
          {label}
        </a>,
      );
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return <span className={`whitespace-pre-wrap ${className}`}>{nodes}</span>;
}
