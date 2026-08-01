import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// GET all products
export async function GET() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST create product
export async function POST(request: NextRequest) {
  const supabase = getSupabase();
  const body = await request.json();

  const { data, error } = await supabase
    .from("products")
    .insert({
      product_url: body.productUrl || null,
      product_name: body.productName,
      product_price: body.productPrice || null,
      product_image_url: body.productImageUrl || null,
      notes: body.notes || null,
      platform: body.platform || null,
      status: "draft",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
