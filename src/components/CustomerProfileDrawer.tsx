import { useEffect, useState, type FormEvent } from 'react';
import { signInWithPopup, signOut, type User } from 'firebase/auth';
import {
  AlertCircle,
  Award,
  Check,
  CheckCircle2,
  Copy,
  Gift,
  HelpCircle,
  Loader2,
  LogOut,
  MapPin,
  Package,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Tag,
  User as UserIcon,
  X,
} from 'lucide-react';
import { formatBDT } from '../data/products';
import { auth, googleProvider } from '../lib/firebase';
import { computeQuizOptionDigest } from '../lib/quizCrypto';
import {
  claimQuizCouponInFirestore,
  saveUserProfileToFirestore,
} from '../lib/storeSync';
import type {
  QuizPublic,
  StoredOrder,
  UserCoupon,
  UserProfile,
} from '../types/store';

interface CustomerProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  isAdmin: boolean;
  profile: UserProfile | null;
  quizzes: QuizPublic[];
  coupons: UserCoupon[];
  orders: StoredOrder[];
  langCode: string;
  initialTab?: ProfileTab;
  onOpenCart: () => void;
  onOpenAdminStudio: () => void;
}

export type ProfileTab = 'profile' | 'quizzes' | 'orders';

export function CustomerProfileDrawer({
  isOpen,
  onClose,
  user,
  isAdmin,
  profile,
  quizzes,
  coupons,
  orders,
  langCode,
  initialTab = 'profile',
  onOpenCart,
  onOpenAdminStudio,
}: CustomerProfileDrawerProps) {
  const [activeTab, setActiveTab] = useState<ProfileTab>(initialTab);
  const [authLoading, setAuthLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Profile form state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [defaultArea, setDefaultArea] = useState<'dhaka' | 'outside'>('dhaka');
  const [defaultAddress, setDefaultAddress] = useState('');
  const [defaultNote, setDefaultNote] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Quiz state
  const [selectedOptions, setSelectedOptions] = useState<Record<string, number>>({});
  const [quizFeedback, setQuizFeedback] = useState<
    Record<string, { type: 'error' | 'success'; text: string }>
  >({});
  const [claimingQuizId, setClaimingQuizId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName);
      setPhone(profile.phone);
      setDefaultArea(profile.defaultArea);
      setDefaultAddress(profile.defaultAddress);
      setDefaultNote(profile.defaultNote);
    } else if (user) {
      setFullName((prev) => prev || user.displayName || '');
    }
  }, [profile, user]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const couponByQuizId = new Map(coupons.map((c) => [c.quizId, c]));
  const unusedCoupons = coupons.filter((c) => !c.used);

  const handleSignIn = async () => {
    setAuthLoading(true);
    setErrorMsg('');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? `সাইন-ইন করা যায়নি: ${err.message}`
          : 'Google সাইন-ইন করতে সমস্যা হয়েছে।',
      );
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setStatusMsg('');
    setErrorMsg('');
  };

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setErrorMsg('');
    setStatusMsg('');

    if (fullName.trim().length < 2) {
      setErrorMsg('আপনার পূর্ণ নাম লিখুন (কমপক্ষে ২ অক্ষর)।');
      return;
    }
    if (phone.trim().length < 6) {
      setErrorMsg('সঠিক মোবাইল নম্বর লিখুন।');
      return;
    }
    if (defaultAddress.trim().length < 4) {
      setErrorMsg('আপনার সম্পূর্ণ ডেলিভারি ঠিকানা লিখুন।');
      return;
    }

    setSavingProfile(true);
    try {
      await saveUserProfileToFirestore(
        user.uid,
        {
          fullName,
          phone,
          defaultArea,
          defaultAddress,
          defaultNote,
        },
        profile?.createdAt,
      );
      setStatusMsg(
        'আপনার প্রোফাইল ও ঠিকানা সেভ হয়েছে! এখন পরবর্তীতে যেকোনো অর্ডারে ঠিকানা স্বয়ংক্রিয়ভাবে পূরণ হবে।',
      );
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'প্রোফাইল সংরক্ষণ করা যায়নি।',
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSubmitQuiz = async (quiz: QuizPublic) => {
    if (!user) return;
    const chosenIdx = selectedOptions[quiz.id];
    if (typeof chosenIdx !== 'number') {
      setQuizFeedback((prev) => ({
        ...prev,
        [quiz.id]: {
          type: 'error',
          text: 'উত্তর জমা দেওয়ার আগে একটি অপশন নির্বাচন করুন।',
        },
      }));
      return;
    }

    setClaimingQuizId(quiz.id);
    setQuizFeedback((prev) => {
      const next = { ...prev };
      delete next[quiz.id];
      return next;
    });

    try {
      const digest = await computeQuizOptionDigest(
        quiz.id,
        chosenIdx,
        quiz.optionSalt,
      );
      if (digest !== quiz.optionDigest) {
        setQuizFeedback((prev) => ({
          ...prev,
          [quiz.id]: {
            type: 'error',
            text: 'উত্তরটি সঠিক হয়নি! একটু ভেবে আরেকটি অপশন নির্বাচন করে আবার চেষ্টা করুন।',
          },
        }));
        return;
      }

      await claimQuizCouponInFirestore(user.uid, quiz, chosenIdx);
      setQuizFeedback((prev) => ({
        ...prev,
        [quiz.id]: {
          type: 'success',
          text: `অভিনন্দন! আপনার "${quiz.couponCode}" কুপনটি প্রোফাইলে যুক্ত হয়েছে।`,
        },
      }));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'কুইজ যাচাই করতে সমস্যা হয়েছে।';
      setQuizFeedback((prev) => ({
        ...prev,
        [quiz.id]: {
          type: 'error',
          text: message.includes('PERMISSION_DENIED')
            ? 'উত্তরটি যাচাই করা যায়নি বা কুপনটি ইতোমধ্যে সংগ্রহ করা হয়েছে।'
            : message,
        },
      }));
    } finally {
      setClaimingQuizId(null);
    }
  };

  const handleCopyCoupon = (code: string) => {
    void navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    window.setTimeout(() => {
      setCopiedCode((prev) => (prev === code ? null : prev));
    }, 2000);
  };

  const formatCouponValue = (coupon: {
    discountType: 'fixed' | 'percent';
    discountValue: number;
  }) => {
    if (coupon.discountType === 'percent') {
      return `${coupon.discountValue}% ছাড়`;
    }
    return `${formatBDT(coupon.discountValue, langCode)} ছাড়`;
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex justify-end bg-black/50 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label="ক্রেতা প্রোফাইল ও কুইজ পুরস্কার"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-xl bg-[#FAF9F6] h-full flex flex-col shadow-2xl border-l border-[#E4E0D8]">
        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-[#E4E0D8] flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-display text-lg sm:text-xl font-bold text-[#1C1917] truncate">
              {user ? profile?.fullName || user.displayName || 'আমার প্রোফাইল' : 'আমার প্রোফাইল ও কুইজ'}
            </h2>
            <p className="text-xs text-[#57534E] mt-0.5 truncate">
              {user
                ? 'সংরক্ষিত ঠিকানায় দ্রুত অর্ডার ও কুইজ ডিসকাউন্ট কুপন'
                : 'প্রোফাইল তৈরি করুন · কুইজ খেলে জিতে নিন ডিসকাউন্ট কুপন'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {user && (
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#57534E] hover:text-[#1C1917] bg-[#F2F0EC] rounded-lg cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>লগআউট</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="প্রোফাইল বন্ধ করুন"
              className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[#F2F0EC] text-[#1C1917] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sign-in Welcome Gate */}
        {!user ? (
          <div className="flex-1 overflow-y-auto p-6 flex items-center justify-center">
            <div className="max-w-md w-full bg-white border border-[#E4E0D8] rounded-xl p-6 sm:p-7 space-y-5">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#F3ECE1] flex items-center justify-center text-[#7A1C32]">
                <UserIcon className="w-5 h-5" />
              </div>

              <div className="text-center space-y-2">
                <h3 className="font-display text-xl font-bold text-[#1C1917]">
                  আপনার মল্লিকা প্রোফাইল চালু করুন
                </h3>
                <p className="text-sm text-[#57534E] leading-relaxed">
                  মাত্র এক ক্লিকে নিজের প্রোফাইল তৈরি করে পরবর্তী কেনাকাটা আরও সহজ করুন এবং কুইজ খেলে ডিসকাউন্ট কুপন জিতুন।
                </p>
              </div>

              <div className="space-y-2.5 text-xs sm:text-sm text-[#1C1917] bg-[#FAF9F6] border border-[#E4E0D8] rounded-xl p-4">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#7A1C32] shrink-0 mt-0.5" />
                  <span>একবার ঠিকানা ও ফোন সেভ করলে পরবর্তীতে অটো-ফিল চেকআউট</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Award className="w-4 h-4 text-[#7A1C32] shrink-0 mt-0.5" />
                  <span>
                    {quizzes.length > 0
                      ? `${quizzes.length}টি অ্যাক্টিভ কুইজের উত্তর দিয়ে ইনস্ট্যান্ট ডিসকাউন্ট কুপন`
                      : 'অ্যাডমিনের তৈরি করা মজার কুইজে অংশ নিয়ে ডিসকাউন্ট কুপন'}
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Package className="w-4 h-4 text-[#7A1C32] shrink-0 mt-0.5" />
                  <span>আপনার পূর্বের সব অর্ডারের লাইভ স্ট্যাটাস ট্র্যাকিং</span>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#991B1B] flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleSignIn}
                disabled={authLoading}
                className="w-full py-3 px-5 min-h-[46px] bg-[#7A1C32] hover:bg-[#5E1425] disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {authLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>লগইন হচ্ছে...</span>
                  </>
                ) : (
                  <span>Google দিয়ে প্রোফাইল তৈরি / লগইন করুন</span>
                )}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Navigation Tabs */}
            <div className="px-4 sm:px-6 pt-3 bg-white border-b border-[#E4E0D8] flex items-center gap-2 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'profile'
                    ? 'border-[#7A1C32] text-[#7A1C32]'
                    : 'border-transparent text-[#57534E] hover:text-[#1C1917]'
                }`}
              >
                <UserIcon className="w-4 h-4" />
                <span>আমার প্রোফাইল</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('quizzes')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'quizzes'
                    ? 'border-[#7A1C32] text-[#7A1C32]'
                    : 'border-transparent text-[#57534E] hover:text-[#1C1917]'
                }`}
              >
                <Gift className="w-4 h-4" />
                <span>
                  কুইজ ও কুপন ({unusedCoupons.length > 0 ? `${unusedCoupons.length} সক্রিয়` : quizzes.length})
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'orders'
                    ? 'border-[#7A1C32] text-[#7A1C32]'
                    : 'border-transparent text-[#57534E] hover:text-[#1C1917]'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>আমার অর্ডার ({orders.length})</span>
              </button>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAdminStudio();
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs sm:text-sm font-semibold border-b-2 border-transparent text-[#7A1C32] hover:bg-[#FAF6EE] whitespace-nowrap cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>অ্যাডমিন প্যানেল</span>
                </button>
              )}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
              {statusMsg && (
                <div className="p-3 rounded-lg bg-[#F0FDF4] border border-[#BBF7D0] text-xs sm:text-sm text-[#166534] flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{statusMsg}</span>
                </div>
              )}
              {errorMsg && (
                <div className="p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-xs sm:text-sm text-[#991B1B] flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Owner-only Admin Studio Card inside Profile */}
              {isAdmin && activeTab === 'profile' && (
                <div className="bg-[#FAF6EE] border border-[#A67C33] rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7A1C32]">
                      <ShieldCheck className="w-4 h-4 shrink-0" />
                      <span>স্টোর অ্যাডমিন অ্যাক্সেস সক্রিয়</span>
                    </div>
                    <p className="text-xs text-[#57534E] leading-relaxed">
                      আপনার প্রোফাইল থেকেই দোকানের পণ্য, ছবি, রেট, কালার থিম, ঠিকানা, কুইজ ও অর্ডার পরিচালনা করতে পারবেন।
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAdminStudio();
                    }}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[40px] bg-[#7A1C32] hover:bg-[#5E1425] text-white text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>অ্যাডমিন প্যানেল খুলুন</span>
                  </button>
                </div>
              )}

              {/* Tab 1: Profile Form */}
              {activeTab === 'profile' && (
                <form
                  onSubmit={handleSaveProfile}
                  className="bg-white border border-[#E4E0D8] rounded-xl p-5 space-y-4"
                >
                  <div>
                    <h3 className="text-base font-semibold text-[#1C1917]">
                      সংরক্ষিত ডেলিভারি প্রোফাইল
                    </h3>
                    <p className="text-xs text-[#57534E] mt-0.5">
                      একবার আপনার নাম, ফোন ও ঠিকানা সেভ রাখলে পরবর্তীতে অর্ডার করার সময় আর বারবার লিখতে হবে না।
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#1C1917] mb-1">
                      আপনার পূর্ণ নাম
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={100}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="যেমন: তানভীর আহমেদ"
                      className="w-full px-3.5 py-2.5 text-sm bg-[#FAF9F6] border border-[#E4E0D8] rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#1C1917] mb-1">
                      মোবাইল নম্বর
                    </label>
                    <input
                      type="tel"
                      required
                      maxLength={24}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="০১৭XX-XXXXXX"
                      className="w-full px-3.5 py-2.5 text-sm bg-[#FAF9F6] border border-[#E4E0D8] rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#1C1917] mb-1.5">
                      ডিফল্ট ডেলিভারি এলাকা
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setDefaultArea('dhaka')}
                        className={`p-3 rounded-lg border text-xs font-medium text-left cursor-pointer ${
                          defaultArea === 'dhaka'
                            ? 'bg-[#7A1C32] text-white border-[#7A1C32]'
                            : 'bg-[#FAF9F6] text-[#1C1917] border-[#E4E0D8]'
                        }`}
                      >
                        ঢাকার ভেতরে (৳ ৭০)
                      </button>
                      <button
                        type="button"
                        onClick={() => setDefaultArea('outside')}
                        className={`p-3 rounded-lg border text-xs font-medium text-left cursor-pointer ${
                          defaultArea === 'outside'
                            ? 'bg-[#7A1C32] text-white border-[#7A1C32]'
                            : 'bg-[#FAF9F6] text-[#1C1917] border-[#E4E0D8]'
                        }`}
                      >
                        ঢাকার বাইরে (৳ ১৩০)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#1C1917] mb-1">
                      সম্পূর্ণ ডেলিভারি ঠিকানা
                    </label>
                    <textarea
                      rows={3}
                      required
                      maxLength={300}
                      value={defaultAddress}
                      onChange={(e) => setDefaultAddress(e.target.value)}
                      placeholder="বাসা/ফ্ল্যাট নং, রোড, এলাকা ও জেলার নাম লিখুন"
                      className="w-full px-3.5 py-2.5 text-sm bg-[#FAF9F6] border border-[#E4E0D8] rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#1C1917] mb-1">
                      ডিফল্ট ডেলিভারি নোট (ঐচ্ছিক)
                    </label>
                    <input
                      type="text"
                      maxLength={240}
                      value={defaultNote}
                      onChange={(e) => setDefaultNote(e.target.value)}
                      placeholder="যেমন: বিকেল ৪টার পর কল দিয়ে আসবেন"
                      className="w-full px-3.5 py-2.5 text-sm bg-[#FAF9F6] border border-[#E4E0D8] rounded-lg"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="w-full py-3 px-5 min-h-[44px] bg-[#7A1C32] hover:bg-[#5E1425] disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {savingProfile ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>সেভ হচ্ছে...</span>
                      </>
                    ) : (
                      <span>{profile ? 'প্রোফাইল আপডেট করুন' : 'প্রোফাইল তৈরি ও সেভ করুন'}</span>
                    )}
                  </button>
                </form>
              )}

              {/* Tab 2: Quizzes & Earned Coupons */}
              {activeTab === 'quizzes' && (
                <div className="space-y-6">
                  {/* Earned Coupons Wallet */}
                  <div className="bg-white border border-[#E4E0D8] rounded-xl p-5 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-base font-semibold text-[#1C1917] flex items-center gap-2">
                        <Tag className="w-4 h-4 text-[#7A1C32]" />
                        <span>আপনার অর্জিত ডিসকাউন্ট কুপন ({coupons.length})</span>
                      </h3>
                      {unusedCoupons.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenCart();
                          }}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#7A1C32] hover:underline cursor-pointer"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>চেকআউটে ব্যবহার করুন</span>
                        </button>
                      )}
                    </div>

                    {coupons.length === 0 ? (
                      <p className="text-xs text-[#57534E] bg-[#FAF9F6] border border-[#E4E0D8] rounded-lg p-3.5">
                        এখনো কোনো কুপন সংগ্রহ করেননি। নিচের কুইজগুলোর সঠিক উত্তর দিয়ে এখনই ডিসকাউন্ট কুপন জিতে নিন!
                      </p>
                    ) : (
                      <div className="space-y-2.5">
                        {coupons.map((coupon) => (
                          <div
                            key={coupon.quizId}
                            className={`p-3.5 rounded-lg border flex flex-wrap items-center justify-between gap-3 ${
                              coupon.used
                                ? 'bg-[#F2F0EC] border-[#E4E0D8] opacity-70'
                                : 'bg-[#FDF8EE] border-[#D4AF37]/50'
                            }`}
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm font-bold text-[#7A1C32] tracking-wider">
                                  {coupon.couponCode}
                                </span>
                                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#7A1C32] text-white">
                                  {formatCouponValue(coupon)}
                                </span>
                                {coupon.used ? (
                                  <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-[#E4E0D8] text-[#57534E]">
                                    ব্যবহৃত {coupon.usedInOrderId ? `(${coupon.usedInOrderId})` : ''}
                                  </span>
                                ) : (
                                  <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-[#DCFCE7] text-[#166534]">
                                    ব্যবহারযোগ্য
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-[#57534E]">
                                {coupon.rewardTitle}
                                {coupon.minOrderAmount > 0
                                  ? ` · সর্বনিম্ন অর্ডার ${formatBDT(coupon.minOrderAmount, langCode)}`
                                  : ''}
                              </p>
                            </div>

                            {!coupon.used && (
                              <button
                                type="button"
                                onClick={() => handleCopyCoupon(coupon.couponCode)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-white border border-[#E4E0D8] hover:border-[#7A1C32] rounded-md text-[#1C1917] cursor-pointer"
                              >
                                {copiedCode === coupon.couponCode ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-[#166534]" />
                                    <span>কপি হয়েছে</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>কোড কপি</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Active Store Quizzes */}
                  <div className="space-y-3">
                    <h3 className="text-base font-semibold text-[#1C1917] flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-[#7A1C32]" />
                      <span>চলমান স্টোর কুইজ ({quizzes.length})</span>
                    </h3>

                    {quizzes.length === 0 ? (
                      <div className="bg-white border border-[#E4E0D8] rounded-xl p-6 text-center text-sm text-[#57534E]">
                        এই মুহূর্তে কোনো সক্রিয় কুইজ নেই। অ্যাডমিন নতুন কুইজ যোগ করলে এখানে দেখা যাবে।
                      </div>
                    ) : (
                      quizzes.map((quiz, qIdx) => {
                        const unlocked = couponByQuizId.get(quiz.id);
                        const feedback = quizFeedback[quiz.id];
                        const chosen = selectedOptions[quiz.id];

                        return (
                          <div
                            key={quiz.id}
                            className="bg-white border border-[#E4E0D8] rounded-xl p-5 space-y-3.5"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="text-xs font-semibold text-[#7A1C32]">
                                কুইজ #{qIdx + 1} · {quiz.rewardTitle}
                              </span>
                              <span className="text-[11px] font-medium px-2.5 py-0.5 rounded bg-[#F3ECE1] text-[#1C1917]">
                                পুরস্কার: {formatCouponValue(quiz)}
                              </span>
                            </div>

                            <p className="text-sm font-semibold text-[#1C1917] leading-relaxed">
                              {quiz.question}
                            </p>

                            {unlocked ? (
                              <div className="p-3.5 rounded-lg bg-[#F0FDF4] border border-[#BBF7D0] text-xs sm:text-sm text-[#166534] flex items-start justify-between gap-3">
                                <div className="flex items-start gap-2">
                                  <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
                                  <div>
                                    <p className="font-semibold">
                                      সঠিক উত্তর! কুপন আনলক হয়েছে
                                    </p>
                                    <p className="mt-0.5">
                                      কুপন কোড: <strong className="font-mono">{unlocked.couponCode}</strong>{' '}
                                      ({unlocked.used ? 'ব্যবহৃত' : 'চেকআউটে ব্যবহার করতে পারবেন'})
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="space-y-2">
                                  {quiz.options.map((optionText, optIdx) => {
                                    const isSelected = chosen === optIdx;
                                    return (
                                      <button
                                        key={optIdx}
                                        type="button"
                                        onClick={() => {
                                          setSelectedOptions((prev) => ({
                                            ...prev,
                                            [quiz.id]: optIdx,
                                          }));
                                          setQuizFeedback((prev) => {
                                            const next = { ...prev };
                                            delete next[quiz.id];
                                            return next;
                                          });
                                        }}
                                        className={`w-full text-left px-3.5 py-2.5 rounded-lg border text-sm transition-colors flex items-center gap-2.5 cursor-pointer ${
                                          isSelected
                                            ? 'bg-[#FDF4F5] border-[#7A1C32] text-[#7A1C32] font-medium'
                                            : 'bg-[#FAF9F6] border-[#E4E0D8] text-[#1C1917] hover:bg-[#F2F0EC]'
                                        }`}
                                      >
                                        <span
                                          className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                            isSelected
                                              ? 'border-[#7A1C32] bg-[#7A1C32]'
                                              : 'border-[#A8A29E] bg-white'
                                          }`}
                                        >
                                          {isSelected && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-white" />
                                          )}
                                        </span>
                                        <span>{optionText}</span>
                                      </button>
                                    );
                                  })}
                                </div>

                                {feedback && (
                                  <div
                                    className={`p-3 rounded-lg text-xs flex items-start gap-2 ${
                                      feedback.type === 'success'
                                        ? 'bg-[#F0FDF4] border border-[#BBF7D0] text-[#166534]'
                                        : 'bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B]'
                                    }`}
                                  >
                                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                    <span>{feedback.text}</span>
                                  </div>
                                )}

                                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                                  <span className="text-[11px] text-[#57534E]">
                                    {quiz.minOrderAmount > 0
                                      ? `সর্বনিম্ন অর্ডার: ${formatBDT(quiz.minOrderAmount, langCode)}`
                                      : 'যেকোনো অর্ডারে প্রযোজ্য'}
                                  </span>
                                  <button
                                    type="button"
                                    disabled={claimingQuizId === quiz.id}
                                    onClick={() => void handleSubmitQuiz(quiz)}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[38px] bg-[#7A1C32] hover:bg-[#5E1425] disabled:opacity-60 text-white text-xs font-semibold rounded-lg cursor-pointer"
                                  >
                                    {claimingQuizId === quiz.id ? (
                                      <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        <span>যাচাই হচ্ছে...</span>
                                      </>
                                    ) : (
                                      <>
                                        <Award className="w-3.5 h-3.5" />
                                        <span>উত্তর জমা ও কুপন জিতুন</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* Tab 3: Personal Order History */}
              {activeTab === 'orders' && (
                <div className="space-y-3">
                  <h3 className="text-base font-semibold text-[#1C1917]">
                    আপনার অর্ডার ইতিহাস
                  </h3>
                  {orders.length === 0 ? (
                    <div className="bg-white border border-[#E4E0D8] rounded-xl p-8 text-center text-sm text-[#57534E]">
                      লগইন অবস্থায় এখনো কোনো অর্ডার করেননি।
                    </div>
                  ) : (
                    orders.map((order) => (
                      <div
                        key={order.docId}
                        className="bg-white border border-[#E4E0D8] rounded-xl p-4 space-y-2.5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <span className="text-sm font-bold text-[#1C1917] tabular-nums">
                              #{order.orderId}
                            </span>
                            <span className="text-xs text-[#57534E] ml-2">
                              {order.createdAt}
                            </span>
                          </div>
                          <span className="text-xs font-semibold px-2.5 py-1 rounded bg-[#F3ECE1] text-[#7A1C32]">
                            {order.status}
                          </span>
                        </div>
                        <p className="text-xs text-[#57534E]">
                          {order.items
                            .map((i) => `${i.name} (${i.size}) × ${i.quantity}`)
                            .join(' · ')}
                        </p>
                        <p className="text-xs text-[#57534E]">
                          ঠিকানা: {order.areaLabel}, {order.address}
                        </p>
                        <div className="pt-2 border-t border-[#E4E0D8] flex flex-wrap items-center justify-between gap-2 text-xs">
                          <span>
                            {order.discountAmount && order.discountAmount > 0
                              ? `কুপন ছাড় (${order.couponCode}): -${formatBDT(order.discountAmount, langCode)}`
                              : order.paymentMethod}
                          </span>
                          <span className="text-sm font-bold text-[#7A1C32] tabular-nums">
                            মোট: {formatBDT(order.total, langCode)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
