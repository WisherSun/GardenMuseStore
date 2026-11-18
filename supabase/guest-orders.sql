-- Guest checkout: customers can order without an account.
-- Run once in Supabase -> SQL Editor, after flower-stock.sql (safe to run again).
--
-- How it works:
-- - A guest's basket lives only in their browser, so the browser sends the list of
--   flowers and quantities. Everything else (names, prices, stock) is taken from the
--   database, never from the browser, exactly like place_order().
-- - Guest orders have no user_id; instead they keep the guest's email (guest_email),
--   so the shop can contact them. They don't show up in any "My orders" list.
-- - Same checks as the signed-in order functions: address, phone, delivery time, stock
--   (with the flowers locked, so two customers can't both buy the last bouquet).

-- 1. Orders without an account
alter table orders alter column user_id drop not null;
alter table orders add column if not exists guest_email text;

-- 2. place_guest_order(): used by the basket AND by "Buy now" for guests.
--    p_items = [{"flower_id": 7, "quantity": 2}, ...]
create or replace function public.place_guest_order(
  p_items         jsonb,
  p_email         text,
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
  clean_email    text := lower(btrim(coalesce(p_email, '')));
  clean_name     text := btrim(coalesce(p_full_name, ''));
  clean_city     text := btrim(coalesce(p_city, ''));
  clean_street   text := btrim(coalesce(p_street, ''));
  clean_building text := btrim(coalesce(p_building, ''));
  clean_flat     text := nullif(btrim(coalesce(p_flat, '')), '');
  clean_phone    text := nullif(btrim(coalesce(p_phone, '')), '');
  clean_slot     text := nullif(btrim(coalesce(p_delivery_slot, '')), '');
  ids  bigint[];
  qtys int[];
  item_count int;
  short_name text;
  short_left int;
  new_order_id bigint;
begin
  -- Checked here, not only in the browser: anyone can call this function directly.
  if char_length(clean_email) > 254 or clean_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'Please enter a valid email address';
  end if;
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

  -- The list of flowers: 1 to 50 different flowers, each 1 to 99, no flower twice.
  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'Your basket is empty';
  end if;

  begin
    select array_agg(x.flower_id order by x.flower_id), array_agg(x.quantity order by x.flower_id)
      into ids, qtys
    from jsonb_to_recordset(p_items) as x(flower_id bigint, quantity int);
  exception when others then
    raise exception 'Your basket could not be read';
  end;

  item_count := coalesce(cardinality(ids), 0);
  if item_count = 0 then
    raise exception 'Your basket is empty';
  end if;
  if item_count > 50 then
    raise exception 'Too many different flowers in one order';
  end if;
  if array_position(ids, null) is not null or array_position(qtys, null) is not null
     or exists (select 1 from unnest(qtys) q where q < 1 or q > 99) then
    raise exception 'Please choose a quantity from 1 to 99';
  end if;
  if (select count(distinct v) from unnest(ids) v) <> item_count then
    raise exception 'Your basket could not be read';
  end if;
  if exists (select 1 from unnest(ids) as g(flower_id) where not exists (select 1 from public."Flowers" f where f.id = g.flower_id)) then
    raise exception 'A flower in your basket is no longer available. Please remove it.';
  end if;

  -- Lock the flowers (in id order, so two orders never wait on each other), then check the stock.
  perform 1 from public."Flowers"
  where id in (select unnest(ids))
  order by id
  for update;

  select f.name || coalesce(' (' || nullif(btrim(f.color), '') || ')', ''), f.amount
    into short_name, short_left
  from unnest(ids, qtys) as g(flower_id, quantity)
  join public."Flowers" f on f.id = g.flower_id
  where g.quantity > f.amount
  order by f.id
  limit 1;

  if found then
    if short_left = 0 then
      raise exception '% is sold out. Please remove it from your basket.', short_name;
    end if;
    raise exception 'Only % of % left. Please lower the quantity.', short_left, short_name;
  end if;

  insert into public.orders (
    user_id, guest_email, status, created_at, phone,
    full_name, city, street, building, flat, address,
    delivery_date, delivery_slot
  )
  values (
    null, clean_email, 'new', now(), clean_phone,
    clean_name, clean_city, clean_street, clean_building, clean_flat,
    coalesce('Flat ' || clean_flat || ', ', '') || clean_building || ' ' || clean_street || ', ' || clean_city,
    p_delivery_date, clean_slot
  )
  returning id into new_order_id;

  insert into public.order_items (order_id, flower_id, name, quantity, unit_price)
  select new_order_id,
         f.id,
         f.name,
         g.quantity,
         case when f.discount and f."newPrice" is not null then f."newPrice" else f.price end
  from unnest(ids, qtys) as g(flower_id, quantity)
  join public."Flowers" f on f.id = g.flower_id
  order by f.id;

  -- take the ordered flowers out of stock
  update public."Flowers" f
  set amount = f.amount - g.quantity
  from unnest(ids, qtys) as g(flower_id, quantity)
  where g.flower_id = f.id;

  return new_order_id;
end;
$$;

-- Only for visitors who are NOT signed in ("anon"). Signed-in customers use place_order()
-- and place_single_order(), so their orders are always linked to their account.
revoke execute on function public.place_guest_order(jsonb, text, text, text, text, text, text, text, date, text) from public, authenticated;
grant execute on function public.place_guest_order(jsonb, text, text, text, text, text, text, text, date, text) to anon;

-- 3. Admin list: guest orders show the guest's email and are marked as guest orders.
--    (The result gets a new column, so the function has to be dropped and made again.)
drop function if exists public.admin_list_orders();
create function public.admin_list_orders()
returns table (
  id bigint,
  created_at timestamptz,
  status text,
  customer_email text,
  is_guest boolean,
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
    coalesce(u.email::text, o.guest_email),
    o.user_id is null and o.guest_email is not null,
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
