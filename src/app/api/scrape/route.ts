import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const dynamic = "force-dynamic";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

function detectPlatform(url: string): string {
  if (url.includes("shopee")) return "shopee";
  if (url.includes("tiktok") || url.includes("tokopedia.com")) return "tiktok";
  return "";
}

function extractFromUrlParams(url: string): {
  title: string;
  image: string;
} {
  try {
    const urlObj = new URL(url);

    // TikTok Shop links have og_info in URL params
    const ogInfoRaw = urlObj.searchParams.get("og_info");
    if (ogInfoRaw) {
      const ogInfo = JSON.parse(ogInfoRaw);
      return {
        title: ogInfo.title || "",
        image: ogInfo.image || "",
      };
    }

    return { title: "", image: "" };
  } catch {
    return { title: "", image: "" };
  }
}

async function fetchPageContent(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "id-ID,id;q=0.9,en;q=0.8",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    return await res.text();
  } catch (error) {
    console.error("Fetch error:", error);
    throw new Error("Gagal mengakses link produk");
  }
}

function extractMetaFromHTML(html: string): {
  title: string;
  description: string;
  price: string;
  image: string;
} {
  const titleMatch =
    html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"/) ||
    html.match(/<meta[^>]*content="([^"]*)"[^>]*property="og:title"/) ||
    html.match(/<meta[^>]*name="title"[^>]*content="([^"]*)"/) ||
    html.match(/<title[^>]*>([^<]*)<\/title>/);

  const descMatch =
    html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]*)"/) ||
    html.match(/<meta[^>]*content="([^"]*)"[^>]*property="og:description"/) ||
    html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/) ||
    html.match(/<meta[^>]*content="([^"]*)"[^>]*name="description"/);

  const priceMatch =
    html.match(/price["\s:]*["\s]*(?:Rp\.?\s*)?([0-9.,]+)/i) ||
    html.match(/Rp\.?\s*([0-9.,]+)/) ||
    html.match(/"price":\s*"?([0-9.,]+)"?/);

  const imageMatch =
    html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]*)"/) ||
    html.match(/<meta[^>]*content="([^"]*)"[^>]*property="og:image"/);

  return {
    title: titleMatch?.[1]?.trim() || "",
    description: descMatch?.[1]?.trim() || "",
    price: priceMatch?.[1]?.trim() || "",
    image: imageMatch?.[1]?.trim() || "",
  };
}

async function generateBriefFromProduct(productInfo: {
  title: string;
  description: string;
  price: string;
  platform: string;
}): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `Kamu adalah content strategist fashion Indonesia. Berdasarkan info produk berikut, buatkan brief singkat untuk content creator.

Nama Produk: ${productInfo.title}
${productInfo.description ? `Deskripsi: ${productInfo.description}` : ""}
${productInfo.price ? `Harga: ${productInfo.price}` : ""}
Platform: ${productInfo.platform || "TikTok/Shopee"}

Buatkan brief dalam format (TANPA heading/markdown, langsung teks):
- Target audience (1 kalimat)
- Vibe/mood konten (1 kalimat)  
- 3 selling point utama (bullet points pendek)

Bahasa Indonesia casual. Maksimal 5 baris. Langsung to the point.`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { url } = body;

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  const platform = detectPlatform(url);

  // Step 1: Try to extract info from URL params (TikTok Shop links have og_info)
  const urlParams = extractFromUrlParams(url);

  let productName = urlParams.title;
  let productPrice = "";
  let productImage = urlParams.image;
  let description = "";

  // Step 2: If no info from URL params, try fetching HTML
  if (!productName) {
    try {
      const html = await fetchPageContent(url);
      const meta = extractMetaFromHTML(html);
      productName = meta.title || "";
      productPrice = meta.price || "";
      productImage = meta.image || "";
      description = meta.description || "";
    } catch (e) {
      console.error("HTML fetch failed:", e);
      // Continue — will return what we have
    }
  }

  // Step 3: Generate brief with Gemini if we have product name
  let notes = "";
  if (productName) {
    try {
      notes = await generateBriefFromProduct({
        title: productName,
        description,
        price: productPrice,
        platform,
      });
    } catch (e) {
      console.error("Brief generation error:", e);
    }
  }

  // Format price
  const formattedPrice = productPrice
    ? productPrice.startsWith("Rp")
      ? productPrice
      : `Rp ${productPrice}`
    : "";

  return NextResponse.json({
    productName: productName || "",
    productPrice: formattedPrice,
    productImage: productImage || "",
    description: description || "",
    notes,
    platform,
    warning: productName ? "" : "Gagal ambil info produk. Isi manual ya.",
  });
}
