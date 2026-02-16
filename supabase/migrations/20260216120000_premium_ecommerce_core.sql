-- Premium e-commerce core schema

create table if not exists public.premium_products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  price numeric(12,2) not null default 0,
  stock_quantity integer not null default 0,
  image_url text,
  category text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.premium_cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  product_id uuid not null references public.premium_products(id) on delete cascade,
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

create table if not exists public.premium_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  order_number text not null unique default ('PO-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))),
  status text not null default 'placed',
  shipping_address text not null,
  total_amount numeric(12,2) not null,
  created_at timestamptz not null default now()
);

create table if not exists public.premium_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.premium_orders(id) on delete cascade,
  product_id uuid not null references public.premium_products(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null
);

create table if not exists public.premium_delivery_partners (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  full_name text not null,
  phone text,
  vehicle_no text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.premium_delivery_assignments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.premium_orders(id) on delete cascade,
  partner_id uuid not null references public.premium_delivery_partners(id) on delete restrict,
  delivery_status text not null default 'assigned',
  created_at timestamptz not null default now(),
  unique (order_id)
);

alter table public.premium_products enable row level security;
alter table public.premium_cart_items enable row level security;
alter table public.premium_orders enable row level security;
alter table public.premium_order_items enable row level security;
alter table public.premium_delivery_partners enable row level security;
alter table public.premium_delivery_assignments enable row level security;

create policy if not exists "premium products read" on public.premium_products
for select using (is_active = true);

create policy if not exists "premium cart owner all" on public.premium_cart_items
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy if not exists "premium orders owner read" on public.premium_orders
for select using (auth.uid() = user_id);

create policy if not exists "premium delivery assignments read" on public.premium_delivery_assignments
for select using (
  exists (
    select 1 from public.premium_delivery_partners dp
    where dp.id = partner_id and dp.user_id = auth.uid()
  )
  or public.has_role(auth.uid(), 'admin')
);

create index if not exists idx_premium_products_slug on public.premium_products(slug);
create index if not exists idx_premium_cart_items_user_id on public.premium_cart_items(user_id);
create index if not exists idx_premium_orders_user_id on public.premium_orders(user_id);
create index if not exists idx_premium_delivery_assignments_partner on public.premium_delivery_assignments(partner_id);
