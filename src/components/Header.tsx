import { ShoppingBag, User } from 'lucide-react';
import { formatCount } from '../data/products';
import type { UITranslationKeys } from '../lib/i18n';
import type { CategoryKey } from '../types/store';

interface HeaderProps {
  storeName: string;
  cartCount: number;
  unusedCouponCount: number;
  isLoggedIn: boolean;
  langCode: string;
  t: UITranslationKeys;
  onOpenCart: () => void;
  onOpenProfile: () => void;
  onSelectCategoryJump: (category: CategoryKey) => void;
  onJumpToAdvisor: () => void;
}

export function Header({
  storeName,
  cartCount,
  unusedCouponCount,
  isLoggedIn,
  langCode,
  t,
  onOpenCart,
  onOpenProfile,
  onSelectCategoryJump,
  onJumpToAdvisor,
}: HeaderProps) {
  return (
    <header
      className="sticky top-0 z-40 backdrop-blur-md border-b"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--brand-canvas, #F3ECE1) 92%, transparent)',
        borderColor: 'var(--brand-border, #D9CDB8)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 sm:gap-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="font-display text-xl sm:text-2xl font-bold tracking-tight whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4"
          style={{ color: 'var(--brand-ink, #1C1917)' }}
        >
          {storeName}
        </a>

        {/* Zone 2: Concise single-line navigation links */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium"
          style={{ color: 'var(--brand-muted, #57534E)' }}
        >
          <button
            type="button"
            onClick={() => onSelectCategoryJump('all')}
            className="hover:opacity-100 hover:underline underline-offset-4 transition-opacity whitespace-nowrap shrink-0 cursor-pointer"
          >
            {t.navAll}
          </button>
          <button
            type="button"
            onClick={() => onSelectCategoryJump('saree-threepiece')}
            className="hover:opacity-100 hover:underline underline-offset-4 transition-opacity whitespace-nowrap shrink-0 cursor-pointer"
          >
            {t.navSaree}
          </button>
          <button
            type="button"
            onClick={() => onSelectCategoryJump('tshirt-pant')}
            className="hover:opacity-100 hover:underline underline-offset-4 transition-opacity whitespace-nowrap shrink-0 cursor-pointer"
          >
            {t.navTshirt}
          </button>
          <button
            type="button"
            onClick={onJumpToAdvisor}
            className="hover:opacity-100 hover:underline underline-offset-4 transition-opacity whitespace-nowrap shrink-0 cursor-pointer"
          >
            {t.navAdvisor}
          </button>
        </nav>

        {/* Zone 3: Member Profile & Cart Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenProfile}
            aria-label={t.profileBtn}
            style={{
              backgroundColor: 'var(--brand-card, #FAF6EE)',
              color: 'var(--brand-ink, #1C1917)',
              borderColor: isLoggedIn
                ? 'var(--brand-gold, #A67C33)'
                : 'var(--brand-border, #D9CDB8)',
            }}
            className="inline-flex items-center gap-2 px-3 py-2 min-h-[42px] border hover:opacity-90 text-sm font-medium rounded-lg transition-opacity duration-150 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <User className="w-4 h-4 shrink-0" strokeWidth={1.75} />
            <span className="hidden sm:inline">{t.profileShort}</span>
            {unusedCouponCount > 0 && (
              <span
                className="px-1.5 py-0.5 text-[11px] font-bold rounded tabular-nums leading-none"
                style={{
                  backgroundColor: 'var(--brand-gold, #A67C33)',
                  color: '#FFFFFF',
                }}
              >
                {formatCount(unusedCouponCount, langCode)}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenCart}
            aria-label={`${t.cart} (${cartCount})`}
            style={{
              backgroundColor: 'var(--brand-accent, #7A1C32)',
              color: 'var(--brand-accent-ink, #FFFFFF)',
            }}
            className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 min-h-[42px] hover:opacity-90 text-sm font-medium rounded-lg transition-opacity duration-150 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 shrink-0" strokeWidth={1.75} />
            <span>{t.cart}</span>
            <span className="tabular-nums font-semibold">
              ({formatCount(cartCount, langCode)})
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
