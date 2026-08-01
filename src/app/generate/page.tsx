"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Loader2,
  Copy,
  Check,
  RefreshCw,
  Zap,
  MessageSquare,
  Hash,
  Eye,
  Type,
  MousePointerClick,
} from "lucide-react";

type GeneratedContent = {
  hooks: string[];
  captions: string[];
  hashtags: string[];
  content_angles: string[];
  cover_texts: string[];
  cta: string[];
};

type Product = {
  id: string;
  product_name: string;
  product_price: string | null;
  product_image_url: string | null;
  notes: string | null;
  platform: string | null;
  generated_content: GeneratedContent | null;
};

export default function GeneratePage() {
  return (
    <Suspense fallback={<div className="p-4 pt-6 text-center text-muted-foreground">Loading...</div>}>
      <GeneratePageContent />
    </Suspense>
  );
}

function GeneratePageContent() {
  const searchParams = useSearchParams();
  const productId = searchParams.get("id");
  const [product, setProduct] = useState<Product | null>(null);
  const [content, setContent] = useState<GeneratedContent | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (productId) {
      fetchProductData(productId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  async function fetchProductData(id: string) {
    try {
      const res = await fetch(`/api/products/${id}`);
      const data = await res.json();
      setProduct(data);
      if (data.generated_content) {
        setContent(data.generated_content);
      }
    } catch (error) {
      console.error("Error fetching product:", error);
    }
  }

  async function handleGenerate() {
    if (!productId) return;
    setGenerating(true);
    try {
      const res = await fetch(`/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      const data = await res.json();
      setContent(data);
    } catch (error) {
      console.error("Error generating content:", error);
    } finally {
      setGenerating(false);
    }
  }

  function copyToClipboard(text: string, field: string) {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }

  function copyAll(items: string[], field: string) {
    const text = items.join("\n\n");
    copyToClipboard(text, field);
  }

  if (!productId) {
    return (
      <div className="p-4 pt-6 text-center">
        <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold">Belum ada produk dipilih</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Tambah produk dulu dari halaman utama
        </p>
      </div>
    );
  }

  const sections = content
    ? [
        {
          key: "hooks",
          title: "Hooks",
          icon: Zap,
          items: content.hooks,
          color: "text-orange-500",
        },
        {
          key: "captions",
          title: "Captions",
          icon: MessageSquare,
          items: content.captions,
          color: "text-blue-500",
        },
        {
          key: "hashtags",
          title: "Hashtags",
          icon: Hash,
          items: content.hashtags,
          color: "text-purple-500",
        },
        {
          key: "content_angles",
          title: "Content Angles",
          icon: Eye,
          items: content.content_angles,
          color: "text-green-500",
        },
        {
          key: "cover_texts",
          title: "Cover Text",
          icon: Type,
          items: content.cover_texts,
          color: "text-pink-500",
        },
        {
          key: "cta",
          title: "Call to Action",
          icon: MousePointerClick,
          items: content.cta,
          color: "text-red-500",
        },
      ]
    : [];

  return (
    <div className="p-4 space-y-4">
      <div className="pt-2 space-y-3">
        {product?.product_image_url && (
          <div className="relative w-full aspect-square rounded-lg overflow-hidden border bg-muted">
            <Image
              src={product.product_image_url}
              alt={product.product_name}
              fill
              className="object-cover"
              sizes="100vw"
            />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold">Generate Konten</h1>
          {product && (
            <p className="text-muted-foreground text-sm mt-1">
              {product.product_name}
              {product.platform && (
                <Badge variant="secondary" className="ml-2 capitalize">
                  {product.platform}
                </Badge>
              )}
            </p>
          )}
        </div>
      </div>

      {!content && (
        <Card>
          <CardContent className="p-6 text-center">
            <Sparkles className="h-10 w-10 mx-auto text-primary mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              Klik tombol di bawah untuk generate konten dengan AI
            </p>
            <Button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full h-12"
            >
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Konten
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {content && (
        <>
          <div className="flex gap-2">
            <Button
              onClick={handleGenerate}
              disabled={generating}
              variant="outline"
              size="sm"
            >
              {generating ? (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="mr-1 h-3 w-3" />
              )}
              Re-generate
            </Button>
          </div>

          {sections.map((section) => (
            <Card key={section.key}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <section.icon className={`h-4 w-4 ${section.color}`} />
                    {section.title}
                    <Badge variant="secondary" className="text-xs">
                      {section.items.length}
                    </Badge>
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyAll(section.items, section.key)}
                  >
                    {copiedField === section.key ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {section.key === "hashtags" ? (
                    <div className="flex flex-wrap gap-1.5">
                      {section.items.map((item, i) => (
                        <Badge
                          key={i}
                          variant="secondary"
                          className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                          onClick={() =>
                            copyToClipboard(
                              `#${item}`,
                              `${section.key}-${i}`
                            )
                          }
                        >
                          #{item}
                          {copiedField === `${section.key}-${i}` && (
                            <Check className="ml-1 h-2.5 w-2.5" />
                          )}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    section.items.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-start justify-between gap-2 p-2.5 rounded-md bg-muted/50 hover:bg-muted transition-colors group"
                      >
                        <p className="text-sm flex-1">{item}</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() =>
                            copyToClipboard(item, `${section.key}-${i}`)
                          }
                        >
                          {copiedField === `${section.key}-${i}` ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </>
      )}
    </div>
  );
}
