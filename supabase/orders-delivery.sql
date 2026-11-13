-- Adds delivery details (phone + address) to orders.
-- Run once in Supabase -> SQL Editor, after orders-setup.sql and admin-setup.sql
-- (safe to run again).

-- 1. New columns on "orders"
alter table orders add column if not exists phone text;
alter table orders add column if not exists address text;

-- 2. place_order() now needs the phone and address.
--    The old version without parameters is removed so it can't be used any more.
drop function if exists public.place_order();

create or replace function public.place_order(p_phone text, p_address text)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  clean_phone text := btrim(coalesce(p_phone, ''));
  clean_address text := btrim(coalesce(p_address, ''));
  new_order_id bigint;
begin
  if uid is null then
    raise exception 'Please sign in to place an order';
  end if;

  -- Checked here too, not only in the browser
  if clean_phone !~ '^\+?[0-9 ()-]{6,20}$' then
    raise exception 'Please enter a valid phone number';
  end if;
  if char_length(clean_address) < 5 or char_length(clean_address) > 300 then
    raise exception 'Please enter the delivery address';
  end if;

  -- lock the basket rows so a second click can't place the same basket twice
  perform 1 from public.cart where user_id = uid for update;
  if not found then
    raise exception 'Your basket is empty';
  end if;

  insert into public.orders (user_id, status, created_at, phone, address)
  values (uid, 'new', now(), clean_phone, clean_address)
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

revoke execute on function public.place_order(text, text) from public, anon;
grant execute on function public.place_order(text, text) to authenticated;

-- 3. The admin order list also returns phone and address.
--    (Its columns change, so it has to be dropped and created again.)
drop function if exists public.admin_list_orders();

create function public.admin_list_orders()
returns table (
  id bigint,
  created_at timestamptz,
  status text,
  customer_email text,
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
