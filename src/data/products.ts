import type {
  CategoryKey,
  Product,
  StoreDesignSettings,
} from '../types/store.ts';

export const HERO_IMAGE = '/src/assets/images/hero_mallika_editorial_1795259357572.jpg';

export const DEFAULT_DESIGN_SETTINGS: StoreDesignSettings = {
  storeName: 'মল্লিকা ফ্যাশন হাউস',
  storeAddress: 'বাড়ি ২৪, রোড ১১, বনানী, ঢাকা-১২১৩',
  storePhone: '+৮৮০ ১৭১১-০০৪৪৫৫ (সকাল ১০টা – রাত ৯টা)',
  storeEmail: 'concierge@mallikafashion.com',
  heroEyebrow: 'মল্লিকা আতেলিয়ার · এক্সক্লুসিভ লাক্সারি কালেকশন',
  heroTitle: 'ঐতিহ্যবাহী ঢাকাই তাঁত ও আভিজাত্যপূর্ণ পোশাকের প্রদর্শনী',
  heroSubtitle:
    'হাতে বোনা ঢাকাই জামদানি, সূক্ষ্ম এমব্রয়ডারি থ্রি-পিস, আরামদায়ক প্রিমিয়াম কটন টি-শার্ট, পাঞ্জাবি, মসলিন ওড়না এবং বনেদি সুতি বেডশিট—নিখুঁত কারুকাজের এক অভিজাত ঠিকানা।',
  heroImage: HERO_IMAGE,
  accentColor: '#7A1C32',
  canvasColor: '#F3ECE1',
  surfaceColor: '#E7DCC8',
  cardRadius: 'balanced',
  gridColumns: 3,
  cardImageRatio: '4:3',
  bannerEnabled: true,
  bannerMessages: [
    'মল্লিকা ফ্যাশন হাউস · এক্সক্লুসিভ ঢাকাই জামদানি ও উৎসবের লাক্সারি সংগ্রহ এখন লাইভ',
    '৳ ২,৫০০+ অর্ডারে সারা দেশে সম্পূর্ণ ফ্রি হোম ডেলিভারি',
    '১০০% খাঁটি তাঁত, মসলিন ও প্রিমিয়াম সুতি · ৭ দিনের সহজ এক্সচেঞ্জ সুবিধা',
  ],
  bannerSpeed: 'normal',
};

export const THEME_PRESETS: {
  name: string;
  accentColor: string;
  canvasColor: string;
  surfaceColor: string;
}[] = [
  {
    name: 'রয়্যাল শ্যাম্পেইন ও বারগান্ডি (ডিফল্ট)',
    accentColor: '#7A1C32',
    canvasColor: '#F3ECE1',
    surfaceColor: '#E7DCC8',
  },
  {
    name: 'অবসিডিয়ান নাইট ও গোল্ড (ডার্ক লাক্সারি)',
    accentColor: '#C59B49',
    canvasColor: '#141210',
    surfaceColor: '#1E1A16',
  },
  {
    name: 'মিডনাইট এমারাল্ড ও গোল্ড',
    accentColor: '#C9A45C',
    canvasColor: '#0F1C18',
    surfaceColor: '#172823',
  },
  {
    name: 'অ্যান্টিক ব্রোঞ্জ ও স্যান্ডস্টোন',
    accentColor: '#854D0E',
    canvasColor: '#EFE6D8',
    surfaceColor: '#E2D4BF',
  },
  {
    name: 'সাটিন পার্ল ও রয়্যাল ইন্ডিগো',
    accentColor: '#1E3A5F',
    canvasColor: '#EAEFF5',
    surfaceColor: '#DCE4EE',
  },
  {
    name: 'ভেলভেট রোজ ও লিনেন',
    accentColor: '#6D2849',
    canvasColor: '#F4EAEB',
    surfaceColor: '#E9D9DC',
  },
];

export const AVAILABLE_STUDIO_IMAGES: { label: string; url: string }[] = [
  { label: 'বুটিক প্রদর্শনী ব্যানার', url: HERO_IMAGE },
  {
    label: 'ঢাকাই জামদানি শাড়ি',
    url: '/src/assets/images/product_jamdani_saree_1795259358146.jpg',
  },
  {
    label: 'এমব্রয়ডারি কটন থ্রি-পিস',
    url: '/src/assets/images/product_cotton_threepiece_1795259358627.jpg',
  },
  {
    label: 'কটন টি-শার্ট সংগ্রহ',
    url: '/src/assets/images/product_cotton_tshirt_1795259359707.jpg',
  },
  {
    label: 'থ্রি-কোয়ার্টার প্যান্ট',
    url: '/src/assets/images/product_three_quarter_pant_1795259359105.jpg',
  },
  {
    label: 'ছেলেদের তাঁত পাঞ্জাবি',
    url: '/src/assets/images/product_mens_panjabi_1795259359636.jpg',
  },
  {
    label: 'মেয়েদের ইন্ডিগো কুর্তি',
    url: '/src/assets/images/product_womens_kurti_1795259362137.jpg',
  },
  {
    label: 'হ্যান্ড-পেইন্টেড মসলিন ওড়না',
    url: '/src/assets/images/product_muslin_orna_1795259361691.jpg',
  },
  {
    label: 'টেরাকোটা সুতি বেডশিট',
    url: '/src/assets/images/product_cotton_bedsheet_1795259362827.jpg',
  },
];

export const CATEGORIES: { key: CategoryKey; label: string }[] = [
  { key: 'all', label: 'সব পণ্য' },
  { key: 'saree-threepiece', label: 'শাড়ি ও থ্রি-পিস' },
  { key: 'tshirt-pant', label: 'টি-শার্ট ও প্যান্ট' },
  { key: 'apparel-orna', label: 'পোশাক ও ওড়না' },
  { key: 'bedsheet', label: 'বেডশিট' },
];

export const PRODUCTS: Product[] = [
  {
    id: 'mfh-jamdani-01',
    name: 'ঢাকাই জামদানি শাড়ি — মেরুন ও সোনালি',
    englishKeywords: 'jamdani saree maroon gold traditional wedding festive',
    category: 'saree-threepiece',
    categoryLabel: 'শাড়ি ও থ্রি-পিস',
    subCategory: 'শাড়ি',
    price: 4850,
    originalPrice: 5400,
    image: '/src/assets/images/product_jamdani_saree_1795259358146.jpg',
    shortDescription: 'হাতে বোনা খাঁটি হাফ-সিল্ক ও সুতি জামদানি, জরি পাড়ের সূক্ষ্ম নকশা।',
    description:
      'রূপগঞ্জের অভিজ্ঞ তাঁতিদের হাতে বোনা ঐতিহ্যবাহী ঢাকাই জামদানি শাড়ি। গাঢ় মেরুন জমিনের ওপর সোনালি জরির কল্কা ও তেরছা নকশা উৎসব, বিয়ে কিংবা বিশেষ দাওয়াতে অনন্য আভিজাত্য এনে দেয়। ১২ হাত দৈর্ঘ্যের সাথে ম্যাচিং ব্লাউজ পিস রয়েছে।',
    fabric: 'হাফ-সিল্ক ও ৮৪ কাউন্ট সুতি',
    careNote: 'প্রথমবার ড্রাই ওয়াশ করুন; রোদে সরাসরি না শুকিয়ে ছায়ায় মেলে দিন।',
    sizes: ['১২ হাত (ব্লাউজ পিসসহ)'],
    colors: [
      { name: 'গাঢ় মেরুন', hex: '#7A1C24' },
      { name: 'অ্যান্টিক গোল্ড', hex: '#B48A3E' },
    ],
    stockStatus: 'স্টকে আছে',
    featuredTag: 'হাতে বোনা',
    published: true,
    sortOrder: 1,
  },
  {
    id: 'mfh-threepiece-01',
    name: 'এমব্রয়ডারি কটন থ্রি-পিস — সেজ গ্রিন',
    englishKeywords: 'three piece salwar kameez cotton embroidered green eid casual',
    category: 'saree-threepiece',
    categoryLabel: 'শাড়ি ও থ্রি-পিস',
    subCategory: 'থ্রি-পিস',
    price: 2290,
    image: '/src/assets/images/product_cotton_threepiece_1795259358627.jpg',
    shortDescription: 'সুই-সুতার সূক্ষ্ম কাজের আরামদায়ক সুতি থ্রি-পিস ও ব্লক-প্রিন্ট ওড়না।',
    description:
      'গরম ও আর্দ্র আবহাওয়ার জন্য উপযোগী ১০০% কোম্বড কটন কাপড়ে তৈরি সেজ গ্রিন থ্রি-পিস। কামিজের গলায় ও হাতায় নিখুঁত সুতার কাজ এবং সাথে আড়াই গজের ব্লক-প্রিন্ট করা আরামদায়ক সুতি ওড়না ও সালোয়ারের কাপড় রয়েছে।',
    fabric: '১০০% প্রিমিয়াম ভয়েল ও লন কটন',
    careNote: 'হালকা ডিটারজেন্টে হাতে ধোয়া উত্তম।',
    sizes: ['আনস্টিচড (ফ্রি সাইজ)', 'M (রেডি)', 'L (রেডি)', 'XL (রেডি)'],
    colors: [
      { name: 'সেজ গ্রিন', hex: '#7D927D' },
      { name: 'ক্রিম অফ-হোয়াইট', hex: '#EAE5D9' },
    ],
    stockStatus: 'স্টকে আছে',
    featuredTag: 'নতুন সংগ্রহ',
    published: true,
    sortOrder: 2,
  },
  {
    id: 'mfh-tshirt-01',
    name: 'প্রিমিয়াম হেভিওয়েট কটন টি-শার্ট',
    englishKeywords: 't-shirt tshirt cotton men unisex casual charcoal olive',
    category: 'tshirt-pant',
    categoryLabel: 'টি-শার্ট ও প্যান্ট',
    subCategory: 'টি-শার্ট',
    price: 680,
    originalPrice: 790,
    image: '/src/assets/images/product_cotton_tshirt_1795259359707.jpg',
    shortDescription: '২০০ জিএসএম ১০০% অর্গানিক সুতি, নিয়মিত ও আরামদায়ক ফিট।',
    description:
      'প্রতিদিনের ব্যবহারের জন্য তৈরি ২০০ জিএসএম কোম্বড রিং-স্পান কটন টি-শার্ট। গলার রিব মজবুত এবং দীর্ঘদিন পরার পরও রঙ বা আকার নষ্ট হয় না। ছেলে ও মেয়ে উভয়ের জন্যই মানানসই।',
    fabric: '১০০% কোম্বড কটন (২০০ জিএসএম)',
    careNote: 'সাধারণ তাপমাত্রার পানিতে মেশিন বা হাতে ধোয়া যাবে।',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: [
      { name: 'চারকোল স্লেট', hex: '#44464A' },
      { name: 'অলিভ গ্রিন', hex: '#6B7458' },
      { name: 'অফ-হোয়াইট', hex: '#F3EFE6' },
    ],
    stockStatus: 'স্টকে আছে',
    featuredTag: 'বেস্টসেলার',
    published: true,
    sortOrder: 3,
  },
  {
    id: 'mfh-pant-01',
    name: 'কটন টুইল থ্রি-কোয়ার্টার কার্গো প্যান্ট',
    englishKeywords: 'three quarter pant 3/4 pants cargo shorts khaki cotton men casual',
    category: 'tshirt-pant',
    categoryLabel: 'টি-শার্ট ও প্যান্ট',
    subCategory: 'থ্রি-কোয়ার্টার প্যান্ট',
    price: 950,
    image: '/src/assets/images/product_three_quarter_pant_1795259359105.jpg',
    shortDescription: 'বাতাস চলাচল উপযোগী স্ট্রেচ টুইল কাপড়, ৬-পকেট ডিজাইন।',
    description:
      'ভ্রমণ, হাঁটাহাঁটি কিংবা দৈনন্দিন ক্যাজুয়াল লুকের জন্য আদর্শ খাঁকি টুইল থ্রি-কোয়ার্টার প্যান্ট। টেকসই সেলাই, বাটনসহ দুটি সাইড কার্গো পকেট এবং আরামদায়ক কোমর ফিটিং রয়েছে।',
    fabric: '৯৮% কটন টুইল, ২% ইলাস্টেন',
    careNote: 'উল্টো করে ধুয়ে নিন, হালকা ইস্ত্রি করুন।',
    sizes: ['৩০ (M)', '৩২ (L)', '৩৪ (XL)', '৩৬ (XXL)'],
    colors: [
      { name: 'স্যান্ড খাঁকি', hex: '#B49B74' },
      { name: 'ডিপ নেভি', hex: '#243046' },
    ],
    stockStatus: 'স্টকে আছে',
    published: true,
    sortOrder: 4,
  },
  {
    id: 'mfh-panjabi-01',
    name: 'ছেলেদের তাঁত কটন এমব্রয়ডারি পাঞ্জাবি',
    englishKeywords: 'panjabi kurta mens wear eid wedding ivory white cotton',
    category: 'apparel-orna',
    categoryLabel: 'পোশাক ও ওড়না',
    subCategory: 'ছেলেদের পোশাক',
    price: 1850,
    image: '/src/assets/images/product_mens_panjabi_1795259359636.jpg',
    shortDescription: 'ম্যান্ডারিন কলার ও প্লেটে সূক্ষ্ম সুতার কাজ, খাঁটি তাঁত সুতি।',
    description:
      'ঈদ, পূজা, পারিবারিক দাওয়াত কিংবা জুমার দিনের জন্য পরিপাটি আইভরি রঙের ছেলেদের পাঞ্জাবি। হালকা ও বাতাস চলাচলকারী তাঁতের সুতি কাপড়ে তৈরি, যা সারাদিন স্বস্তি দেয়।',
    fabric: '১০০% হ্যান্ডলুম খাদি-কটন',
    careNote: 'হালকা হাতে ধোয়া বা ড্রাই ওয়াশ উপযোগী।',
    sizes: ['৩৮ (S)', '৪০ (M)', '৪২ (L)', '৪৪ (XL)'],
    colors: [
      { name: 'আইভরি সাদা', hex: '#F2EDE1' },
      { name: 'বালি বেইজ', hex: '#D8CCB8' },
    ],
    stockStatus: 'স্টকে আছে',
    featuredTag: 'উৎসব স্পেশাল',
    published: true,
    sortOrder: 5,
  },
  {
    id: 'mfh-kurti-01',
    name: 'মেয়েদের ইন্ডিগো ব্লক-প্রিন্ট কুর্তি',
    englishKeywords: 'kurti womens wear indigo blue block print office casual',
    category: 'apparel-orna',
    categoryLabel: 'পোশাক ও ওড়না',
    subCategory: 'মেয়েদের পোশাক',
    price: 1350,
    image: '/src/assets/images/product_womens_kurti_1795259362137.jpg',
    shortDescription: 'হাতে করা উডেন ব্লক প্রিন্ট ও গলায় মিরর-টাসেল ডিটেইলিং।',
    description:
      'অফিস, ভার্সিটি বা দিনের বেলার যেকোনো অনুষ্ঠানের জন্য আধুনিক কাটের ইন্ডিগো নীল কুর্তি। সফট কটন-মসলিন মিশ্রণ কাপড়ে প্রাকৃতিক রঙের ব্লক প্রিন্ট করা হয়েছে।',
    fabric: 'কটন-মসলিন মিশ্রণ',
    careNote: 'প্রথমবার আলাদা করে ঠান্ডা পানিতে ধুয়ে নিন।',
    sizes: ['৩৬ (S)', '৩৮ (M)', '৪০ (L)', '৪২ (XL)', '৪৪ (XXL)'],
    colors: [
      { name: 'ইন্ডিগো ব্লু', hex: '#2B4C73' },
      { name: 'চারকোল ব্ল্যাক', hex: '#2A2927' },
    ],
    stockStatus: 'স্টকে আছে',
    published: true,
    sortOrder: 6,
  },
  {
    id: 'mfh-orna-01',
    name: 'হ্যান্ড-পেইন্টেড মসলিন ওড়না',
    englishKeywords: 'orna dupatta scarf muslin hand painted floral blush pink',
    category: 'apparel-orna',
    categoryLabel: 'পোশাক ও ওড়না',
    subCategory: 'ওড়না',
    price: 890,
    image: '/src/assets/images/product_muslin_orna_1795259361691.jpg',
    shortDescription: 'হালকা ও স্বচ্ছ হাফ-সিল্ক মসলিন, পাড়ে সোনালি বুনন ও টাসেল।',
    description:
      'যেকোনো একরঙা কুর্তি বা থ্রি-পিসের সাথে মানানসই কোমল ব্লাশ রোজ রঙের হ্যান্ড-পেইন্টেড মসলিন ওড়না। ওড়নার দুই প্রান্তে হাতে বাঁধা টাসেল ও সূক্ষ্ম ফুলেল তুলির কাজ রয়েছে।',
    fabric: 'হাফ-সিল্ক মসলিন',
    careNote: 'শুধুমাত্র ড্রাই ওয়াশ অথবা খুব আলতোভাবে ঠান্ডা পানিতে ধুবেন।',
    sizes: ['২.৫ গজ (স্ট্যান্ডার্ড)'],
    colors: [
      { name: 'ব্লাশ রোজ', hex: '#E6C3BE' },
      { name: 'সফট আইভরি', hex: '#F4EFE8' },
    ],
    stockStatus: 'স্টকে আছে',
    published: true,
    sortOrder: 7,
  },
  {
    id: 'mfh-bedsheet-01',
    name: 'টেরাকোটা ফ্লোরাল কিং সাইজ বেডশিট সেট',
    englishKeywords: 'bedsheet cotton king size terracotta floral pillow cover home',
    category: 'bedsheet',
    categoryLabel: 'বেডশিট',
    subCategory: 'কিং সাইজ বেডশিট',
    price: 1650,
    originalPrice: 1850,
    image: '/src/assets/images/product_cotton_bedsheet_1795259362827.jpg',
    shortDescription: '১০০% সুতি টুইল বেডশিট ও ২টি ম্যাচিং বালিশের কভার, রঙ পাকা।',
    description:
      'ঘরের শোবার ঘরে উষ্ণতা ও স্নিগ্ধতা আনতে ১০০% খাঁটি সুতি কিং-সাইজ বেডশিট (৭.৫ × ৮.৫ ফুট)। ৩০০ থ্রেড-কাউন্টের কোমল কাপড়, যা বারবার ধোয়ার পরও রঙ উজ্জ্বল থাকে এবং কুঁচকে যায় না।',
    fabric: '১০০% কোম্বড সুতি (৩০০ থ্রেড কাউন্ট)',
    careNote: 'মেশিন ওয়াশ উপযোগী, ব্লিচ ব্যবহার করবেন না।',
    sizes: ['কিং (৭.৫ × ৮.৫ ফুট) + ২টি বালিশ কভার', 'সেমি-ডাবল (৭ × ৮ ফুট)'],
    colors: [
      { name: 'টেরাকোটা ক্রিম', hex: '#BC7B6A' },
      { name: 'সেজ ব্লক প্রিন্ট', hex: '#889B87' },
    ],
    stockStatus: 'স্টকে আছে',
    featuredTag: 'ঘর সাজানো',
    published: true,
    sortOrder: 8,
  },
  {
    id: 'mfh-saree-02',
    name: 'সুতি তাঁত ও ব্লক-প্রিন্ট ক্যাজুয়াল শাড়ি',
    englishKeywords: 'cotton saree tant casual office wear daily bengali saree',
    category: 'saree-threepiece',
    categoryLabel: 'শাড়ি ও থ্রি-পিস',
    subCategory: 'সুতি শাড়ি',
    price: 1580,
    image: '/src/assets/images/hero_mallika_editorial_1795259357572.jpg',
    shortDescription: 'সারাদিন পরার জন্য হালকা ও বাতাস চলাচলকারী খাঁটি টাঙ্গাইল সুতি।',
    description:
      'অফিস, ক্লাস কিংবা ঘরোয়া আয়োজনের জন্য নরম টাঙ্গাইল সুতি শাড়ি। অফ-হোয়াইট ও মেরুন পাড়ের পরিমিত নকশা সব বয়সের জন্যই দারুণ মানানসই।',
    fabric: '১০০% টাঙ্গাইল সুতি',
    careNote: 'প্রথমবার লবণ পানিতে ভিজিয়ে ধুয়ে নিলে রঙ দীর্ঘস্থায়ী হয়।',
    sizes: ['১২ হাত (স্ট্যান্ডার্ড)'],
    colors: [
      { name: 'অফ-হোয়াইট ও মেরুন', hex: '#881337' },
    ],
    stockStatus: 'স্টকে আছে',
    published: true,
    sortOrder: 9,
  },
  {
    id: 'mfh-tshirt-02',
    name: 'অলিভ রিল্যাক্সড-ফিট ডেইলি টি-শার্ট (প্যাক)',
    englishKeywords: 'olive t-shirt daily wear pack cotton casual summer',
    category: 'tshirt-pant',
    categoryLabel: 'টি-শার্ট ও প্যান্ট',
    subCategory: 'টি-শার্ট',
    price: 1250,
    image: '/src/assets/images/product_cotton_tshirt_1795259359707.jpg',
    shortDescription: 'চারকোল ও অলিভ রঙের ২ পিস প্রিমিয়াম সুতি টি-শার্ট কম্বো।',
    description:
      'দৈনন্দিন ব্যবহারের জন্য সাশ্রয়ী ২ পিস কম্বো প্যাক—একটি চারকোল স্লেট এবং একটি অলিভ গ্রিন টি-শার্ট। সফট ওয়াশ ফিনিশের কারণে গায়ে পরলে দারুণ আরাম পাওয়া যায়।',
    fabric: '১০০% অর্গানিক সিঙ্গেল জার্সি কটন',
    careNote: 'স্বাভাবিক পানিতে ধোয়া যাবে।',
    sizes: ['M', 'L', 'XL', 'XXL'],
    colors: [
      { name: 'চারকোল + অলিভ প্যাক', hex: '#565F4F' },
    ],
    stockStatus: 'স্টকে আছে',
    published: true,
    sortOrder: 10,
  },
];

export interface QuizSeedInput {
  id: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
  rewardTitle: string;
  couponCode: string;
  discountType: 'fixed' | 'percent';
  discountValue: number;
  minOrderAmount: number;
  active: boolean;
  sortOrder: number;
}

export const DEFAULT_QUIZ_SEEDS: QuizSeedInput[] = [
  {
    id: 'quiz-jamdani-heritage',
    question:
      'বাংলাদেশের কোন ঐতিহ্যবাহী শাড়ি ইউনেস্কোর বিশ্ব সাংস্কৃতিক ঐতিহ্যের স্বীকৃতি পেয়েছে?',
    options: ['ঢাকাই জামদানি', 'সিল্ক জর্জেট', 'সিনথেটিক ক্রেপ', 'ভেলভেট'],
    correctOptionIndex: 0,
    rewardTitle: 'ঐতিহ্য কুপন: ৳ ১৫০ ছাড়',
    couponCode: 'JAMDANI150',
    discountType: 'fixed',
    discountValue: 150,
    minOrderAmount: 1500,
    active: true,
    sortOrder: 1,
  },
  {
    id: 'quiz-cotton-comfort',
    question: 'গরমে ও সারা দিনের আরামের জন্য কোন ধরনের কাপড় সবচেয়ে উপযোগী?',
    options: [
      '১০০% পলিয়েস্টার',
      '১০০% খাঁটি সুতি ও তাঁত',
      'নাইলন মিশ্রিত কাপড়',
      'ভারী সাটিন',
    ],
    correctOptionIndex: 1,
    rewardTitle: 'সুতি প্রেমী কুপন: ১০% ছাড়',
    couponCode: 'COTTON10',
    discountType: 'percent',
    discountValue: 10,
    minOrderAmount: 1000,
    active: true,
    sortOrder: 2,
  },
  {
    id: 'quiz-free-delivery',
    question:
      'মল্লিকা ফ্যাশন হাউসে কত টাকার বেশি অর্ডারে সারা দেশে ফ্রি হোম ডেলিভারি পাওয়া যায়?',
    options: ['৳ ১,০০০', '৳ ৫,০০০', '৳ ২,৫০০', '৳ ১০,০০০'],
    correctOptionIndex: 2,
    rewardTitle: 'ভিআইপি কুপন: ৳ ২০০ ছাড়',
    couponCode: 'MALLIKA200',
    discountType: 'fixed',
    discountValue: 200,
    minOrderAmount: 2000,
    active: true,
    sortOrder: 3,
  },
];

export function formatBDT(amount: number, langCode = 'bn'): string {
  const locale = langCode === 'bn' ? 'bn-BD' : 'en-US';
  return `৳ ${amount.toLocaleString(locale)}`;
}

export function formatCount(value: number, langCode = 'bn'): string {
  const locale = langCode === 'bn' ? 'bn-BD' : 'en-US';
  return value.toLocaleString(locale);
}
