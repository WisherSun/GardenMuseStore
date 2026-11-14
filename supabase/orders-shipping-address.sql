-- Full delivery address on orders (London-style): name, city, street, building, flat.
-- Phone becomes optional.
-- Run once in Supabase -> SQL Editor, after orders-delivery.sql (safe to run again).

-- 1. New columns on "orders".
--    Old orders keep their one-line "address"; the new columns stay empty for them.
--    New orders fill both: the separate parts AND "address" as a ready-to-read line,
--    so the order history and admin list keep working for old and new orders alike.
alter table orders add column if not exists full_name text;
alter table orders add column if not exists city      text;
alter table orders add column if not exists street    text;
alter table orders add column if not exists building  text;  -- house number or building name, e.g. '221B'
alter table orders add column if not exists flat      text;  -- empty for houses

-- Columns from the earlier US-style draft, in case that version was run. They were never used.
alter table orders drop column if exists state;
alter table orders drop column if exists zip_code;
alter table orders drop column if exists country;

-- 2. place_order() now takes the full address. Older versions are removed.
drop function if exists public.place_order(text, text);
drop function if exists public.place_order(text, text, text, text, text, text);

create or replace function public.place_order(
  p_full_name text,
  p_city      text,
  p_street    text,
  p_building  text,
  p_flat      text default null,
  p_phone     text default null
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  clean_name     text := btrim(coalesce(p_full_name, ''));
  clean_city     text := btrim(coalesce(p_city, ''));
  clean_street   text := btrim(coalesce(p_street, ''));
  clean_building text := btrim(coalesce(p_building, ''));
  clean_flat     text := nullif(btrim(coalesce(p_flat, '')), '');
  clean_phone    text := nullif(btrim(coalesce(p_phone, '')), '');
  new_order_id bigint;
begin
  if uid is null then
    raise exception 'Please sign in to place an order';
  end if;

  -- Checked here too, not only in the browser: anyone can call this function directly.
  if char_length(clean_name) < 2 or char_length(clean_name) > 100 then
    raise exception 'Please enter the recipient name';
  end if;
  if char_length(clean_city) < 2 or char_length(clean_city) > 100 then
    raise exception 'Please enter the city';
  end if;
  if char_length(clean_street) < 2 or char_length(clean_street) > 150 then
    raise exception 'Please enter the street';
  end if;
  if char_length(clean_building) < 1 or char_length(clean_building) > 50 then
    raise exception 'Please enter the building';
  end if;
  if char_length(clean_flat) > 20 then
    raise exception 'Please enter a shorter flat number';
  end if;
  if clean_phone is not null and clean_phone !~ '^\+?[0-9 ()-]{6,20}$' then
    raise exception 'Please enter a valid phone number';
  end if;

  -- lock the basket rows so a second click can't place the same basket twice
  perform 1 from public.cart where user_id = uid for update;
  if not found then
    raise exception 'Your basket is empty';
  end if;

  insert into public.orders (
    user_id, status, created_at, phone,
    full_name, city, street, building, flat, address
  )
  values (
    uid, 'new', now(), clean_phone,
    clean_name, clean_city, clean_street, clean_building, clean_flat,
    -- e.g. "Flat 4, 12 Baker Street, London"  (no "Flat ..." part for houses)
    coalesce('Flat ' || clean_flat || ', ', '') || clean_building || ' ' || clean_street || ', ' || clean_city
  )
  returning id into new_order_id;

  insert into public.order_items (order_id, flower_id, name, quantity, unit_price)
  select new_order_id,
         f.id,
         f.name,
         c.quantity,
         case when f.discount and f."newPrice" is not null then f."newPrice" else f.price end
  from public.cart c
  join public."Flowers" f on f.id = c.flower_id
  where c.user_id = uid
  order by c.id;

  delete from public.cart where user_id = uid;

  return new_order_id;
end;
$$;

revoke execute on function public.place_order(text, text, text, text, text, text) from public, anon;
grant execute on function public.place_order(text, text, text, text, text, text) to authenticated;

-- 3. The admin order list also returns the recipient name.
--    (Its columns change, so it has to be dropped and created again.)
drop function if exists public.admin_list_orders();

create function public.admin_list_orders()
returns table (
  id bigint,
  created_at timestamptz,
  status text,
  customer_email text,
  full_name text,
  phone text,
  address text,
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
    o.full_name,
    o.phone,
    o.address,
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
