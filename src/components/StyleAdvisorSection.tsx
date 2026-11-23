import { useState, type FormEvent } from 'react';
import { AlertCircle, ArrowRight, Loader2, ShoppingBag } from 'lucide-react';
import { formatBDT, formatCount } from '../data/products';
import type { UITranslationKeys } from '../lib/i18n';
import type {
  Product,
  ProductColor,
  StyleAdviceResponse,
} from '../types/store';
import { ResilientImage } from './ResilientImage';

interface StyleAdvisorSectionProps {
  products: Product[];
  langCode: string;
  langPromptName: string;
  t: UITranslationKeys;
  onViewDetails: (product: Product) => void;
  onAddToCart: (
    product: Product,
    size: string,
    color: ProductColor,
    quantity: number,
  ) => void;
}

const PRESET_SCENARIOS_BN = [
  {
    label: 'উৎসব ও দাওয়াত (৳ ৩,০০০–৫,০০০)',
    occasion: 'পারিবারিক বিয়ের দাওয়াত ও উৎসব',
    budget: '৩,০০০ – ৫,০০০ টাকা',
    preference: 'ঐতিহ্যবাহী জামদানি বা মার্জিত পাঞ্জাবি, আরামদায়ক ও অভিজাত রঙ',
  },
  {
    label: 'গরমে আরামদায়ক ক্যাজুয়াল (৳ ১,৫০০)',
    occasion: 'দৈনন্দিন ব্যবহার ও বন্ধুদের সাথে আড্ডা',
    budget: '১,০০০ – ২,০০০ টাকা',
    preference: 'খাঁটি সুতি টি-শার্ট ও থ্রি-কোয়ার্টার প্যান্ট বা হালকা কুর্তি',
  },
  {
    label: 'অফিস বা ভার্সিটি লুক (৳ ২,৫০০)',
    occasion: 'অফিস ও প্রতিদিনের কর্মক্ষেত্র',
    budget: '১,৫০০ – ২,৫০০ টাকা',
    preference: 'পরিপাটি কুর্তি ও ওড়না অথবা সুতি থ্রি-পিস',
  },
  {
    label: 'নতুন ঘর সাজানো বা উপহার',
    occasion: 'নতুন বাসা সাজানো ও পারিবারিক উপহার',
    budget: '১,৫০০ – ২,০০০ টাকা',
    preference: '১০০% সুতি রঙ-পাকা কিং সাইজ বেডশিট',
  },
];

const PRESET_SCENARIOS_EN = [
  {
    label: 'Festive & Wedding (৳ 3,000–5,000)',
    occasion: 'Family wedding invitation & celebration',
    budget: '3,000 – 5,000 BDT',
    preference: 'Heritage Jamdani saree or tailored Panjabi in rich jewel tones',
  },
  {
    label: 'Summer Breathable Casual (৳ 1,500)',
    occasion: 'Everyday outings and relaxed weekends',
    budget: '1,000 – 2,000 BDT',
    preference: 'Pure cotton t-shirt with three-quarter pant or airy kurti',
  },
  {
    label: 'Refined Office Look (৳ 2,500)',
    occasion: 'Office and daytime formal appointments',
    budget: '1,500 – 2,500 BDT',
    preference: 'Tailored block-print kurti with muslin orna or embroidered 3-piece',
  },
  {
    label: 'Home Sanctuary & Gifting',
    occasion: 'Bedroom styling and family housewarming gift',
    budget: '1,500 – 2,000 BDT',
    preference: '100% combed cotton king-size floral bedsheet set',
  },
];

export function StyleAdvisorSection({
  products,
  langCode,
  langPromptName,
  t,
  onViewDetails,
  onAddToCart,
}: StyleAdvisorSectionProps) {
  const [occasion, setOccasion] = useState('');
  const [budget, setBudget] = useState('');
  const [preference, setPreference] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [advice, setAdvice] = useState<StyleAdviceResponse | null>(null);

  const productMap = new Map(products.map((p) => [p.id, p]));
  const presets = langCode === 'bn' ? PRESET_SCENARIOS_BN : PRESET_SCENARIOS_EN;

  const applyPreset = (preset: (typeof PRESET_SCENARIOS_BN)[number]) => {
    setOccasion(preset.occasion);
    setBudget(preset.budget);
    setPreference(preset.preference);
    setError('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!occasion.trim() && !preference.trim()) {
      setError(
        langCode === 'bn'
          ? 'অনুগ্রহ করে অন্তত উপলক্ষ বা পছন্দের ধরন লিখুন।'
          : 'Please describe your occasion or style preference.',
      );
      return;
    }

    setLoading(true);
    try {
      const liveCatalog = products.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.categoryLabel,
        subCategory: p.subCategory,
        priceBDT: p.price,
        fabric: p.fabric,
        colors: p.colors.map((c) => c.name),
        shortDescription: p.shortDescription,
      }));

      const response = await fetch('/api/style-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          occasion,
          budget,
          preference,
          catalog: liveCatalog,
          languageName: langPromptName,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Unable to generate style recommendation.');
        return;
      }

      setAdvice(data as StyleAdviceResponse);
    } catch {
      setError(
        langCode === 'bn'
          ? 'নেটওয়ার্ক সমস্যার কারণে পরামর্শক সেবাটি এই মুহূর্তে সাড়া দিচ্ছে না।'
          : 'Network error while reaching style concierge.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      id="style-advisor"
      className="border-t py-16 lg:py-20"
      style={{
        backgroundColor: 'var(--brand-surface, #E7DCC8)',
        borderColor: 'var(--brand-border, #D9CDB8)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* Left: Form */}
          <div className="lg:col-span-5">
            <p
              className="text-xs font-semibold tracking-wide mb-2"
              style={{ color: 'var(--brand-accent, #7A1C32)' }}
            >
              {t.advisorEyebrow}
            </p>
            <h2
              className="font-display text-2xl sm:text-3xl font-bold leading-snug mb-3 text-balance"
              style={{ color: 'var(--brand-ink, #1C1917)' }}
            >
              {t.advisorHeading}
            </h2>
            <p
              className="text-sm sm:text-[15px] leading-relaxed mb-5"
              style={{ color: 'var(--brand-muted, #57534E)' }}
            >
              {t.advisorSubheading}
            </p>

            {/* Quick Presets */}
            <div className="mb-5">
              <span
                className="block text-xs font-medium mb-2"
                style={{ color: 'var(--brand-muted, #57534E)' }}
              >
                {t.advisorSamplesLabel}
              </span>
              <div className="flex flex-wrap gap-2">
                {presets.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    style={{
                      backgroundColor: 'var(--brand-card, #FAF6EE)',
                      color: 'var(--brand-ink, #1C1917)',
                      borderColor: 'var(--brand-border, #D9CDB8)',
                    }}
                    className="px-3 py-1.5 text-xs font-medium border hover:opacity-85 rounded-lg transition-opacity cursor-pointer"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              style={{
                backgroundColor: 'var(--brand-card, #FAF6EE)',
                borderColor: 'var(--brand-border, #D9CDB8)',
              }}
              className="border rounded-xl p-5 sm:p-6 space-y-4"
            >
              <div>
                <label
                  htmlFor="advisor-occasion"
                  className="block text-sm font-medium mb-1.5"
                >
                  {t.advisorOccasionLabel}
                </label>
                <input
                  id="advisor-occasion"
                  type="text"
                  value={occasion}
                  onChange={(e) => setOccasion(e.target.value)}
                  placeholder={t.advisorOccasionPlaceholder}
                  style={{
                    backgroundColor: 'var(--brand-card-alt, #EFE6D8)',
                    borderColor: 'var(--brand-border, #D9CDB8)',
                    color: 'var(--brand-ink, #1C1917)',
                  }}
                  className="w-full px-3.5 py-2.5 min-h-[42px] text-sm border rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="advisor-budget"
                  className="block text-sm font-medium mb-1.5"
                >
                  {t.advisorBudgetLabel}
                </label>
                <input
                  id="advisor-budget"
                  type="text"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder={t.advisorBudgetPlaceholder}
                  style={{
                    backgroundColor: 'var(--brand-card-alt, #EFE6D8)',
                    borderColor: 'var(--brand-border, #D9CDB8)',
                    color: 'var(--brand-ink, #1C1917)',
                  }}
                  className="w-full px-3.5 py-2.5 min-h-[42px] text-sm border rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="advisor-preference"
                  className="block text-sm font-medium mb-1.5"
                >
                  {t.advisorPrefLabel}
                </label>
                <textarea
                  id="advisor-preference"
                  rows={2}
                  value={preference}
                  onChange={(e) => setPreference(e.target.value)}
                  placeholder={t.advisorPrefPlaceholder}
                  style={{
                    backgroundColor: 'var(--brand-card-alt, #EFE6D8)',
                    borderColor: 'var(--brand-border, #D9CDB8)',
                    color: 'var(--brand-ink, #1C1917)',
                  }}
                  className="w-full px-3.5 py-2.5 text-sm border rounded-lg focus:outline-none"
                />
              </div>

              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#991B1B]"
                >
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  backgroundColor: 'var(--brand-accent, #7A1C32)',
                  color: 'var(--brand-accent-ink, #FFFFFF)',
                }}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[44px] text-sm font-semibold hover:opacity-90 disabled:opacity-60 rounded-lg transition-opacity cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t.advisorLoading}</span>
                  </>
                ) : (
                  <>
                    <span>{t.advisorSubmit}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right: Advice Output */}
          <div className="lg:col-span-7">
            <div
              style={{
                backgroundColor: 'var(--brand-card, #FAF6EE)',
                borderColor: 'var(--brand-border, #D9CDB8)',
              }}
              className="border rounded-xl p-6 sm:p-8 min-h-[380px] flex flex-col justify-center"
            >
              {loading ? (
                <div className="py-12 text-center space-y-3">
                  <Loader2
                    className="w-7 h-7 animate-spin mx-auto"
                    style={{ color: 'var(--brand-accent, #7A1C32)' }}
                  />
                  <p className="text-sm font-medium">{t.advisorLoadingTitle}</p>
                  <p className="text-xs" style={{ color: 'var(--brand-muted, #57534E)' }}>
                    {t.advisorLoadingSub}
                  </p>
                </div>
              ) : advice ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-display text-xl font-bold mb-2">
                      {t.advisorResultTitle}
                    </h3>
                    <p
                      className="text-sm sm:text-[15px] leading-relaxed"
                      style={{ color: 'var(--brand-muted, #57534E)' }}
                    >
                      {advice.summary}
                    </p>
                  </div>

                  {advice.stylingTips.length > 0 && (
                    <div
                      className="pt-4 border-t"
                      style={{ borderColor: 'var(--brand-border, #D9CDB8)' }}
                    >
                      <h4 className="text-sm font-semibold mb-2.5">
                        {t.advisorTipsTitle}
                      </h4>
                      <ol
                        className="space-y-2 text-sm"
                        style={{ color: 'var(--brand-muted, #57534E)' }}
                      >
                        {advice.stylingTips.map((tip, index) => (
                          <li key={index} className="flex items-start gap-2.5">
                            <span
                              className="font-semibold tabular-nums shrink-0"
                              style={{ color: 'var(--brand-accent, #7A1C32)' }}
                            >
                              {formatCount(index + 1, langCode)}.
                            </span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {advice.recommendations.length > 0 && (
                    <div
                      className="pt-4 border-t"
                      style={{ borderColor: 'var(--brand-border, #D9CDB8)' }}
                    >
                      <h4 className="text-sm font-semibold mb-3">
                        {t.advisorRecTitle}
                      </h4>
                      <div className="space-y-3">
                        {advice.recommendations.map((rec) => {
                          const product = productMap.get(rec.productId);
                          if (!product) return null;
                          return (
                            <div
                              key={product.id}
                              style={{
                                backgroundColor: 'var(--brand-card-alt, #EFE6D8)',
                                borderColor: 'var(--brand-border, #D9CDB8)',
                              }}
                              className="flex flex-col sm:flex-row gap-4 p-3.5 rounded-lg border"
                            >
                              <div className="w-full sm:w-28 aspect-[4/3] rounded-md overflow-hidden shrink-0">
                                <ResilientImage
                                  src={product.image}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>

                              <div className="flex-1 min-w-0 flex flex-col justify-between">
                                <div>
                                  <div className="flex items-start justify-between gap-2">
                                    <h5 className="text-sm font-semibold">
                                      {product.name}
                                    </h5>
                                    <span
                                      className="text-sm font-bold tabular-nums shrink-0"
                                      style={{ color: 'var(--brand-accent, #7A1C32)' }}
                                    >
                                      {formatBDT(product.price, langCode)}
                                    </span>
                                  </div>
                                  <p
                                    className="text-xs mt-1 leading-relaxed"
                                    style={{ color: 'var(--brand-muted, #57534E)' }}
                                  >
                                    {rec.reason}
                                  </p>
                                </div>

                                <div className="mt-3 flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onAddToCart(
                                        product,
                                        product.sizes[0],
                                        product.colors[0],
                                        1,
                                      )
                                    }
                                    style={{
                                      backgroundColor: 'var(--brand-accent, #7A1C32)',
                                      color: 'var(--brand-accent-ink, #FFFFFF)',
                                    }}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] text-xs font-medium hover:opacity-90 rounded-md transition-opacity cursor-pointer"
                                  >
                                    <ShoppingBag className="w-3.5 h-3.5" />
                                    <span>{t.addToCart}</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => onViewDetails(product)}
                                    style={{
                                      backgroundColor: 'var(--brand-card, #FAF6EE)',
                                      color: 'var(--brand-ink, #1C1917)',
                                      borderColor: 'var(--brand-border, #D9CDB8)',
                                    }}
                                    className="px-3 py-1.5 min-h-[36px] text-xs font-medium border hover:opacity-85 rounded-md transition-opacity cursor-pointer"
                                  >
                                    {t.viewDetails}
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center max-w-md mx-auto space-y-3">
                  <p className="font-display text-lg font-semibold">
                    {t.advisorEmptyTitle}
                  </p>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: 'var(--brand-muted, #57534E)' }}
                  >
                    {t.advisorEmptyDesc}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
