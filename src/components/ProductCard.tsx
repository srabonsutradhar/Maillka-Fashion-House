import { useState } from 'react';
import { Check, Eye, ShoppingBag } from 'lucide-react';
import { formatBDT, formatCount } from '../data/products';
import type { UITranslationKeys } from '../lib/i18n';
import type {
  CardImageRatioOption,
  CardRadiusOption,
  Product,
  ProductColor,
} from '../types/store';
import { ResilientImage } from './ResilientImage';

interface ProductCardProps {
  product: Product;
  cardRadius: CardRadiusOption;
  imageRatio: CardImageRatioOption;
  langCode: string;
  t: UITranslationKeys;
  onAddToCart: (product: Product, size: string, color: ProductColor, quantity: number) => void;
  onViewDetails: (product: Product) => void;
}

const RADIUS_CLASS: Record<CardRadiusOption, string> = {
  sharp: 'rounded-sm',
  balanced: 'rounded-xl',
  soft: 'rounded-2xl',
};

const RATIO_CLASS: Record<CardImageRatioOption, string> = {
  '4:3': 'aspect-[4/3]',
  '1:1': 'aspect-square',
  '3:4': 'aspect-[3/4]',
};

export function ProductCard({
  product,
  cardRadius,
  imageRatio,
  langCode,
  t,
  onAddToCart,
  onViewDetails,
}: ProductCardProps) {
  const [justAdded, setJustAdded] = useState(false);

  const handleQuickAdd = () => {
    onAddToCart(product, product.sizes[0], product.colors[0], 1);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1200);
  };

  return (
    <article
      style={{
        backgroundColor: 'var(--brand-card, #FAF6EE)',
        borderColor: 'var(--brand-border, #D9CDB8)',
      }}
      className={`group flex flex-col border overflow-hidden transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-md ${RADIUS_CLASS[cardRadius]}`}
    >
      {/* Product Media */}
      <button
        type="button"
        onClick={() => onViewDetails(product)}
        style={{ backgroundColor: 'var(--brand-card-alt, #EFE6D8)' }}
        className={`relative w-full overflow-hidden cursor-pointer text-left ${RATIO_CLASS[imageRatio]}`}
        aria-label={`${product.name} — ${t.viewDetails}`}
      >
        <ResilientImage
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />
      </button>

      {/* Card Body */}
      <div className="flex flex-col flex-1 p-5">
        {/* Quiet unboxed metadata line */}
        <div
          className="flex items-center gap-2 text-xs mb-1.5"
          style={{ color: 'var(--brand-muted, #57534E)' }}
        >
          <span>{product.categoryLabel}</span>
          <span aria-hidden="true">·</span>
          <span>{product.featuredTag || product.subCategory}</span>
        </div>

        {/* Title */}
        <h3
          className="font-display text-lg font-semibold leading-snug mb-1.5"
          style={{ color: 'var(--brand-ink, #1C1917)' }}
        >
          <button
            type="button"
            onClick={() => onViewDetails(product)}
            className="text-left hover:opacity-80 transition-opacity cursor-pointer"
          >
            {product.name}
          </button>
        </h3>

        {/* Short description */}
        <p
          className="text-sm leading-relaxed line-clamp-2 mb-4"
          style={{ color: 'var(--brand-muted, #57534E)' }}
        >
          {product.shortDescription}
        </p>

        {/* Price & Color/Size preview */}
        <div
          className="mt-auto pt-3 border-t"
          style={{ borderColor: 'var(--brand-border, #D9CDB8)' }}
        >
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-baseline gap-2">
              <span
                className="text-lg font-bold tabular-nums"
                style={{ color: 'var(--brand-ink, #1C1917)' }}
              >
                {formatBDT(product.price, langCode)}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span
                  className="text-xs line-through tabular-nums"
                  style={{ color: 'var(--brand-muted, #57534E)' }}
                >
                  {formatBDT(product.originalPrice, langCode)}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {product.colors.map((color) => (
                  <span
                    key={color.name}
                    className="w-3.5 h-3.5 rounded-full border border-black/20"
                    style={{ backgroundColor: color.hex }}
                    aria-label={color.name}
                  />
                ))}
              </div>
              <span
                className="text-xs tabular-nums"
                style={{ color: 'var(--brand-muted, #57534E)' }}
              >
                {product.sizes.length > 1
                  ? `${formatCount(product.sizes.length, langCode)} ${t.sizesWord}`
                  : t.standardSize}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleQuickAdd}
              style={
                justAdded
                  ? undefined
                  : {
                      backgroundColor: 'var(--brand-accent, #7A1C32)',
                      color: 'var(--brand-accent-ink, #FFFFFF)',
                    }
              }
              className={`inline-flex items-center justify-center gap-1.5 px-3 py-2.5 min-h-[42px] text-sm font-medium rounded-lg transition-opacity duration-150 whitespace-nowrap cursor-pointer ${
                justAdded ? 'bg-[#166534] text-white' : 'hover:opacity-90'
              }`}
            >
              {justAdded ? (
                <>
                  <Check className="w-4 h-4 shrink-0" strokeWidth={2} />
                  <span>{t.addedToCart}</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                  <span>{t.addToCart}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => onViewDetails(product)}
              style={{
                backgroundColor: 'var(--brand-card-alt, #EFE6D8)',
                color: 'var(--brand-ink, #1C1917)',
                borderColor: 'var(--brand-border, #D9CDB8)',
              }}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 min-h-[42px] text-sm font-medium border hover:opacity-85 rounded-lg transition-opacity duration-150 whitespace-nowrap cursor-pointer"
            >
              <Eye className="w-4 h-4 shrink-0" strokeWidth={1.75} />
              <span>{t.viewDetails}</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
