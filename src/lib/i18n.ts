export interface LanguageOption {
  code: string;
  label: string;
  nativeLabel: string;
  promptName: string;
  rtl?: boolean;
}

export const PRESET_LANGUAGES: LanguageOption[] = [
  { code: 'bn', label: 'Bengali', nativeLabel: 'বাংলা', promptName: 'Bengali' },
  { code: 'en', label: 'English', nativeLabel: 'English', promptName: 'English' },
  { code: 'ar', label: 'Arabic', nativeLabel: 'العربية', promptName: 'Arabic', rtl: true },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी', promptName: 'Hindi' },
  { code: 'ur', label: 'Urdu', nativeLabel: 'اردو', promptName: 'Urdu', rtl: true },
  { code: 'fr', label: 'French', nativeLabel: 'Français', promptName: 'French' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español', promptName: 'Spanish' },
  { code: 'de', label: 'German', nativeLabel: 'Deutsch', promptName: 'German' },
  { code: 'it', label: 'Italian', nativeLabel: 'Italiano', promptName: 'Italian' },
  { code: 'tr', label: 'Turkish', nativeLabel: 'Türkçe', promptName: 'Turkish' },
  { code: 'ms', label: 'Malay', nativeLabel: 'Bahasa Melayu', promptName: 'Malay' },
  { code: 'ja', label: 'Japanese', nativeLabel: '日本語', promptName: 'Japanese' },
  { code: 'zh', label: 'Chinese', nativeLabel: '中文', promptName: 'Simplified Chinese' },
  { code: 'ko', label: 'Korean', nativeLabel: '한국어', promptName: 'Korean' },
];

export const UI_STRINGS_BN = {
  navAll: 'সব সংগ্রহ',
  navSaree: 'শাড়ি ও থ্রি-পিস',
  navTshirt: 'টি-শার্ট ও প্যান্ট',
  navAdvisor: 'স্টাইল পরামর্শক',
  cart: 'কার্ট',
  exploreCollection: 'সংগ্রহ দেখুন',
  getStyleAdvice: 'স্টাইল পরামর্শ নিন',
  promise1Title: 'সারা দেশে হোম ডেলিভারি',
  promise1Desc: 'ঢাকায় ২৪–৪৮ ঘণ্টা, বাইরে ২–৪ দিন',
  promise2Title: 'ক্যাশ অন ডেলিভারি',
  promise2Desc: 'পণ্য হাতে পেয়ে মূল্য পরিশোধের সুবিধা',
  promise3Title: '৭ দিনের সহজ এক্সচেঞ্জ',
  promise3Desc: 'সাইজ বা ত্রুটিতে ঝামেলামুক্ত পরিবর্তন',
  promise4Title: 'খাঁটি সুতি ও তাঁতের মান',
  promise4Desc: 'যাচাইকৃত ফেব্রিক ও রঙ-পাকা গ্যারান্টি',
  catalogTitle: 'আমাদের লাক্সারি পণ্য সংগ্রহ',
  catalogCountPrefix: 'মোট',
  catalogCountSuffix: 'টি পণ্য প্রদর্শিত হচ্ছে',
  searchPlaceholder: 'শাড়ি, টি-শার্ট, প্যান্ট বা বেডশিট খুঁজুন...',
  sortFeatured: 'সাজানো: জনপ্রিয়',
  sortPriceAsc: 'মূল্য: কম থেকে বেশি',
  sortPriceDesc: 'মূল্য: বেশি থেকে কম',
  catAll: 'সব পণ্য',
  catSareeThreepiece: 'শাড়ি ও থ্রি-পিস',
  catTshirtPant: 'টি-শার্ট ও প্যান্ট',
  catApparelOrna: 'পোশাক ও ওড়না',
  catBedsheet: 'বেডশিট',
  emptyTitle: 'দুঃখিত, এই মুহূর্তে কোনো পণ্য পাওয়া যায়নি',
  emptySubtitle: 'অন্য ক্যাটাগরি নির্বাচন করুন অথবা সার্চ শব্দটি পরিবর্তন করে দেখুন।',
  viewAllProducts: 'সব পণ্য দেখুন',
  addToCart: 'কার্টে যোগ করুন',
  addedToCart: 'যোগ হয়েছে',
  viewDetails: 'বিস্তারিত দেখুন',
  sizesWord: 'সাইজ',
  standardSize: 'স্ট্যান্ডার্ড',
  fabricLabel: 'কাপড়ের ধরন',
  careLabel: 'যত্ন ও ধোয়া',
  colorSelect: 'রঙ নির্বাচন',
  sizeSelect: 'সাইজ নির্বাচন',
  orderNow: 'এখনই অর্ডার করুন (কার্ট ও চেকআউট)',
  addedToastSuffix: 'কার্টে যোগ হয়েছে',
  viewCart: 'কার্ট দেখুন',
  advisorEyebrow: 'এআই স্টাইল ও পোশাক পরামর্শক',
  advisorHeading: 'আপনার উপলক্ষ ও বাজেট অনুযায়ী সঠিক পোশাক বেছে নিন',
  advisorSubheading:
    'উপলক্ষ, বাজেট এবং পছন্দের ধরন লিখুন—আমাদের স্মার্ট পরামর্শক মল্লিকা ফ্যাশন হাউসের লাইভ সংগ্রহ থেকে মানানসই পোশাক ও স্টাইলিং টিপস তৈরি করে দেবে।',
  advisorSamplesLabel: 'দ্রুত নমুনা বেছে নিন:',
  advisorOccasionLabel: 'উপলক্ষ বা ব্যবহারের ধরন',
  advisorOccasionPlaceholder: 'যেমন: ঈদ দাওয়াত, অফিস, বা ক্যাজুয়াল ভ্রমণ',
  advisorBudgetLabel: 'বাজেট (টাকায়)',
  advisorBudgetPlaceholder: 'যেমন: ২,০০০ – ৩,৫০০ টাকা',
  advisorPrefLabel: 'পছন্দের পোশাক, রঙ বা কাপড়',
  advisorPrefPlaceholder: 'যেমন: গরমে পরার জন্য হালকা সুতি কাপড়, বা মায়ের জন্য উপহারের শাড়ি',
  advisorSubmit: 'স্টাইল পরামর্শ দেখুন',
  advisorLoading: 'সাজেশন তৈরি হচ্ছে...',
  advisorLoadingTitle: 'আপনার চাহিদা অনুযায়ী ক্যাটালগ বিশ্লেষণ করা হচ্ছে...',
  advisorLoadingSub: 'কয়েক সেকেন্ডের মধ্যে উপযুক্ত পোশাক ও টিপস দেখতে পাবেন।',
  advisorResultTitle: 'আপনার জন্য ব্যক্তিগত স্টাইল পরামর্শ',
  advisorTipsTitle: 'সহায়ক স্টাইলিং টিপস',
  advisorRecTitle: 'সুপারিশকৃত পোশাক',
  advisorEmptyTitle: 'আপনার স্টাইল পরামর্শ এখানে দেখানো হবে',
  advisorEmptyDesc:
    'বাঁ পাশের ফর্মে উপলক্ষ ও বাজেট লিখুন অথবা ওপরের যেকোনো একটি নমুনা বেছে নিয়ে “স্টাইল পরামর্শ দেখুন” বাটনে ক্লিক করুন।',
  cartTitle: 'আপনার শপিং কার্ট',
  checkoutTitle: 'ডেলিভারি তথ্য ও চেকআউট',
  confirmTitle: 'অর্ডার কনফার্মেশন',
  cartEmptyTitle: 'আপনার কার্ট এখনো খালি',
  cartEmptyDesc: 'পছন্দের শাড়ি, থ্রি-পিস, টি-শার্ট বা বেডশিট কার্টে যোগ করে সহজেই অর্ডার করতে পারবেন।',
  freeDeliveryCongrats: 'অভিনন্দন! এই অর্ডারে আপনি ফ্রি হোম ডেলিভারি পাচ্ছেন।',
  freeDeliveryAddPrefix: 'আরো',
  freeDeliveryAddSuffix: 'মূল্যের পণ্য যোগ করলে ডেলিভারি চার্জ সম্পূর্ণ ফ্রি!',
  subtotal: 'উপমোট',
  deliveryCharge: 'ডেলিভারি চার্জ',
  totalBill: 'মোট বিল',
  freeWord: 'ফ্রি',
  insideDhaka: 'ঢাকার ভেতরে',
  outsideDhaka: 'ঢাকার বাইরে',
  proceedCheckout: 'অর্ডার করতে এগিয়ে যান',
  confirmOrder: 'অর্ডার কনফার্ম করুন',
  processingOrder: 'অর্ডার প্রসেস হচ্ছে...',
  continueShopping: 'কেনাকাটা চালিয়ে যান',
  customerNameLabel: 'ক্রেতার পূর্ণ নাম',
  customerNamePlaceholder: 'যেমন: তানভীর আহমেদ',
  phoneLabel: 'মোবাইল নম্বর',
  deliveryAreaLabel: 'ডেলিভারি এলাকা',
  addressLabel: 'সম্পূর্ণ ডেলিভারি ঠিকানা',
  addressPlaceholder: 'বাসা/ফ্ল্যাট নং, রোড, এলাকা ও জেলার নাম লিখুন',
  deliveryNoteLabel: 'ডেলিভারি নোট (ঐচ্ছিক)',
  deliveryNotePlaceholder: 'যেমন: বিকেল ৪টার পর ডেলিভারি দিলে ভালো হয়',
  paymentMethodLabel: 'পেমেন্ট মাধ্যম:',
  codFullLabel: 'ক্যাশ অন ডেলিভারি (পণ্য হাতে পেয়ে মূল্য পরিশোধ)',
  orderSuccessHeading: 'ধন্যবাদ! আপনার অর্ডারটি সফলভাবে গৃহীত হয়েছে',
  orderNoLabel: 'অর্ডার নম্বর:',
  orderItemsTitle: 'অর্ডারকৃত পণ্যের তালিকা',
  totalPayable: 'সর্বমোট পরিশোধযোগ্য',
  footerTagline: 'দেশীয় তাঁত, খাঁটি সুতি এবং অভিজাত বনেদি ডিজাইনের বিশ্বস্ত আতেলিয়ার।',
  footerAddress: 'বাড়ি ২৪, রোড ১১, বনানী, ঢাকা-১২১৩',
  footerHours: '+৮৮০ ১৭১১-০০৪৪৫৫ (সকাল ১০টা – রাত ৯টা)',
  footerDeliveryHeading: 'ডেলিভারি ও রিটার্ন নীতিমালা',
  footerDeliveryNote:
    'ঢাকার ভেতরে ২৪–৪৮ ঘণ্টায় হোম ডেলিভারি (চার্জ ৳ ৭০) এবং ঢাকার বাইরে ২–৪ কার্যদিবসে ডেলিভারি (চার্জ ৳ ১৩০)। ৳ ২,৫০০+ অর্ডারে ডেলিভারি সম্পূর্ণ ফ্রি।',
  footerReturnNote:
    'পণ্য হাতে পেয়ে কোনো ত্রুটি বা সাইজ পরিবর্তনের প্রয়োজন হলে ডেলিভারির ৭ দিনের মধ্যে অব্যবহৃত অবস্থায় সহজেই রিটার্ন বা এক্সচেঞ্জ করতে পারবেন।',
  footerQuickCategories: 'দ্রুত ক্যাটাগরি',
  footerCatApparel: 'ছেলেদের ও মেয়েদের পোশাক ও ওড়না',
  footerCatBedsheet: 'খাঁটি সুতি বেডশিট',
  footerCopyrightSuffix: 'সর্বস্বত্ব সংরক্ষিত।',
  footerBottomTagline: 'ক্যাশ অন ডেলিভারি সুবিধা · নির্ভরযোগ্য দেশীয় বস্ত্র সংগ্রহ',
  languageLabel: 'ভাষা',
  translatingLabel: 'অনুবাদ হচ্ছে...',
  customLanguagePlaceholder: 'যেকোনো ভাষার নাম লিখুন (যেমন: Portuguese)',
  applyLanguage: 'অনুবাদ করুন',
  adminPanelButton: 'অ্যাডমিন প্যানেল',
  adminStudioActive: 'অ্যাডমিন স্টুডিও (সক্রিয়)',
  profileBtn: 'প্রোফাইল ও কুইজ',
  profileShort: 'প্রোফাইল',
  quizBannerEyebrow: 'সদস্য সুবিধা ও কুইজ পুরস্কার',
  quizBannerTitle: 'নিজের প্রোফাইল তৈরি করুন এবং কুইজ খেলে জিতে নিন ডিসকাউন্ট কুপন',
  quizBannerDesc:
    'একবার ঠিকানা সেভ রাখলে পরবর্তীতে ১ ক্লিকেই দ্রুত অর্ডার করতে পারবেন। পাশাপাশি মল্লিকা ফ্যাশন হাউসের মজার কুইজের সঠিক উত্তর দিয়ে পান তাৎক্ষণিক ডিসকাউন্ট কুপন।',
  quizBannerCta: 'প্রোফাইল ও কুইজ খুলুন',
  couponDiscountLabel: 'কুপন ছাড়',
} as const;

export type UITranslationKeys = Record<keyof typeof UI_STRINGS_BN, string>;

export const UI_STRINGS_EN: UITranslationKeys = {
  navAll: 'Collection',
  navSaree: 'Saree & 3-Piece',
  navTshirt: 'Tees & Pants',
  navAdvisor: 'Style Concierge',
  cart: 'Bag',
  exploreCollection: 'Explore Collection',
  getStyleAdvice: 'Style Concierge',
  promise1Title: 'Nationwide Delivery',
  promise1Desc: '24–48 hrs in Dhaka, 2–4 days nationwide',
  promise2Title: 'Cash on Delivery',
  promise2Desc: 'Inspect and pay comfortably at your doorstep',
  promise3Title: '7-Day Easy Exchange',
  promise3Desc: 'Hassle-free size or defect replacement',
  promise4Title: 'Authentic Handloom & Cotton',
  promise4Desc: 'Verified fabrics & colorfast craftsmanship',
  catalogTitle: 'Our Luxury Collection',
  catalogCountPrefix: 'Showing',
  catalogCountSuffix: 'curated pieces',
  searchPlaceholder: 'Search saree, t-shirt, pant, or bedsheet...',
  sortFeatured: 'Sort: Featured',
  sortPriceAsc: 'Price: Low to High',
  sortPriceDesc: 'Price: High to Low',
  catAll: 'All Pieces',
  catSareeThreepiece: 'Saree & 3-Piece',
  catTshirtPant: 'T-Shirts & Pants',
  catApparelOrna: 'Apparel & Orna',
  catBedsheet: 'Bedsheets',
  emptyTitle: 'No matching pieces found',
  emptySubtitle: 'Select another category or try adjusting your search terms.',
  viewAllProducts: 'View All Pieces',
  addToCart: 'Add to Bag',
  addedToCart: 'Added',
  viewDetails: 'View Details',
  sizesWord: 'sizes',
  standardSize: 'Standard',
  fabricLabel: 'Fabric Composition',
  careLabel: 'Care & Washing',
  colorSelect: 'Select Color',
  sizeSelect: 'Select Size',
  orderNow: 'Order Now (Bag & Checkout)',
  addedToastSuffix: 'added to your bag',
  viewCart: 'View Bag',
  advisorEyebrow: 'AI Style & Wardrobe Concierge',
  advisorHeading: 'Curate the ideal ensemble for your occasion and budget',
  advisorSubheading:
    'Share your occasion, budget, and preferred aesthetic—our AI concierge selects harmonious pieces and styling tips from our live boutique catalog.',
  advisorSamplesLabel: 'Quick inspirations:',
  advisorOccasionLabel: 'Occasion or Setting',
  advisorOccasionPlaceholder: 'e.g. Eid celebration, formal dinner, or daily wear',
  advisorBudgetLabel: 'Budget (BDT)',
  advisorBudgetPlaceholder: 'e.g. 2,000 – 3,500 BDT',
  advisorPrefLabel: 'Preferred Silhouette, Hue or Fabric',
  advisorPrefPlaceholder: 'e.g. breathable pure cotton for summer or a festive jamdani gift',
  advisorSubmit: 'Get Style Advice',
  advisorLoading: 'Curating recommendations...',
  advisorLoadingTitle: 'Analyzing our boutique catalog for your preferences...',
  advisorLoadingSub: 'Your bespoke styling guide will appear in a few moments.',
  advisorResultTitle: 'Your Personal Style Recommendation',
  advisorTipsTitle: 'Bespoke Styling Notes',
  advisorRecTitle: 'Recommended Pieces',
  advisorEmptyTitle: 'Your personalized curation appears here',
  advisorEmptyDesc:
    'Enter your occasion and budget on the left, or pick a quick inspiration and click “Get Style Advice”.',
  cartTitle: 'Your Shopping Bag',
  checkoutTitle: 'Delivery & Checkout',
  confirmTitle: 'Order Confirmation',
  cartEmptyTitle: 'Your shopping bag is currently empty',
  cartEmptyDesc: 'Add your favorite sarees, 3-piece sets, apparel, or bedsheets to place an order.',
  freeDeliveryCongrats: 'Complimentary nationwide home delivery unlocked!',
  freeDeliveryAddPrefix: 'Add',
  freeDeliveryAddSuffix: 'more to unlock complimentary delivery!',
  subtotal: 'Subtotal',
  deliveryCharge: 'Delivery Charge',
  totalBill: 'Total Amount',
  freeWord: 'Free',
  insideDhaka: 'Inside Dhaka',
  outsideDhaka: 'Outside Dhaka',
  proceedCheckout: 'Proceed to Checkout',
  confirmOrder: 'Confirm Order',
  processingOrder: 'Processing Order...',
  continueShopping: 'Continue Shopping',
  customerNameLabel: 'Full Name',
  customerNamePlaceholder: 'e.g. Tanvir Ahmed',
  phoneLabel: 'Mobile Number',
  deliveryAreaLabel: 'Delivery Area',
  addressLabel: 'Complete Delivery Address',
  addressPlaceholder: 'House/Flat no., road, neighborhood & district',
  deliveryNoteLabel: 'Delivery Note (Optional)',
  deliveryNotePlaceholder: 'e.g. Please deliver after 4:00 PM',
  paymentMethodLabel: 'Payment Method:',
  codFullLabel: 'Cash on Delivery (Pay upon receiving)',
  orderSuccessHeading: 'Thank you! Your order has been confirmed',
  orderNoLabel: 'Order ID:',
  orderItemsTitle: 'Ordered Items',
  totalPayable: 'Total Payable',
  footerTagline: 'A trusted luxury atelier for heritage Bengali handloom, pure cotton, and modern tailoring.',
  footerAddress: 'House 24, Road 11, Banani, Dhaka-1213',
  footerHours: '+880 1711-004455 (10:00 AM – 9:00 PM)',
  footerDeliveryHeading: 'Delivery & Return Policy',
  footerDeliveryNote:
    'Inside Dhaka home delivery within 24–48 hrs (৳ 70) and nationwide within 2–4 business days (৳ 130). Complimentary delivery on orders ৳ 2,500+.',
  footerReturnNote:
    'Enjoy hassle-free returns or size exchanges within 7 days of delivery for unused items.',
  footerQuickCategories: 'Quick Categories',
  footerCatApparel: 'Men’s & Women’s Apparel & Orna',
  footerCatBedsheet: 'Pure Cotton Bedsheets',
  footerCopyrightSuffix: 'All rights reserved.',
  footerBottomTagline: 'Cash on Delivery · Heritage Bengali Craftsmanship',
  languageLabel: 'Language',
  translatingLabel: 'Translating...',
  customLanguagePlaceholder: 'Type any language (e.g. Portuguese)',
  applyLanguage: 'Translate',
  adminPanelButton: 'Admin Panel',
  adminStudioActive: 'Admin Studio (Active)',
  profileBtn: 'Profile & Quiz',
  profileShort: 'Profile',
  quizBannerEyebrow: 'Member Perks & Quiz Rewards',
  quizBannerTitle: 'Create your profile & answer quizzes to unlock instant discount coupons',
  quizBannerDesc:
    'Save your delivery details once for effortless 1-click checkout on future orders, and earn verified discount coupons by answering boutique quizzes.',
  quizBannerCta: 'Open Profile & Quiz',
  couponDiscountLabel: 'Coupon Discount',
};

const MEMORY_CACHE = new Map<string, Record<string, string>>();

function simpleHash(input: string): string {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

export function isRtlLanguage(langCodeOrName: string): boolean {
  const lower = langCodeOrName.trim().toLowerCase();
  return (
    lower === 'ar' ||
    lower === 'ur' ||
    lower === 'fa' ||
    lower === 'he' ||
    lower.includes('arabic') ||
    lower.includes('urdu') ||
    lower.includes('persian') ||
    lower.includes('hebrew') ||
    lower.includes('আরবি') ||
    lower.includes('উর্দু')
  );
}

export async function translateStringsBatch(
  targetLanguagePromptName: string,
  stringsMap: Record<string, string>,
): Promise<Record<string, string>> {
  const entries = Object.entries(stringsMap).filter(
    ([, val]) => typeof val === 'string' && val.trim().length > 0,
  );
  if (entries.length === 0) return {};

  const cacheKey = `${targetLanguagePromptName.toLowerCase()}::${simpleHash(
    JSON.stringify(entries),
  )}`;

  const cachedMem = MEMORY_CACHE.get(cacheKey);
  if (cachedMem) return cachedMem;

  try {
    const rawStored = window.sessionStorage.getItem(`mfh_i18n_${cacheKey}`);
    if (rawStored) {
      const parsed = JSON.parse(rawStored) as Record<string, string>;
      MEMORY_CACHE.set(cacheKey, parsed);
      return parsed;
    }
  } catch {
    // Ignore storage quota / privacy errors
  }

  // Chunk into batches of up to 120 keys so large catalogs translate reliably
  const mergedResult: Record<string, string> = {};
  const chunkSize = 120;

  for (let i = 0; i < entries.length; i += chunkSize) {
    const chunkObj: Record<string, string> = {};
    for (const [k, v] of entries.slice(i, i + chunkSize)) {
      chunkObj[k] = v;
    }

    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetLanguage: targetLanguagePromptName,
        strings: chunkObj,
      }),
    });

    if (!res.ok) {
      const errData = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(errData.error || 'Translation service unavailable');
    }

    const data = (await res.json()) as { translations?: Record<string, string> };
    if (data.translations && typeof data.translations === 'object') {
      Object.assign(mergedResult, data.translations);
    }
  }

  MEMORY_CACHE.set(cacheKey, mergedResult);
  try {
    window.sessionStorage.setItem(
      `mfh_i18n_${cacheKey}`,
      JSON.stringify(mergedResult),
    );
  } catch {
    // Ignore storage errors
  }

  return mergedResult;
}
