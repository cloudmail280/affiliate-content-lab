"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link2, Upload, Sparkles, Loader2, Search, CheckCircle2 } from "lucide-react";

export default function AddProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [scraped, setScraped] = useState(false);
  const [scrapeWarning, setScrapeWarning] = useState("");
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const [formData, setFormData] = useState({
    productUrl: "",
    productName: "",
    productPrice: "",
    notes: "",
    platform: "" as "shopee" | "tiktok" | "",
  });

  // Auto-detect platform from URL
  function detectPlatform(url: string) {
    if (url.includes("shopee")) return "shopee";
    if (url.includes("tiktok") || url.includes("tokopedia")) return "tiktok";
    return "";
  }

  function isValidProductUrl(url: string) {
    return (
      (url.includes("shopee") || url.includes("tiktok") || url.includes("tokopedia")) &&
      (url.startsWith("http://") || url.startsWith("https://"))
    );
  }

  async function scrapeProduct(url: string) {
    setScraping(true);
    setScraped(false);
    setScrapeWarning("");

    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();

      // Auto-fill form fields
      setFormData((prev) => ({
        ...prev,
        productName: data.productName || prev.productName,
        productPrice: data.productPrice || prev.productPrice,
        notes: data.notes || prev.notes,
        platform: data.platform || prev.platform,
      }));

      if (data.warning) {
        setScrapeWarning(data.warning);
      }

      if (data.productName) {
        setScraped(true);
      }
    } catch (error) {
      console.error("Scrape error:", error);
      setScrapeWarning("Gagal fetch info produk. Isi manual ya.");
    } finally {
      setScraping(false);
    }
  }

  function handleUrlChange(url: string) {
    const platform = detectPlatform(url) || formData.platform;
    setFormData({
      ...formData,
      productUrl: url,
      platform,
    });

    // Debounce auto-scrape
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (isValidProductUrl(url)) {
      debounceRef.current = setTimeout(() => {
        scrapeProduct(url);
      }, 800);
    }
  }

  function handleUrlPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pastedUrl = e.clipboardData.getData("text");
    if (isValidProductUrl(pastedUrl)) {
      // Clear debounce and scrape immediately on paste
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      setTimeout(() => scrapeProduct(pastedUrl), 100);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.productName) return;

    setLoading(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.id) {
        router.push(`/generate?id=${data.id}`);
      }
    } catch (error) {
      console.error("Error saving product:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 space-y-4">
      <div className="pt-2">
        <h1 className="text-2xl font-bold">Tambah Produk</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Paste link dan info produk otomatis terisi
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              Link Produk
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Input
                placeholder="Paste link Shopee/TikTok Shop..."
                value={formData.productUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                onPaste={handleUrlPaste}
              />
              {scraping && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
              )}
              {scraped && !scraping && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                </div>
              )}
            </div>
            {scraping && (
              <p className="text-xs text-primary flex items-center gap-1">
                <Search className="h-3 w-3" />
                Mengambil info produk...
              </p>
            )}
            {scraped && !scraping && (
              <p className="text-xs text-green-600 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Info produk berhasil diambil! Cek & edit di bawah.
              </p>
            )}
            {scrapeWarning && !scraping && (
              <p className="text-xs text-yellow-600">
                {scrapeWarning}
              </p>
            )}
            {formData.platform && !scraping && (
              <p className="text-xs text-muted-foreground">
                Platform terdeteksi:{" "}
                <span className="font-medium capitalize text-primary">
                  {formData.platform}
                </span>
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Info Produk
              {scraped && (
                <span className="text-xs font-normal text-muted-foreground">
                  (auto-filled, bisa diedit)
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">
                Nama Produk *
              </label>
              <Input
                placeholder="Contoh: Cardigan Oversize Korean Style"
                value={formData.productName}
                onChange={(e) =>
                  setFormData({ ...formData, productName: e.target.value })
                }
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Harga</label>
              <Input
                placeholder="Contoh: Rp 89.000"
                value={formData.productPrice}
                onChange={(e) =>
                  setFormData({ ...formData, productPrice: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">
                Platform
              </label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={
                    formData.platform === "shopee" ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() =>
                    setFormData({ ...formData, platform: "shopee" })
                  }
                >
                  Shopee
                </Button>
                <Button
                  type="button"
                  variant={
                    formData.platform === "tiktok" ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() =>
                    setFormData({ ...formData, platform: "tiktok" })
                  }
                >
                  TikTok
                </Button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">
                Notes / Brief
              </label>
              <Textarea
                placeholder="Target audience, vibe yang dimau, selling point utama..."
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={4}
              />
              {scraped && formData.notes && (
                <p className="text-xs text-muted-foreground mt-1">
                  AI auto-generated brief. Edit sesuai kebutuhan.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Button
          type="submit"
          className="w-full h-12 text-base"
          disabled={!formData.productName || loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Simpan & Generate Konten
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
