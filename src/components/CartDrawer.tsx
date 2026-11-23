import { useEffect, useState, type FormEvent } from 'react';
import type { User } from 'firebase/auth';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Minus,
  Plus,
  ShoppingBag,
  Tag,
  Trash2,
  User as UserIcon,
  X,
} from 'lucide-react';
import { formatBDT, formatCount } from '../data/products';
import type { UITranslationKeys } from '../lib/i18n';
import {
  createOrderInFirestore,
  saveUserProfileToFirestore,
} from '../lib/storeSync';
import type {
  CartItem,
  CheckoutFormData,
  OrderConfirmation,
  UserCoupon,
  UserProfile,
} from '../types/store';
import { ResilientImage } from './ResilientImage';

interface CartDrawerProps {
  isOpen: boolean;
  items: CartItem[];
  langCode: string;
  t: UITranslationKeys;
  user: User | null;
  userProfile: UserProfile | null;
  userCoupons: UserCoupon[];
  onOpenProfile: (tab?: 'profile' | 'quizzes' | 'orders') => void;
  onClose: () => void;
  onUpdateQuantity: (key: string, delta: number) => void;
  onRemoveItem: (key: string) => void;
  onClearCart: () => void;
}

type DrawerStep = 'cart' | 'checkout' | 'confirmation';

const FREE_DELIVERY_THRESHOLD = 2500;

export function CartDrawer({
  isOpen,
  items,
  langCode,
  t,
  user,
  userProfile,
  userCoupons,
  onOpenProfile,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
}: CartDrawerProps) {
  const [step, setStep] = useState<DrawerStep>('cart');
  const [form, setForm] = useState<CheckoutFormData>({
    customerName: '',
    phone: '',
    area: 'dhaka',
    address: '',
    deliveryNote: '',
  });
  const [saveToProfile, setSaveToProfile] = useState<boolean>(true);
  const [selectedCouponId, setSelectedCouponId] = useState<string>('');
  const [couponInput, setCouponInput] = useState<string>('');
  const [couponFeedback, setCouponFeedback] = useState<string>('');
  const [formError, setFormError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [confirmation, setConfirmation] = useState<OrderConfirmation | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && items.length === 0 && step === 'checkout') {
      setStep('cart');
    }
  }, [isOpen, items.length, step]);

  useEffect(() => {
    if (!userProfile) return;
    setForm((prev) => ({
      customerName: prev.customerName || userProfile.fullName,
      phone: prev.phone || userProfile.phone,
      area: prev.address ? prev.area : userProfile.defaultArea,
      address: prev.address || userProfile.defaultAddress,
      deliveryNote: prev.deliveryNote || userProfile.defaultNote || '',
    }));
  }, [userProfile]);

  useEffect(() => {
    if (!user) {
      setSelectedCouponId('');
      setCouponInput('');
      setCouponFeedback('');
    }
  }, [user]);

  if (!isOpen) return null;

  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );
  const unusedCoupons = userCoupons.filter((c) => !c.used);
  const activeCoupon =
    unusedCoupons.find(
      (c) => c.quizId === selectedCouponId && subtotal >= c.minOrderAmount,
    ) || null;
  const discountAmount = activeCoupon
    ? activeCoupon.discountType === 'fixed'
      ? Math.min(subtotal, Math.round(activeCoupon.discountValue))
      : Math.min(subtotal, Math.round((subtotal * activeCoupon.discountValue) / 100))
    : 0;

  const baseDeliveryFee = form.area === 'outside' ? 130 : 70;
  const deliveryFee =
    subtotal === 0 ? 0 : subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : baseDeliveryFee;
  const totalBill = Math.max(0, subtotal - discountAmount + deliveryFee);
  const remainingForFreeDelivery = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);

  const handleApplyCouponCode = () => {
    setCouponFeedback('');
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    const match = unusedCoupons.find((c) => c.couponCode.toUpperCase() === code);
    if (!match) {
      setCouponFeedback(
        'এই কুপন কোডটি আপনার প্রোফাইলে পাওয়া যায়নি বা ইতোমধ্যে ব্যবহৃত হয়েছে।',
      );
      return;
    }
    if (subtotal < match.minOrderAmount) {
      setCouponFeedback(
        `এই কুপন ব্যবহার করতে সর্বনিম্ন ${formatBDT(match.minOrderAmount, langCode)} মূল্যের পণ্য প্রয়োজন।`,
      );
      return;
    }
    setSelectedCouponId(match.quizId);
    setCouponFeedback('');
  };

  const handleCheckoutSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!form.customerName.trim()) {
      setFormError(
        langCode === 'bn'
          ? 'অনুগ্রহ করে ক্রেতার নাম লিখুন।'
          : 'Please enter your full name.',
      );
      return;
    }
    if (!form.phone.trim() || form.phone.trim().length < 6) {
      setFormError(
        langCode === 'bn'
          ? 'অনুগ্রহ করে একটি সঠিক মোবাইল নম্বর লিখুন (যেমন: 017XXXXXXXX)।'
          : 'Please enter a valid mobile number.',
      );
      return;
    }
    if (!form.address.trim() || form.address.trim().length < 4) {
      setFormError(
        langCode === 'bn'
          ? 'অনুগ্রহ করে সম্পূর্ণ ডেলিভারি ঠিকানা লিখুন।'
          : 'Please enter your complete delivery address.',
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const orderReceipt = await createOrderInFirestore(
        form,
        items.map((item) => ({
          productId: item.product.id,
          name: item.product.name,
          size: item.selectedSize,
          colorName: item.selectedColor.name,
          quantity: item.quantity,
          unitPrice: item.product.price,
        })),
        {
          userId: user?.emailVerified ? user.uid : undefined,
          coupon: activeCoupon,
        },
      );

      if (user?.emailVerified && saveToProfile) {
        try {
          await saveUserProfileToFirestore(
            user.uid,
            {
              fullName: form.customerName,
              phone: form.phone,
              defaultArea: form.area,
              defaultAddress: form.address,
              defaultNote: form.deliveryNote,
            },
            userProfile?.createdAt,
          );
        } catch {
          // Non-blocking profile sync after successful order
        }
      }

      setConfirmation(orderReceipt);
      setSelectedCouponId('');
      setCouponInput('');
      setStep('confirmation');
      onClearCart();
    } catch {
      setFormError(
        langCode === 'bn'
          ? 'অর্ডার সম্পন্ন করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।'
          : 'Could not complete order. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseDrawer = () => {
    if (step === 'confirmation') {
      setStep('cart');
      setConfirmation(null);
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex justify-end bg-black/50 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label={t.cartTitle}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleCloseDrawer();
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--brand-card, #FAF6EE)',
          borderColor: 'var(--brand-border, #D9CDB8)',
          color: 'var(--brand-ink, #1C1917)',
        }}
        className="w-full max-w-lg h-full flex flex-col shadow-2xl border-l"
      >
        {/* Drawer Header */}
        <div
          className="px-6 py-4 border-b flex items-center justify-between gap-4"
          style={{ borderColor: 'var(--brand-border, #D9CDB8)' }}
        >
          <div className="flex items-center gap-2.5">
            {step === 'checkout' && (
              <button
                type="button"
                onClick={() => {
                  setFormError('');
                  setStep('cart');
                }}
                aria-label="Back"
                className="w-9 h-9 flex items-center justify-center rounded-lg hover:opacity-75 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <h2 className="font-display text-lg font-bold">
              {step === 'cart' && t.cartTitle}
              {step === 'checkout' && t.checkoutTitle}
              {step === 'confirmation' && t.confirmTitle}
            </h2>
          </div>

          <button
            type="button"
            onClick={handleCloseDrawer}
            aria-label="Close"
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:opacity-75 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step === 'cart' && (
            <>
              {items.length === 0 ? (
                <div className="py-16 text-center">
                  <div
                    style={{
                      backgroundColor: 'var(--brand-card-alt, #EFE6D8)',
                      color: 'var(--brand-muted, #57534E)',
                    }}
                    className="w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center"
                  >
                    <ShoppingBag className="w-6 h-6" strokeWidth={1.5} />
                  </div>
                  <p className="font-display text-lg font-semibold mb-1.5">
                    {t.cartEmptyTitle}
                  </p>
                  <p
                    className="text-sm mb-6 max-w-xs mx-auto"
                    style={{ color: 'var(--brand-muted, #57534E)' }}
                  >
                    {t.cartEmptyDesc}
                  </p>
                  <button
                    type="button"
                    onClick={handleCloseDrawer}
                    style={{
                      backgroundColor: 'var(--brand-accent, #7A1C32)',
                      color: 'var(--brand-accent-ink, #FFFFFF)',
                    }}
                    className="px-5 py-2.5 min-h-[42px] text-sm font-medium rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
                  >
                    {t.exploreCollection}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div
                    style={{
                      backgroundColor: 'var(--brand-card-alt, #EFE6D8)',
                      borderColor: 'var(--brand-border, #D9CDB8)',
                      color: 'var(--brand-muted, #57534E)',
                    }}
                    className="px-4 py-3 rounded-lg border text-xs"
                  >
                    {remainingForFreeDelivery > 0 ? (
                      <span>
                        {t.freeDeliveryAddPrefix}{' '}
                        <strong
                          className="tabular-nums"
                          style={{ color: 'var(--brand-ink, #1C1917)' }}
                        >
                          {formatBDT(remainingForFreeDelivery, langCode)}
                        </strong>{' '}
                        {t.freeDeliveryAddSuffix}
                      </span>
                    ) : (
                      <span className="font-medium text-[#166534] dark:text-[#86EFAC]">
                        {t.freeDeliveryCongrats}
                      </span>
                    )}
                  </div>

                  <ul
                    className="divide-y"
                    style={{ borderColor: 'var(--brand-border, #D9CDB8)' }}
                  >
                    {items.map((item) => (
                      <li key={item.key} className="py-4 flex gap-4">
                        <div
                          style={{ borderColor: 'var(--brand-border, #D9CDB8)' }}
                          className="w-20 h-20 rounded-lg overflow-hidden border shrink-0"
                        >
                          <ResilientImage
                            src={item.product.image}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-sm font-semibold leading-snug line-clamp-2">
                              {item.product.name}
                            </h3>
                            <button
                              type="button"
                              onClick={() => onRemoveItem(item.key)}
                              aria-label="Remove item"
                              className="p-1 opacity-70 hover:text-[#B91C1C] transition-colors shrink-0 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <p
                            className="text-xs mt-1"
                            style={{ color: 'var(--brand-muted, #57534E)' }}
                          >
                            {item.selectedSize} · {item.selectedColor.name}
                          </p>

                          <div className="mt-3 flex items-center justify-between gap-3">
                            <div
                              style={{
                                borderColor: 'var(--brand-border, #D9CDB8)',
                                backgroundColor: 'var(--brand-card-alt, #EFE6D8)',
                              }}
                              className="inline-flex items-center border rounded-md"
                            >
                              <button
                                type="button"
                                onClick={() => onUpdateQuantity(item.key, -1)}
                                aria-label="Decrease"
                                className="w-8 h-8 flex items-center justify-center rounded-l-md cursor-pointer"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="w-8 text-center text-xs font-semibold tabular-nums">
                                {formatCount(item.quantity, langCode)}
                              </span>
                              <button
                                type="button"
                                onClick={() => onUpdateQuantity(item.key, 1)}
                                aria-label="Increase"
                                className="w-8 h-8 flex items-center justify-center rounded-r-md cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <span className="text-sm font-bold tabular-nums">
                              {formatBDT(item.product.price * item.quantity, langCode)}
                            </span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}

          {step === 'checkout' && (
            <form
              id="checkout-form"
              onSubmit={handleCheckoutSubmit}
              className="space-y-4"
            >
              {/* Profile Fast-Checkout Banner */}
              {user ? (
                <div
                  style={{
                    backgroundColor: 'var(--brand-card-alt, #EFE6D8)',
                    borderColor: 'var(--brand-border, #D9CDB8)',
                  }}
                  className="p-3 rounded-lg border flex flex-wrap items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <UserIcon
                      className="w-4 h-4 shrink-0"
                      style={{ color: 'var(--brand-accent, #7A1C32)' }}
                    />
                    <span>
                      {userProfile
                        ? 'আপনার সংরক্ষিত প্রোফাইল ঠিকানা থেকে তথ্য পূরণ করা হয়েছে।'
                        : 'লগইন সম্পন্ন — তথ্য দিয়ে অর্ডার করলে প্রোফাইল সেভ হয়ে যাবে।'}
                    </span>
                  </div>
                  <label className="inline-flex items-center gap-1.5 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={saveToProfile}
                      onChange={(e) => setSaveToProfile(e.target.checked)}
                      className="w-3.5 h-3.5 accent-[#7A1C32]"
                    />
                    <span>প্রোফাইলে সেভ রাখুন</span>
                  </label>
                </div>
              ) : (
                <div
                  style={{
                    backgroundColor: 'var(--brand-card-alt, #EFE6D8)',
                    borderColor: 'var(--brand-border, #D9CDB8)',
                  }}
                  className="p-3 rounded-lg border flex flex-wrap items-center justify-between gap-2 text-xs"
                >
                  <span>প্রোফাইল তৈরি বা কুইজ কুপন ব্যবহার করতে চান?</span>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenProfile('quizzes');
                    }}
                    style={{ color: 'var(--brand-accent, #7A1C32)' }}
                    className="font-semibold underline underline-offset-2 cursor-pointer"
                  >
                    প্রোফাইল ও কুইজ খুলুন
                  </button>
                </div>
              )}

              {formError && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 p-3.5 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-xs sm:text-sm text-[#991B1B]"
                >
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label htmlFor="checkout-name" className="block text-sm font-medium mb-1.5">
                  {t.customerNameLabel} *
                </label>
                <input
                  id="checkout-name"
                  type="text"
                  required
                  value={form.customerName}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, customerName: e.target.value }))
                  }
                  placeholder={t.customerNamePlaceholder}
                  style={{
                    backgroundColor: 'var(--brand-card-alt, #EFE6D8)',
                    borderColor: 'var(--brand-border, #D9CDB8)',
                    color: 'var(--brand-ink, #1C1917)',
                  }}
                  className="w-full px-3.5 py-2.5 min-h-[42px] text-sm border rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="checkout-phone" className="block text-sm font-medium mb-1.5">
                  {t.phoneLabel} *
                </label>
                <input
                  id="checkout-phone"
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  placeholder="01711-000000"
                  style={{
                    backgroundColor: 'var(--brand-card-alt, #EFE6D8)',
                    borderColor: 'var(--brand-border, #D9CDB8)',
                    color: 'var(--brand-ink, #1C1917)',
                  }}
                  className="w-full px-3.5 py-2.5 min-h-[42px] text-sm border rounded-lg focus:outline-none tabular-nums"
                />
              </div>

              <div>
                <span className="block text-sm font-medium mb-1.5">
                  {t.deliveryAreaLabel}
                </span>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, area: 'dhaka' }))}
                    style={{
                      borderColor:
                        form.area === 'dhaka'
                          ? 'var(--brand-accent, #7A1C32)'
                          : 'var(--brand-border, #D9CDB8)',
                      backgroundColor:
                        form.area === 'dhaka'
                          ? 'var(--brand-card-alt, #EFE6D8)'
                          : 'var(--brand-card, #FAF6EE)',
                    }}
                    className="px-3 py-2.5 min-h-[42px] text-xs sm:text-sm font-medium rounded-lg border transition-colors cursor-pointer"
                  >
                    {t.insideDhaka} ({formatBDT(70, langCode)})
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, area: 'outside' }))}
                    style={{
                      borderColor:
                        form.area === 'outside'
                          ? 'var(--brand-accent, #7A1C32)'
                          : 'var(--brand-border, #D9CDB8)',
                      backgroundColor:
                        form.area === 'outside'
                          ? 'var(--brand-card-alt, #EFE6D8)'
                          : 'var(--brand-card, #FAF6EE)',
                    }}
                    className="px-3 py-2.5 min-h-[42px] text-xs sm:text-sm font-medium rounded-lg border transition-colors cursor-pointer"
                  >
                    {t.outsideDhaka} ({formatBDT(130, langCode)})
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="checkout-address" className="block text-sm font-medium mb-1.5">
                  {t.addressLabel} *
                </label>
                <textarea
                  id="checkout-address"
                  required
                  rows={2}
                  value={form.address}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, address: e.target.value }))
                  }
                  placeholder={t.addressPlaceholder}
                  style={{
                    backgroundColor: 'var(--brand-card-alt, #EFE6D8)',
                    borderColor: 'var(--brand-border, #D9CDB8)',
                    color: 'var(--brand-ink, #1C1917)',
                  }}
                  className="w-full px-3.5 py-2.5 text-sm border rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="checkout-note" className="block text-sm font-medium mb-1.5">
                  {t.deliveryNoteLabel}
                </label>
                <input
                  id="checkout-note"
                  type="text"
                  value={form.deliveryNote}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, deliveryNote: e.target.value }))
                  }
                  placeholder={t.deliveryNotePlaceholder}
                  style={{
                    backgroundColor: 'var(--brand-card-alt, #EFE6D8)',
                    borderColor: 'var(--brand-border, #D9CDB8)',
                    color: 'var(--brand-ink, #1C1917)',
                  }}
                  className="w-full px-3.5 py-2.5 min-h-[42px] text-sm border rounded-lg focus:outline-none"
                />
              </div>

              {/* Earned Quiz Coupons Section */}
              {user && (
                <div
                  style={{
                    backgroundColor: 'var(--brand-card-alt, #EFE6D8)',
                    borderColor: 'var(--brand-border, #D9CDB8)',
                  }}
                  className="p-3.5 rounded-xl border space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold flex items-center gap-1.5">
                      <Tag
                        className="w-3.5 h-3.5"
                        style={{ color: 'var(--brand-accent, #7A1C32)' }}
                      />
                      <span>কুইজ ডিসকাউন্ট কুপন ({unusedCoupons.length})</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenProfile('quizzes');
                      }}
                      style={{ color: 'var(--brand-accent, #7A1C32)' }}
                      className="text-[11px] font-semibold underline cursor-pointer"
                    >
                      নতুন কুইজ খেলুন
                    </button>
                  </div>

                  {unusedCoupons.length > 0 && (
                    <div className="space-y-1.5">
                      {unusedCoupons.map((c) => {
                        const eligible = subtotal >= c.minOrderAmount;
                        const isPicked = activeCoupon?.quizId === c.quizId;
                        return (
                          <button
                            key={c.quizId}
                            type="button"
                            disabled={!eligible}
                            onClick={() =>
                              setSelectedCouponId(isPicked ? '' : c.quizId)
                            }
                            style={{
                              borderColor: isPicked
                                ? 'var(--brand-accent, #7A1C32)'
                                : 'var(--brand-border, #D9CDB8)',
                              backgroundColor: 'var(--brand-card, #FAF6EE)',
                            }}
                            className={`w-full px-3 py-2 rounded-lg border text-left text-xs flex items-center justify-between gap-2 transition-colors ${
                              eligible
                                ? 'cursor-pointer'
                                : 'opacity-55 cursor-not-allowed'
                            }`}
                          >
                            <div>
                              <span className="font-mono font-bold mr-2">
                                {c.couponCode}
                              </span>
                              <span>
                                ({c.discountType === 'percent' ? `${c.discountValue}%` : formatBDT(c.discountValue, langCode)} ছাড়)
                              </span>
                              {!eligible && (
                                <p className="text-[10px] text-[#991B1B] mt-0.5">
                                  সর্বনিম্ন অর্ডার {formatBDT(c.minOrderAmount, langCode)} প্রয়োজন
                                </p>
                              )}
                            </div>
                            <span
                              className="text-[11px] font-semibold"
                              style={{ color: 'var(--brand-accent, #7A1C32)' }}
                            >
                              {isPicked ? 'নির্বাচিত ✓' : eligible ? 'ব্যবহার করুন' : 'শর্ত অপূর্ণ'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder="কুপন কোড লিখুন (যদি থাকে)"
                      style={{
                        backgroundColor: 'var(--brand-card, #FAF6EE)',
                        borderColor: 'var(--brand-border, #D9CDB8)',
                        color: 'var(--brand-ink, #1C1917)',
                      }}
                      className="flex-1 min-w-0 px-3 py-1.5 text-xs border rounded-lg uppercase"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCouponCode}
                      style={{
                        backgroundColor: 'var(--brand-accent, #7A1C32)',
                        color: 'var(--brand-accent-ink, #FFFFFF)',
                      }}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer"
                    >
                      প্রয়োগ
                    </button>
                  </div>
                  {couponFeedback && (
                    <p className="text-[11px] text-[#991B1B]">{couponFeedback}</p>
                  )}
                </div>
              )}

              <div
                className="pt-3 border-t text-xs"
                style={{
                  borderColor: 'var(--brand-border, #D9CDB8)',
                  color: 'var(--brand-muted, #57534E)',
                }}
              >
                {t.paymentMethodLabel}{' '}
                <strong style={{ color: 'var(--brand-ink, #1C1917)' }}>
                  {t.codFullLabel}
                </strong>
              </div>
            </form>
          )}

          {step === 'confirmation' && confirmation && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#166534] mt-0.5 shrink-0" />
                <div>
                  <h3 className="text-sm font-bold text-[#14532D]">
                    {t.orderSuccessHeading}
                  </h3>
                  <p className="text-xs text-[#166534] mt-1">
                    {t.orderNoLabel}{' '}
                    <span className="font-bold tabular-nums">
                      #{confirmation.orderId}
                    </span>{' '}
                    · {confirmation.createdAt}
                  </p>
                </div>
              </div>

              <div
                style={{
                  backgroundColor: 'var(--brand-card-alt, #EFE6D8)',
                  borderColor: 'var(--brand-border, #D9CDB8)',
                }}
                className="p-4 rounded-xl border space-y-2 text-sm"
              >
                <div className="flex justify-between gap-4">
                  <span style={{ color: 'var(--brand-muted, #57534E)' }}>
                    {t.customerNameLabel}
                  </span>
                  <span className="font-medium text-right">
                    {confirmation.customerName}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span style={{ color: 'var(--brand-muted, #57534E)' }}>
                    {t.phoneLabel}
                  </span>
                  <span className="font-medium tabular-nums text-right">
                    {confirmation.phone}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span style={{ color: 'var(--brand-muted, #57534E)' }}>
                    {t.addressLabel}
                  </span>
                  <span className="text-right">{confirmation.address}</span>
                </div>
                {confirmation.deliveryNote && (
                  <div className="flex justify-between gap-4">
                    <span style={{ color: 'var(--brand-muted, #57534E)' }}>
                      {t.deliveryNoteLabel}
                    </span>
                    <span className="text-right">{confirmation.deliveryNote}</span>
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-2.5">{t.orderItemsTitle}</h4>
                <ul
                  style={{ borderColor: 'var(--brand-border, #D9CDB8)' }}
                  className="divide-y border rounded-xl px-4"
                >
                  {confirmation.items.map((item, idx) => (
                    <li
                      key={`${item.productId}-${idx}`}
                      className="py-3 flex items-start justify-between gap-3 text-sm"
                    >
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p
                          className="text-xs mt-0.5"
                          style={{ color: 'var(--brand-muted, #57534E)' }}
                        >
                          {item.size} · {item.colorName} · ×{' '}
                          <span className="tabular-nums">
                            {formatCount(item.quantity, langCode)}
                          </span>
                        </p>
                      </div>
                      <span className="font-semibold tabular-nums shrink-0">
                        {formatBDT(item.lineTotal, langCode)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div
                style={{ backgroundColor: 'var(--brand-card-alt, #EFE6D8)' }}
                className="p-4 rounded-xl space-y-2 text-sm"
              >
                <div
                  className="flex justify-between"
                  style={{ color: 'var(--brand-muted, #57534E)' }}
                >
                  <span>{t.subtotal}</span>
                  <span className="tabular-nums">
                    {formatBDT(confirmation.subtotal, langCode)}
                  </span>
                </div>
                {confirmation.discountAmount && confirmation.discountAmount > 0 && (
                  <div className="flex justify-between text-[#166534] font-medium">
                    <span>
                      {t.couponDiscountLabel} ({confirmation.couponCode})
                    </span>
                    <span className="tabular-nums">
                      - {formatBDT(confirmation.discountAmount, langCode)}
                    </span>
                  </div>
                )}
                <div
                  className="flex justify-between"
                  style={{ color: 'var(--brand-muted, #57534E)' }}
                >
                  <span>{t.deliveryCharge}</span>
                  <span className="tabular-nums">
                    {confirmation.deliveryFee === 0
                      ? t.freeWord
                      : formatBDT(confirmation.deliveryFee, langCode)}
                  </span>
                </div>
                <div
                  className="flex justify-between font-bold text-base pt-2 border-t"
                  style={{ borderColor: 'var(--brand-border, #D9CDB8)' }}
                >
                  <span>{t.totalPayable}</span>
                  <span
                    className="tabular-nums"
                    style={{ color: 'var(--brand-accent, #7A1C32)' }}
                  >
                    {formatBDT(confirmation.total, langCode)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        {(step === 'cart' && items.length > 0) || step === 'checkout' ? (
          <div
            style={{
              backgroundColor: 'var(--brand-card-alt, #EFE6D8)',
              borderColor: 'var(--brand-border, #D9CDB8)',
            }}
            className="px-6 py-4 border-t space-y-3"
          >
            <div className="space-y-1.5 text-sm">
              <div
                className="flex justify-between"
                style={{ color: 'var(--brand-muted, #57534E)' }}
              >
                <span>{t.subtotal}</span>
                <span className="tabular-nums font-medium">
                  {formatBDT(subtotal, langCode)}
                </span>
              </div>
              {discountAmount > 0 && activeCoupon && (
                <div className="flex justify-between text-[#166534] font-medium">
                  <span>
                    {t.couponDiscountLabel} ({activeCoupon.couponCode})
                  </span>
                  <span className="tabular-nums">
                    - {formatBDT(discountAmount, langCode)}
                  </span>
                </div>
              )}
              <div
                className="flex justify-between"
                style={{ color: 'var(--brand-muted, #57534E)' }}
              >
                <span>
                  {t.deliveryCharge} (
                  {form.area === 'outside' ? t.outsideDhaka : t.insideDhaka})
                </span>
                <span className="tabular-nums font-medium">
                  {deliveryFee === 0
                    ? t.freeWord
                    : formatBDT(deliveryFee, langCode)}
                </span>
              </div>
              <div
                className="flex justify-between text-base font-bold pt-1.5 border-t"
                style={{ borderColor: 'var(--brand-border, #D9CDB8)' }}
              >
                <span>{t.totalBill}</span>
                <span
                  className="tabular-nums"
                  style={{ color: 'var(--brand-accent, #7A1C32)' }}
                >
                  {formatBDT(totalBill, langCode)}
                </span>
              </div>
            </div>

            {step === 'cart' ? (
              <button
                type="button"
                onClick={() => setStep('checkout')}
                style={{
                  backgroundColor: 'var(--brand-accent, #7A1C32)',
                  color: 'var(--brand-accent-ink, #FFFFFF)',
                }}
                className="w-full py-3 min-h-[44px] text-sm font-semibold hover:opacity-90 rounded-lg transition-opacity cursor-pointer"
              >
                {t.proceedCheckout}
              </button>
            ) : (
              <button
                type="submit"
                form="checkout-form"
                disabled={isSubmitting}
                style={{
                  backgroundColor: 'var(--brand-accent, #7A1C32)',
                  color: 'var(--brand-accent-ink, #FFFFFF)',
                }}
                className="w-full py-3 min-h-[44px] text-sm font-semibold hover:opacity-90 disabled:opacity-60 rounded-lg transition-opacity cursor-pointer"
              >
                {isSubmitting ? t.processingOrder : t.confirmOrder}
              </button>
            )}
          </div>
        ) : step === 'confirmation' ? (
          <div
            style={{
              backgroundColor: 'var(--brand-card-alt, #EFE6D8)',
              borderColor: 'var(--brand-border, #D9CDB8)',
            }}
            className="px-6 py-4 border-t"
          >
            <button
              type="button"
              onClick={handleCloseDrawer}
              style={{
                backgroundColor: 'var(--brand-accent, #7A1C32)',
                color: 'var(--brand-accent-ink, #FFFFFF)',
              }}
              className="w-full py-3 min-h-[44px] text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
            >
              {t.continueShopping}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
