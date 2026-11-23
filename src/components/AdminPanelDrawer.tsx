import { useEffect, useState, type FormEvent } from 'react';
import {
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {
  AlertCircle,
  ArrowLeft,
  Award,
  Camera,
  Check,
  Edit3,
  Globe,
  ImagePlus,
  Layers,
  Loader2,
  Lock,
  LogOut,
  Package,
  Palette,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  AVAILABLE_STUDIO_IMAGES,
  CATEGORIES,
  DEFAULT_DESIGN_SETTINGS,
  THEME_PRESETS,
  formatBDT,
  type QuizSeedInput,
} from '../data/products';
import { auth, googleProvider } from '../lib/firebase';
import { uploadProductImageFromDevice } from '../lib/imageUpload';
import {
  deleteProductFromFirestore,
  deleteQuizAdmin,
  publishAllDraftProducts,
  saveDesignSettings,
  saveProductToFirestore,
  saveQuizAdmin,
  seedStarterQuizzesIfEmpty,
  updateOrderStatusInFirestore,
} from '../lib/storeSync';
import type {
  BannerSpeedOption,
  CardImageRatioOption,
  CardRadiusOption,
  OrderStatus,
  Product,
  ProductColor,
  QuizAdminItem,
  StoreDesignSettings,
  StoredOrder,
} from '../types/store';
import { ResilientImage } from './ResilientImage';

interface AdminPanelDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  isAdmin: boolean;
  products: Product[];
  publishedDesign: StoreDesignSettings;
  draftDesign: StoreDesignSettings | null;
  orders: StoredOrder[];
  quizzes: QuizAdminItem[];
  onPreviewDesign: (preview: StoreDesignSettings | null) => void;
  onBackToProfile?: () => void;
}

type AdminTab = 'products' | 'design' | 'quizzes' | 'orders';

const EMPTY_PRODUCT: Product = {
  id: '',
  name: '',
  englishKeywords: '',
  category: 'saree-threepiece',
  categoryLabel: 'শাড়ি ও থ্রি-পিস',
  subCategory: 'শাড়ি',
  price: 1500,
  originalPrice: null,
  image: AVAILABLE_STUDIO_IMAGES[1].url,
  shortDescription: '',
  description: '',
  fabric: '১০০% খাঁটি সুতি',
  careNote: 'সাধারণ তাপমাত্রার পানিতে হালকা ডিটারজেন্টে ধুয়ে নিন।',
  sizes: ['M', 'L', 'XL'],
  colors: [{ name: 'মেরুন', hex: '#881337' }],
  stockStatus: 'স্টকে আছে',
  featuredTag: '',
  published: true,
  sortOrder: 50,
};

const ORDER_STATUSES: OrderStatus[] = [
  'নতুন অর্ডার',
  'প্রসেসিং',
  'ডেলিভারির পথে',
  'সম্পন্ন',
  'বাতিল',
];

export function AdminPanelDrawer({
  isOpen,
  onClose,
  user,
  isAdmin,
  products,
  publishedDesign,
  draftDesign,
  orders,
  quizzes,
  onPreviewDesign,
  onBackToProfile,
}: AdminPanelDrawerProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('products');
  const [authLoading, setAuthLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Product editor state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [sizesInput, setSizesInput] = useState<string>('');
  const [isNewProduct, setIsNewProduct] = useState<boolean>(false);
  const [savingProduct, setSavingProduct] = useState<boolean>(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Quick rate edit inline state & separate mobile picture manager state
  const [quickRates, setQuickRates] = useState<Record<string, string>>({});
  const [photoManagerProductId, setPhotoManagerProductId] = useState<string | null>(null);
  const [uploadingTarget, setUploadingTarget] = useState<string | null>(null);

  // Design editor state
  const [designForm, setDesignForm] = useState<StoreDesignSettings>(
    draftDesign || publishedDesign,
  );
  const [savingDesign, setSavingDesign] = useState<boolean>(false);

  // Quiz editor state
  const [editingQuiz, setEditingQuiz] = useState<QuizSeedInput | null>(null);
  const [savingQuiz, setSavingQuiz] = useState<boolean>(false);

  useEffect(() => {
    setDesignForm(draftDesign || publishedDesign);
  }, [draftDesign, publishedDesign, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      onPreviewDesign(null);
      return;
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onPreviewDesign]);

  if (!isOpen) return null;

  const draftCount = products.filter((p) => p.published === false).length;

  const showSuccess = (msg: string) => {
    setErrorMessage('');
    setStatusMessage(msg);
    window.setTimeout(() => {
      setStatusMessage((prev) => (prev === msg ? '' : prev));
    }, 3500);
  };

  const handleSignIn = async () => {
    setAuthLoading(true);
    setErrorMessage('');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? `লগইন করা যায়নি: ${err.message}`
          : 'লগইন করতে সমস্যা হয়েছে।',
      );
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    onPreviewDesign(null);
  };

  const openEditProduct = (product: Product) => {
    setEditingProduct({
      ...product,
      colors: product.colors.map((c) => ({ ...c })),
      sizes: [...product.sizes],
    });
    setSizesInput(product.sizes.join(', '));
    setIsNewProduct(false);
    setErrorMessage('');
  };

  const openCreateProduct = () => {
    const newId = `mfh-item-${Date.now().toString().slice(-6)}`;
    const base = {
      ...EMPTY_PRODUCT,
      id: newId,
      sortOrder: products.length + 1,
    };
    setEditingProduct(base);
    setSizesInput(base.sizes.join(', '));
    setIsNewProduct(true);
    setErrorMessage('');
  };

  const handleSaveProduct = async (publishNow: boolean, e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!editingProduct || !user) return;

    if (!editingProduct.name.trim()) {
      setErrorMessage('পণ্যের নাম লিখুন।');
      return;
    }
    if (Number(editingProduct.price) < 1) {
      setErrorMessage('পণ্যের সঠিক মূল্য (৳) লিখুন।');
      return;
    }

    const parsedSizes = sizesInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const catInfo = CATEGORIES.find((c) => c.key === editingProduct.category);
    const updatedProduct: Product = {
      ...editingProduct,
      categoryLabel: catInfo ? catInfo.label : editingProduct.categoryLabel,
      sizes: parsedSizes.length > 0 ? parsedSizes : ['স্ট্যান্ডার্ড'],
      colors:
        editingProduct.colors.length > 0
          ? editingProduct.colors
          : [{ name: 'ডিফল্ট', hex: '#1C1917' }],
    };

    setSavingProduct(true);
    setErrorMessage('');
    try {
      await saveProductToFirestore(updatedProduct, user.uid, publishNow);
      setEditingProduct(null);
      showSuccess(
        publishNow
          ? 'পণ্যটি সেভ ও লাইভ পাবলিশ হয়েছে — ক্রেতারা এখনই দেখতে পাচ্ছেন।'
          : 'পণ্যটি ড্রাফট হিসেবে সংরক্ষিত হয়েছে।',
      );
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'পণ্য সংরক্ষণ করা যায়নি।',
      );
    } finally {
      setSavingProduct(false);
    }
  };

  const handleQuickRateSave = async (product: Product) => {
    if (!user) return;
    const raw = quickRates[product.id];
    const nextPrice = Math.round(Number(raw));
    if (!Number.isFinite(nextPrice) || nextPrice < 1) {
      setErrorMessage('সঠিক রেট (১ টাকা বা তার বেশি) লিখুন।');
      return;
    }
    setErrorMessage('');
    try {
      await saveProductToFirestore(
        { ...product, price: nextPrice },
        user.uid,
        product.published !== false,
      );
      setQuickRates((prev) => {
        const copy = { ...prev };
        delete copy[product.id];
        return copy;
      });
      showSuccess(`"${product.name}"-এর নতুন রেট (${formatBDT(nextPrice)}) লাইভ আপডেট হয়েছে।`);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'রেট আপডেট করা যায়নি।',
      );
    }
  };

  const handlePublishAllDrafts = async () => {
    if (!user) return;
    try {
      const count = await publishAllDraftProducts(products, user.uid);
      if (count > 0) {
        showSuccess(`${count.toLocaleString('bn-BD')}টি ড্রাফট পণ্য লাইভ পাবলিশ করা হয়েছে।`);
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'ড্রাফট পাবলিশ করা যায়নি।',
      );
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      await deleteProductFromFirestore(productId);
      setConfirmDeleteId(null);
      showSuccess('পণ্যটি ক্যাটালগ থেকে মুছে ফেলা হয়েছে।');
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'পণ্য মুছে ফেলা যায়নি।',
      );
    }
  };

  const handleDesignChange = (patch: Partial<StoreDesignSettings>) => {
    const next = { ...designForm, ...patch };
    setDesignForm(next);
    onPreviewDesign(next);
  };

  const handleSaveDesign = async (target: 'draft' | 'published') => {
    if (!user) return;
    setSavingDesign(true);
    setErrorMessage('');
    try {
      await saveDesignSettings(designForm, user.uid, target);
      if (target === 'published') {
        onPreviewDesign(null);
        showSuccess(
          'স্টোরের ডিজাইন ও কালার থিম লাইভ পাবলিশ হয়েছে — সব ক্রেতা এখনই দেখতে পাবেন!',
        );
      } else {
        showSuccess('ডিজাইন ড্রাফট হিসেবে সংরক্ষিত হয়েছে।');
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'ডিজাইন সেভ করা যায়নি।',
      );
    } finally {
      setSavingDesign(false);
    }
  };

  const handleResetDesign = () => {
    setDesignForm(DEFAULT_DESIGN_SETTINGS);
    onPreviewDesign(DEFAULT_DESIGN_SETTINGS);
  };

  const handleUpdateOrderStatus = async (docId: string, status: OrderStatus) => {
    try {
      await updateOrderStatusInFirestore(docId, status);
      showSuccess(`অর্ডার স্ট্যাটাস "${status}" হিসেবে আপডেট হয়েছে।`);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'অর্ডার স্ট্যাটাস আপডেট করা যায়নি।',
      );
    }
  };

  const updateProductColor = (idx: number, patch: Partial<ProductColor>) => {
    if (!editingProduct) return;
    const nextColors = editingProduct.colors.map((c, i) =>
      i === idx ? { ...c, ...patch } : c,
    );
    setEditingProduct({ ...editingProduct, colors: nextColors });
  };

  const addProductColor = () => {
    if (!editingProduct || editingProduct.colors.length >= 10) return;
    setEditingProduct({
      ...editingProduct,
      colors: [
        ...editingProduct.colors,
        { name: 'নতুন রঙ', hex: '#1E3A5F' },
      ],
    });
  };

  const removeProductColor = (idx: number) => {
    if (!editingProduct || editingProduct.colors.length <= 1) return;
    setEditingProduct({
      ...editingProduct,
      colors: editingProduct.colors.filter((_, i) => i !== idx),
    });
  };

  const handleQuickProductImageUpload = async (
    product: Product,
    files: FileList | null,
    mode: 'main' | 'gallery',
  ) => {
    if (!files || files.length === 0 || !user) return;
    const file = files[0];
    setUploadingTarget(`quick-${product.id}-${mode}`);
    setErrorMessage('');
    try {
      const uploadedUrl = await uploadProductImageFromDevice(file);
      const currentGallery = product.galleryImages || [];
      const updatedProduct: Product =
        mode === 'main'
          ? { ...product, image: uploadedUrl }
          : {
              ...product,
              galleryImages: [...currentGallery, uploadedUrl].slice(0, 5),
            };

      await saveProductToFirestore(
        updatedProduct,
        user.uid,
        product.published !== false,
      );
      showSuccess(
        mode === 'main'
          ? `"${product.name}"-এর মূল ছবি আপডেট ও লাইভ হয়েছে।`
          : `"${product.name}"-এ নতুন ছবি যুক্ত হয়েছে।`,
      );
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'ছবি আপলোড করা যায়নি।',
      );
    } finally {
      setUploadingTarget(null);
    }
  };

  const handleRemoveQuickGalleryImage = async (
    product: Product,
    urlToRemove: string,
  ) => {
    if (!user) return;
    try {
      const nextGallery = (product.galleryImages || []).filter(
        (u) => u !== urlToRemove,
      );
      await saveProductToFirestore(
        { ...product, galleryImages: nextGallery },
        user.uid,
        product.published !== false,
      );
      showSuccess('অতিরিক্ত ছবিটি সরানো হয়েছে।');
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'ছবিটি সরানো যায়নি।',
      );
    }
  };

  const handlePromoteGalleryToMain = async (
    product: Product,
    newMainUrl: string,
  ) => {
    if (!user) return;
    try {
      const restGallery = (product.galleryImages || []).filter(
        (u) => u !== newMainUrl,
      );
      const nextGallery = [product.image, ...restGallery]
        .filter((u) => u && u !== newMainUrl)
        .slice(0, 5);
      await saveProductToFirestore(
        { ...product, image: newMainUrl, galleryImages: nextGallery },
        user.uid,
        product.published !== false,
      );
      showSuccess('নির্বাচিত ছবিটি মূল ছবি হিসেবে সেট হয়েছে।');
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'মূল ছবি পরিবর্তন করা যায়নি।',
      );
    }
  };

  const handleEditorImageUpload = async (
    files: FileList | null,
    mode: 'main' | 'gallery',
  ) => {
    if (!files || files.length === 0 || !editingProduct) return;
    setUploadingTarget(`editor-${mode}`);
    setErrorMessage('');
    try {
      const uploadedUrl = await uploadProductImageFromDevice(files[0]);
      if (mode === 'main') {
        setEditingProduct({ ...editingProduct, image: uploadedUrl });
      } else {
        const currentGallery = editingProduct.galleryImages || [];
        setEditingProduct({
          ...editingProduct,
          galleryImages: [...currentGallery, uploadedUrl].slice(0, 5),
        });
      }
      showSuccess('মোবাইল থেকে ছবি আপলোড সম্পন্ন হয়েছে।');
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'ছবি আপলোড করা যায়নি।',
      );
    } finally {
      setUploadingTarget(null);
    }
  };

  const handleHeroImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadingTarget('hero');
    setErrorMessage('');
    try {
      const uploadedUrl = await uploadProductImageFromDevice(files[0]);
      handleDesignChange({ heroImage: uploadedUrl });
      showSuccess('হিরো ব্যানারের নতুন ছবি আপলোড হয়েছে।');
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'ব্যানার ছবি আপলোড করা যায়নি।',
      );
    } finally {
      setUploadingTarget(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex justify-end bg-[#1C1917]/50 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label="মল্লিকা ফ্যাশন হাউস — অ্যাডমিন প্যানেল ও লাইভ পাবলিশ স্টুডিও"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-3xl bg-[#FAF9F6] h-full flex flex-col shadow-2xl border-l border-[#E4E0D8]">
        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-[#E4E0D8] flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-lg sm:text-xl font-bold text-[#1C1917]">
              মল্লিকা ফ্যাশন হাউস · অ্যাডমিন স্টুডিও
            </h2>
            <p className="text-xs text-[#57534E] mt-0.5">
              পণ্য, ছবি, রেট, কালার ও স্টোর ডিজাইন পরিবর্তন করে লাইভ পাবলিশ করুন
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onBackToProfile && (
              <button
                type="button"
                onClick={onBackToProfile}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#7A1C32] bg-[#FAF6EE] border border-[#E4E0D8] hover:bg-[#F3ECE1] rounded-lg cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>প্রোফাইল</span>
              </button>
            )}
            {user && (
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#57534E] hover:text-[#1C1917] bg-[#F2F0EC] rounded-lg cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>লগআউট</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="অ্যাডমিন প্যানেল বন্ধ করুন"
              className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[#F2F0EC] text-[#1C1917] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Auth Gate or Admin Workspace */}
        {!user ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-white border border-[#E4E0D8] rounded-xl p-7 text-center space-y-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#F2F0EC] flex items-center justify-center text-[#7A1C32]">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="font-display text-xl font-bold text-[#1C1917]">
                অ্যাডমিন স্টুডিও লগইন
              </h3>
              <p className="text-sm text-[#57534E] leading-relaxed">
                সকল পণ্য, রেট, কালার, চলমান ব্যানার ও স্টোরের লাক্সারি থিম
                পরিবর্তন করে লাইভ পাবলিশ করতে অনুমোদিত অ্যাডমিন Google
                অ্যাকাউন্ট দিয়ে সাইন-ইন করুন।
              </p>

              {errorMessage && (
                <div className="p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#991B1B] text-left flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleSignIn}
                disabled={authLoading}
                className="w-full py-3 px-5 min-h-[44px] bg-[#1C1917] hover:bg-[#7A1C32] disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
              >
                {authLoading
                  ? 'যাচাই করা হচ্ছে...'
                  : 'Google দিয়ে অ্যাডমিন লগইন করুন'}
              </button>
            </div>
          </div>
        ) : !isAdmin ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-white border border-[#E4E0D8] rounded-xl p-7 text-center space-y-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#FEF2F2] flex items-center justify-center text-[#991B1B]">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="font-display text-lg font-bold text-[#1C1917]">
                অ্যাডমিন অনুমতি নেই
              </h3>
              <p className="text-sm text-[#57534E] leading-relaxed">
                বর্তমানে ব্যবহৃত Google অ্যাকাউন্টটির অ্যাডমিন প্রবেশাধিকার নেই।
                শুধুমাত্র অনুমোদিত স্টোর অ্যাডমিন অ্যাকাউন্ট দিয়েই এখানে
                প্রবেশ করা যাবে।
              </p>
              <button
                type="button"
                onClick={handleSignOut}
                className="px-5 py-2.5 bg-[#1C1917] hover:bg-[#7A1C32] text-white text-sm font-medium rounded-lg cursor-pointer"
              >
                অন্য Google অ্যাকাউন্ট দিয়ে লগইন করুন
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Navigation Tabs */}
            <div className="px-6 pt-3 bg-white border-b border-[#E4E0D8] flex items-center gap-2 overflow-x-auto">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('products');
                  setEditingProduct(null);
                  onPreviewDesign(null);
                }}
                className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'products'
                    ? 'border-[#881337] text-[#881337]'
                    : 'border-transparent text-[#57534E] hover:text-[#1C1917]'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>পণ্য, রেট ও কালার ({products.length.toLocaleString('bn-BD')})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('design');
                  setEditingProduct(null);
                }}
                className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'design'
                    ? 'border-[#881337] text-[#881337]'
                    : 'border-transparent text-[#57534E] hover:text-[#1C1917]'
                }`}
              >
                <Palette className="w-4 h-4" />
                <span>স্টোর ডিজাইন ও কালার</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('quizzes');
                  setEditingProduct(null);
                  onPreviewDesign(null);
                }}
                className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'quizzes'
                    ? 'border-[#881337] text-[#881337]'
                    : 'border-transparent text-[#57534E] hover:text-[#1C1917]'
                }`}
              >
                <Award className="w-4 h-4" />
                <span>কুইজ ও কুপন ({quizzes.length.toLocaleString('bn-BD')})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('orders');
                  setEditingProduct(null);
                  onPreviewDesign(null);
                }}
                className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'orders'
                    ? 'border-[#881337] text-[#881337]'
                    : 'border-transparent text-[#57534E] hover:text-[#1C1917]'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>অর্ডারসমূহ ({orders.length.toLocaleString('bn-BD')})</span>
              </button>
            </div>

            {/* Feedback Banner */}
            {(statusMessage || errorMessage) && (
              <div className="px-6 pt-4">
                {statusMessage && (
                  <div className="p-3 rounded-lg bg-[#F0FDF4] border border-[#BBF7D0] text-xs sm:text-sm text-[#166534] flex items-center gap-2">
                    <Check className="w-4 h-4 shrink-0" />
                    <span>{statusMessage}</span>
                  </div>
                )}
                {errorMessage && (
                  <div className="p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-xs sm:text-sm text-[#991B1B] flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}
              </div>
            )}

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'products' && !editingProduct && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-[#1C1917]">
                        সকল পণ্য ও তাৎক্ষণিক রেট নিয়ন্ত্রণ
                      </h3>
                      <p className="text-xs text-[#57534E]">
                        যেকোনো পণ্যের রেট সরাসরি পরিবর্তন করুন অথবা &ldquo;এডিট&rdquo; করে
                        কালার, ছবি ও বিবরণ বদলান।
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {draftCount > 0 && (
                        <button
                          type="button"
                          onClick={handlePublishAllDrafts}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] bg-[#166534] hover:bg-[#14532D] text-white text-xs font-semibold rounded-lg cursor-pointer"
                        >
                          <Globe className="w-3.5 h-3.5" />
                          <span>
                            সব ড্রাফট পাবলিশ করুন ({draftCount.toLocaleString('bn-BD')})
                          </span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={openCreateProduct}
                        className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[40px] bg-[#881337] hover:bg-[#6E0E2B] text-white text-xs sm:text-sm font-semibold rounded-lg cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>নতুন পণ্য যোগ করুন</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {products.map((product) => {
                      const rateDraft = quickRates[product.id];
                      const isLive = product.published !== false;
                      const isPhotoOpen = photoManagerProductId === product.id;
                      const galleryList = product.galleryImages || [];
                      return (
                        <div
                          key={product.id}
                          className="bg-white border border-[#E4E0D8] rounded-xl p-4 space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                            <div className="w-20 h-16 rounded-lg overflow-hidden bg-[#F2F0EC] border border-[#E4E0D8] shrink-0">
                              <ResilientImage
                                src={product.image}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 text-xs mb-1">
                                <span className="text-[#57534E]">
                                  {product.categoryLabel}
                                </span>
                                <span aria-hidden="true">·</span>
                                <span
                                  className={`font-semibold ${
                                    isLive ? 'text-[#166534]' : 'text-[#B45309]'
                                  }`}
                                >
                                  {isLive ? 'লাইভ পাবলিশড' : 'ড্রাফট (লুকানো)'}
                                </span>
                                {galleryList.length > 0 && (
                                  <>
                                    <span aria-hidden="true">·</span>
                                    <span className="text-[#57534E]">
                                      +{(galleryList.length).toLocaleString('bn-BD')}টি অতিরিক্ত ছবি
                                    </span>
                                  </>
                                )}
                              </div>
                              <h4 className="text-sm font-semibold text-[#1C1917] truncate">
                                {product.name}
                              </h4>

                              <div className="flex items-center gap-2 mt-2">
                                <div className="flex items-center gap-1">
                                  {product.colors.map((c) => (
                                    <span
                                      key={c.name}
                                      title={c.name}
                                      className="w-3.5 h-3.5 rounded-full border border-[#1C1917]/20"
                                      style={{ backgroundColor: c.hex }}
                                    />
                                  ))}
                                </div>
                                <span className="text-xs text-[#57534E]">
                                  ({product.colors.length.toLocaleString('bn-BD')}টি রঙ)
                                </span>
                              </div>
                            </div>

                            {/* Quick Rate Editor + Actions */}
                            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs text-[#57534E]">৳</span>
                                <input
                                  type="number"
                                  min={1}
                                  value={
                                    rateDraft !== undefined
                                      ? rateDraft
                                      : String(product.price)
                                  }
                                  onChange={(e) =>
                                    setQuickRates((prev) => ({
                                      ...prev,
                                      [product.id]: e.target.value,
                                    }))
                                  }
                                  aria-label={`${product.name} এর রেট`}
                                  className="w-24 px-2.5 py-1.5 text-sm font-semibold tabular-nums bg-[#FAF9F6] border border-[#E4E0D8] rounded-lg focus:outline-none focus:border-[#881337]"
                                />
                                {rateDraft !== undefined &&
                                  Number(rateDraft) !== product.price && (
                                    <button
                                      type="button"
                                      onClick={() => handleQuickRateSave(product)}
                                      className="px-2.5 py-1.5 text-xs font-semibold bg-[#166534] text-white rounded-lg cursor-pointer"
                                    >
                                      আপডেট
                                    </button>
                                  )}
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  setPhotoManagerProductId(
                                    isPhotoOpen ? null : product.id,
                                  )
                                }
                                className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg cursor-pointer ${
                                  isPhotoOpen
                                    ? 'bg-[#881337] text-white'
                                    : 'bg-[#FAF9F6] hover:bg-[#F2F0EC] text-[#1C1917] border border-[#E4E0D8]'
                                }`}
                              >
                                <ImagePlus className="w-3.5 h-3.5" />
                                <span>ছবি যোগ</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => openEditProduct(product)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-[#F2F0EC] hover:bg-[#E4E0D8] text-[#1C1917] rounded-lg cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>এডিট</span>
                              </button>

                              {confirmDeleteId === product.id ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteProduct(product.id)}
                                    className="px-2.5 py-1.5 text-xs font-semibold bg-[#B91C1C] text-white rounded-lg cursor-pointer"
                                  >
                                    নিশ্চিত মুছুন
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteId(null)}
                                    className="px-2 py-1.5 text-xs text-[#57534E] hover:text-[#1C1917] cursor-pointer"
                                  >
                                    বাতিল
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(product.id)}
                                  aria-label={`${product.name} মুছুন`}
                                  className="p-2 text-[#57534E] hover:text-[#B91C1C] cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Dedicated Quick Mobile Picture Manager */}
                          {isPhotoOpen && (
                            <div className="pt-3 border-t border-[#E4E0D8] bg-[#FAF9F6] -mx-4 -mb-4 p-4 rounded-b-xl space-y-3">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-semibold text-[#1C1917]">
                                  মোবাইল থেকে পণ্যের ছবি যোগ বা পরিবর্তন করুন
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setPhotoManagerProductId(null)}
                                  className="text-xs text-[#57534E] hover:text-[#1C1917] cursor-pointer"
                                >
                                  বন্ধ করুন
                                </button>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                {/* Replace Main Picture from Phone Gallery or Camera */}
                                <div className="p-3 bg-white border border-[#E4E0D8] rounded-lg space-y-2">
                                  <p className="text-xs font-medium text-[#1C1917]">
                                    মূল ছবি পরিবর্তন করুন
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    <label className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[38px] bg-[#1C1917] hover:bg-[#881337] text-white text-xs font-medium rounded-lg cursor-pointer">
                                      {uploadingTarget ===
                                      `quick-${product.id}-main` ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      ) : (
                                        <Upload className="w-3.5 h-3.5" />
                                      )}
                                      <span>গ্যালারি থেকে বাছুন</span>
                                      <input
                                        type="file"
                                        accept="image/*"
                                        className="sr-only"
                                        onChange={(e) => {
                                          void handleQuickProductImageUpload(
                                            product,
                                            e.target.files,
                                            'main',
                                          );
                                          e.target.value = '';
                                        }}
                                      />
                                    </label>

                                    <label className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[38px] bg-[#F2F0EC] hover:bg-[#E4E0D8] text-[#1C1917] text-xs font-medium rounded-lg cursor-pointer">
                                      <Camera className="w-3.5 h-3.5" />
                                      <span>ক্যামেরা</span>
                                      <input
                                        type="file"
                                        accept="image/*"
                                        capture="environment"
                                        className="sr-only"
                                        onChange={(e) => {
                                          void handleQuickProductImageUpload(
                                            product,
                                            e.target.files,
                                            'main',
                                          );
                                          e.target.value = '';
                                        }}
                                      />
                                    </label>
                                  </div>
                                </div>

                                {/* Add Extra Gallery Picture */}
                                <div className="p-3 bg-white border border-[#E4E0D8] rounded-lg space-y-2">
                                  <p className="text-xs font-medium text-[#1C1917]">
                                    অতিরিক্ত ছবি যোগ করুন (সর্বোচ্চ ৫টি)
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    <label
                                      className={`inline-flex items-center gap-1.5 px-3 py-2 min-h-[38px] bg-[#881337] hover:bg-[#6E0E2B] text-white text-xs font-medium rounded-lg cursor-pointer ${
                                        galleryList.length >= 5
                                          ? 'opacity-50 pointer-events-none'
                                          : ''
                                      }`}
                                    >
                                      {uploadingTarget ===
                                      `quick-${product.id}-gallery` ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      ) : (
                                        <ImagePlus className="w-3.5 h-3.5" />
                                      )}
                                      <span>গ্যালারি যোগ</span>
                                      <input
                                        type="file"
                                        accept="image/*"
                                        disabled={galleryList.length >= 5}
                                        className="sr-only"
                                        onChange={(e) => {
                                          void handleQuickProductImageUpload(
                                            product,
                                            e.target.files,
                                            'gallery',
                                          );
                                          e.target.value = '';
                                        }}
                                      />
                                    </label>

                                    <label
                                      className={`inline-flex items-center gap-1.5 px-3 py-2 min-h-[38px] bg-[#F2F0EC] hover:bg-[#E4E0D8] text-[#1C1917] text-xs font-medium rounded-lg cursor-pointer ${
                                        galleryList.length >= 5
                                          ? 'opacity-50 pointer-events-none'
                                          : ''
                                      }`}
                                    >
                                      <Camera className="w-3.5 h-3.5" />
                                      <span>ক্যামেরা</span>
                                      <input
                                        type="file"
                                        accept="image/*"
                                        capture="environment"
                                        disabled={galleryList.length >= 5}
                                        className="sr-only"
                                        onChange={(e) => {
                                          void handleQuickProductImageUpload(
                                            product,
                                            e.target.files,
                                            'gallery',
                                          );
                                          e.target.value = '';
                                        }}
                                      />
                                    </label>
                                  </div>
                                </div>
                              </div>

                              {/* Current Extra Gallery Thumbnails */}
                              {galleryList.length > 0 && (
                                <div className="space-y-1.5">
                                  <p className="text-xs text-[#57534E]">
                                    সংযুক্ত অতিরিক্ত ছবিসমূহ:
                                  </p>
                                  <div className="flex flex-wrap gap-2.5">
                                    {galleryList.map((imgUrl, idx) => (
                                      <div
                                        key={`${imgUrl}-${idx}`}
                                        className="flex items-center gap-1.5 p-1.5 bg-white border border-[#E4E0D8] rounded-lg"
                                      >
                                        <img
                                          src={imgUrl}
                                          alt={`${product.name} গ্যালারি`}
                                          className="w-11 h-9 object-cover rounded"
                                        />
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handlePromoteGalleryToMain(
                                              product,
                                              imgUrl,
                                            )
                                          }
                                          className="px-2 py-1 text-[11px] font-medium bg-[#F2F0EC] hover:bg-[#E4E0D8] rounded cursor-pointer"
                                        >
                                          মূল করুন
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleRemoveQuickGalleryImage(
                                              product,
                                              imgUrl,
                                            )
                                          }
                                          aria-label="ছবি সরান"
                                          className="p-1 text-[#57534E] hover:text-[#B91C1C] cursor-pointer"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeTab === 'products' && editingProduct && (
                <form
                  onSubmit={(e) => handleSaveProduct(true, e)}
                  className="bg-white border border-[#E4E0D8] rounded-xl p-5 sm:p-6 space-y-5"
                >
                  <div className="flex items-center justify-between border-b border-[#E4E0D8] pb-3">
                    <h3 className="font-display text-lg font-bold text-[#1C1917]">
                      {isNewProduct ? 'নতুন পণ্য যোগ করুন' : 'পণ্য, রেট ও কালার এডিট করুন'}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setEditingProduct(null)}
                      className="text-xs font-medium text-[#57534E] hover:text-[#1C1917] cursor-pointer"
                    >
                      তালিকায় ফিরে যান
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-[#1C1917] mb-1">
                        পণ্যের নাম
                      </label>
                      <input
                        type="text"
                        required
                        value={editingProduct.name}
                        onChange={(e) =>
                          setEditingProduct({
                            ...editingProduct,
                            name: e.target.value,
                          })
                        }
                        className="w-full px-3.5 py-2 text-sm bg-[#FAF9F6] border border-[#E4E0D8] rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#1C1917] mb-1">
                        ক্যাটাগরি
                      </label>
                      <select
                        value={editingProduct.category}
                        onChange={(e) => {
                          const cat = e.target.value as Product['category'];
                          const label =
                            CATEGORIES.find((c) => c.key === cat)?.label || '';
                          setEditingProduct({
                            ...editingProduct,
                            category: cat,
                            categoryLabel: label,
                          });
                        }}
                        className="w-full px-3.5 py-2 text-sm bg-[#FAF9F6] border border-[#E4E0D8] rounded-lg"
                      >
                        {CATEGORIES.filter((c) => c.key !== 'all').map((c) => (
                          <option key={c.key} value={c.key}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#1C1917] mb-1">
                        সাব-ক্যাটাগরি (যেমন: শাড়ি, টি-শার্ট, পাঞ্জাবি)
                      </label>
                      <input
                        type="text"
                        required
                        value={editingProduct.subCategory}
                        onChange={(e) =>
                          setEditingProduct({
                            ...editingProduct,
                            subCategory: e.target.value,
                          })
                        }
                        className="w-full px-3.5 py-2 text-sm bg-[#FAF9F6] border border-[#E4E0D8] rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#1C1917] mb-1">
                        বর্তমান রেট / মূল্য (BDT ৳)
                      </label>
                      <input
                        type="number"
                        required
                        min={1}
                        value={editingProduct.price}
                        onChange={(e) =>
                          setEditingProduct({
                            ...editingProduct,
                            price: Number(e.target.value) || 0,
                          })
                        }
                        className="w-full px-3.5 py-2 text-sm font-semibold tabular-nums bg-[#FAF9F6] border border-[#E4E0D8] rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#1C1917] mb-1">
                        পূর্বের রেট (ছাড়ের আগে, ঐচ্ছিক)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={editingProduct.originalPrice || ''}
                        onChange={(e) =>
                          setEditingProduct({
                            ...editingProduct,
                            originalPrice: e.target.value
                              ? Number(e.target.value)
                              : null,
                          })
                        }
                        placeholder="যেমন: ২৫০০"
                        className="w-full px-3.5 py-2 text-sm tabular-nums bg-[#FAF9F6] border border-[#E4E0D8] rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#1C1917] mb-1">
                        স্টক অবস্থা
                      </label>
                      <select
                        value={editingProduct.stockStatus}
                        onChange={(e) =>
                          setEditingProduct({
                            ...editingProduct,
                            stockStatus: e.target.value,
                          })
                        }
                        className="w-full px-3.5 py-2 text-sm bg-[#FAF9F6] border border-[#E4E0D8] rounded-lg"
                      >
                        <option value="স্টকে আছে">স্টকে আছে</option>
                        <option value="স্টক সীমিত">স্টক সীমিত</option>
                        <option value="স্টক শেষ">স্টক শেষ</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#1C1917] mb-1">
                        বিশেষ ট্যাগ (ঐচ্ছিক, যেমন: নতুন সংগ্রহ)
                      </label>
                      <input
                        type="text"
                        value={editingProduct.featuredTag || ''}
                        onChange={(e) =>
                          setEditingProduct({
                            ...editingProduct,
                            featuredTag: e.target.value,
                          })
                        }
                        className="w-full px-3.5 py-2 text-sm bg-[#FAF9F6] border border-[#E4E0D8] rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Color Swatches Editor */}
                  <div className="pt-2 border-t border-[#E4E0D8]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-[#1C1917]">
                        পণ্যের কালার ভ্যারিয়েন্ট
                      </span>
                      <button
                        type="button"
                        onClick={addProductColor}
                        className="inline-flex items-center gap-1 text-xs font-medium text-[#881337] hover:underline cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>নতুন কালার যোগ করুন</span>
                      </button>
                    </div>
                    <div className="space-y-2">
                      {editingProduct.colors.map((color, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="color"
                            value={color.hex}
                            onChange={(e) =>
                              updateProductColor(idx, { hex: e.target.value })
                            }
                            aria-label="কালার পিকার"
                            className="w-10 h-9 p-0.5 bg-white border border-[#E4E0D8] rounded cursor-pointer"
                          />
                          <input
                            type="text"
                            value={color.name}
                            onChange={(e) =>
                              updateProductColor(idx, { name: e.target.value })
                            }
                            placeholder="রঙের নাম (যেমন: গাঢ় মেরুন)"
                            className="flex-1 px-3 py-1.5 text-sm bg-[#FAF9F6] border border-[#E4E0D8] rounded-lg"
                          />
                          {editingProduct.colors.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeProductColor(idx)}
                              aria-label="কালার সরান"
                              className="p-2 text-[#57534E] hover:text-[#B91C1C] cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sizes & Fabric */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#1C1917] mb-1">
                        সাইজ সমূহ (কমা দিয়ে লিখুন)
                      </label>
                      <input
                        type="text"
                        value={sizesInput}
                        onChange={(e) => setSizesInput(e.target.value)}
                        placeholder="S, M, L, XL"
                        className="w-full px-3.5 py-2 text-sm bg-[#FAF9F6] border border-[#E4E0D8] rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#1C1917] mb-1">
                        কাপড়ের ধরন (Fabric)
                      </label>
                      <input
                        type="text"
                        required
                        value={editingProduct.fabric}
                        onChange={(e) =>
                          setEditingProduct({
                            ...editingProduct,
                            fabric: e.target.value,
                          })
                        }
                        className="w-full px-3.5 py-2 text-sm bg-[#FAF9F6] border border-[#E4E0D8] rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Mobile Upload + Studio Image Picker + Gallery */}
                  <div className="space-y-4 pt-2 border-t border-[#E4E0D8]">
                    <div>
                      <label className="block text-xs font-semibold text-[#1C1917] mb-2">
                        পণ্যের মূল ছবি (মোবাইল থেকে আপলোড করুন বা স্টুডিও ছবি বাছুন)
                      </label>

                      <div className="flex flex-wrap items-center gap-2.5 mb-3">
                        <div className="w-16 h-12 rounded-lg overflow-hidden bg-[#F2F0EC] border border-[#E4E0D8] shrink-0">
                          <ResilientImage
                            src={editingProduct.image}
                            alt="মূল ছবি প্রিভিউ"
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <label className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] bg-[#1C1917] hover:bg-[#881337] text-white text-xs font-medium rounded-lg cursor-pointer">
                          {uploadingTarget === 'editor-main' ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Upload className="w-3.5 h-3.5" />
                          )}
                          <span>মোবাইল গ্যালারি থেকে আপলোড</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={(e) => {
                              void handleEditorImageUpload(e.target.files, 'main');
                              e.target.value = '';
                            }}
                          />
                        </label>

                        <label className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] bg-[#F2F0EC] hover:bg-[#E4E0D8] text-[#1C1917] text-xs font-medium rounded-lg cursor-pointer">
                          <Camera className="w-3.5 h-3.5" />
                          <span>ক্যামেরা দিয়ে ছবি তুলুন</span>
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="sr-only"
                            onChange={(e) => {
                              void handleEditorImageUpload(e.target.files, 'main');
                              e.target.value = '';
                            }}
                          />
                        </label>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-2.5">
                        {AVAILABLE_STUDIO_IMAGES.map((img) => {
                          const selected = editingProduct.image === img.url;
                          return (
                            <button
                              key={img.url}
                              type="button"
                              onClick={() =>
                                setEditingProduct({
                                  ...editingProduct,
                                  image: img.url,
                                })
                              }
                              title={img.label}
                              className={`w-14 h-11 rounded-md overflow-hidden border-2 cursor-pointer ${
                                selected
                                  ? 'border-[#881337]'
                                  : 'border-[#E4E0D8] opacity-75 hover:opacity-100'
                              }`}
                            >
                              <img
                                src={img.url}
                                alt={img.label}
                                className="w-full h-full object-cover"
                              />
                            </button>
                          );
                        })}
                      </div>
                      <input
                        type="text"
                        required
                        value={editingProduct.image}
                        onChange={(e) =>
                          setEditingProduct({
                            ...editingProduct,
                            image: e.target.value,
                          })
                        }
                        placeholder="অথবা ছবির URL দিন"
                        className="w-full px-3.5 py-2 text-xs bg-[#FAF9F6] border border-[#E4E0D8] rounded-lg"
                      />
                    </div>

                    {/* Additional Gallery Images */}
                    <div className="p-3.5 rounded-lg bg-[#FAF9F6] border border-[#E4E0D8] space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-[#1C1917]">
                          অতিরিক্ত গ্যালারি ছবি (সর্বোচ্চ ৫টি)
                        </span>
                        <div className="flex items-center gap-2">
                          <label
                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-[#F2F0EC] border border-[#E4E0D8] text-[#1C1917] text-xs font-medium rounded-md cursor-pointer ${
                              (editingProduct.galleryImages?.length || 0) >= 5
                                ? 'opacity-50 pointer-events-none'
                                : ''
                            }`}
                          >
                            {uploadingTarget === 'editor-gallery' ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <ImagePlus className="w-3.5 h-3.5" />
                            )}
                            <span>গ্যালারি ছবি যোগ</span>
                            <input
                              type="file"
                              accept="image/*"
                              disabled={
                                (editingProduct.galleryImages?.length || 0) >= 5
                              }
                              className="sr-only"
                              onChange={(e) => {
                                void handleEditorImageUpload(
                                  e.target.files,
                                  'gallery',
                                );
                                e.target.value = '';
                              }}
                            />
                          </label>
                          <label
                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-[#F2F0EC] border border-[#E4E0D8] text-[#1C1917] text-xs font-medium rounded-md cursor-pointer ${
                              (editingProduct.galleryImages?.length || 0) >= 5
                                ? 'opacity-50 pointer-events-none'
                                : ''
                            }`}
                          >
                            <Camera className="w-3.5 h-3.5" />
                            <span>ক্যামেরা</span>
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              disabled={
                                (editingProduct.galleryImages?.length || 0) >= 5
                              }
                              className="sr-only"
                              onChange={(e) => {
                                void handleEditorImageUpload(
                                  e.target.files,
                                  'gallery',
                                );
                                e.target.value = '';
                              }}
                            />
                          </label>
                        </div>
                      </div>

                      {(editingProduct.galleryImages || []).length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {(editingProduct.galleryImages || []).map((url, idx) => (
                            <div
                              key={`${url}-${idx}`}
                              className="relative w-16 h-12 rounded-md overflow-hidden border border-[#E4E0D8] bg-white"
                            >
                              <img
                                src={url}
                                alt={`গ্যালারি ${idx + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setEditingProduct({
                                    ...editingProduct,
                                    galleryImages: (
                                      editingProduct.galleryImages || []
                                    ).filter((_, i) => i !== idx),
                                  })
                                }
                                aria-label="গ্যালারি ছবি সরান"
                                className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-[#1C1917]/80 text-white flex items-center justify-center cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Descriptions */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-[#1C1917] mb-1">
                        সংক্ষিপ্ত বিবরণ (কার্ডে দেখানো হবে)
                      </label>
                      <input
                        type="text"
                        required
                        value={editingProduct.shortDescription}
                        onChange={(e) =>
                          setEditingProduct({
                            ...editingProduct,
                            shortDescription: e.target.value,
                          })
                        }
                        className="w-full px-3.5 py-2 text-sm bg-[#FAF9F6] border border-[#E4E0D8] rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#1C1917] mb-1">
                        বিস্তারিত বিবরণ
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={editingProduct.description}
                        onChange={(e) =>
                          setEditingProduct({
                            ...editingProduct,
                            description: e.target.value,
                          })
                        }
                        className="w-full px-3.5 py-2 text-sm bg-[#FAF9F6] border border-[#E4E0D8] rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Save Draft vs Publish Live */}
                  <div className="pt-4 border-t border-[#E4E0D8] flex flex-wrap items-center justify-end gap-3">
                    <button
                      type="button"
                      disabled={savingProduct}
                      onClick={() => handleSaveProduct(false)}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 min-h-[42px] text-sm font-medium bg-[#F2F0EC] hover:bg-[#E4E0D8] text-[#1C1917] rounded-lg cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>ড্রাফট হিসেবে রাখুন</span>
                    </button>

                    <button
                      type="submit"
                      disabled={savingProduct}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 min-h-[42px] text-sm font-semibold bg-[#881337] hover:bg-[#6E0E2B] text-white rounded-lg cursor-pointer"
                    >
                      <Globe className="w-4 h-4" />
                      <span>
                        {savingProduct
                          ? 'পাবলিশ হচ্ছে...'
                          : 'সেভ ও লাইভ পাবলিশ করুন'}
                      </span>
                    </button>
                  </div>
                </form>
              )}

              {activeTab === 'design' && (
                <div className="space-y-6">
                  {/* Theme Presets */}
                  <div className="bg-white border border-[#E4E0D8] rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-semibold text-[#1C1917]">
                          স্টোরের কালার থিম ও প্যালেট
                        </h3>
                        <p className="text-xs text-[#57534E]">
                          প্রি-সেট থিম বেছে নিন অথবা নিচের কালার পিকার দিয়ে কাস্টম
                          রঙ সেট করুন। পরিবর্তন সাথে সাথে প্রিভিউতে দেখা যাবে।
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleResetDesign}
                        className="inline-flex items-center gap-1 text-xs font-medium text-[#57534E] hover:text-[#1C1917] cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>ডিফল্ট</span>
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {THEME_PRESETS.map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() =>
                            handleDesignChange({
                              accentColor: preset.accentColor,
                              canvasColor: preset.canvasColor,
                              surfaceColor: preset.surfaceColor,
                            })
                          }
                          className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium bg-[#FAF9F6] hover:bg-[#F2F0EC] border border-[#E4E0D8] rounded-lg cursor-pointer"
                        >
                          <span
                            className="w-3.5 h-3.5 rounded-full"
                            style={{ backgroundColor: preset.accentColor }}
                          />
                          <span>{preset.name}</span>
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                      <label className="flex items-center justify-between gap-3 p-3 rounded-lg bg-[#FAF9F6] border border-[#E4E0D8]">
                        <span className="text-xs font-medium text-[#1C1917]">
                          প্রাইমারি অ্যাকসেন্ট
                        </span>
                        <input
                          type="color"
                          value={designForm.accentColor}
                          onChange={(e) =>
                            handleDesignChange({ accentColor: e.target.value })
                          }
                          className="w-9 h-8 cursor-pointer"
                        />
                      </label>
                      <label className="flex items-center justify-between gap-3 p-3 rounded-lg bg-[#FAF9F6] border border-[#E4E0D8]">
                        <span className="text-xs font-medium text-[#1C1917]">
                          পৃষ্ঠার ব্যাকগ্রাউন্ড
                        </span>
                        <input
                          type="color"
                          value={designForm.canvasColor}
                          onChange={(e) =>
                            handleDesignChange({ canvasColor: e.target.value })
                          }
                          className="w-9 h-8 cursor-pointer"
                        />
                      </label>
                      <label className="flex items-center justify-between gap-3 p-3 rounded-lg bg-[#FAF9F6] border border-[#E4E0D8]">
                        <span className="text-xs font-medium text-[#1C1917]">
                          সেকশন সারফেস
                        </span>
                        <input
                          type="color"
                          value={designForm.surfaceColor}
                          onChange={(e) =>
                            handleDesignChange({ surfaceColor: e.target.value })
                          }
                          className="w-9 h-8 cursor-pointer"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Layout & Card Design */}
                  <div className="bg-white border border-[#E4E0D8] rounded-xl p-5 space-y-4">
                    <h3 className="text-base font-semibold text-[#1C1917]">
                      কার্ড ও গ্রিড লেআউট ডিজাইন
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-[#1C1917] mb-1.5">
                          কার্ডের কর্নার স্টাইল
                        </label>
                        <select
                          value={designForm.cardRadius}
                          onChange={(e) =>
                            handleDesignChange({
                              cardRadius: e.target.value as CardRadiusOption,
                            })
                          }
                          className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E4E0D8] rounded-lg"
                        >
                          <option value="sharp">তীক্ষ্ণ (Sharp)</option>
                          <option value="balanced">পরিমিত (Balanced)</option>
                          <option value="soft">মসৃণ (Soft Rounded)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[#1C1917] mb-1.5">
                          ডেস্কটপ প্রোডাক্ট কলাম
                        </label>
                        <select
                          value={designForm.gridColumns}
                          onChange={(e) =>
                            handleDesignChange({
                              gridColumns: Number(e.target.value),
                            })
                          }
                          className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E4E0D8] rounded-lg"
                        >
                          <option value={2}>২ কলাম (প্রশস্ত কার্ড)</option>
                          <option value={3}>৩ কলাম (স্ট্যান্ডার্ড)</option>
                          <option value={4}>৪ কলাম (কম্প্যাক্ট)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[#1C1917] mb-1.5">
                          ছবির অনুপাত
                        </label>
                        <select
                          value={designForm.cardImageRatio}
                          onChange={(e) =>
                            handleDesignChange({
                              cardImageRatio: e.target
                                .value as CardImageRatioOption,
                            })
                          }
                          className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E4E0D8] rounded-lg"
                        >
                          <option value="4:3">৪:৩ ল্যান্ডস্কেপ</option>
                          <option value="1:1">১:১ বর্গাকার</option>
                          <option value="3:4">৩:৪ পোর্ট্রেট</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Hero Copy & Banner */}
                  <div className="bg-white border border-[#E4E0D8] rounded-xl p-5 space-y-4">
                    <h3 className="text-base font-semibold text-[#1C1917]">
                      দোকানের শিরোনাম ও হিরো ব্যানার
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-[#1C1917] mb-1">
                          দোকানের নাম
                        </label>
                        <input
                          type="text"
                          value={designForm.storeName}
                          onChange={(e) =>
                            handleDesignChange({ storeName: e.target.value })
                          }
                          className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E4E0D8] rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#1C1917] mb-1">
                          হিরো সাব-ট্যাগ
                        </label>
                        <input
                          type="text"
                          value={designForm.heroEyebrow}
                          onChange={(e) =>
                            handleDesignChange({ heroEyebrow: e.target.value })
                          }
                          className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E4E0D8] rounded-lg"
                        />
                      </div>
                    </div>

                    {/* Editable Store Address & Contact Details */}
                    <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#E4E0D8] space-y-3">
                      <h4 className="text-sm font-semibold text-[#1C1917]">
                        দোকানের ঠিকানা ও যোগাযোগ তথ্য (ফুটারে প্রদর্শিত হবে)
                      </h4>
                      <div>
                        <label className="block text-xs font-medium text-[#1C1917] mb-1">
                          দোকানের ঠিকানা
                        </label>
                        <input
                          type="text"
                          maxLength={240}
                          value={designForm.storeAddress}
                          onChange={(e) =>
                            handleDesignChange({ storeAddress: e.target.value })
                          }
                          placeholder="যেমন: বাড়ি ২৪, রোড ১১, বনানী, ঢাকা-১২১৩"
                          className="w-full px-3 py-2 text-sm bg-white border border-[#E4E0D8] rounded-lg"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-[#1C1917] mb-1">
                            ফোন নম্বর ও সময়
                          </label>
                          <input
                            type="text"
                            maxLength={100}
                            value={designForm.storePhone}
                            onChange={(e) =>
                              handleDesignChange({ storePhone: e.target.value })
                            }
                            placeholder="+৮৮০ ১৭১১-০০৪৪৫৫ (সকাল ১০টা – রাত ৯টা)"
                            className="w-full px-3 py-2 text-sm bg-white border border-[#E4E0D8] rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-[#1C1917] mb-1">
                            দোকানের যোগাযোগের ইমেইল
                          </label>
                          <input
                            type="email"
                            maxLength={120}
                            value={designForm.storeEmail}
                            onChange={(e) =>
                              handleDesignChange({ storeEmail: e.target.value })
                            }
                            placeholder="concierge@mallikafashion.com"
                            className="w-full px-3 py-2 text-sm bg-white border border-[#E4E0D8] rounded-lg"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#1C1917] mb-1">
                        মূল হিরো শিরোনাম
                      </label>
                      <input
                        type="text"
                        value={designForm.heroTitle}
                        onChange={(e) =>
                          handleDesignChange({ heroTitle: e.target.value })
                        }
                        className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E4E0D8] rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#1C1917] mb-1">
                        হিরো বিবরণ
                      </label>
                      <textarea
                        rows={2}
                        value={designForm.heroSubtitle}
                        onChange={(e) =>
                          handleDesignChange({ heroSubtitle: e.target.value })
                        }
                        className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E4E0D8] rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#1C1917] mb-1.5">
                        হিরো ব্যানার ছবি (মোবাইল থেকে আপলোড বা স্টুডিও ছবি)
                      </label>
                      <div className="flex flex-wrap items-center gap-2 mb-2.5">
                        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1C1917] hover:bg-[#881337] text-white text-xs font-medium rounded-lg cursor-pointer">
                          {uploadingTarget === 'hero' ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Upload className="w-3.5 h-3.5" />
                          )}
                          <span>গ্যালারি থেকে আপলোড</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={(e) => {
                              void handleHeroImageUpload(e.target.files);
                              e.target.value = '';
                            }}
                          />
                        </label>
                        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F2F0EC] hover:bg-[#E4E0D8] text-[#1C1917] text-xs font-medium rounded-lg cursor-pointer">
                          <Camera className="w-3.5 h-3.5" />
                          <span>ক্যামেরা</span>
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="sr-only"
                            onChange={(e) => {
                              void handleHeroImageUpload(e.target.files);
                              e.target.value = '';
                            }}
                          />
                        </label>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {AVAILABLE_STUDIO_IMAGES.slice(0, 5).map((img) => (
                          <button
                            key={img.url}
                            type="button"
                            onClick={() =>
                              handleDesignChange({ heroImage: img.url })
                            }
                            className={`w-16 h-11 rounded overflow-hidden border-2 cursor-pointer ${
                              designForm.heroImage === img.url
                                ? 'border-[#881337]'
                                : 'border-[#E4E0D8] opacity-75'
                            }`}
                          >
                            <img
                              src={img.url}
                              alt={img.label}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Moving Luxury Announcement Banner Editor */}
                    <div className="pt-4 border-t border-[#E4E0D8] space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-semibold text-[#1C1917]">
                            চলমান ঘোষণা ব্যানার (আসা-যাওয়া করা টেক্সট)
                          </h4>
                          <p className="text-xs text-[#57534E]">
                            এখানে যেসব লেখা যোগ করবেন সেগুলো পেজের ওপরের লাক্সারি ব্যানারে
                            চলতে থাকবে।
                          </p>
                        </div>

                        <label className="inline-flex items-center gap-2 text-xs font-medium text-[#1C1917] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={designForm.bannerEnabled}
                            onChange={(e) =>
                              handleDesignChange({
                                bannerEnabled: e.target.checked,
                              })
                            }
                            className="w-4 h-4 accent-[#7A1C32] cursor-pointer"
                          />
                          <span>ব্যানার চালু রাখুন</span>
                        </label>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-[#1C1917] mb-1">
                            লেখা চলার গতি
                          </label>
                          <select
                            value={designForm.bannerSpeed}
                            onChange={(e) =>
                              handleDesignChange({
                                bannerSpeed: e.target.value as BannerSpeedOption,
                              })
                            }
                            className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E4E0D8] rounded-lg"
                          >
                            <option value="slow">ধীর (Gentle)</option>
                            <option value="normal">মাঝারি (Standard)</option>
                            <option value="fast">দ্রুত (Brisk)</option>
                          </select>
                        </div>
                        <div className="flex items-end">
                          <button
                            type="button"
                            disabled={designForm.bannerMessages.length >= 8}
                            onClick={() =>
                              handleDesignChange({
                                bannerMessages: [
                                  ...designForm.bannerMessages,
                                  'নতুন বিশেষ অফার ও এক্সক্লুসিভ কালেকশন',
                                ],
                              })
                            }
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[38px] text-xs font-medium bg-[#FAF9F6] hover:bg-[#F2F0EC] border border-[#E4E0D8] text-[#1C1917] rounded-lg disabled:opacity-50 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>নতুন লাইন যোগ করুন (সর্বোচ্চ ৮টি)</span>
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {designForm.bannerMessages.map((msg, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <input
                              type="text"
                              maxLength={160}
                              value={msg}
                              onChange={(e) => {
                                const next = [...designForm.bannerMessages];
                                next[idx] = e.target.value;
                                handleDesignChange({ bannerMessages: next });
                              }}
                              placeholder={`ব্যানার বার্তা #${idx + 1}`}
                              className="flex-1 px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E4E0D8] rounded-lg"
                            />
                            {designForm.bannerMessages.length > 1 && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleDesignChange({
                                    bannerMessages:
                                      designForm.bannerMessages.filter(
                                        (_, i) => i !== idx,
                                      ),
                                  })
                                }
                                aria-label="বার্তা সরান"
                                className="p-2 text-[#57534E] hover:text-[#B91C1C] cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#E4E0D8] flex flex-wrap justify-end gap-3">
                      <button
                        type="button"
                        disabled={savingDesign}
                        onClick={() => handleSaveDesign('draft')}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 min-h-[42px] text-sm font-medium bg-[#F2F0EC] hover:bg-[#E4E0D8] text-[#1C1917] rounded-lg cursor-pointer"
                      >
                        <Save className="w-4 h-4" />
                        <span>ড্রাফট সেভ</span>
                      </button>

                      <button
                        type="button"
                        disabled={savingDesign}
                        onClick={() => handleSaveDesign('published')}
                        className="inline-flex items-center gap-1.5 px-5 py-2.5 min-h-[42px] text-sm font-semibold bg-[#7A1C32] hover:bg-[#5E1425] text-white rounded-lg cursor-pointer"
                      >
                        <Globe className="w-4 h-4" />
                        <span>
                          {savingDesign
                            ? 'পাবলিশ হচ্ছে...'
                            : 'ডিজাইন লাইভ পাবলিশ করুন'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'quizzes' && (
                <div className="space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-[#1C1917]">
                        ক্রেতাদের জন্য কুইজ ও ডিসকাউন্ট কুপন
                      </h3>
                      <p className="text-xs text-[#57534E]">
                        এখানে তৈরি করা কুইজ ক্রেতার প্রোফাইলে দেখা যাবে। সঠিক উত্তর দিলে তারা অটো-ভেরিফাইড ডিসকাউন্ট কুপন পাবে।
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {quizzes.length === 0 && user && (
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const count = await seedStarterQuizzesIfEmpty(user.uid);
                              if (count > 0) {
                                showSuccess(`${count}টি নমুনা কুইজ তৈরি হয়েছে।`);
                              }
                            } catch (err) {
                              setErrorMessage(
                                err instanceof Error ? err.message : 'নমুনা কুইজ তৈরি করা যায়নি।',
                              );
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-[#F2F0EC] hover:bg-[#E4E0D8] text-[#1C1917] rounded-lg cursor-pointer"
                        >
                          <span>নমুনা কুইজ যোগ করুন</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          setEditingQuiz({
                            id: `quiz-${Date.now().toString().slice(-6)}`,
                            question: '',
                            options: ['', '', '', ''],
                            correctOptionIndex: 0,
                            rewardTitle: 'বিশেষ কুইজ পুরস্কার: ৳ ১০০ ছাড়',
                            couponCode: `QUIZ${Date.now().toString().slice(-4)}`,
                            discountType: 'fixed',
                            discountValue: 100,
                            minOrderAmount: 1000,
                            active: true,
                            sortOrder: quizzes.length + 1,
                          })
                        }
                        className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[38px] bg-[#7A1C32] hover:bg-[#5E1425] text-white text-xs font-semibold rounded-lg cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>নতুন কুইজ তৈরি</span>
                      </button>
                    </div>
                  </div>

                  {editingQuiz && (
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!user) return;
                        const cleanOpts = editingQuiz.options
                          .map((o) => o.trim())
                          .filter(Boolean);
                        if (editingQuiz.question.trim().length < 4) {
                          setErrorMessage('কমপক্ষে ৪ অক্ষরের কুইজ প্রশ্ন লিখুন।');
                          return;
                        }
                        if (cleanOpts.length < 2) {
                          setErrorMessage('কমপক্ষে ২টি উত্তর অপশন লিখুন।');
                          return;
                        }
                        setSavingQuiz(true);
                        setErrorMessage('');
                        try {
                          await saveQuizAdmin(
                            { ...editingQuiz, options: cleanOpts },
                            user.uid,
                          );
                          setEditingQuiz(null);
                          showSuccess('কুইজ ও কুপন পুরস্কার লাইভ সেভ হয়েছে!');
                        } catch (err) {
                          setErrorMessage(
                            err instanceof Error ? err.message : 'কুইজ সেভ করা যায়নি।',
                          );
                        } finally {
                          setSavingQuiz(false);
                        }
                      }}
                      className="bg-white border border-[#E4E0D8] rounded-xl p-5 space-y-4"
                    >
                      <div className="flex items-center justify-between border-b border-[#E4E0D8] pb-3">
                        <h4 className="text-sm font-bold text-[#1C1917]">
                          কুইজ সম্পাদনা / নতুন কুইজ
                        </h4>
                        <button
                          type="button"
                          onClick={() => setEditingQuiz(null)}
                          className="text-xs text-[#57534E] hover:text-[#1C1917] cursor-pointer"
                        >
                          বাতিল
                        </button>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[#1C1917] mb-1">
                          কুইজের প্রশ্ন *
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={300}
                          value={editingQuiz.question}
                          onChange={(e) =>
                            setEditingQuiz({ ...editingQuiz, question: e.target.value })
                          }
                          placeholder="যেমন: ঢাকাই জামদানি শাড়ি মূলত কোন অঞ্চলে বোনা হয়?"
                          className="w-full px-3.5 py-2 text-sm bg-[#FAF9F6] border border-[#E4E0D8] rounded-lg"
                        />
                      </div>

                      <div className="space-y-2">
                        <span className="block text-xs font-medium text-[#1C1917]">
                          উত্তর অপশনসমূহ (পাশের রেডিও বাটনে সঠিক উত্তর চিহ্নিত করুন)
                        </span>
                        {editingQuiz.options.map((opt, idx) => (
                          <div key={idx} className="flex items-center gap-2.5">
                            <input
                              type="radio"
                              name="correctOptionIndex"
                              checked={editingQuiz.correctOptionIndex === idx}
                              onChange={() =>
                                setEditingQuiz({
                                  ...editingQuiz,
                                  correctOptionIndex: idx,
                                })
                              }
                              aria-label={`সঠিক উত্তর অপশন ${idx + 1}`}
                              className="w-4 h-4 accent-[#7A1C32] cursor-pointer"
                            />
                            <input
                              type="text"
                              maxLength={150}
                              value={opt}
                              onChange={(e) => {
                                const nextOpts = [...editingQuiz.options];
                                nextOpts[idx] = e.target.value;
                                setEditingQuiz({ ...editingQuiz, options: nextOpts });
                              }}
                              placeholder={`অপশন ${idx + 1}${idx < 2 ? ' *' : ' (ঐচ্ছিক)'}`}
                              className="flex-1 px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E4E0D8] rounded-lg"
                            />
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-[#1C1917] mb-1">
                            কুপন কোড (ইংরেজি বড় হাতের অক্ষর/সংখ্যা) *
                          </label>
                          <input
                            type="text"
                            required
                            maxLength={40}
                            value={editingQuiz.couponCode}
                            onChange={(e) =>
                              setEditingQuiz({
                                ...editingQuiz,
                                couponCode: e.target.value.toUpperCase(),
                              })
                            }
                            placeholder="JAMDANI150"
                            className="w-full px-3 py-2 text-sm font-mono bg-[#FAF9F6] border border-[#E4E0D8] rounded-lg uppercase"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-[#1C1917] mb-1">
                            পুরস্কারের শিরোনাম *
                          </label>
                          <input
                            type="text"
                            required
                            maxLength={120}
                            value={editingQuiz.rewardTitle}
                            onChange={(e) =>
                              setEditingQuiz({
                                ...editingQuiz,
                                rewardTitle: e.target.value,
                              })
                            }
                            placeholder="ঐতিহ্য কুপন: ৳ ১৫০ ছাড়"
                            className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E4E0D8] rounded-lg"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-[#1C1917] mb-1">
                            ডিসকাউন্ট ধরন
                          </label>
                          <select
                            value={editingQuiz.discountType}
                            onChange={(e) =>
                              setEditingQuiz({
                                ...editingQuiz,
                                discountType: e.target.value as 'fixed' | 'percent',
                              })
                            }
                            className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E4E0D8] rounded-lg"
                          >
                            <option value="fixed">নির্দিষ্ট টাকা (৳)</option>
                            <option value="percent">শতাংশ (%)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-[#1C1917] mb-1">
                            ছাড়ের পরিমাণ ({editingQuiz.discountType === 'percent' ? '%' : '৳'})
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={editingQuiz.discountType === 'percent' ? 80 : 100000}
                            required
                            value={editingQuiz.discountValue}
                            onChange={(e) =>
                              setEditingQuiz({
                                ...editingQuiz,
                                discountValue: Number(e.target.value),
                              })
                            }
                            className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E4E0D8] rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-[#1C1917] mb-1">
                            সর্বনিম্ন অর্ডার (৳)
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={1000000}
                            required
                            value={editingQuiz.minOrderAmount}
                            onChange={(e) =>
                              setEditingQuiz({
                                ...editingQuiz,
                                minOrderAmount: Number(e.target.value),
                              })
                            }
                            className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E4E0D8] rounded-lg"
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#E4E0D8]">
                        <label className="inline-flex items-center gap-2 text-xs font-medium text-[#1C1917] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editingQuiz.active}
                            onChange={(e) =>
                              setEditingQuiz({ ...editingQuiz, active: e.target.checked })
                            }
                            className="w-4 h-4 accent-[#7A1C32]"
                          />
                          <span>ক্রেতাদের প্রোফাইলে চালু রাখুন</span>
                        </label>

                        <button
                          type="submit"
                          disabled={savingQuiz}
                          className="inline-flex items-center gap-1.5 px-5 py-2.5 min-h-[40px] bg-[#7A1C32] hover:bg-[#5E1425] disabled:opacity-60 text-white text-xs sm:text-sm font-semibold rounded-lg cursor-pointer"
                        >
                          <Globe className="w-4 h-4" />
                          <span>{savingQuiz ? 'সেভ হচ্ছে...' : 'কুইজ সেভ ও লাইভ করুন'}</span>
                        </button>
                      </div>
                    </form>
                  )}

                  {quizzes.length === 0 ? (
                    <div className="bg-white border border-[#E4E0D8] rounded-xl p-8 text-center text-sm text-[#57534E]">
                      এখনো কোনো কুইজ তৈরি করা হয়নি। ওপরের "নতুন কুইজ তৈরি" বা "নমুনা কুইজ যোগ করুন" বাটনে ক্লিক করুন।
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {quizzes.map((q) => (
                        <div
                          key={q.id}
                          className="bg-white border border-[#E4E0D8] rounded-xl p-4 space-y-2.5"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="space-y-1 flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#F3ECE1] text-[#7A1C32]">
                                  {q.couponCode}
                                </span>
                                <span className="text-xs font-medium text-[#166534]">
                                  {q.discountType === 'percent'
                                    ? `${q.discountValue}% ছাড়`
                                    : `${formatBDT(q.discountValue)} ছাড়`}
                                </span>
                                <span
                                  className={`text-[11px] px-2 py-0.5 rounded font-medium ${
                                    q.active
                                      ? 'bg-[#DCFCE7] text-[#166534]'
                                      : 'bg-[#F2F0EC] text-[#57534E]'
                                  }`}
                                >
                                  {q.active ? 'সক্রিয়' : 'বন্ধ'}
                                </span>
                              </div>
                              <p className="text-sm font-semibold text-[#1C1917]">
                                {q.question}
                              </p>
                              <p className="text-xs text-[#57534E]">
                                সঠিক উত্তর: <strong>{q.options[q.correctOptionIndex] || '—'}</strong> · সর্বনিম্ন অর্ডার: {formatBDT(q.minOrderAmount)}
                              </p>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() =>
                                  setEditingQuiz({
                                    ...q,
                                    options: [
                                      q.options[0] || '',
                                      q.options[1] || '',
                                      q.options[2] || '',
                                      q.options[3] || '',
                                    ],
                                  })
                                }
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-[#FAF9F6] hover:bg-[#F2F0EC] border border-[#E4E0D8] rounded-lg cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>এডিট</span>
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  if (!user) return;
                                  try {
                                    await deleteQuizAdmin(q.id);
                                    showSuccess('কুইজটি মুছে ফেলা হয়েছে।');
                                  } catch (err) {
                                    setErrorMessage(
                                      err instanceof Error ? err.message : 'কুইজ মুছা যায়নি।',
                                    );
                                  }
                                }}
                                aria-label="কুইজ মুছুন"
                                className="p-2 text-[#57534E] hover:text-[#B91C1C] rounded-lg cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'orders' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-semibold text-[#1C1917]">
                      ক্রেতাদের অর্ডার তালিকা (রিয়েল-টাইম)
                    </h3>
                    <p className="text-xs text-[#57534E]">
                      নতুন অর্ডার আসা মাত্র এখানে দেখা যাবে এবং স্ট্যাটাস পরিবর্তন
                      করা যাবে।
                    </p>
                  </div>

                  {orders.length === 0 ? (
                    <div className="bg-white border border-[#E4E0D8] rounded-xl p-10 text-center text-sm text-[#57534E]">
                      এখনো কোনো অর্ডার জমা পড়েনি।
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {orders.map((order) => (
                        <div
                          key={order.docId}
                          className="bg-white border border-[#E4E0D8] rounded-xl p-4 sm:p-5 space-y-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <span className="text-sm font-bold text-[#1C1917] tabular-nums">
                                #{order.orderId}
                              </span>
                              <span className="text-xs text-[#57534E] ml-2">
                                {order.createdAt}
                              </span>
                            </div>

                            <select
                              value={order.status}
                              onChange={(e) =>
                                handleUpdateOrderStatus(
                                  order.docId,
                                  e.target.value as OrderStatus,
                                )
                              }
                              aria-label={`অর্ডার ${order.orderId} স্ট্যাটাস`}
                              className="px-3 py-1.5 text-xs font-semibold bg-[#FAF9F6] border border-[#E4E0D8] rounded-lg"
                            >
                              {ORDER_STATUSES.map((st) => (
                                <option key={st} value={st}>
                                  {st}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="text-xs sm:text-sm text-[#57534E] space-y-1">
                            <p>
                              <strong className="text-[#1C1917]">
                                {order.customerName}
                              </strong>{' '}
                              · <span className="tabular-nums">{order.phone}</span>
                            </p>
                            <p>
                              {order.areaLabel}: {order.address}
                            </p>
                            {order.deliveryNote && (
                              <p>নোট: {order.deliveryNote}</p>
                            )}
                            {order.discountAmount && order.discountAmount > 0 && (
                              <p className="text-xs text-[#166534] font-medium">
                                কুপন ব্যবহৃত: {order.couponCode} (-{formatBDT(order.discountAmount)})
                              </p>
                            )}
                          </div>

                          <div className="pt-2 border-t border-[#E4E0D8] flex flex-wrap items-center justify-between gap-2 text-xs">
                            <span className="text-[#57534E]">
                              {order.items
                                .map(
                                  (i) =>
                                    `${i.name} (${i.size}, ${i.colorName}) × ${i.quantity}`,
                                )
                                .join(' · ')}
                            </span>
                            <span className="text-sm font-bold text-[#881337] tabular-nums">
                              মোট: {formatBDT(order.total)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
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
