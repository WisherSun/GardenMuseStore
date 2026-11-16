-- Delivery date + time slot chosen by the customer on the order form (optional).
-- Run once in Supabase -> SQL Editor, after orders-shipping-address.sql and buy-now.sql
-- (safe to run again). It replaces place_order(), place_single_order() and admin_list_orders().
--
-- Time slots (PLACEHOLDER hours, change them here AND in src/lib/delivery.js):
--   morning   09:00-12:00
--   afternoon 12:00-17:00
--   evening   17:00-21:00
-- All times are London time.

-- 1. Two new columns on "orders". Both empty = "as soon as possible" (and all old orders).
--    Customers who chose no date see "on its way" once the order is confirmed.
alter table orders add column if not exists delivery_date date;
alter table orders add column if not exists delivery_slot text;  -- 'morning' | 'afternoon' | 'evening', empty = any time

alter table orders drop constraint if exists orders_delivery_slot_check;
alter table orders add constraint orders_delivery_slot_check
  check (delivery_slot in ('morning', 'afternoon', 'evening'));

-- a time slot without a date makes no sense
alter table orders drop constraint if exists orders_delivery_slot_needs_date;
alter table orders add constraint orders_delivery_slot_needs_date
  check (delivery_slot is null or delivery_date is not null);

-- 2. One shared check for both order functions. It raises an error if the date/slot
--    can't be delivered: in the past, more than a year ahead, or a slot that is already over today.
create or replace function public.check_delivery_time(p_date date, p_slot text)
returns void
language plpgsql
set search_path = ''
as $$
declare
  london_now timestamp := now() at time zone 'Europe/London';
  today date := london_now::date;
  last_hour int;
begin
  if p_date is null then
    if p_slot is not null then
      raise exception 'Please choose the delivery date as well';
    end if;
    return;
  end if;

  if p_slot is not null and p_slot not in ('morning', 'afternoon', 'evening') then
    raise exception 'Please choose a delivery time from the list';
  end if;

  if p_date < today or p_date > today + 365 then
    raise exception 'Please choose a delivery date from today up to a year ahead';
  end if;

  -- Today: the chosen slot (or, with no slot, the whole delivery day) must not be over yet
  if p_date = today then
    last_hour := case p_slot when 'morning' then 12 when 'afternoon' then 17 else 21 end;
    if extract(hour from london_now) >= last_hour then
      raise exception 'That delivery time has already passed';
    end if;
  end if;
end;
$$;

-- Only used inside the order functions below, nobody calls it directly
revoke execute on function public.check_delivery_time(date, text) from public, anon, authenticated;

-- 3. place_order() (basket) also takes the delivery date and slot.
drop function if exists public.place_order(text, text, text, text, text, text);

create or replace function public.place_order(
  p_full_name     text,
  p_city          text,
  p_street        text,
  p_building      text,
  p_flat          text default null,
  p_phone         text default null,
  p_delivery_date date default null,
  p_delivery_slot text default null
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
  clean_slot     text := nullif(btrim(coalesce(p_delivery_slot, '')), '');
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
  perform public.check_delivery_time(p_delivery_date, clean_slot);

  -- lock the basket rows so a second click can't place the same basket twice
  perform 1 from public.cart where user_id = uid for update;
  if not found then
    raise exception 'Your basket is empty';
  end if;

  insert into public.orders (
    user_id, status, created_at, phone,
    full_name, city, street, building, flat, address,
    delivery_date, delivery_slot
  )
  values (
    uid, 'new', now(), clean_phone,
    clean_name, clean_city, clean_street, clean_building, clean_flat,
    -- e.g. "Flat 4, 12 Baker Street, London"  (no "Flat ..." part for houses)
    coalesce('Flat ' || clean_flat || ', ', '') || clean_building || ' ' || clean_street || ', ' || clean_city,
    p_delivery_date, clean_slot
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

revoke execute on function public.place_order(text, text, text, text, text, text, date, text) from public, anon;
grant execute on function public.place_order(text, text, text, text, text, text, date, text) to authenticated;

-- 4. place_single_order() ("Buy now") also takes the delivery date and slot.
drop function if exists public.place_single_order(bigint, int, text, text, text, text, text, text);

create or replace function public.place_single_order(
  p_flower_id     bigint,
  p_quantity      int,
  p_full_name     text,
  p_city          text,
  p_street        text,
  p_building      text,
  p_flat          text default null,
  p_phone         text default null,
  p_delivery_date date default null,
  p_delivery_slot text default null
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
  clean_slot     text := nullif(btrim(coalesce(p_delivery_slot, '')), '');
  flower public."Flowers"%rowtype;
  new_order_id bigint;
begin
  if uid is null then
    raise exception 'Please sign in to place an order';
  end if;

  -- Same rules as place_order(). Checked here too, not only in the browser.
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
  perform public.check_delivery_time(p_delivery_date, clean_slot);

  if p_quantity is null or p_quantity < 1 or p_quantity > 99 then
    raise exception 'Please choose a quantity from 1 to 99';
  end if;

  -- Name and price come from the database, never from the browser.
  select * into flower from public."Flowers" where id = p_flower_id;
  if not found then
    raise exception 'This flower is no longer available';
  end if;

  insert into public.orders (
    user_id, status, created_at, phone,
    full_name, city, street, building, flat, address,
    delivery_date, delivery_slot
  )
  values (
    uid, 'new', now(), clean_phone,
    clean_name, clean_city, clean_street, clean_building, clean_flat,
    coalesce('Flat ' || clean_flat || ', ', '') || clean_building || ' ' || clean_street || ', ' || clean_city,
    p_delivery_date, clean_slot
  )
  returning id into new_order_id;

  insert into public.order_items (order_id, flower_id, name, quantity, unit_price)
  values (
    new_order_id,
    flower.id,
    flower.name,
    p_quantity,
    case when flower.discount and flower."newPrice" is not null then flower."newPrice" else flower.price end
  );

  return new_order_id;
end;
$$;

revoke execute on function public.place_single_order(bigint, int, text, text, text, text, text, text, date, text) from public, anon;
grant execute on function public.place_single_order(bigint, int, text, text, text, text, text, text, date, text) to authenticated;

-- 5. The admin order list also returns the delivery date and slot.
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
  delivery_date date,
  delivery_slot text,
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
    o.delivery_date,
    o.delivery_slot,
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

-- 6. Clean-up: an earlier draft of this file added a trigger that filled in "next morning"
--    when an order without a date was confirmed. That rule was dropped; this removes it
--    if it was ever run. (Without a date, the customer now just sees "on its way".)
drop trigger if exists orders_default_delivery on orders;
drop function if exists public.orders_default_delivery();
