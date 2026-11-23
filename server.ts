import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import { PRODUCTS } from './src/data/products.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const UPLOADS_DIR = path.resolve(__dirname, 'uploads');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

interface FirebaseAppletConfig {
  projectId: string;
  apiKey: string;
  firestoreDatabaseId: string;
}

function loadFirebaseConfig(): FirebaseAppletConfig | null {
  try {
    const raw = fs.readFileSync(
      path.resolve(__dirname, 'firebase-applet-config.json'),
      'utf8',
    );
    return JSON.parse(raw) as FirebaseAppletConfig;
  } catch {
    return null;
  }
}

const FIREBASE_CONFIG = loadFirebaseConfig();
const BOOTSTRAP_ADMIN_EMAIL = 'srabon10010@gmail.com';

async function verifyAdminIdToken(
  authHeader: string | undefined,
): Promise<{ ok: true; uid: string } | { ok: false; error: string }> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { ok: false, error: 'অ্যাডমিন অনুমোদন টোকেন পাওয়া যায়নি।' };
  }
  if (!FIREBASE_CONFIG?.apiKey) {
    return { ok: false, error: 'Firebase কনফিগারেশন পাওয়া যায়নি।' };
  }

  const idToken = authHeader.slice('Bearer '.length).trim();
  if (!idToken) {
    return { ok: false, error: 'অবৈধ টোকেন।' };
  }

  try {
    const lookupRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(FIREBASE_CONFIG.apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      },
    );

    if (!lookupRes.ok) {
      return { ok: false, error: 'অ্যাডমিন সেশন যাচাই করা যায়নি। পুনরায় লগইন করুন।' };
    }

    const lookupData = (await lookupRes.json()) as {
      users?: {
        localId?: string;
        email?: string;
        emailVerified?: boolean;
      }[];
    };

    const user = lookupData.users?.[0];
    if (!user?.localId || !user.emailVerified) {
      return { ok: false, error: 'যাচাইকৃত ইমেইলসহ লগইন প্রয়োজন।' };
    }

    if (user.email === BOOTSTRAP_ADMIN_EMAIL) {
      return { ok: true, uid: user.localId };
    }

    // Check /admins/{uid} document using caller's verified ID token
    const adminDocUrl = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(FIREBASE_CONFIG.projectId)}/databases/${encodeURIComponent(FIREBASE_CONFIG.firestoreDatabaseId)}/documents/admins/${encodeURIComponent(user.localId)}`;
    const adminCheckRes = await fetch(adminDocUrl, {
      headers: { Authorization: `Bearer ${idToken}` },
    });
    if (adminCheckRes.ok) {
      return { ok: true, uid: user.localId };
    }

    return { ok: false, error: 'এই অ্যাকাউন্টের অ্যাডমিন অনুমতি নেই।' };
  } catch {
    return { ok: false, error: 'অ্যাডমিন যাচাইকরণে সমস্যা হয়েছে।' };
  }
}

function detectImageExtension(buffer: Buffer): 'jpg' | 'png' | 'webp' | null {
  if (buffer.length < 12) return null;
  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'jpg';
  }
  // PNG: 89 50 4E 47
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return 'png';
  }
  // WEBP: RIFF....WEBP
  if (
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'webp';
  }
  return null;
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '5mb' }));

  // Serve uploaded product pictures securely
  app.use(
    '/uploads',
    express.static(UPLOADS_DIR, {
      setHeaders: (res) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      },
    }),
  );

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.post('/api/admin/verify', async (req, res) => {
    const authCheck = await verifyAdminIdToken(req.headers.authorization);
    if (!authCheck.ok) {
      res.json({ isAdmin: false });
      return;
    }
    res.json({ isAdmin: true });
  });

  app.post('/api/translate', async (req, res) => {
    try {
      const { targetLanguage, strings } = req.body as {
        targetLanguage?: string;
        strings?: Record<string, string>;
      };

      const cleanLang = typeof targetLanguage === 'string' ? targetLanguage.trim().slice(0, 60) : '';
      if (!cleanLang) {
        res.status(400).json({ error: 'Target language is required.' });
        return;
      }

      if (!strings || typeof strings !== 'object' || Array.isArray(strings)) {
        res.status(400).json({ error: 'Strings map is required.' });
        return;
      }

      const entries = Object.entries(strings)
        .filter(([k, v]) => typeof k === 'string' && typeof v === 'string' && v.trim().length > 0)
        .slice(0, 160)
        .map(([k, v]) => [k.slice(0, 120), v.slice(0, 1500)] as const);

      if (entries.length === 0) {
        res.json({ translations: {} });
        return;
      }

      const ai = getGeminiClient();
      if (!ai) {
        res.status(503).json({
          error: 'অনুবাদ সেবা চালানোর জন্য GEMINI_API_KEY কনফিগার করা নেই।',
        });
        return;
      }

      const itemsList = entries.map(([key, text]) => ({ key, text }));

      let responseText = '{}';
      let lastError: unknown = null;
      const modelsToTry = ['gemini-4-hydrogen', 'gemini-3.1-flash-lite'] as const;

      for (let attempt = 0; attempt < modelsToTry.length; attempt++) {
        const modelName = modelsToTry[attempt];
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: `Translate the following e-commerce fashion storefront texts into ${cleanLang}. Preserve the exact "key" values, keep luxury boutique tone natural in ${cleanLang}, preserve numbers/brand intent appropriately, and return every key.\n\nInput:\n${JSON.stringify(itemsList)}`,
            config: {
              thinkingConfig:
                modelName === 'gemini-4-hydrogen'
                  ? { thinkingLevel: ThinkingLevel.LOW }
                  : { thinkingLevel: ThinkingLevel.MINIMAL },
              systemInstruction:
                'You are an expert luxury fashion copy translator. Translate every provided item accurately into the requested target language while returning strictly matching keys.',
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  items: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        key: { type: Type.STRING },
                        text: { type: Type.STRING },
                      },
                      required: ['key', 'text'],
                    },
                  },
                },
                required: ['items'],
              },
            },
          });
          responseText = (response.text ?? '{}').trim();
          lastError = null;
          break;
        } catch (err) {
          lastError = err;
          const msg = err instanceof Error ? err.message : String(err);
          const isTransient = msg.includes('503') || msg.includes('429') || msg.includes('UNAVAILABLE');
          if (!isTransient || attempt === modelsToTry.length - 1) {
            throw err;
          }
          await new Promise((r) => setTimeout(r, 400));
        }
      }

      if (lastError) {
        throw lastError;
      }

      const rawText = responseText;
      const parsed = JSON.parse(rawText) as {
        items?: { key?: string; text?: string }[];
      };

      const translations: Record<string, string> = {};
      if (Array.isArray(parsed.items)) {
        for (const item of parsed.items) {
          if (typeof item.key === 'string' && typeof item.text === 'string') {
            translations[item.key] = item.text;
          }
        }
      }

      res.json({ translations });
    } catch (err) {
      console.error('Translation API error:', err);
      const message =
        err instanceof Error ? err.message : 'অনুবাদ প্রক্রিয়ায় সমস্যা হয়েছে।';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/upload-image', async (req, res) => {
    const authCheck = await verifyAdminIdToken(req.headers.authorization);
    if (!authCheck.ok) {
      res.status(403).json({ error: authCheck.error });
      return;
    }

    const { dataUrl } = req.body as { dataUrl?: string };
    if (!dataUrl || typeof dataUrl !== 'string') {
      res.status(400).json({ error: 'ছবির ডাটা পাওয়া যায়নি।' });
      return;
    }

    const match = /^data:(image\/(?:jpeg|jpg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(
      dataUrl.trim(),
    );
    if (!match) {
      res.status(400).json({
        error: 'শুধুমাত্র JPG, PNG অথবা WebP ছবি আপলোড করা যাবে।',
      });
      return;
    }

    const buffer = Buffer.from(match[2], 'base64');
    if (buffer.length === 0 || buffer.length > 2.5 * 1024 * 1024) {
      res.status(400).json({
        error: 'ছবির আকার ২.৫ মেগাবাইটের মধ্যে হতে হবে।',
      });
      return;
    }

    const ext = detectImageExtension(buffer);
    if (!ext) {
      res.status(400).json({ error: 'অকার্যকর ছবির ফরম্যাট।' });
      return;
    }

    const filename = `mfh-${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
    const resolvedPath = path.resolve(UPLOADS_DIR, filename);
    if (!resolvedPath.startsWith(UPLOADS_DIR + path.sep)) {
      res.status(400).json({ error: 'অকার্যকর ফাইল পাথ।' });
      return;
    }

    await fs.promises.writeFile(resolvedPath, buffer);
    res.status(201).json({ url: `/uploads/${filename}` });
  });

  app.post('/api/style-advice', async (req, res) => {
    try {
      const { occasion, budget, preference, catalog, languageName } = req.body as {
        occasion?: string;
        budget?: string;
        preference?: string;
        languageName?: string;
        catalog?: {
          id: string;
          name: string;
          category: string;
          subCategory: string;
          priceBDT: number;
          fabric: string;
          colors: string[];
          shortDescription: string;
        }[];
      };

      const targetLang =
        typeof languageName === 'string' && languageName.trim()
          ? languageName.trim().slice(0, 60)
          : 'Bengali';

      if (!occasion?.trim() && !preference?.trim()) {
        res.status(400).json({
          error: 'অনুগ্রহ করে অন্তত উপলক্ষ বা পছন্দের বিবরণ লিখুন।',
        });
        return;
      }

      const ai = getGeminiClient();
      if (!ai) {
        res.status(503).json({
          error:
            'এআই পরামর্শক চালানোর জন্য GEMINI_API_KEY কনফিগার করা নেই। Settings > Secrets প্যানেল থেকে কী যাচাই করুন।',
        });
        return;
      }

      const catalogSummary =
        Array.isArray(catalog) && catalog.length > 0
          ? catalog.slice(0, 40).map((p) => ({
              id: String(p.id).slice(0, 128),
              name: String(p.name).slice(0, 120),
              category: String(p.category).slice(0, 60),
              subCategory: String(p.subCategory).slice(0, 60),
              priceBDT: Number(p.priceBDT) || 0,
              fabric: String(p.fabric).slice(0, 120),
              colors: Array.isArray(p.colors)
                ? p.colors.slice(0, 10).map((c) => String(c).slice(0, 40))
                : [],
              shortDescription: String(p.shortDescription).slice(0, 240),
            }))
          : PRODUCTS.map((p) => ({
              id: p.id,
              name: p.name,
              category: p.categoryLabel,
              subCategory: p.subCategory,
              priceBDT: p.price,
              fabric: p.fabric,
              colors: p.colors.map((c) => c.name),
              shortDescription: p.shortDescription,
            }));

      const userQuery = `
Customer request (Reply strictly in ${targetLang}):
- Occasion: ${occasion?.trim() || 'Not specified'}
- Budget: ${budget?.trim() || 'Flexible'}
- Preferences: ${preference?.trim() || 'Not specified'}

Current "মল্লিকা ফ্যাশন হাউস" catalog:
${JSON.stringify(catalogSummary, null, 2)}
`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: userQuery,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          systemInstruction:
            `You are a refined, experienced luxury fashion & wardrobe stylist for "মল্লিকা ফ্যাশন হাউস" (Mallika Fashion House). Select 2 to 3 best-matching products strictly from the provided catalog (productId must match an exact catalog id). Write your entire response naturally and fluently in ${targetLang}, including realistic color, fabric, and pairing tips.`,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: {
                type: Type.STRING,
                description:
                  `2-3 sentence overall style advice tailored to the customer's occasion and budget in ${targetLang}.`,
              },
              stylingTips: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description:
                  `3 concise, practical outfit and styling tips in ${targetLang}.`,
              },
              recommendations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    productId: {
                      type: Type.STRING,
                      description: 'Exact catalog product id.',
                    },
                    reason: {
                      type: Type.STRING,
                      description:
                        `1-2 sentence explanation of why this item fits the occasion and budget in ${targetLang}.`,
                    },
                  },
                  required: ['productId', 'reason'],
                },
                description: '2 to 3 recommended products.',
              },
            },
            required: ['summary', 'stylingTips', 'recommendations'],
          },
        },
      });

      const rawText = (response.text ?? '{}').trim();
      const parsed = JSON.parse(rawText);

      const validIds = new Set(catalogSummary.map((p) => p.id));
      const cleanRecommendations = Array.isArray(parsed.recommendations)
        ? parsed.recommendations.filter(
            (r: { productId?: string; reason?: string }) =>
              r.productId && validIds.has(r.productId),
          )
        : [];

      res.json({
        summary: parsed.summary || '',
        stylingTips: Array.isArray(parsed.stylingTips) ? parsed.stylingTips : [],
        recommendations: cleanRecommendations,
      });
    } catch (err) {
      console.error('Style advice API error:', err);
      const message =
        err instanceof Error ? err.message : 'অজানা সার্ভার ত্রুটি ঘটেছে।';
      res.status(500).json({
        error: `এই মুহূর্তে এআই পরামর্শ তৈরি করা যায়নি: ${message}`,
      });
    }
  });

  app.post('/api/orders', (req, res) => {
    const {
      customerName,
      phone,
      area,
      address,
      deliveryNote,
      items,
    } = req.body as {
      customerName?: string;
      phone?: string;
      area?: 'dhaka' | 'outside';
      address?: string;
      deliveryNote?: string;
      items?: {
        productId: string;
        size: string;
        colorName: string;
        quantity: number;
      }[];
    };

    if (!customerName?.trim() || !phone?.trim() || !address?.trim()) {
      res.status(400).json({
        error: 'ক্রেতার নাম, ফোন নম্বর এবং সম্পূর্ণ ঠিকানা আবশ্যক।',
      });
      return;
    }

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'কার্টে কোনো পণ্য নেই।' });
      return;
    }

    const productMap = new Map(PRODUCTS.map((p) => [p.id, p]));
    const verifiedItems = [];
    let subtotal = 0;

    for (const item of items) {
      const product = productMap.get(item.productId);
      const qty = Math.max(1, Math.min(50, Math.floor(Number(item.quantity) || 1)));
      if (!product) {
        res.status(400).json({ error: 'অকার্যকর পণ্য পাওয়া গেছে।' });
        return;
      }
      const lineTotal = product.price * qty;
      subtotal += lineTotal;
      verifiedItems.push({
        productId: product.id,
        name: product.name,
        size: item.size || product.sizes[0],
        colorName: item.colorName || product.colors[0].name,
        quantity: qty,
        unitPrice: product.price,
        lineTotal,
      });
    }

    const freeDeliveryThreshold = 2500;
    const baseDeliveryFee = area === 'outside' ? 130 : 70;
    const deliveryFee = subtotal >= freeDeliveryThreshold ? 0 : baseDeliveryFee;
    const total = subtotal + deliveryFee;

    const orderNum = Math.floor(1000 + Math.random() * 9000);
    const confirmation = {
      orderId: `MFH-${orderNum}`,
      createdAt: new Date().toLocaleString('bn-BD', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
      customerName: customerName.trim(),
      phone: phone.trim(),
      areaLabel: area === 'outside' ? 'ঢাকার বাইরে' : 'ঢাকার ভেতরে',
      address: address.trim(),
      deliveryNote: deliveryNote?.trim() || '',
      paymentMethod: 'ক্যাশ অন ডেলিভারি',
      subtotal,
      deliveryFee,
      total,
      items: verifiedItems,
    };

    res.status(201).json(confirmation);
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`মল্লিকা ফ্যাশন হাউস (Mallika Fashion House) server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
