import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const dynamic = "force-dynamic";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

async function fetchPageContent(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "id-ID,id;q=0.9,en;q=0.8",
      },
      redirect: "follow",
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const html = await res.text();
    return html;
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
  // Extract from meta tags and common patterns
  const titleMatch =
    html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"/) ||
    html.match(/<meta[^>]*name="title"[^>]*content="([^"]*)"/) ||
    html.match(/<title[^>]*>([^<]*)<\/title>/);

  const descMatch =
    html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]*)"/) ||
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
Deskripsi: ${productInfo.description}
Harga: ${productInfo.price}
Platform: ${productInfo.platform}

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

  // Detect platform
  let platform = "";
  if (url.includes("shopee")) platform = "shopee";
  else if (url.includes("tiktok")) platform = "tiktok";

  try {
    // Fetch and parse HTML
    const html = await fetchPageContent(url);
    const meta = extractMetaFromHTML(html);

    // If we got product info, generate brief with Gemini
    let notes = "";
    if (meta.title || meta.description) {
      try {
        notes = await generateBriefFromProduct({
          title: meta.title,
          description: meta.description,
          price: meta.price,
          platform,
        });
      } catch (e) {
        console.error("Brief generation error:", e);
        // Non-fatal, continue without notes
      }
    }

    return NextResponse.json({
      productName: meta.title || "",
      productPrice: meta.price ? `Rp ${meta.price}` : "",
      productImage: meta.image || "",
      description: meta.description || "",
      notes,
      platform,
    });
  } catch (error) {
    // Fallback: just return platform detection, user fills manually
    const message =
      error instanceof Error ? error.message : "Gagal scrape produk";
    return NextResponse.json(
      {
        productName: "",
        productPrice: "",
        productImage: "",
        description: "",
        notes: "",
        platform,
        warning: message,
      },
      { status: 200 }
    );
  }
}
