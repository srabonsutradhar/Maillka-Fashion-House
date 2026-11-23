import { auth } from './firebase';

function compressImageToDataUrl(
  file: File,
  maxDimension = 1200,
  quality = 0.85,
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('অনুগ্রহ করে একটি ছবির ফাইল নির্বাচন করুন।'));
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      reject(new Error('ছবির ফাইলটি ২০ মেগাবাইটের কম হতে হবে।'));
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      try {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width >= height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(objectUrl);
          reject(new Error('ছবি প্রসেস করা যায়নি।'));
          return;
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        URL.revokeObjectURL(objectUrl);
        resolve(dataUrl);
      } catch {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('ছবি প্রসেস করতে সমস্যা হয়েছে।'));
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('ছবিটি পড়া যায়নি। অন্য ছবি নির্বাচন করুন।'));
    };

    img.src = objectUrl;
  });
}

export async function uploadProductImageFromDevice(file: File): Promise<string> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('ছবি আপলোড করতে অ্যাডমিন হিসেবে লগইন করুন।');
  }

  const idToken = await currentUser.getIdToken();
  const dataUrl = await compressImageToDataUrl(file);

  const response = await fetch('/api/upload-image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ dataUrl }),
  });

  const data = (await response.json()) as { url?: string; error?: string };
  if (!response.ok || !data.url) {
    throw new Error(data.error || 'ছবি আপলোড করা যায়নি।');
  }

  return data.url;
}
