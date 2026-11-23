import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from 'react';
import { Check, ChevronDown, Globe, Loader2 } from 'lucide-react';
import { PRESET_LANGUAGES, type LanguageOption } from '../lib/i18n';
import type { BannerSpeedOption } from '../types/store';

interface LuxuryMarqueeBannerProps {
  bannerEnabled: boolean;
  messages: string[];
  speed: BannerSpeedOption;
  accentColor: string;
  currentLangCode: string;
  currentLangLabel: string;
  isTranslating: boolean;
  translatingLabel: string;
  customPlaceholder: string;
  applyLabel: string;
  onSelectLanguage: (option: LanguageOption) => void;
}

const SPEED_DURATION: Record<BannerSpeedOption, string> = {
  slow: '48s',
  normal: '30s',
  fast: '18s',
};

export function LuxuryMarqueeBanner({
  bannerEnabled,
  messages,
  speed,
  currentLangCode,
  currentLangLabel,
  isTranslating,
  translatingLabel,
  customPlaceholder,
  applyLabel,
  onSelectLanguage,
}: LuxuryMarqueeBannerProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [customLang, setCustomLang] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMenuOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMenuOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    window.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isMenuOpen]);

  const cleanMessages = messages.map((m) => m.trim()).filter(Boolean);
  const marqueeItems =
    cleanMessages.length > 0
      ? cleanMessages
      : ['মল্লিকা ফ্যাশন হাউস · এক্সক্লুসিভ লাক্সারি কালেকশন'];

  const handleCustomSubmit = (e: FormEvent) => {
    e.preventDefault();
    const cleaned = customLang.trim();
    if (!cleaned) return;
    onSelectLanguage({
      code: `custom-${cleaned.toLowerCase()}`,
      label: cleaned,
      nativeLabel: cleaned,
      promptName: cleaned,
    });
    setCustomLang('');
    setIsMenuOpen(false);
  };

  return (
    <div
      className="relative z-50 h-9 w-full bg-[#171310] text-[#F5EFE6] border-b border-[#D4AF37]/30 flex items-center"
      role="region"
      aria-label="স্টোর ঘোষণা ও ভাষা নির্বাচন"
    >
      <div className="max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-3 h-full">
        {/* Moving Announcement Marquee */}
        {bannerEnabled ? (
          <div className="flex-1 min-w-0 overflow-hidden h-full flex items-center">
            <div
              className="animate-luxury-marquee items-center text-xs tracking-wide whitespace-nowrap text-[#EFE4D2]"
              style={
                {
                  '--marquee-duration': SPEED_DURATION[speed] || '30s',
                } as CSSProperties
              }
            >
              {[0, 1].map((dupIdx) => (
                <div key={dupIdx} className="inline-flex items-center shrink-0">
                  {marqueeItems.map((msg, idx) => (
                    <span key={`${dupIdx}-${idx}`} className="inline-flex items-center">
                      <span className="px-4 font-medium">{msg}</span>
                      <span
                        aria-hidden="true"
                        className="text-[#D4AF37] text-[10px]"
                      >
                        ◆
                      </span>
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1" />
        )}

        {/* Compact Language Switcher */}
        <div
          ref={menuRef}
          className="relative shrink-0 pl-2 sm:pl-3 border-l border-[#D4AF37]/25 flex items-center"
        >
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-expanded={isMenuOpen}
            aria-haspopup="listbox"
            className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-[#F5EFE6] hover:text-[#D4AF37] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {isTranslating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#D4AF37]" />
            ) : (
              <Globe className="w-3.5 h-3.5 text-[#D4AF37]" />
            )}
            <span className="max-w-[96px] truncate">
              {isTranslating ? translatingLabel : currentLangLabel}
            </span>
            <ChevronDown className="w-3 h-3 opacity-80" />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-72 bg-[#1A1613] text-[#F5EFE6] border border-[#D4AF37]/35 rounded-xl shadow-2xl p-2.5 z-50">
              <div className="grid grid-cols-2 gap-1 max-h-60 overflow-y-auto pr-0.5">
                {PRESET_LANGUAGES.map((lang) => {
                  const isActive = currentLangCode === lang.code;
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => {
                        onSelectLanguage(lang);
                        setIsMenuOpen(false);
                      }}
                      className={`flex items-center justify-between gap-1.5 px-2.5 py-2 rounded-lg text-xs text-left transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-[#D4AF37] text-[#141210] font-semibold'
                          : 'hover:bg-white/10 text-[#F5EFE6]'
                      }`}
                    >
                      <span className="truncate">{lang.nativeLabel}</span>
                      {isActive && <Check className="w-3 h-3 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              <form
                onSubmit={handleCustomSubmit}
                className="mt-2 pt-2 border-t border-white/15 flex items-center gap-1.5"
              >
                <input
                  type="text"
                  value={customLang}
                  onChange={(e) => setCustomLang(e.target.value)}
                  placeholder={customPlaceholder}
                  className="flex-1 min-w-0 px-2.5 py-1.5 text-xs bg-[#26201B] text-[#F5EFE6] placeholder:text-[#A89E91] border border-white/15 rounded-lg focus:outline-none focus:border-[#D4AF37]"
                />
                <button
                  type="submit"
                  className="px-2.5 py-1.5 text-xs font-semibold bg-[#D4AF37] hover:bg-[#E2BF52] text-[#141210] rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {applyLabel}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
