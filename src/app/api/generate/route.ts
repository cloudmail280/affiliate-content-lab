import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { generateContent } from "@/lib/gemini";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { productId } = body;

  if (!productId) {
    return NextResponse.json(
      { error: "productId is required" },
      { status: 400 }
    );
  }

  const supabase = getSupabase();

  // Fetch product info
  const { data: product, error: fetchError } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .single();

  if (fetchError || !product) {
    return NextResponse.json(
      { error: "Product not found" },
      { status: 404 }
    );
  }

  try {
    // Generate content using Gemini (multimodal when an image is present)
    const generatedContent = await generateContent({
      name: product.product_name,
      price: product.product_price || undefined,
      notes: product.notes || undefined,
      platform: product.platform || undefined,
      imageUrl: product.product_image_url || undefined,
    });

    // Save generated content to product
    const { error: updateError } = await supabase
      .from("products")
      .update({
        generated_content: generatedContent,
        updated_at: new Date().toISOString(),
      })
      .eq("id", productId);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(generatedContent);
  } catch (error) {
    console.error("Generation error:", error);
    const message = error instanceof Error ? error.message : "Failed to generate content";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
