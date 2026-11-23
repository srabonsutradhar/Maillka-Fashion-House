import { Mail, MapPin, Phone, RotateCcw, Truck } from 'lucide-react';
import type { UITranslationKeys } from '../lib/i18n';
import type { CategoryKey } from '../types/store';

interface FooterProps {
  storeName: string;
  storeAddress: string;
  storePhone: string;
  storeEmail: string;
  t: UITranslationKeys;
  onSelectCategoryJump: (category: CategoryKey) => void;
}

export function Footer({
  storeName,
  storeAddress,
  storePhone,
  storeEmail,
  t,
  onSelectCategoryJump,
}: FooterProps) {
  return (
    <footer
      className="border-t"
      style={{
        backgroundColor: 'var(--brand-surface, #E7DCC8)',
        borderColor: 'var(--brand-border, #D9CDB8)',
        color: 'var(--brand-ink, #1C1917)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Column 1: Store Info */}
          <div>
            <h2
              className="font-display text-2xl font-bold mb-3"
              style={{ color: 'var(--brand-ink, #1C1917)' }}
            >
              {storeName}
            </h2>
            <p
              className="text-sm leading-relaxed mb-5 max-w-sm"
              style={{ color: 'var(--brand-muted, #57534E)' }}
            >
              {t.footerTagline}
            </p>
            <ul
              className="space-y-2.5 text-sm"
              style={{ color: 'var(--brand-muted, #57534E)' }}
            >
              <li className="flex items-start gap-2.5">
                <MapPin
                  className="w-4 h-4 mt-0.5 shrink-0"
                  style={{ color: 'var(--brand-accent, #7A1C32)' }}
                />
                <span>{storeAddress || t.footerAddress}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone
                  className="w-4 h-4 shrink-0"
                  style={{ color: 'var(--brand-accent, #7A1C32)' }}
                />
                <span className="tabular-nums">{storePhone || t.footerHours}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail
                  className="w-4 h-4 shrink-0"
                  style={{ color: 'var(--brand-accent, #7A1C32)' }}
                />
                <span>{storeEmail || 'concierge@mallikafashion.com'}</span>
              </li>
            </ul>
          </div>

          {/* Column 2: Delivery & Return Notes */}
          <div>
            <h3
              className="text-sm font-semibold mb-4"
              style={{ color: 'var(--brand-ink, #1C1917)' }}
            >
              {t.footerDeliveryHeading}
            </h3>
            <ul
              className="space-y-3 text-sm leading-relaxed"
              style={{ color: 'var(--brand-muted, #57534E)' }}
            >
              <li className="flex items-start gap-2.5">
                <Truck
                  className="w-4 h-4 mt-0.5 shrink-0"
                  style={{ color: 'var(--brand-accent, #7A1C32)' }}
                />
                <span>{t.footerDeliveryNote}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <RotateCcw
                  className="w-4 h-4 mt-0.5 shrink-0"
                  style={{ color: 'var(--brand-accent, #7A1C32)' }}
                />
                <span>{t.footerReturnNote}</span>
              </li>
            </ul>
          </div>

          {/* Column 3: Categories */}
          <div>
            <h3
              className="text-sm font-semibold mb-4"
              style={{ color: 'var(--brand-ink, #1C1917)' }}
            >
              {t.footerQuickCategories}
            </h3>
            <div
              className="flex flex-col items-start gap-2.5 text-sm"
              style={{ color: 'var(--brand-muted, #57534E)' }}
            >
              <button
                type="button"
                onClick={() => onSelectCategoryJump('saree-threepiece')}
                className="hover:underline underline-offset-4 transition-colors cursor-pointer"
              >
                {t.catSareeThreepiece}
              </button>
              <button
                type="button"
                onClick={() => onSelectCategoryJump('tshirt-pant')}
                className="hover:underline underline-offset-4 transition-colors cursor-pointer"
              >
                {t.catTshirtPant}
              </button>
              <button
                type="button"
                onClick={() => onSelectCategoryJump('apparel-orna')}
                className="hover:underline underline-offset-4 transition-colors cursor-pointer"
              >
                {t.footerCatApparel}
              </button>
              <button
                type="button"
                onClick={() => onSelectCategoryJump('bedsheet')}
                className="hover:underline underline-offset-4 transition-colors cursor-pointer"
              >
                {t.footerCatBedsheet}
              </button>
            </div>
          </div>
        </div>

        <div
          className="mt-10 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs"
          style={{
            borderColor: 'var(--brand-border, #D9CDB8)',
            color: 'var(--brand-muted, #57534E)',
          }}
        >
          <p>
            © 2026 {storeName}. {t.footerCopyrightSuffix}
          </p>
          <span>{t.footerBottomTagline}</span>
        </div>
      </div>
    </footer>
  );
}
