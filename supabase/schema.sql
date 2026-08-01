-- Affiliate Content Lab - Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Products table
create table if not exists products (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  product_url text,
  product_name text not null,
  product_price text,
  product_image_url text,
  notes text,
  platform text check (platform in ('shopee', 'tiktok')),
  status text not null default 'draft' check (status in ('draft', 'posted', 'archived')),
  generated_content jsonb
);

-- Index for faster queries
create index if not exists idx_products_status on products(status);
create index if not exists idx_products_created_at on products(created_at desc);

-- Row Level Security (RLS) - disabled for MVP single-user
-- Enable later when adding auth:
-- alter table products enable row level security;
-- create policy "Users can manage their own products" on products
--   for all using (auth.uid() = user_id);

-- ===================================================================
-- Product images storage bucket (public read for MVP)
-- Uploads happen server-side via SUPABASE_SERVICE_ROLE_KEY (bypasses RLS),
-- so no insert policy is required. Public read lets the stored URL be
-- fetched directly by the generate route (to send the image to Gemini).
-- ===================================================================
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Allow public read of product images
create policy "Public read product images"
  on storage.objects for select
  using (bucket_id = 'product-images');
