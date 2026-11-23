import { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { ArrowDown, Award, Check, Search, User as UserIcon, X } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { AdminPanelDrawer } from './components/AdminPanelDrawer';
import { CartDrawer } from './components/CartDrawer';
import {
  CustomerProfileDrawer,
  type ProfileTab,
} from './components/CustomerProfileDrawer';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { LuxuryMarqueeBanner } from './components/LuxuryMarqueeBanner';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { ResilientImage } from './components/ResilientImage';
import { StyleAdvisorSection } from './components/StyleAdvisorSection';
import {
  DEFAULT_DESIGN_SETTINGS,
  PRODUCTS,
  formatCount,
} from './data/products';
import { auth, db } from './lib/firebase';
import {
  PRESET_LANGUAGES,
  UI_STRINGS_BN,
  UI_STRINGS_EN,
  isRtlLanguage,
  translateStringsBatch,
  type LanguageOption,
  type UITranslationKeys,
} from './lib/i18n';
import {
  seedInitialCatalogIfEmpty,
  subscribeActiveQuizzes,
  subscribeAdminQuizzes,
  subscribeAllProductsAdmin,
  subscribeDraftDesign,
  subscribeOrdersAdmin,
  subscribePublishedDesign,
  subscribePublishedProducts,
  subscribeUserCoupons,
  subscribeUserOrders,
  subscribeUserProfile,
} from './lib/storeSync';
import { getThemeStyleVars } from './lib/theme';
import type {
  CartItem,
  CategoryKey,
  Product,
  ProductColor,
  QuizAdminItem,
  QuizPublic,
  StoreDesignSettings,
  StoredOrder,
  UserCoupon,
  UserProfile,
} from './types/store';

type SortOrder = 'featured' | 'price-asc' | 'price-desc';

const GRID_COLUMNS_CLASS: Record<number, string> = {
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
};

export default function App() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('featured');
  const [detailProductId, setDetailProductId] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [profileInitialTab, setProfileInitialTab] =
    useState<ProfileTab>('profile');
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');

  // Multilingual state
  const [selectedLang, setSelectedLang] = useState<LanguageOption>(
    PRESET_LANGUAGES[0],
  );
  const [translatedUi, setTranslatedUi] = useState<Partial<UITranslationKeys>>({});
  const [translatedContent, setTranslatedContent] = useState<
    Record<string, string>
  >({});
  const [isTranslating, setIsTranslating] = useState<boolean>(false);

  // Live Firestore state
  const [liveProducts, setLiveProducts] = useState<Product[]>(PRODUCTS);
  const [adminProducts, setAdminProducts] = useState<Product[]>(PRODUCTS);
  const [publishedDesign, setPublishedDesign] = useState<StoreDesignSettings>(
    DEFAULT_DESIGN_SETTINGS,
  );
  const [draftDesign, setDraftDesign] = useState<StoreDesignSettings | null>(
    null,
  );
  const [previewDesign, setPreviewDesign] =
    useState<StoreDesignSettings | null>(null);
  const [orders, setOrders] = useState<StoredOrder[]>([]);
  const [activeQuizzes, setActiveQuizzes] = useState<QuizPublic[]>([]);
  const [adminQuizzes, setAdminQuizzes] = useState<QuizAdminItem[]>([]);

  // Auth, Customer Profile & Admin status (never exposes admin email in client UI)
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userCoupons, setUserCoupons] = useState<UserCoupon[]>([]);
  const [userOrders, setUserOrders] = useState<StoredOrder[]>([]);

  // Ensure Admin Studio automatically closes if session signs out or lacks admin access
  useEffect(() => {
    if (!user || !isAdmin) {
      setIsAdminOpen(false);
    }
  }, [user, isAdmin]);

  // Subscribe to published products & design for ALL shoppers in real time
  useEffect(() => {
    const unsubProducts = subscribePublishedProducts(
      (remoteList, hasRemote) => {
        if (hasRemote) {
          setLiveProducts(remoteList);
        }
      },
      (err) => {
        console.error('Published products subscription error:', err);
      },
    );

    const unsubDesign = subscribePublishedDesign(
      (settings) => {
        if (settings) {
          setPublishedDesign(settings);
        }
      },
      (err) => {
        console.error('Published design subscription error:', err);
      },
    );

    const unsubQuizzes = subscribeActiveQuizzes(
      (quizList) => {
        setActiveQuizzes(quizList);
      },
      (err) => {
        console.error('Active quizzes subscription error:', err);
      },
    );

    return () => {
      unsubProducts();
      unsubDesign();
      unsubQuizzes();
    };
  }, []);

  // Auth listener + Server-verified Admin check (never stores or displays admin email in client)
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (!currentUser || !currentUser.emailVerified) {
        setIsAdmin(false);
        return;
      }

      try {
        const token = await currentUser.getIdToken();
        const verifyRes = await fetch('/api/admin/verify', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (verifyRes.ok) {
          const data = (await verifyRes.json()) as { isAdmin?: boolean };
          if (data.isAdmin) {
            setIsAdmin(true);
            return;
          }
        }
      } catch {
        // Fallback to Firestore /admins/{uid} check
      }

      try {
        const adminDoc = await getDoc(doc(db, 'admins', currentUser.uid));
        setIsAdmin(adminDoc.exists());
      } catch {
        setIsAdmin(false);
      }
    });

    return () => unsubAuth();
  }, []);

  // Subscribe to signed-in customer's own profile, coupons, and order history
  useEffect(() => {
    if (!user || !user.emailVerified) {
      setUserProfile(null);
      setUserCoupons([]);
      setUserOrders([]);
      return;
    }

    const unsubProfile = subscribeUserProfile(
      user.uid,
      (prof) => setUserProfile(prof),
      (err) => console.error('User profile subscription error:', err),
    );
    const unsubCoupons = subscribeUserCoupons(
      user.uid,
      (list) => setUserCoupons(list),
      (err) => console.error('User coupons subscription error:', err),
    );
    const unsubMyOrders = subscribeUserOrders(
      user.uid,
      (list) => setUserOrders(list),
      (err) => console.error('User orders subscription error:', err),
    );

    return () => {
      unsubProfile();
      unsubCoupons();
      unsubMyOrders();
    };
  }, [user]);

  // Seed initial catalog once when admin signs in & subscribe to admin-only live streams
  useEffect(() => {
    if (!user || !isAdmin) {
      setAdminQuizzes([]);
      return;
    }

    void seedInitialCatalogIfEmpty(user.uid);

    const unsubAllProducts = subscribeAllProductsAdmin((list) => {
      if (list.length > 0) {
        setAdminProducts(list);
      }
    });

    const unsubDraftDesign = subscribeDraftDesign((settings) => {
      if (settings) {
        setDraftDesign(settings);
      }
    });

    const unsubOrders = subscribeOrdersAdmin((orderList) => {
      setOrders(orderList);
    });

    const unsubAdminQuizzes = subscribeAdminQuizzes(
      (quizList) => {
        setAdminQuizzes(quizList);
      },
      (err) => console.error('Admin quizzes subscription error:', err),
    );

    return () => {
      unsubAllProducts();
      unsubDraftDesign();
      unsubOrders();
      unsubAdminQuizzes();
    };
  }, [user, isAdmin]);

  const activeDesign = previewDesign || publishedDesign;

  // Dynamic translation effect for non-Bengali languages
  useEffect(() => {
    if (selectedLang.code === 'bn') {
      setTranslatedUi({});
      setTranslatedContent({});
      setIsTranslating(false);
      return;
    }

    let cancelled = false;
    const runTranslation = async () => {
      setIsTranslating(true);
      try {
        const dynamicPayload: Record<string, string> = {
          'design.storeName': activeDesign.storeName,
          'design.storeAddress': activeDesign.storeAddress,
          'design.storePhone': activeDesign.storePhone,
          'design.heroEyebrow': activeDesign.heroEyebrow,
          'design.heroTitle': activeDesign.heroTitle,
          'design.heroSubtitle': activeDesign.heroSubtitle,
        };

        activeDesign.bannerMessages.forEach((msg, idx) => {
          dynamicPayload[`banner.${idx}`] = msg;
        });

        liveProducts.forEach((p) => {
          dynamicPayload[`prod.${p.id}.name`] = p.name;
          dynamicPayload[`prod.${p.id}.catLabel`] = p.categoryLabel;
          dynamicPayload[`prod.${p.id}.subCat`] = p.subCategory;
          dynamicPayload[`prod.${p.id}.short`] = p.shortDescription;
          dynamicPayload[`prod.${p.id}.desc`] = p.description;
          dynamicPayload[`prod.${p.id}.fabric`] = p.fabric;
          dynamicPayload[`prod.${p.id}.care`] = p.careNote;
          dynamicPayload[`prod.${p.id}.stock`] = p.stockStatus;
          if (p.featuredTag) {
            dynamicPayload[`prod.${p.id}.tag`] = p.featuredTag;
          }
          p.colors.forEach((c, cIdx) => {
            dynamicPayload[`prod.${p.id}.color.${cIdx}`] = c.name;
          });
        });

        activeQuizzes.forEach((qz) => {
          dynamicPayload[`quiz.${qz.id}.q`] = qz.question;
          dynamicPayload[`quiz.${qz.id}.reward`] = qz.rewardTitle;
          qz.options.forEach((opt, oIdx) => {
            dynamicPayload[`quiz.${qz.id}.opt.${oIdx}`] = opt;
          });
        });

        if (selectedLang.code === 'en') {
          const contentMap = await translateStringsBatch(
            selectedLang.promptName,
            dynamicPayload,
          );
          if (!cancelled) {
            setTranslatedUi({});
            setTranslatedContent(contentMap);
          }
        } else {
          const uiPayload: Record<string, string> = { ...UI_STRINGS_EN };
          const [uiMap, contentMap] = await Promise.all([
            translateStringsBatch(selectedLang.promptName, uiPayload),
            translateStringsBatch(selectedLang.promptName, dynamicPayload),
          ]);
          if (!cancelled) {
            setTranslatedUi(uiMap as Partial<UITranslationKeys>);
            setTranslatedContent(contentMap);
          }
        }
      } catch (err) {
        console.error('Translation error:', err);
      } finally {
        if (!cancelled) {
          setIsTranslating(false);
        }
      }
    };

    void runTranslation();

    return () => {
      cancelled = true;
    };
  }, [selectedLang, activeDesign, liveProducts, activeQuizzes]);

  const t: UITranslationKeys = useMemo(() => {
    if (selectedLang.code === 'bn') return UI_STRINGS_BN;
    if (selectedLang.code === 'en') return UI_STRINGS_EN;
    return { ...UI_STRINGS_EN, ...translatedUi };
  }, [selectedLang.code, translatedUi]);

  const localizedDesign: StoreDesignSettings = useMemo(() => {
    if (selectedLang.code === 'bn') return activeDesign;
    return {
      ...activeDesign,
      storeName:
        translatedContent['design.storeName'] || activeDesign.storeName,
      storeAddress:
        translatedContent['design.storeAddress'] || activeDesign.storeAddress,
      storePhone:
        translatedContent['design.storePhone'] || activeDesign.storePhone,
      heroEyebrow:
        translatedContent['design.heroEyebrow'] || activeDesign.heroEyebrow,
      heroTitle:
        translatedContent['design.heroTitle'] || activeDesign.heroTitle,
      heroSubtitle:
        translatedContent['design.heroSubtitle'] || activeDesign.heroSubtitle,
      bannerMessages: activeDesign.bannerMessages.map(
        (msg, idx) => translatedContent[`banner.${idx}`] || msg,
      ),
    };
  }, [selectedLang.code, activeDesign, translatedContent]);

  const localizedProducts: Product[] = useMemo(() => {
    if (selectedLang.code === 'bn') return liveProducts;
    return liveProducts.map((p) => ({
      ...p,
      name: translatedContent[`prod.${p.id}.name`] || p.name,
      categoryLabel:
        translatedContent[`prod.${p.id}.catLabel`] || p.categoryLabel,
      subCategory: translatedContent[`prod.${p.id}.subCat`] || p.subCategory,
      shortDescription:
        translatedContent[`prod.${p.id}.short`] || p.shortDescription,
      description: translatedContent[`prod.${p.id}.desc`] || p.description,
      fabric: translatedContent[`prod.${p.id}.fabric`] || p.fabric,
      careNote: translatedContent[`prod.${p.id}.care`] || p.careNote,
      stockStatus: translatedContent[`prod.${p.id}.stock`] || p.stockStatus,
      featuredTag: p.featuredTag
        ? translatedContent[`prod.${p.id}.tag`] || p.featuredTag
        : undefined,
      colors: p.colors.map((c, idx) => ({
        ...c,
        name: translatedContent[`prod.${p.id}.color.${idx}`] || c.name,
      })),
    }));
  }, [selectedLang.code, liveProducts, translatedContent]);

  const localizedQuizzes: QuizPublic[] = useMemo(() => {
    if (selectedLang.code === 'bn') return activeQuizzes;
    return activeQuizzes.map((qz) => ({
      ...qz,
      question: translatedContent[`quiz.${qz.id}.q`] || qz.question,
      rewardTitle: translatedContent[`quiz.${qz.id}.reward`] || qz.rewardTitle,
      options: qz.options.map(
        (opt, idx) => translatedContent[`quiz.${qz.id}.opt.${idx}`] || opt,
      ),
    }));
  }, [selectedLang.code, activeQuizzes, translatedContent]);

  const localizedCategories = useMemo(
    () => [
      { key: 'all' as CategoryKey, label: t.catAll },
      { key: 'saree-threepiece' as CategoryKey, label: t.catSareeThreepiece },
      { key: 'tshirt-pant' as CategoryKey, label: t.catTshirtPant },
      { key: 'apparel-orna' as CategoryKey, label: t.catApparelOrna },
      { key: 'bedsheet' as CategoryKey, label: t.catBedsheet },
    ],
    [t],
  );

  const detailProduct = useMemo(
    () =>
      detailProductId
        ? localizedProducts.find((p) => p.id === detailProductId) || null
        : null,
    [detailProductId, localizedProducts],
  );

  const totalCartCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems],
  );

  const unusedCouponCount = useMemo(
    () => userCoupons.filter((c) => !c.used).length,
    [userCoupons],
  );

  const filteredProducts = useMemo(() => {
    const queryText = searchQuery.trim().toLowerCase();

    const list = localizedProducts.filter((product) => {
      const matchesCategory =
        selectedCategory === 'all' || product.category === selectedCategory;

      if (!matchesCategory) return false;
      if (!queryText) return true;

      const searchable = [
        product.name,
        product.categoryLabel,
        product.subCategory,
        product.shortDescription,
        product.fabric,
        product.englishKeywords,
      ]
        .join(' ')
        .toLowerCase();

      return searchable.includes(queryText);
    });

    if (sortOrder === 'price-asc') {
      return [...list].sort((a, b) => a.price - b.price);
    }
    if (sortOrder === 'price-desc') {
      return [...list].sort((a, b) => b.price - a.price);
    }
    return list;
  }, [localizedProducts, selectedCategory, searchQuery, sortOrder]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? '' : prev));
    }, 2600);
  };

  const handleAddToCart = (
    product: Product,
    size: string,
    color: ProductColor,
    quantity: number,
  ) => {
    const key = `${product.id}__${size}__${color.name}`;
    setCartItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.key === key);
      if (existingIndex !== -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: Math.min(20, updated[existingIndex].quantity + quantity),
        };
        return updated;
      }
      return [
        ...prev,
        {
          key,
          product,
          selectedSize: size,
          selectedColor: color,
          quantity,
        },
      ];
    });
    showToast(`"${product.name}" ${t.addedToastSuffix}`);
  };

  const handleAddAndOpenCart = (
    product: Product,
    size: string,
    color: ProductColor,
    quantity: number,
  ) => {
    handleAddToCart(product, size, color, quantity);
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (key: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.key === key
            ? { ...item, quantity: Math.max(0, Math.min(20, item.quantity + delta)) }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const handleRemoveItem = (key: string) => {
    setCartItems((prev) => prev.filter((item) => item.key !== key));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSelectCategoryJump = (category: CategoryKey) => {
    setSelectedCategory(category);
    scrollToSection('catalog');
  };

  const themeStyle = useMemo(
    () => getThemeStyleVars(activeDesign),
    [activeDesign],
  );

  const isRtl = isRtlLanguage(selectedLang.code) || isRtlLanguage(selectedLang.promptName);

  return (
    <div
      id="top"
      lang={selectedLang.code.startsWith('custom-') ? undefined : selectedLang.code}
      dir={isRtl ? 'rtl' : 'ltr'}
      style={themeStyle}
      className="min-h-screen flex flex-col transition-colors duration-200"
    >
      {/* Top Luxury Moving Announcement Banner + Language Switcher */}
      <LuxuryMarqueeBanner
        bannerEnabled={localizedDesign.bannerEnabled}
        messages={localizedDesign.bannerMessages}
        speed={localizedDesign.bannerSpeed}
        accentColor={localizedDesign.accentColor}
        currentLangCode={selectedLang.code}
        currentLangLabel={selectedLang.nativeLabel}
        isTranslating={isTranslating}
        translatingLabel={t.translatingLabel}
        customPlaceholder={t.customLanguagePlaceholder}
        applyLabel={t.applyLanguage}
        onSelectLanguage={(opt) => setSelectedLang(opt)}
      />

      {/* Strict 3-Zone Header */}
      <Header
        storeName={localizedDesign.storeName}
        cartCount={totalCartCount}
        unusedCouponCount={unusedCouponCount}
        isLoggedIn={Boolean(user && user.emailVerified)}
        langCode={selectedLang.code}
        t={t}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenProfile={() => {
          setProfileInitialTab('profile');
          setIsProfileOpen(true);
        }}
        onSelectCategoryJump={handleSelectCategoryJump}
        onJumpToAdvisor={() => scrollToSection('style-advisor')}
      />

      <main className="flex-1">
        {/* Section 1: Luxury Editorial Hero Showcase */}
        <section
          className="border-b"
          style={{
            background: 'var(--brand-hero-bg)',
            borderColor: 'var(--brand-border, #D9CDB8)',
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
              <div className="lg:col-span-5 flex flex-col justify-center py-2">
                <p
                  className="text-xs font-semibold tracking-wider mb-3"
                  style={{ color: 'var(--brand-gold, #A67C33)' }}
                >
                  {localizedDesign.heroEyebrow}
                </p>
                <h1
                  className="font-display text-3xl sm:text-4xl lg:text-[46px] font-bold leading-[1.18] mb-4 text-balance"
                  style={{ color: 'var(--brand-ink, #1C1917)' }}
                >
                  {localizedDesign.heroTitle}
                </h1>
                <p
                  className="text-base leading-relaxed mb-7 max-w-lg"
                  style={{ color: 'var(--brand-muted, #57534E)' }}
                >
                  {localizedDesign.heroSubtitle}
                </p>

                <div className="flex flex-wrap items-center gap-3.5">
                  <button
                    type="button"
                    onClick={() => scrollToSection('catalog')}
                    style={{
                      backgroundColor: 'var(--brand-accent, #7A1C32)',
                      color: 'var(--brand-accent-ink, #FFFFFF)',
                    }}
                    className="inline-flex items-center gap-2 px-6 py-3 min-h-[44px] hover:opacity-90 text-sm font-semibold rounded-lg transition-opacity whitespace-nowrap cursor-pointer"
                  >
                    <span>{t.exploreCollection}</span>
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollToSection('style-advisor')}
                    style={{
                      backgroundColor: 'var(--brand-card, #FAF6EE)',
                      color: 'var(--brand-ink, #1C1917)',
                      borderColor: 'var(--brand-border, #D9CDB8)',
                    }}
                    className="inline-flex items-center px-5 py-3 min-h-[44px] border hover:opacity-85 text-sm font-medium rounded-lg transition-opacity whitespace-nowrap cursor-pointer"
                  >
                    {t.getStyleAdvice}
                  </button>
                </div>
              </div>

              <div className="lg:col-span-7">
                <div
                  style={{
                    backgroundColor: 'var(--brand-card-alt, #EFE6D8)',
                    borderColor: 'var(--brand-gold, #A67C33)',
                  }}
                  className="aspect-[16/9] lg:h-full w-full rounded-xl overflow-hidden border shadow-sm"
                >
                  <ResilientImage
                    src={localizedDesign.heroImage}
                    alt={localizedDesign.storeName}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Full-width 4-column Luxury Service Strip below Hero */}
            <div
              className="mt-10 pt-6 border-t grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 text-sm"
              style={{ borderColor: 'var(--brand-border, #D9CDB8)' }}
            >
              <div>
                <p className="font-semibold">{t.promise1Title}</p>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: 'var(--brand-muted, #57534E)' }}
                >
                  {t.promise1Desc}
                </p>
              </div>
              <div>
                <p className="font-semibold">{t.promise2Title}</p>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: 'var(--brand-muted, #57534E)' }}
                >
                  {t.promise2Desc}
                </p>
              </div>
              <div>
                <p className="font-semibold">{t.promise3Title}</p>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: 'var(--brand-muted, #57534E)' }}
                >
                  {t.promise3Desc}
                </p>
              </div>
              <div>
                <p className="font-semibold">{t.promise4Title}</p>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: 'var(--brand-muted, #57534E)' }}
                >
                  {t.promise4Desc}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Luxury Product Catalog & Filters */}
        <section id="catalog" className="py-14 lg:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Catalog Header + Search + Sort (Admin button kept hidden from public shoppers) */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
              <div>
                <h2 className="font-display text-2xl sm:text-3xl font-bold mb-1.5">
                  {t.catalogTitle}
                </h2>
                <p
                  className="text-sm tabular-nums"
                  style={{ color: 'var(--brand-muted, #57534E)' }}
                >
                  {t.catalogCountPrefix}{' '}
                  {formatCount(filteredProducts.length, selectedLang.code)}{' '}
                  {t.catalogCountSuffix}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                {/* Search Input */}
                <div className="relative flex-1 sm:w-64">
                  <Search
                    className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: 'var(--brand-muted, #57534E)' }}
                  />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t.searchPlaceholder}
                    aria-label={t.searchPlaceholder}
                    style={{
                      backgroundColor: 'var(--brand-card, #FAF6EE)',
                      borderColor: 'var(--brand-border, #D9CDB8)',
                      color: 'var(--brand-ink, #1C1917)',
                    }}
                    className="w-full pl-10 pr-9 py-2.5 min-h-[42px] text-sm border rounded-lg focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      aria-label="Clear search"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 opacity-70 hover:opacity-100 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Sort Select */}
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                  aria-label="Sort products"
                  style={{
                    backgroundColor: 'var(--brand-card, #FAF6EE)',
                    borderColor: 'var(--brand-border, #D9CDB8)',
                    color: 'var(--brand-ink, #1C1917)',
                  }}
                  className="px-3.5 py-2.5 min-h-[42px] text-sm border rounded-lg focus:outline-none cursor-pointer"
                >
                  <option value="featured">{t.sortFeatured}</option>
                  <option value="price-asc">{t.sortPriceAsc}</option>
                  <option value="price-desc">{t.sortPriceDesc}</option>
                </select>
              </div>
            </div>

            {/* Category Segmented Filter Tabs */}
            <div
              role="tablist"
              aria-label="Category filter"
              style={{ borderColor: 'var(--brand-border, #D9CDB8)' }}
              className="flex flex-wrap items-center gap-2 mb-8 pb-4 border-b"
            >
              {localizedCategories.map((cat) => {
                const isActive = selectedCategory === cat.key;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setSelectedCategory(cat.key)}
                    style={
                      isActive
                        ? {
                            backgroundColor: 'var(--brand-accent, #7A1C32)',
                            color: 'var(--brand-accent-ink, #FFFFFF)',
                            borderColor: 'var(--brand-accent, #7A1C32)',
                          }
                        : {
                            backgroundColor: 'var(--brand-card, #FAF6EE)',
                            color: 'var(--brand-muted, #57534E)',
                            borderColor: 'var(--brand-border, #D9CDB8)',
                          }
                    }
                    className="px-4 py-2 min-h-[40px] text-sm font-medium border rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            {/* Product Grid */}
            {filteredProducts.length === 0 ? (
              <div
                style={{
                  backgroundColor: 'var(--brand-card, #FAF6EE)',
                  borderColor: 'var(--brand-border, #D9CDB8)',
                }}
                className="py-16 text-center border rounded-xl"
              >
                <p className="font-display text-lg font-semibold mb-2">
                  {t.emptyTitle}
                </p>
                <p
                  className="text-sm mb-5"
                  style={{ color: 'var(--brand-muted, #57534E)' }}
                >
                  {t.emptySubtitle}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('all');
                    setSearchQuery('');
                  }}
                  style={{
                    backgroundColor: 'var(--brand-accent, #7A1C32)',
                    color: 'var(--brand-accent-ink, #FFFFFF)',
                  }}
                  className="px-5 py-2.5 min-h-[42px] text-sm font-medium rounded-lg transition-opacity hover:opacity-90 cursor-pointer"
                >
                  {t.viewAllProducts}
                </button>
              </div>
            ) : (
              <div
                className={`grid gap-7 ${
                  GRID_COLUMNS_CLASS[activeDesign.gridColumns] ||
                  GRID_COLUMNS_CLASS[3]
                }`}
              >
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    cardRadius={activeDesign.cardRadius}
                    imageRatio={activeDesign.cardImageRatio}
                    langCode={selectedLang.code}
                    t={t}
                    onAddToCart={handleAddToCart}
                    onViewDetails={(p) => setDetailProductId(p.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Section 3: Member Profile & Quiz Rewards Showcase */}
        <section
          className="py-12 border-t"
          style={{
            borderColor: 'var(--brand-border, #D9CDB8)',
            backgroundColor: 'var(--brand-card-alt, #EFE6D8)',
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div
              style={{
                backgroundColor: 'var(--brand-card, #FAF6EE)',
                borderColor: 'var(--brand-gold, #A67C33)',
              }}
              className="rounded-xl border p-6 sm:p-8 lg:p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-sm"
            >
              <div className="max-w-2xl">
                <p
                  className="text-xs font-semibold tracking-wider mb-2 flex items-center gap-1.5"
                  style={{ color: 'var(--brand-gold, #A67C33)' }}
                >
                  <Award className="w-4 h-4 shrink-0" />
                  <span>{t.quizBannerEyebrow}</span>
                </p>
                <h2 className="font-display text-2xl sm:text-3xl font-bold mb-2.5 leading-snug">
                  {t.quizBannerTitle}
                </h2>
                <p
                  className="text-sm sm:text-base leading-relaxed"
                  style={{ color: 'var(--brand-muted, #57534E)' }}
                >
                  {t.quizBannerDesc}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setProfileInitialTab('quizzes');
                    setIsProfileOpen(true);
                  }}
                  style={{
                    backgroundColor: 'var(--brand-accent, #7A1C32)',
                    color: 'var(--brand-accent-ink, #FFFFFF)',
                  }}
                  className="inline-flex items-center gap-2 px-5 py-3 min-h-[44px] hover:opacity-90 text-sm font-semibold rounded-lg transition-opacity whitespace-nowrap cursor-pointer"
                >
                  <Award className="w-4 h-4 shrink-0" />
                  <span>{t.quizBannerCta}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProfileInitialTab('profile');
                    setIsProfileOpen(true);
                  }}
                  style={{
                    backgroundColor: 'var(--brand-canvas, #F3ECE1)',
                    color: 'var(--brand-ink, #1C1917)',
                    borderColor: 'var(--brand-border, #D9CDB8)',
                  }}
                  className="inline-flex items-center gap-2 px-5 py-3 min-h-[44px] border hover:opacity-85 text-sm font-medium rounded-lg transition-opacity whitespace-nowrap cursor-pointer"
                >
                  <UserIcon className="w-4 h-4 shrink-0" />
                  <span>{t.profileBtn}</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: AI Style & Outfit Advisor */}
        <StyleAdvisorSection
          products={localizedProducts}
          langCode={selectedLang.code}
          langPromptName={selectedLang.promptName}
          t={t}
          onViewDetails={(p) => setDetailProductId(p.id)}
          onAddToCart={handleAddToCart}
        />
      </main>

      <Footer
        storeName={localizedDesign.storeName}
        storeAddress={localizedDesign.storeAddress}
        storePhone={localizedDesign.storePhone}
        storeEmail={localizedDesign.storeEmail}
        t={t}
        onSelectCategoryJump={handleSelectCategoryJump}
      />

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={detailProduct}
        langCode={selectedLang.code}
        t={t}
        onClose={() => setDetailProductId(null)}
        onAddToCart={handleAddToCart}
        onAddAndOpenCart={handleAddAndOpenCart}
      />

      {/* Cart & Checkout Slide-over Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        items={cartItems}
        langCode={selectedLang.code}
        t={t}
        user={user}
        userProfile={userProfile}
        userCoupons={userCoupons}
        onOpenProfile={(tab) => {
          setProfileInitialTab(tab || 'profile');
          setIsCartOpen(false);
          setIsProfileOpen(true);
        }}
        onClose={() => setIsCartOpen(false)}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
      />

      {/* Customer Profile, Quiz & Coupon Wallet Drawer (also houses Admin access strictly for verified owner) */}
      <CustomerProfileDrawer
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={user}
        isAdmin={isAdmin}
        profile={userProfile}
        quizzes={localizedQuizzes}
        coupons={userCoupons}
        orders={userOrders}
        langCode={selectedLang.code}
        initialTab={profileInitialTab}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAdminStudio={() => setIsAdminOpen(true)}
      />

      {/* Owner-only Admin Studio Drawer: only accessible from inside verified Admin Profile */}
      {user && isAdmin && (
        <AdminPanelDrawer
          isOpen={isAdminOpen}
          onClose={() => setIsAdminOpen(false)}
          user={user}
          isAdmin={isAdmin}
          products={adminProducts}
          publishedDesign={publishedDesign}
          draftDesign={draftDesign}
          orders={orders}
          quizzes={adminQuizzes}
          onPreviewDesign={setPreviewDesign}
          onBackToProfile={() => {
            setIsAdminOpen(false);
            setProfileInitialTab('profile');
            setIsProfileOpen(true);
          }}
        />
      )}

      {/* Subtle Cart Feedback Toast */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-40 flex items-center gap-3 px-4 py-3 bg-[#171310] text-[#F5EFE6] text-sm rounded-lg shadow-lg border border-[#D4AF37]/30"
        >
          <Check className="w-4 h-4 text-[#86EFAC] shrink-0" />
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="text-xs font-semibold underline underline-offset-4 text-[#D4AF37] hover:text-white whitespace-nowrap cursor-pointer"
          >
            {t.viewCart}
          </button>
        </div>
      )}
    </div>
  );
}
