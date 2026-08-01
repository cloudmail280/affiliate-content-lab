import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const MAX_SIZE = 4 * 1024 * 1024; // 4MB (keeps inline Gemini payload reasonable)
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const BUCKET = "product-images";

// POST: upload a product image to Supabase Storage, return its public URL
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Format foto harus JPG, PNG, atau WEBP" },
        { status: 415 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "Ukuran foto maksimal 4MB" },
        { status: 413 }
      );
    }

    const supabase = getServiceSupabase();
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(fileName, file, { contentType: file.type, upsert: false });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(fileName);

    return NextResponse.json({ url: urlData.publicUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
