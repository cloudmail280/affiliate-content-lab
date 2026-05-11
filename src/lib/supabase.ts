import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        "Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY"
      );
    }

    _supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
  return _supabase;
}

export type Product = {
  id: string;
  created_at: string;
  updated_at: string;
  product_url: string | null;
  product_name: string;
  product_price: string | null;
  product_image_url: string | null;
  notes: string | null;
  platform: "shopee" | "tiktok" | null;
  status: "draft" | "posted" | "archived";
  generated_content: GeneratedContent | null;
};

export type GeneratedContent = {
  hooks: string[];
  captions: string[];
  hashtags: string[];
  content_angles: string[];
  cover_texts: string[];
  cta: string[];
};
