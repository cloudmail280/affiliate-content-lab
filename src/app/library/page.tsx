"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Library,
  Sparkles,
  Archive,
  CheckCircle2,
  FileText,
} from "lucide-react";

type Product = {
  id: string;
  product_name: string;
  product_price: string | null;
  platform: string | null;
  status: "draft" | "posted" | "archived";
  created_at: string;
  generated_content: Record<string, unknown> | null;
};

const statusConfig = {
  draft: { label: "Draft", variant: "secondary" as const, icon: FileText },
  posted: { label: "Posted", variant: "success" as const, icon: CheckCircle2 },
  archived: { label: "Archived", variant: "outline" as const, icon: Archive },
};

export default function LibraryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filter, setFilter] = useState<"all" | "draft" | "posted" | "archived">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, status: string) {
    try {
      await fetch(`/api/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      fetchProducts();
    } catch (error) {
      console.error("Error updating status:", error);
    }
  }

  const filteredProducts =
    filter === "all"
      ? products
      : products.filter((p) => p.status === filter);

  return (
    <div className="p-4 space-y-4">
      <div className="pt-2">
        <h1 className="text-2xl font-bold">Library</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {products.length} produk tersimpan
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {(["all", "draft", "posted", "archived"] as const).map((status) => (
          <Button
            key={status}
            variant={filter === status ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(status)}
            className="capitalize shrink-0"
          >
            {status === "all" ? "Semua" : status}
            <Badge variant="secondary" className="ml-1.5 text-xs">
              {status === "all"
                ? products.length
                : products.filter((p) => p.status === status).length}
            </Badge>
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">
          Loading...
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <Library className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold">Belum ada produk</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Tambah produk baru untuk mulai generate konten
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredProducts.map((product) => {
            const config = statusConfig[product.status];
            return (
              <Card key={product.id} className="overflow-hidden">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/generate?id=${product.id}`}
                        className="font-medium text-sm hover:text-primary transition-colors line-clamp-1"
                      >
                        {product.product_name}
                      </Link>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge variant={config.variant} className="text-xs">
                          {config.label}
                        </Badge>
                        {product.platform && (
                          <Badge variant="outline" className="text-xs capitalize">
                            {product.platform}
                          </Badge>
                        )}
                        {product.generated_content && (
                          <Badge variant="secondary" className="text-xs">
                            <Sparkles className="h-2.5 w-2.5 mr-0.5" />
                            Generated
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5">
                        {new Date(product.created_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                        {product.product_price && ` · ${product.product_price}`}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {product.status === "draft" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateStatus(product.id, "posted")}
                          title="Mark as posted"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {product.status !== "archived" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateStatus(product.id, "archived")}
                          title="Archive"
                        >
                          <Archive className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
