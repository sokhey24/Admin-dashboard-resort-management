import { Link } from 'react-router-dom';
import logoUrl from '../../assets/logo.png';

/**
 * Solara brand mark — shared across header, footer, and auth pages.
 */
export function BrandLogo({
  to = '/',
  className = '',
  imgClassName = 'h-10 w-auto max-w-[160px] object-contain object-left',
  showWordmark = false,
  titleClassName = 'text-xl font-bold font-serif tracking-[0.2em] text-white',
  taglineClassName = 'text-[9px] uppercase tracking-[0.25em] text-gold-light -mt-1 font-sans',
  name = 'SOLARA',
  tagline = 'Resort & Spa',
  asLink = true,
  imageSrc,
}) {
  const content = (
    <span className={`inline-flex items-center gap-2.5 group tracking-tight ${className}`}>
      <img
        src={imageSrc || logoUrl}
        alt="Solara Resort & Spa"
        className={`shrink-0 group-hover:scale-[1.02] transition-transform ${imgClassName}`}
        width={160}
        height={40}
        decoding="async"
      />
      {showWordmark && (
        <span className="flex flex-col text-left">
          <span className={titleClassName}>{name}</span>
          <span className={taglineClassName}>{tagline}</span>
        </span>
      )}
    </span>
  );

  if (!asLink) {
    return content;
  }

  return (
    <Link
      to={to}
      className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 rounded-sm"
      aria-label="Solara Luxury Resort Home"
    >
      {content}
    </Link>
  );
}
