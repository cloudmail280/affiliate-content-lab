import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

type ImagePart = {
  inlineData: { data: string; mimeType: string };
};

type ContentPart = { text: string } | ImagePart;

export async function generateContent(productInfo: {
  name: string;
  price?: string;
  notes?: string;
  platform?: string;
  imageUrl?: string;
}) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const hasImage = !!productInfo.imageUrl;

  const prompt = `Kamu adalah content creator fashion Indonesia yang expert di TikTok dan Shopee affiliate. 
Berdasarkan informasi produk berikut, buatkan konten untuk promosi affiliate:

Nama Produk: ${productInfo.name}
${productInfo.price ? `Harga: ${productInfo.price}` : ""}
${productInfo.notes ? `Notes tambahan: ${productInfo.notes}` : ""}
${productInfo.platform ? `Platform: ${productInfo.platform}` : ""}
${hasImage ? "\nAda foto produk yang dilampirkan. Analisis visual produknya (warna, potongan, tekstur, styling, vibe) dan gunakan observasi itu untuk bikin hook, content angle, dan cover text yang lebih spesifik, tajam, dan visual-driven." : ""}

Buatkan dalam format JSON (tanpa markdown code block) dengan struktur:
{
  "hooks": [10 hook opening yang catchy untuk video pendek, masing-masing 1-2 kalimat],
  "captions": [5 caption untuk posting, include emoji, 2-3 kalimat],
  "hashtags": [20 hashtag relevan tanpa #, campuran populer dan niche],
  "content_angles": [3 angle/sudut pandang konten yang berbeda, masing-masing 2-3 kalimat penjelasan],
  "cover_texts": [5 teks untuk cover/thumbnail video, maksimal 5 kata],
  "cta": [5 call-to-action yang engaging, 1 kalimat]
}

Pastikan:
- Bahasa Indonesia casual/gaul yang relatable
- Sesuai tone anak muda/gen-z
- Fokus pada pain point dan benefit
- Hook harus bikin penasaran
- Hashtag mix antara broad dan niche fashion`;

  // Build multimodal parts: text prompt + optional product image
  const parts: ContentPart[] = [{ text: prompt }];

  if (hasImage) {
    try {
      const imageData = await fetchImageAsBase64(productInfo.imageUrl!);
      parts.push({ inlineData: imageData });
    } catch (err) {
      // Fall back to text-only generation so content still gets produced
      console.warn("Failed to fetch product image, falling back to text-only:", err);
    }
  }

  const result = await model.generateContent(parts);
  const response = result.response;
  const text = response.text();

  // Parse JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse AI response");
  }

  return JSON.parse(jsonMatch[0]);
}

// Fetch a remote image and convert it to base64 inline data for Gemini
async function fetchImageAsBase64(url: string): Promise<ImagePart["inlineData"]> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch image: ${res.status}`);
  }
  const buffer = await res.arrayBuffer();
  const data = Buffer.from(buffer).toString("base64");
  const mimeType = res.headers.get("content-type") || "image/jpeg";
  return { data, mimeType };
}
