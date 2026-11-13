-- Admin panel: who is an admin, and what admins may do.
-- Run once in Supabase -> SQL Editor (safe to run again).
-- All checks happen here in the database; the website only hides or shows the admin page.
-- Then run orders-delivery.sql: it adds phone and address to admin_list_orders().

-- ============ 1. Who is an admin ============
-- A user is an admin if their id is in this table. RLS is on with no policies,
-- so nobody can read or change this table through the website, only from the dashboard.
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- Make someone an admin (they must have signed up on the site first):
-- insert into public.admins (user_id)
-- select id from auth.users where email = 'ADMIN_EMAIL_HERE'
-- on conflict do nothing;

-- ============ 2. Admins manage products ============
drop policy if exists "Admins add flowers" on "Flowers";
drop policy if exists "Admins edit flowers" on "Flowers";
drop policy if exists "Admins delete flowers" on "Flowers";

create policy "Admins add flowers" on "Flowers"
  for insert to authenticated with check (public.is_admin());
create policy "Admins edit flowers" on "Flowers"
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins delete flowers" on "Flowers"
  for delete to authenticated using (public.is_admin());

-- Deleting a flower: remove it from baskets, and keep old orders
-- (order_items keeps the copied name and price; flower_id becomes empty).
do $$
declare
  fk text;
begin
  select c.conname into fk
  from pg_constraint c
  join pg_attribute a on a.attrelid = c.conrelid and a.attnum = any (c.conkey)
  where c.conrelid = 'public.cart'::regclass and c.contype = 'f' and a.attname = 'flower_id';
  if fk is not null then
    execute format('alter table public.cart drop constraint %I', fk);
  end if;
  alter table public.cart
    add constraint cart_flower_id_fkey foreign key (flower_id)
    references public."Flowers" (id) on delete cascade;

  select c.conname into fk
  from pg_constraint c
  join pg_attribute a on a.attrelid = c.conrelid and a.attnum = any (c.conkey)
  where c.conrelid = 'public.order_items'::regclass and c.contype = 'f' and a.attname = 'flower_id';
  if fk is not null then
    execute format('alter table public.order_items drop constraint %I', fk);
  end if;
  alter table public.order_items alter column flower_id drop not null;
  alter table public.order_items
    add constraint order_items_flower_id_fkey foreign key (flower_id)
    references public."Flowers" (id) on delete set null;
end $$;

-- ============ 3. Admins see and update all orders ============
drop policy if exists "Admins read all orders" on orders;
drop policy if exists "Admins update orders" on orders;
drop policy if exists "Admins read all order items" on order_items;

create policy "Admins read all orders" on orders
  for select to authenticated using (public.is_admin());
create policy "Admins update orders" on orders
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins read all order items" on order_items
  for select to authenticated using (public.is_admin());

-- Allowed order statuses.
-- The old rule is removed first: if the table was created with its own status check,
-- Postgres gave it this same name, and it may not allow 'confirmed' / 'delivered'.
alter table orders drop constraint if exists orders_status_check;
update orders set status = 'new'
  where status is null or status not in ('new', 'confirmed', 'delivered', 'cancelled');
alter table orders add constraint orders_status_check
  check (status in ('new', 'confirmed', 'delivered', 'cancelled'));

-- All orders with the customer's email, items and total (newest first).
-- Customer emails live in auth.users, which the website can't read directly,
-- so this function returns them, and only to admins (others get no rows).
drop function if exists public.admin_list_orders();
create function public.admin_list_orders()
returns table (
  id bigint,
  created_at timestamptz,
  status text,
  customer_email text,
  items jsonb,
  total numeric
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    o.id,
    o.created_at,
    o.status,
    u.email::text,
    coalesce(
      jsonb_agg(
        jsonb_build_object('name', i.name, 'quantity', i.quantity, 'unit_price', i.unit_price)
        order by i.id
      ) filter (where i.id is not null),
      '[]'::jsonb
    ),
    coalesce(sum(i.quantity * i.unit_price), 0)
  from public.orders o
  left join auth.users u on u.id = o.user_id
  left join public.order_items i on i.order_id = o.id
  where public.is_admin()
  group by o.id, u.email
  order by o.created_at desc;
$$;

revoke execute on function public.admin_list_orders() from public, anon;
grant execute on function public.admin_list_orders() to authenticated;
