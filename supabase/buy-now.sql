-- "Buy now" on the flower page: orders ONE flower straight away, without the basket.
-- The basket is not touched, so anything already in it stays there.
-- Run once in Supabase -> SQL Editor, after orders-shipping-address.sql (safe to run again).

create or replace function public.place_single_order(
  p_flower_id bigint,
  p_quantity  int,
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
  flower public."Flowers"%rowtype;
  new_order_id bigint;
begin
  if uid is null then
    raise exception 'Please sign in to place an order';
  end if;

  -- Same address rules as place_order(). Checked here too, not only in the browser:
  -- anyone can call this function directly.
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
    full_name, city, street, building, flat, address
  )
  values (
    uid, 'new', now(), clean_phone,
    clean_name, clean_city, clean_street, clean_building, clean_flat,
    coalesce('Flat ' || clean_flat || ', ', '') || clean_building || ' ' || clean_street || ', ' || clean_city
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

revoke execute on function public.place_single_order(bigint, int, text, text, text, text, text, text) from public, anon;
grant execute on function public.place_single_order(bigint, int, text, text, text, text, text, text) to authenticated;
