import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import {
  DEFAULT_DESIGN_SETTINGS,
  DEFAULT_QUIZ_SEEDS,
  PRODUCTS,
  type QuizSeedInput,
} from '../data/products';
import type {
  CheckoutFormData,
  OrderConfirmation,
  OrderItemSummary,
  OrderStatus,
  Product,
  QuizAdminItem,
  QuizPublic,
  StoreDesignSettings,
  StoredOrder,
  UserCoupon,
  UserProfile,
} from '../types/store';
import { db, handleFirestoreError, OperationType } from './firebase';
import { computeQuizOptionDigest, generateQuizSalt } from './quizCrypto';

function sanitizeId(raw: string): string {
  const cleaned = raw.trim().replace(/[^a-zA-Z0-9_-]/g, '-');
  return cleaned.length >= 2 ? cleaned.slice(0, 128) : `mfh-${Date.now()}`;
}

function sanitizeHex(raw: string, fallback: string): string {
  return /^#[0-9A-Fa-f]{6}$/.test(raw) ? raw.toUpperCase() : fallback;
}

function mapDocToProduct(data: Record<string, unknown>, docId: string): Product {
  return {
    id: String(data.id || docId),
    name: String(data.name || ''),
    englishKeywords: String(data.englishKeywords || ''),
    category: (data.category as Product['category']) || 'apparel-orna',
    categoryLabel: String(data.categoryLabel || ''),
    subCategory: String(data.subCategory || ''),
    price: Number(data.price || 0),
    originalPrice:
      typeof data.originalPrice === 'number' && data.originalPrice > 0
        ? data.originalPrice
        : undefined,
    image: String(data.image || ''),
    galleryImages: Array.isArray(data.galleryImages)
      ? data.galleryImages
          .map(String)
          .filter(Boolean)
          .slice(0, 5)
      : [],
    shortDescription: String(data.shortDescription || ''),
    description: String(data.description || ''),
    fabric: String(data.fabric || ''),
    careNote: String(data.careNote || ''),
    sizes: Array.isArray(data.sizes) && data.sizes.length > 0
      ? data.sizes.map(String)
      : ['স্ট্যান্ডার্ড'],
    colors:
      Array.isArray(data.colors) && data.colors.length > 0
        ? (data.colors as { name?: string; hex?: string }[]).map((c) => ({
            name: String(c.name || 'ডিফল্ট'),
            hex: sanitizeHex(String(c.hex || '#1C1917'), '#1C1917'),
          }))
        : [{ name: 'ডিফল্ট', hex: '#1C1917' }],
    stockStatus: String(data.stockStatus || 'স্টকে আছে'),
    featuredTag: data.featuredTag ? String(data.featuredTag) : undefined,
    published: data.published !== false,
    sortOrder: typeof data.sortOrder === 'number' ? data.sortOrder : 100,
  };
}

function mapDocToDesign(data: Record<string, unknown>): StoreDesignSettings {
  const gridCols = Number(data.gridColumns);
  const cardRadius = String(data.cardRadius);
  const ratio = String(data.cardImageRatio);
  const speed = String(data.bannerSpeed);

  const parsedMessages = Array.isArray(data.bannerMessages)
    ? data.bannerMessages
        .map((m) => String(m || '').trim())
        .filter(Boolean)
        .slice(0, 8)
    : DEFAULT_DESIGN_SETTINGS.bannerMessages;

  return {
    storeName: String(data.storeName || DEFAULT_DESIGN_SETTINGS.storeName),
    storeAddress: String(
      data.storeAddress || DEFAULT_DESIGN_SETTINGS.storeAddress,
    ),
    storePhone: String(data.storePhone || DEFAULT_DESIGN_SETTINGS.storePhone),
    storeEmail: String(data.storeEmail || DEFAULT_DESIGN_SETTINGS.storeEmail),
    heroEyebrow: String(data.heroEyebrow || DEFAULT_DESIGN_SETTINGS.heroEyebrow),
    heroTitle: String(data.heroTitle || DEFAULT_DESIGN_SETTINGS.heroTitle),
    heroSubtitle: String(
      data.heroSubtitle || DEFAULT_DESIGN_SETTINGS.heroSubtitle,
    ),
    heroImage: String(data.heroImage || DEFAULT_DESIGN_SETTINGS.heroImage),
    accentColor: sanitizeHex(
      String(data.accentColor || ''),
      DEFAULT_DESIGN_SETTINGS.accentColor,
    ),
    canvasColor: sanitizeHex(
      String(data.canvasColor || ''),
      DEFAULT_DESIGN_SETTINGS.canvasColor,
    ),
    surfaceColor: sanitizeHex(
      String(data.surfaceColor || ''),
      DEFAULT_DESIGN_SETTINGS.surfaceColor,
    ),
    cardRadius:
      cardRadius === 'sharp' || cardRadius === 'soft' ? cardRadius : 'balanced',
    gridColumns: gridCols === 2 || gridCols === 4 ? gridCols : 3,
    cardImageRatio: ratio === '1:1' || ratio === '3:4' ? ratio : '4:3',
    bannerEnabled:
      typeof data.bannerEnabled === 'boolean'
        ? data.bannerEnabled
        : DEFAULT_DESIGN_SETTINGS.bannerEnabled,
    bannerMessages:
      parsedMessages.length > 0
        ? parsedMessages
        : DEFAULT_DESIGN_SETTINGS.bannerMessages,
    bannerSpeed:
      speed === 'slow' || speed === 'fast' ? speed : 'normal',
  };
}

function buildProductPayload(
  product: Product,
  uid: string,
  publishNow: boolean,
) {
  const safeId = sanitizeId(product.id);
  const payload: Record<string, unknown> = {
    id: safeId,
    name: product.name.trim().slice(0, 120),
    englishKeywords: (product.englishKeywords || '').trim().slice(0, 200),
    category: product.category,
    categoryLabel: product.categoryLabel.trim().slice(0, 60),
    subCategory: product.subCategory.trim().slice(0, 60),
    price: Math.max(1, Math.min(1000000, Math.round(Number(product.price) || 1))),
    image: product.image.trim().slice(0, 500),
    shortDescription: product.shortDescription.trim().slice(0, 240),
    description: product.description.trim().slice(0, 1500),
    fabric: product.fabric.trim().slice(0, 120),
    careNote: product.careNote.trim().slice(0, 240),
    sizes: (product.sizes.length > 0 ? product.sizes : ['স্ট্যান্ডার্ড'])
      .slice(0, 10)
      .map((s) => s.trim().slice(0, 50))
      .filter(Boolean),
    colors: (product.colors.length > 0
      ? product.colors
      : [{ name: 'ডিফল্ট', hex: '#1C1917' }]
    )
      .slice(0, 10)
      .map((c) => ({
        name: c.name.trim().slice(0, 40) || 'রঙ',
        hex: sanitizeHex(c.hex, '#1C1917'),
      })),
    stockStatus: (product.stockStatus || 'স্টকে আছে').trim().slice(0, 40),
    published: publishNow,
    sortOrder: Math.max(0, Math.min(10000, Number(product.sortOrder ?? 100))),
    updatedAt: serverTimestamp(),
    updatedBy: uid,
  };

  if (
    typeof product.originalPrice === 'number' &&
    product.originalPrice > 0
  ) {
    payload.originalPrice = Math.max(
      1,
      Math.min(1000000, Math.round(product.originalPrice)),
    );
  }
  if (product.featuredTag && product.featuredTag.trim()) {
    payload.featuredTag = product.featuredTag.trim().slice(0, 40);
  }
  if (Array.isArray(product.galleryImages)) {
    const cleanGallery = product.galleryImages
      .map((u) => u.trim().slice(0, 500))
      .filter(Boolean)
      .slice(0, 5);
    if (cleanGallery.length > 0) {
      payload.galleryImages = cleanGallery;
    }
  }

  return { safeId, payload };
}

function buildDesignPayload(settings: StoreDesignSettings, uid: string) {
  const cleanBannerMessages = (
    Array.isArray(settings.bannerMessages) ? settings.bannerMessages : []
  )
    .map((m) => m.trim().slice(0, 160))
    .filter(Boolean)
    .slice(0, 8);

  return {
    storeName: settings.storeName.trim().slice(0, 80) || DEFAULT_DESIGN_SETTINGS.storeName,
    storeAddress:
      (settings.storeAddress || '').trim().slice(0, 240) ||
      DEFAULT_DESIGN_SETTINGS.storeAddress,
    storePhone:
      (settings.storePhone || '').trim().slice(0, 100) ||
      DEFAULT_DESIGN_SETTINGS.storePhone,
    storeEmail:
      (settings.storeEmail || '').trim().slice(0, 120) ||
      DEFAULT_DESIGN_SETTINGS.storeEmail,
    heroEyebrow: settings.heroEyebrow.trim().slice(0, 80) || DEFAULT_DESIGN_SETTINGS.heroEyebrow,
    heroTitle: settings.heroTitle.trim().slice(0, 140) || DEFAULT_DESIGN_SETTINGS.heroTitle,
    heroSubtitle: settings.heroSubtitle.trim().slice(0, 360) || DEFAULT_DESIGN_SETTINGS.heroSubtitle,
    heroImage: settings.heroImage.trim().slice(0, 500) || DEFAULT_DESIGN_SETTINGS.heroImage,
    accentColor: sanitizeHex(settings.accentColor, DEFAULT_DESIGN_SETTINGS.accentColor),
    canvasColor: sanitizeHex(settings.canvasColor, DEFAULT_DESIGN_SETTINGS.canvasColor),
    surfaceColor: sanitizeHex(settings.surfaceColor, DEFAULT_DESIGN_SETTINGS.surfaceColor),
    cardRadius: settings.cardRadius,
    gridColumns: Math.max(2, Math.min(4, Math.round(settings.gridColumns))),
    cardImageRatio: settings.cardImageRatio,
    bannerEnabled: Boolean(settings.bannerEnabled),
    bannerMessages: cleanBannerMessages,
    bannerSpeed:
      settings.bannerSpeed === 'slow' || settings.bannerSpeed === 'fast'
        ? settings.bannerSpeed
        : 'normal',
    updatedAt: serverTimestamp(),
    updatedBy: uid,
  };
}

export function subscribePublishedProducts(
  onData: (products: Product[], hasRemoteData: boolean) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  const path = 'products';
  const q = query(collection(db, path), where('published', '==', true));
  return onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) {
        onData([], false);
        return;
      }
      const list = snapshot.docs
        .map((d) => mapDocToProduct(d.data() as Record<string, unknown>, d.id))
        .sort((a, b) => (a.sortOrder ?? 100) - (b.sortOrder ?? 100));
      onData(list, true);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) onError(wrapped);
      }
    },
  );
}

export function subscribeAllProductsAdmin(
  onData: (products: Product[]) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  const path = 'products';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const list = snapshot.docs
        .map((d) => mapDocToProduct(d.data() as Record<string, unknown>, d.id))
        .sort((a, b) => (a.sortOrder ?? 100) - (b.sortOrder ?? 100));
      onData(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) onError(wrapped);
      }
    },
  );
}

export function subscribePublishedDesign(
  onData: (settings: StoreDesignSettings | null) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  const path = 'storeSettings/published';
  return onSnapshot(
    doc(db, 'storeSettings', 'published'),
    (snap) => {
      if (!snap.exists()) {
        onData(null);
        return;
      }
      onData(mapDocToDesign(snap.data() as Record<string, unknown>));
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) onError(wrapped);
      }
    },
  );
}

export function subscribeDraftDesign(
  onData: (settings: StoreDesignSettings | null) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  const path = 'storeSettings/draft';
  return onSnapshot(
    doc(db, 'storeSettings', 'draft'),
    (snap) => {
      if (!snap.exists()) {
        onData(null);
        return;
      }
      onData(mapDocToDesign(snap.data() as Record<string, unknown>));
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) onError(wrapped);
      }
    },
  );
}

export function subscribeOrdersAdmin(
  onData: (orders: StoredOrder[]) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  const path = 'orders';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const orders: StoredOrder[] = snapshot.docs.map((d) => {
        const data = d.data() as Record<string, unknown>;
        const ts = data.createdAt as { toDate?: () => Date } | undefined;
        const createdDate = ts?.toDate ? ts.toDate() : new Date();
        return {
          docId: d.id,
          userId: data.userId ? String(data.userId) : undefined,
          orderId: String(data.orderId || d.id),
          createdAt: createdDate.toLocaleString('bn-BD', {
            dateStyle: 'medium',
            timeStyle: 'short',
          }),
          customerName: String(data.customerName || ''),
          phone: String(data.phone || ''),
          area: data.area === 'outside' ? 'outside' : 'dhaka',
          areaLabel: String(data.areaLabel || ''),
          address: String(data.address || ''),
          deliveryNote: String(data.deliveryNote || ''),
          paymentMethod: String(data.paymentMethod || 'ক্যাশ অন ডেলিভারি'),
          subtotal: Number(data.subtotal || 0),
          discountAmount:
            typeof data.discountAmount === 'number' ? data.discountAmount : 0,
          couponCode: data.couponCode ? String(data.couponCode) : undefined,
          deliveryFee: Number(data.deliveryFee || 0),
          total: Number(data.total || 0),
          status: (data.status as OrderStatus) || 'নতুন অর্ডার',
          items: Array.isArray(data.items)
            ? (data.items as OrderItemSummary[])
            : [],
        };
      });
      orders.sort((a, b) => b.docId.localeCompare(a.docId));
      onData(orders);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) onError(wrapped);
      }
    },
  );
}

export async function seedInitialCatalogIfEmpty(uid: string): Promise<void> {
  try {
    const existingProducts = await getDocs(collection(db, 'products'));
    if (existingProducts.empty) {
      const batch = writeBatch(db);
      PRODUCTS.forEach((product, idx) => {
        const { safeId, payload } = buildProductPayload(
          { ...product, sortOrder: idx + 1 },
          uid,
          true,
        );
        batch.set(doc(db, 'products', safeId), payload);
      });
      await batch.commit();
    }

    const publishedDesignSnap = await getDoc(
      doc(db, 'storeSettings', 'published'),
    );
    if (!publishedDesignSnap.exists()) {
      const designPayload = buildDesignPayload(DEFAULT_DESIGN_SETTINGS, uid);
      await setDoc(doc(db, 'storeSettings', 'published'), designPayload);
      await setDoc(doc(db, 'storeSettings', 'draft'), designPayload);
    }
    const existingQuizzes = await getDocs(collection(db, 'quizzes'));
    if (existingQuizzes.empty) {
      await seedStarterQuizzesIfEmpty(uid);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'products');
  }
}

export async function seedStarterQuizzesIfEmpty(uid: string): Promise<number> {
  try {
    const existing = await getDocs(collection(db, 'quizzes'));
    if (!existing.empty) return 0;

    for (const seed of DEFAULT_QUIZ_SEEDS) {
      await saveQuizAdmin(seed, uid);
    }
    return DEFAULT_QUIZ_SEEDS.length;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'quizzes');
  }
}

export async function saveProductToFirestore(
  product: Product,
  uid: string,
  publishNow: boolean,
): Promise<void> {
  const { safeId, payload } = buildProductPayload(product, uid, publishNow);
  const path = `products/${safeId}`;
  try {
    await setDoc(doc(db, 'products', safeId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function publishAllDraftProducts(
  products: Product[],
  uid: string,
): Promise<number> {
  const drafts = products.filter((p) => p.published === false);
  if (drafts.length === 0) return 0;

  try {
    const batch = writeBatch(db);
    for (const p of drafts) {
      const { safeId, payload } = buildProductPayload(p, uid, true);
      batch.set(doc(db, 'products', safeId), payload);
    }
    await batch.commit();
    return drafts.length;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'products');
  }
}

export async function deleteProductFromFirestore(
  productId: string,
): Promise<void> {
  const safeId = sanitizeId(productId);
  const path = `products/${safeId}`;
  try {
    await deleteDoc(doc(db, 'products', safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveDesignSettings(
  settings: StoreDesignSettings,
  uid: string,
  target: 'draft' | 'published',
): Promise<void> {
  const path = `storeSettings/${target}`;
  const payload = buildDesignPayload(settings, uid);
  try {
    await setDoc(doc(db, 'storeSettings', target), payload);
    if (target === 'published') {
      await setDoc(doc(db, 'storeSettings', 'draft'), payload);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function createOrderInFirestore(
  form: CheckoutFormData,
  items: {
    productId: string;
    name: string;
    size: string;
    colorName: string;
    quantity: number;
    unitPrice: number;
  }[],
  options?: {
    userId?: string;
    coupon?: UserCoupon | null;
  },
): Promise<OrderConfirmation> {
  const orderNum = Math.floor(1000 + Math.random() * 9000);
  const orderId = `MFH-${orderNum}`;
  const docId = `${Date.now()}-${orderId}`;
  const path = `orders/${docId}`;

  const verifiedItems: OrderItemSummary[] = items.slice(0, 25).map((item) => {
    const qty = Math.max(1, Math.min(50, Math.floor(item.quantity)));
    const unitPrice = Math.max(1, Math.round(item.unitPrice));
    return {
      productId: item.productId,
      name: item.name.slice(0, 120),
      size: item.size.slice(0, 50),
      colorName: item.colorName.slice(0, 40),
      quantity: qty,
      unitPrice,
      lineTotal: unitPrice * qty,
    };
  });

  const subtotal = verifiedItems.reduce((sum, i) => sum + i.lineTotal, 0);
  const coupon = options?.coupon || null;

  let discountAmount = 0;
  if (
    coupon &&
    !coupon.used &&
    options?.userId &&
    subtotal >= coupon.minOrderAmount
  ) {
    discountAmount =
      coupon.discountType === 'fixed'
        ? Math.min(subtotal, Math.round(coupon.discountValue))
        : Math.min(subtotal, Math.round((subtotal * coupon.discountValue) / 100));
  }

  const baseDeliveryFee = form.area === 'outside' ? 130 : 70;
  const deliveryFee = subtotal >= 2500 ? 0 : baseDeliveryFee;
  const total = Math.max(0, subtotal - discountAmount + deliveryFee);
  const areaLabel = form.area === 'outside' ? 'ঢাকার বাইরে' : 'ঢাকার ভেতরে';

  const payload: Record<string, unknown> = {
    orderId,
    customerName: form.customerName.trim().slice(0, 100),
    phone: form.phone.trim().slice(0, 24),
    area: form.area,
    areaLabel,
    address: form.address.trim().slice(0, 300),
    paymentMethod: 'ক্যাশ অন ডেলিভারি',
    subtotal,
    deliveryFee,
    total,
    status: 'নতুন অর্ডার',
    items: verifiedItems,
    createdAt: serverTimestamp(),
  };

  if (options?.userId) {
    payload.userId = options.userId;
  }
  if (coupon && discountAmount > 0 && options?.userId) {
    payload.discountAmount = discountAmount;
    payload.couponCode = coupon.couponCode.slice(0, 40);
    payload.couponQuizId = sanitizeId(coupon.quizId);
  }
  if (form.deliveryNote.trim()) {
    payload.deliveryNote = form.deliveryNote.trim().slice(0, 240);
  }

  try {
    if (coupon && discountAmount > 0 && options?.userId) {
      const batch = writeBatch(db);
      batch.set(doc(db, 'orders', docId), payload);
      batch.update(
        doc(db, 'users', options.userId, 'coupons', sanitizeId(coupon.quizId)),
        {
          used: true,
          usedInOrderId: orderId,
          usedAt: serverTimestamp(),
        },
      );
      await batch.commit();
    } else {
      await setDoc(doc(db, 'orders', docId), payload);
    }

    return {
      orderId,
      createdAt: new Date().toLocaleString('bn-BD', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
      customerName: form.customerName.trim(),
      phone: form.phone.trim(),
      areaLabel,
      address: form.address.trim(),
      deliveryNote: form.deliveryNote.trim(),
      paymentMethod: 'ক্যাশ অন ডেলিভারি',
      subtotal,
      discountAmount: discountAmount > 0 ? discountAmount : undefined,
      couponCode: coupon && discountAmount > 0 ? coupon.couponCode : undefined,
      deliveryFee,
      total,
      items: verifiedItems,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateOrderStatusInFirestore(
  docId: string,
  status: OrderStatus,
): Promise<void> {
  const path = `orders/${docId}`;
  try {
    await updateDoc(doc(db, 'orders', docId), { status });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// =========================================================
// Customer Profile, Quiz & Coupon Sync Functions
// =========================================================

export function subscribeUserProfile(
  uid: string,
  onData: (profile: UserProfile | null) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  const path = `users/${uid}`;
  return onSnapshot(
    doc(db, 'users', uid),
    (snap) => {
      if (!snap.exists()) {
        onData(null);
        return;
      }
      const d = snap.data() as Record<string, unknown>;
      onData({
        uid: String(d.uid || uid),
        fullName: String(d.fullName || ''),
        phone: String(d.phone || ''),
        defaultArea: d.defaultArea === 'outside' ? 'outside' : 'dhaka',
        defaultAddress: String(d.defaultAddress || ''),
        defaultNote: String(d.defaultNote || ''),
        createdAt: d.createdAt,
      });
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) onError(wrapped);
      }
    },
  );
}

export async function saveUserProfileToFirestore(
  uid: string,
  data: {
    fullName: string;
    phone: string;
    defaultArea: 'dhaka' | 'outside';
    defaultAddress: string;
    defaultNote: string;
  },
  existingCreatedAt?: unknown,
): Promise<void> {
  const path = `users/${uid}`;
  const cleanNote = data.defaultNote.trim().slice(0, 240);
  try {
    if (existingCreatedAt) {
      const updatePayload: Record<string, unknown> = {
        fullName: data.fullName.trim().slice(0, 100),
        phone: data.phone.trim().slice(0, 24),
        defaultArea: data.defaultArea,
        defaultAddress: data.defaultAddress.trim().slice(0, 300),
        defaultNote: cleanNote,
        updatedAt: serverTimestamp(),
      };
      await updateDoc(doc(db, 'users', uid), updatePayload);
    } else {
      const createPayload: Record<string, unknown> = {
        uid,
        fullName: data.fullName.trim().slice(0, 100),
        phone: data.phone.trim().slice(0, 24),
        defaultArea: data.defaultArea,
        defaultAddress: data.defaultAddress.trim().slice(0, 300),
        defaultNote: cleanNote,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(doc(db, 'users', uid), createPayload);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeUserCoupons(
  uid: string,
  onData: (coupons: UserCoupon[]) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  const path = `users/${uid}/coupons`;
  return onSnapshot(
    collection(db, 'users', uid, 'coupons'),
    (snapshot) => {
      const list: UserCoupon[] = snapshot.docs.map((d) => {
        const data = d.data() as Record<string, unknown>;
        const ts = data.claimedAt as { toDate?: () => Date } | undefined;
        return {
          quizId: String(data.quizId || d.id),
          couponCode: String(data.couponCode || ''),
          rewardTitle: String(data.rewardTitle || ''),
          discountType: data.discountType === 'percent' ? 'percent' : 'fixed',
          discountValue: Number(data.discountValue || 0),
          minOrderAmount: Number(data.minOrderAmount || 0),
          selectedOption: Number(data.selectedOption ?? 0),
          used: Boolean(data.used),
          usedInOrderId: data.usedInOrderId
            ? String(data.usedInOrderId)
            : undefined,
          claimedAtText: ts?.toDate
            ? ts.toDate().toLocaleDateString('bn-BD', { dateStyle: 'medium' })
            : undefined,
        };
      });
      onData(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) onError(wrapped);
      }
    },
  );
}

export function subscribeUserOrders(
  uid: string,
  onData: (orders: StoredOrder[]) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  const path = 'orders';
  const q = query(collection(db, path), where('userId', '==', uid));
  return onSnapshot(
    q,
    (snapshot) => {
      const orders: StoredOrder[] = snapshot.docs.map((d) => {
        const data = d.data() as Record<string, unknown>;
        const ts = data.createdAt as { toDate?: () => Date } | undefined;
        const createdDate = ts?.toDate ? ts.toDate() : new Date();
        return {
          docId: d.id,
          userId: data.userId ? String(data.userId) : undefined,
          orderId: String(data.orderId || d.id),
          createdAt: createdDate.toLocaleString('bn-BD', {
            dateStyle: 'medium',
            timeStyle: 'short',
          }),
          customerName: String(data.customerName || ''),
          phone: String(data.phone || ''),
          area: data.area === 'outside' ? 'outside' : 'dhaka',
          areaLabel: String(data.areaLabel || ''),
          address: String(data.address || ''),
          deliveryNote: String(data.deliveryNote || ''),
          paymentMethod: String(data.paymentMethod || 'ক্যাশ অন ডেলিভারি'),
          subtotal: Number(data.subtotal || 0),
          discountAmount:
            typeof data.discountAmount === 'number' ? data.discountAmount : 0,
          couponCode: data.couponCode ? String(data.couponCode) : undefined,
          deliveryFee: Number(data.deliveryFee || 0),
          total: Number(data.total || 0),
          status: (data.status as OrderStatus) || 'নতুন অর্ডার',
          items: Array.isArray(data.items)
            ? (data.items as OrderItemSummary[])
            : [],
        };
      });
      orders.sort((a, b) => b.docId.localeCompare(a.docId));
      onData(orders);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) onError(wrapped);
      }
    },
  );
}

function mapDocToQuizPublic(
  data: Record<string, unknown>,
  docId: string,
): QuizPublic {
  return {
    id: String(data.id || docId),
    question: String(data.question || ''),
    options: Array.isArray(data.options)
      ? data.options.map(String).slice(0, 4)
      : [],
    optionSalt: String(data.optionSalt || ''),
    optionDigest: String(data.optionDigest || ''),
    rewardTitle: String(data.rewardTitle || ''),
    couponCode: String(data.couponCode || ''),
    discountType: data.discountType === 'percent' ? 'percent' : 'fixed',
    discountValue: Number(data.discountValue || 0),
    minOrderAmount: Number(data.minOrderAmount || 0),
    active: data.active !== false,
    sortOrder: typeof data.sortOrder === 'number' ? data.sortOrder : 10,
  };
}

export function subscribeActiveQuizzes(
  onData: (quizzes: QuizPublic[]) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  const path = 'quizzes';
  const q = query(collection(db, path), where('active', '==', true));
  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs
        .map((d) => mapDocToQuizPublic(d.data() as Record<string, unknown>, d.id))
        .sort((a, b) => a.sortOrder - b.sortOrder);
      onData(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) onError(wrapped);
      }
    },
  );
}

export function subscribeAdminQuizzes(
  onData: (quizzes: QuizAdminItem[]) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  const path = 'quizzes';
  return onSnapshot(
    collection(db, path),
    async (snapshot) => {
      try {
        const answerDocs = await getDocs(collection(db, 'quizAnswers'));
        const answerMap = new Map<string, number>();
        answerDocs.docs.forEach((ad) => {
          const val = (ad.data() as Record<string, unknown>).correctOptionIndex;
          if (typeof val === 'number') {
            answerMap.set(ad.id, val);
          }
        });

        const list: QuizAdminItem[] = snapshot.docs
          .map((d) => {
            const pub = mapDocToQuizPublic(
              d.data() as Record<string, unknown>,
              d.id,
            );
            return {
              ...pub,
              correctOptionIndex: answerMap.get(pub.id) ?? 0,
            };
          })
          .sort((a, b) => a.sortOrder - b.sortOrder);
        onData(list);
      } catch (err) {
        if (onError && err instanceof Error) onError(err);
      }
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) onError(wrapped);
      }
    },
  );
}

export async function saveQuizAdmin(
  quiz: QuizSeedInput,
  uid: string,
): Promise<void> {
  const safeId = sanitizeId(quiz.id);
  const cleanOptions = quiz.options
    .map((o) => o.trim().slice(0, 150))
    .filter(Boolean)
    .slice(0, 4);
  const safeCorrectIdx = Math.max(
    0,
    Math.min(cleanOptions.length - 1, Math.floor(quiz.correctOptionIndex)),
  );
  const cleanCode =
    quiz.couponCode
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9_-]/g, '')
      .slice(0, 40) || `MFH${Date.now().toString().slice(-4)}`;
  const discountType = quiz.discountType === 'percent' ? 'percent' : 'fixed';
  const discountValue =
    discountType === 'percent'
      ? Math.max(1, Math.min(80, Math.round(Number(quiz.discountValue) || 10)))
      : Math.max(1, Math.min(100000, Math.round(Number(quiz.discountValue) || 50)));
  const minOrderAmount = Math.max(
    0,
    Math.min(1000000, Math.round(Number(quiz.minOrderAmount) || 0)),
  );

  const optionSalt = generateQuizSalt();
  const optionDigest = await computeQuizOptionDigest(
    safeId,
    safeCorrectIdx,
    optionSalt,
  );

  const publicPayload = {
    id: safeId,
    question: quiz.question.trim().slice(0, 300),
    options: cleanOptions,
    optionSalt,
    optionDigest,
    rewardTitle: quiz.rewardTitle.trim().slice(0, 120),
    couponCode: cleanCode,
    discountType,
    discountValue,
    minOrderAmount,
    active: Boolean(quiz.active),
    sortOrder: Math.max(0, Math.min(10000, Number(quiz.sortOrder ?? 1))),
    updatedAt: serverTimestamp(),
    updatedBy: uid,
  };

  const secretPayload = {
    quizId: safeId,
    correctOptionIndex: safeCorrectIdx,
    couponCode: cleanCode,
    discountType,
    discountValue,
    minOrderAmount,
    active: Boolean(quiz.active),
    updatedAt: serverTimestamp(),
    updatedBy: uid,
  };

  try {
    const batch = writeBatch(db);
    batch.set(doc(db, 'quizzes', safeId), publicPayload);
    batch.set(doc(db, 'quizAnswers', safeId), secretPayload);
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `quizzes/${safeId}`);
  }
}

export async function deleteQuizAdmin(quizId: string): Promise<void> {
  const safeId = sanitizeId(quizId);
  try {
    const batch = writeBatch(db);
    batch.delete(doc(db, 'quizzes', safeId));
    batch.delete(doc(db, 'quizAnswers', safeId));
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `quizzes/${safeId}`);
  }
}

export async function claimQuizCouponInFirestore(
  uid: string,
  quiz: QuizPublic,
  selectedOption: number,
): Promise<void> {
  const safeQuizId = sanitizeId(quiz.id);
  const path = `users/${uid}/coupons/${safeQuizId}`;
  try {
    await setDoc(doc(db, 'users', uid, 'coupons', safeQuizId), {
      quizId: safeQuizId,
      couponCode: quiz.couponCode,
      rewardTitle: quiz.rewardTitle,
      discountType: quiz.discountType,
      discountValue: quiz.discountValue,
      minOrderAmount: quiz.minOrderAmount,
      selectedOption,
      used: false,
      claimedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}
