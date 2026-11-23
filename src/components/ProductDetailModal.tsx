import { useEffect, useState } from 'react';
import { Check, Minus, Plus, ShoppingBag, X } from 'lucide-react';
import { formatBDT, formatCount } from '../data/products';
import type { UITranslationKeys } from '../lib/i18n';
import type { Product, ProductColor } from '../types/store';
import { ResilientImage } from './ResilientImage';

interface ProductDetailModalProps {
  product: Product | null;
  langCode: string;
  t: UITranslationKeys;
  onClose: () => void;
  onAddToCart: (
    product: Product,
    size: string,
    color: ProductColor,
    quantity: number,
  ) => void;
  onAddAndOpenCart: (
    product: Product,
    size: string,
    color: ProductColor,
    quantity: number,
  ) => void;
}

export function ProductDetailModal({
  product,
  langCode,
  t,
  onClose,
  onAddToCart,
  onAddAndOpenCart,
}: ProductDetailModalProps) {
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<ProductColor | null>(null);
  const [activeImage, setActiveImage] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [addedFeedback, setAddedFeedback] = useState<boolean>(false);

  useEffect(() => {
    if (product) {
      setSelectedSize(product.sizes[0]);
      setSelectedColor(product.colors[0]);
      setActiveImage(product.image);
      setQuantity(1);
      setAddedFeedback(false);
    }
  }, [product]);

  useEffect(() => {
    if (!product) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [product, onClose]);

  if (!product) return null;

  const activeSize = selectedSize || product.sizes[0];
  const activeColor = selectedColor || product.colors[0];
  const allImages = [
    product.image,
    ...(product.galleryImages || []).filter((img) => img && img !== product.image),
  ];
  const currentImage = activeImage || product.image;

  const handleAdd = () => {
    onAddToCart(product, activeSize, activeColor, quantity);
    setAddedFeedback(true);
    window.setTimeout(() => setAddedFeedback(false), 1500);
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-black/55 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdp-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--brand-card, #FAF6EE)',
          borderColor: 'var(--brand-border, #D9CDB8)',
          color: 'var(--brand-ink, #1C1917)',
        }}
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto border rounded-xl shadow-2xl"
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{
            backgroundColor: 'var(--brand-card, #FAF6EE)',
            borderColor: 'var(--brand-border, #D9CDB8)',
            color: 'var(--brand-ink, #1C1917)',
          }}
          className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-lg border hover:opacity-80 transition-opacity cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 items-stretch">
          {/* Left: Product Image + Gallery + Specs */}
          <div
            style={{
              backgroundColor: 'var(--brand-card-alt, #EFE6D8)',
              borderColor: 'var(--brand-border, #D9CDB8)',
            }}
            className="p-6 sm:p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r"
          >
            <div>
              <div
                style={{ borderColor: 'var(--brand-border, #D9CDB8)' }}
                className="aspect-[4/3] w-full rounded-lg overflow-hidden border"
              >
                <ResilientImage
                  src={currentImage}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {allImages.length > 1 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {allImages.map((imgUrl, idx) => {
                    const isSelected = currentImage === imgUrl;
                    return (
                      <button
                        key={`${imgUrl}-${idx}`}
                        type="button"
                        onClick={() => setActiveImage(imgUrl)}
                        aria-label={`${product.name} #${idx + 1}`}
                        style={{
                          borderColor: isSelected
                            ? 'var(--brand-accent, #7A1C32)'
                            : 'var(--brand-border, #D9CDB8)',
                        }}
                        className={`w-16 h-12 rounded-md overflow-hidden border-2 transition-opacity cursor-pointer ${
                          isSelected ? 'opacity-100' : 'opacity-75 hover:opacity-100'
                        }`}
                      >
                        <ResilientImage
                          src={imgUrl}
                          alt={`${product.name} preview`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div
              className="mt-6 pt-5 border-t space-y-3 text-sm"
              style={{ borderColor: 'var(--brand-border, #D9CDB8)' }}
            >
              <div className="flex justify-between gap-4">
                <span style={{ color: 'var(--brand-muted, #57534E)' }} className="shrink-0">
                  {t.fabricLabel}
                </span>
                <span className="font-medium text-right">{product.fabric}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span style={{ color: 'var(--brand-muted, #57534E)' }} className="shrink-0">
                  {t.careLabel}
                </span>
                <span className="text-right leading-relaxed">{product.careNote}</span>
              </div>
            </div>
          </div>

          {/* Right: Contiguous Purchase Module */}
          <div className="p-6 sm:p-8 flex flex-col">
            <div
              className="flex items-center gap-2 text-xs mb-2 pr-10"
              style={{ color: 'var(--brand-muted, #57534E)' }}
            >
              <span>{product.categoryLabel}</span>
              <span aria-hidden="true">·</span>
              <span>{product.subCategory}</span>
              <span aria-hidden="true">·</span>
              <span className="font-medium text-[#166534] dark:text-[#86EFAC]">
                {product.stockStatus}
              </span>
            </div>

            <h2
              id="pdp-modal-title"
              className="font-display text-2xl font-bold leading-snug mb-3 pr-8"
            >
              {product.name}
            </h2>

            <div className="flex items-baseline gap-3 mb-4">
              <span
                className="text-2xl font-bold tabular-nums"
                style={{ color: 'var(--brand-accent, #7A1C32)' }}
              >
                {formatBDT(product.price, langCode)}
              </span>
              {product.originalPrice && (
                <span
                  className="text-sm line-through tabular-nums"
                  style={{ color: 'var(--brand-muted, #57534E)' }}
                >
                  {formatBDT(product.originalPrice, langCode)}
                </span>
              )}
            </div>

            <p
              className="text-sm sm:text-[15px] leading-relaxed mb-6"
              style={{ color: 'var(--brand-muted, #57534E)' }}
            >
              {product.description}
            </p>

            {/* Color Selection */}
            <div className="mb-5">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="font-medium">{t.colorSelect}</span>
                <span style={{ color: 'var(--brand-muted, #57534E)' }}>
                  {activeColor.name}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((color) => {
                  const isActive = activeColor.name === color.name;
                  return (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      style={{
                        borderColor: isActive
                          ? 'var(--brand-accent, #7A1C32)'
                          : 'var(--brand-border, #D9CDB8)',
                        backgroundColor: isActive
                          ? 'var(--brand-card-alt, #EFE6D8)'
                          : 'var(--brand-card, #FAF6EE)',
                      }}
                      className="inline-flex items-center gap-2 px-3 py-2 min-h-[40px] text-xs font-medium rounded-lg border transition-colors cursor-pointer"
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0"
                        style={{ backgroundColor: color.hex }}
                      />
                      <span className="whitespace-nowrap">{color.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Size Selection */}
            <div className="mb-6">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="font-medium">{t.sizeSelect}</span>
                <span style={{ color: 'var(--brand-muted, #57534E)' }}>
                  {activeSize}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => {
                  const isActive = activeSize === size;
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      style={
                        isActive
                          ? {
                              backgroundColor: 'var(--brand-accent, #7A1C32)',
                              color: 'var(--brand-accent-ink, #FFFFFF)',
                              borderColor: 'var(--brand-accent, #7A1C32)',
                            }
                          : {
                              backgroundColor: 'var(--brand-card, #FAF6EE)',
                              color: 'var(--brand-ink, #1C1917)',
                              borderColor: 'var(--brand-border, #D9CDB8)',
                            }
                      }
                      className="px-3.5 py-2 min-h-[40px] text-xs font-medium rounded-lg border transition-colors whitespace-nowrap cursor-pointer"
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantity & Primary CTAs */}
            <div
              className="mt-auto pt-5 border-t space-y-3"
              style={{ borderColor: 'var(--brand-border, #D9CDB8)' }}
            >
              <div className="flex items-center gap-3">
                <div
                  style={{
                    borderColor: 'var(--brand-border, #D9CDB8)',
                    backgroundColor: 'var(--brand-card-alt, #EFE6D8)',
                  }}
                  className="inline-flex items-center border rounded-lg"
                >
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    aria-label="Decrease quantity"
                    className="w-10 h-11 flex items-center justify-center rounded-l-lg cursor-pointer hover:opacity-75"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-10 text-center text-sm font-semibold tabular-nums">
                    {formatCount(quantity, langCode)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                    aria-label="Increase quantity"
                    className="w-10 h-11 flex items-center justify-center rounded-r-lg cursor-pointer hover:opacity-75"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleAdd}
                  style={
                    addedFeedback
                      ? undefined
                      : {
                          backgroundColor: 'var(--brand-accent, #7A1C32)',
                          color: 'var(--brand-accent-ink, #FFFFFF)',
                        }
                  }
                  className={`flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] text-sm font-semibold rounded-lg transition-opacity whitespace-nowrap cursor-pointer ${
                    addedFeedback ? 'bg-[#166534] text-white' : 'hover:opacity-90'
                  }`}
                >
                  {addedFeedback ? (
                    <>
                      <Check className="w-4 h-4 shrink-0" />
                      <span>{t.addedToCart}</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4 shrink-0" />
                      <span>
                        {t.addToCart} · {formatBDT(product.price * quantity, langCode)}
                      </span>
                    </>
                  )}
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  onAddAndOpenCart(product, activeSize, activeColor, quantity);
                  onClose();
                }}
                style={{
                  backgroundColor: 'var(--brand-card-alt, #EFE6D8)',
                  color: 'var(--brand-ink, #1C1917)',
                  borderColor: 'var(--brand-border, #D9CDB8)',
                }}
                className="w-full py-2.5 min-h-[42px] text-sm font-medium border hover:opacity-85 rounded-lg transition-opacity cursor-pointer"
              >
                {t.orderNow}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
