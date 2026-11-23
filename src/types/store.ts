export type CategoryKey =
  | 'all'
  | 'saree-threepiece'
  | 'tshirt-pant'
  | 'apparel-orna'
  | 'bedsheet';

export interface ProductColor {
  name: string;
  hex: string;
}

export interface Product {
  id: string;
  name: string;
  englishKeywords: string;
  category: Exclude<CategoryKey, 'all'>;
  categoryLabel: string;
  subCategory: string;
  price: number;
  originalPrice?: number | null;
  image: string;
  galleryImages?: string[];
  shortDescription: string;
  description: string;
  fabric: string;
  careNote: string;
  sizes: string[];
  colors: ProductColor[];
  stockStatus: string;
  featuredTag?: string;
  published?: boolean;
  sortOrder?: number;
}

export type CardRadiusOption = 'sharp' | 'balanced' | 'soft';
export type CardImageRatioOption = '4:3' | '1:1' | '3:4';

export type BannerSpeedOption = 'slow' | 'normal' | 'fast';

export interface StoreDesignSettings {
  storeName: string;
  storeAddress: string;
  storePhone: string;
  storeEmail: string;
  heroEyebrow: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  accentColor: string;
  canvasColor: string;
  surfaceColor: string;
  cardRadius: CardRadiusOption;
  gridColumns: number;
  cardImageRatio: CardImageRatioOption;
  bannerEnabled: boolean;
  bannerMessages: string[];
  bannerSpeed: BannerSpeedOption;
}

export interface CartItem {
  key: string;
  product: Product;
  selectedSize: string;
  selectedColor: ProductColor;
  quantity: number;
}

export interface CheckoutFormData {
  customerName: string;
  phone: string;
  area: 'dhaka' | 'outside';
  address: string;
  deliveryNote: string;
}

export interface OrderItemSummary {
  productId: string;
  name: string;
  size: string;
  colorName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export type OrderStatus =
  | 'নতুন অর্ডার'
  | 'প্রসেসিং'
  | 'ডেলিভারির পথে'
  | 'সম্পন্ন'
  | 'বাতিল';

export type DiscountType = 'fixed' | 'percent';

export interface UserProfile {
  uid: string;
  fullName: string;
  phone: string;
  defaultArea: 'dhaka' | 'outside';
  defaultAddress: string;
  defaultNote: string;
  createdAt?: unknown;
}

export interface QuizPublic {
  id: string;
  question: string;
  options: string[];
  optionSalt: string;
  optionDigest: string;
  rewardTitle: string;
  couponCode: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount: number;
  active: boolean;
  sortOrder: number;
}

export interface QuizAdminItem extends QuizPublic {
  correctOptionIndex: number;
}

export interface UserCoupon {
  quizId: string;
  couponCode: string;
  rewardTitle: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount: number;
  selectedOption: number;
  used: boolean;
  usedInOrderId?: string;
  claimedAtText?: string;
}

export interface OrderConfirmation {
  orderId: string;
  createdAt: string;
  customerName: string;
  phone: string;
  areaLabel: string;
  address: string;
  deliveryNote: string;
  paymentMethod: string;
  subtotal: number;
  discountAmount?: number;
  couponCode?: string;
  deliveryFee: number;
  total: number;
  items: OrderItemSummary[];
}

export interface StoredOrder extends OrderConfirmation {
  docId: string;
  userId?: string;
  area: 'dhaka' | 'outside';
  status: OrderStatus;
}

export interface StyleAdviceRecommendation {
  productId: string;
  reason: string;
}

export interface StyleAdviceResponse {
  summary: string;
  stylingTips: string[];
  recommendations: StyleAdviceRecommendation[];
}
