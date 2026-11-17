-- Stock: how many of each flower can still be ordered ("amount" on "Flowers").
-- Run once in Supabase -> SQL Editor, after orders-delivery-time.sql (safe to run again).
-- It replaces place_order() and place_single_order() with versions that check and reduce the stock.
--
-- How it works:
-- - Putting flowers in the basket does NOT reserve them. Stock goes down only when an order
--   is placed, otherwise forgotten baskets would make flowers look sold out for ever.
-- - The order functions check the stock and reduce it in the same step as creating the order.
--   The flower rows are locked meanwhile, so two customers can't both buy the last bouquet.
-- - The browser also stops customers from choosing more than is in stock, but that is only
--   for convenience: the database is what really decides.
-- - When an admin sets an order to "cancelled", its flowers go back into stock
--   (and are taken again if the order is set back from "cancelled").

-- 1. The column (skipped if it already exists). Never empty, never below 0.
alter table "Flowers" add column if not exists amount integer not null default 0 check (amount >= 0);

-- 2. place_order() (basket) with a stock check.
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
  short_name text;
  short_left int;
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

  -- Lock the flowers in the basket (in id order, so two orders never wait on each other),
  -- then check there are enough of each.
  perform 1 from public."Flowers"
  where id in (select flower_id from public.cart where user_id = uid)
  order by id
  for update;

  select f.name || coalesce(' (' || nullif(btrim(f.color), '') || ')', ''), f.amount
    into short_name, short_left
  from public.cart c
  join public."Flowers" f on f.id = c.flower_id
  where c.user_id = uid and c.quantity > f.amount
  order by c.id
  limit 1;

  if found then
    if short_left = 0 then
      raise exception '% is sold out. Please remove it from your basket.', short_name;
    end if;
    raise exception 'Only % of % left. Please lower the quantity in your basket.', short_left, short_name;
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

  -- take the ordered flowers out of stock
  update public."Flowers" f
  set amount = f.amount - c.quantity
  from public.cart c
  where c.user_id = uid and c.flower_id = f.id;

  delete from public.cart where user_id = uid;

  return new_order_id;
end;
$$;

revoke execute on function public.place_order(text, text, text, text, text, text, date, text) from public, anon;
grant execute on function public.place_order(text, text, text, text, text, text, date, text) to authenticated;

-- 3. place_single_order() ("Buy now") with a stock check.
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
  -- "for update" locks the flower until the order is saved (see the note at the top).
  select * into flower from public."Flowers" where id = p_flower_id for update;
  if not found then
    raise exception 'This flower is no longer available';
  end if;

  if flower.amount = 0 then
    raise exception 'Sorry, this flower is sold out';
  end if;
  if p_quantity > flower.amount then
    raise exception 'Only % left. Please choose a smaller quantity.', flower.amount;
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

  update public."Flowers" set amount = amount - p_quantity where id = flower.id;

  return new_order_id;
end;
$$;

revoke execute on function public.place_single_order(bigint, int, text, text, text, text, text, text, date, text) from public, anon;
grant execute on function public.place_single_order(bigint, int, text, text, text, text, text, text, date, text) to authenticated;

-- 4. Cancelled orders give their flowers back.
--    Runs inside the database whenever an order's status changes.
create or replace function public.order_stock_on_cancel()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  short_name text;
begin
  -- cancelled now: put the flowers back
  if new.status = 'cancelled' and old.status is distinct from 'cancelled' then
    update public."Flowers" f
    set amount = f.amount + i.qty
    from (
      select flower_id, sum(quantity) as qty
      from public.order_items
      where order_id = new.id and flower_id is not null
      group by flower_id
    ) i
    where f.id = i.flower_id;

  -- no longer cancelled: take them again, if there are still enough
  elsif old.status = 'cancelled' and new.status is distinct from 'cancelled' then
    select f.name into short_name
    from public."Flowers" f
    join (
      select flower_id, sum(quantity) as qty
      from public.order_items
      where order_id = new.id and flower_id is not null
      group by flower_id
    ) i on i.flower_id = f.id
    where f.amount < i.qty
    limit 1;

    if found then
      raise exception 'Not enough "%" in stock to reopen this order', short_name;
    end if;

    update public."Flowers" f
    set amount = f.amount - i.qty
    from (
      select flower_id, sum(quantity) as qty
      from public.order_items
      where order_id = new.id and flower_id is not null
      group by flower_id
    ) i
    where f.id = i.flower_id;
  end if;

  return new;
end;
$$;

revoke execute on function public.order_stock_on_cancel() from public, anon, authenticated;

drop trigger if exists order_stock_on_cancel on orders;
create trigger order_stock_on_cancel
  after update of status on orders
  for each row execute function public.order_stock_on_cancel();
