-- Refugee Digital Identity - Supabase schema baseline (identity service)

create extension if not exists "pgcrypto";

create table if not exists public.refugee_profiles (
  id uuid primary key default gen_random_uuid(),
  refugee_id text unique not null,
  auth_user_id uuid unique not null,
  full_name text not null,
  camp text not null check (camp in ('Hagadera','Ifo','Dagahaley','Kakuma')),
  ration_card text unique not null,
  alien_id text not null,
  biometric_opt_in boolean not null default false,
  language text not null default 'en' check (language in ('en','so','sw','ar')),
  phone_number text unique not null,
  registration_channel text not null default 'mobile_app',
  created_at timestamptz not null default now()
);

create index if not exists refugee_profiles_refugee_id_idx on public.refugee_profiles (refugee_id);
create index if not exists refugee_profiles_auth_user_id_idx on public.refugee_profiles (auth_user_id);
