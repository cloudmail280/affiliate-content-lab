"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Link2,
  Upload,
  Sparkles,
  Loader2,
  ImagePlus,
  X,
  AlertCircle,
} from "lucide-react";

const MAX_SIZE = 4 * 1024 * 1024; // 4MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function AddProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
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
    if (url.includes("tiktok")) return "tiktok";
    return "";
  }

  function handleUrlChange(url: string) {
    setFormData({
      ...formData,
      productUrl: url,
      platform: detectPlatform(url) || formData.platform,
    });
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Format foto harus JPG, PNG, atau WEBP");
      return;
    }
    if (file.size > MAX_SIZE) {
      setError("Ukuran foto maksimal 4MB");
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function handleRemoveImage() {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.productName) return;

    setError(null);
    setLoading(true);

    try {
      let productImageUrl: string | null = null;

      // Upload image first (if present), then create the product with its URL
      if (imageFile) {
        const fd = new FormData();
        fd.append("file", imageFile);
        const upRes = await fetch("/api/upload", { method: "POST", body: fd });
        const upData = await upRes.json();
        if (!upRes.ok || !upData.url) {
          setError(upData.error || "Gagal upload foto");
          setLoading(false);
          return;
        }
        productImageUrl = upData.url;
      }

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, productImageUrl }),
      });
      const data = await res.json();
      if (data.id) {
        router.push(`/generate?id=${data.id}`);
      } else {
        setError(data.error || "Gagal menyimpan produk");
      }
    } catch (error) {
      console.error("Error saving product:", error);
      setError("Terjadi kesalahan, coba lagi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 space-y-4">
      <div className="pt-2">
        <h1 className="text-2xl font-bold">Tambah Produk</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Paste link atau input manual untuk generate konten
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              Link Produk
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Paste link Shopee/TikTok Shop..."
              value={formData.productUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
            />
            {formData.platform && (
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
              <ImagePlus className="h-4 w-4" />
              Foto Produk
            </CardTitle>
          </CardHeader>
          <CardContent>
            {imagePreview ? (
              <div className="relative w-full aspect-square rounded-lg overflow-hidden border">
                <Image
                  src={imagePreview}
                  alt="Preview produk"
                  fill
                  className="object-cover"
                  sizes="100vw"
                  unoptimized
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8"
                  onClick={handleRemoveImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <label
                htmlFor="product-image"
                className="flex flex-col items-center justify-center gap-2 w-full aspect-square rounded-lg border border-dashed cursor-pointer hover:bg-muted/50 transition-colors text-muted-foreground"
              >
                <ImagePlus className="h-8 w-8" />
                <span className="text-sm">Klik untuk upload foto produk</span>
                <span className="text-xs">JPG, PNG, WEBP · maks 4MB</span>
                <input
                  id="product-image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              Foto dikirim ke AI untuk analisis visual → konten lebih tajam
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Info Produk
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
                rows={3}
              />
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
