create extension if not exists pgcrypto;

create table if not exists public.plants (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('edible', 'inedible')),
  slug text not null,
  name text not null,
  scientific_name text not null,
  short_description text not null,
  hero_image_url text not null,
  status text not null default 'published' check (status in ('draft', 'published')),
  published_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz null
);

create table if not exists public.plant_blocks (
  id uuid primary key default gen_random_uuid(),
  plant_id uuid not null references public.plants(id) on delete cascade,
  position int not null,
  block_kind text not null check (block_kind in ('about', 'edible_recipe', 'inedible_use')),
  title text null,
  body text null,
  image_url text null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (plant_id, position)
);

create unique index if not exists plants_slug_active_unique
  on public.plants (lower(slug))
  where deleted_at is null;

create index if not exists plants_public_order_idx
  on public.plants (status, deleted_at, updated_at desc);

create index if not exists plant_blocks_lookup_idx
  on public.plant_blocks (plant_id, position);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_plants_updated_at
before update on public.plants
for each row
execute function public.set_updated_at();

create trigger set_plant_blocks_updated_at
before update on public.plant_blocks
for each row
execute function public.set_updated_at();

alter table public.plants enable row level security;
alter table public.plant_blocks enable row level security;

create policy "Public can view published plants"
on public.plants
for select
using (status = 'published' and deleted_at is null);

create policy "Public can view blocks for published plants"
on public.plant_blocks
for select
using (
  exists (
    select 1
    from public.plants
    where plants.id = plant_blocks.plant_id
      and plants.status = 'published'
      and plants.deleted_at is null
  )
);
