-- Checkout: turns the signed-in user's basket into an order.
-- Run once in Supabase -> SQL Editor (safe to run again).

-- 1. Sensible defaults for new orders
alter table orders alter column user_id set default auth.uid();
alter table orders alter column status set default 'new';
alter table orders alter column created_at set default now();

-- 2. Customers can READ their own orders. There are no insert/update/delete
--    policies on purpose: orders are only created by place_order() below,
--    so nobody can write an order with made-up prices from the browser.
alter table orders enable row level security;
alter table order_items enable row level security;

drop policy if exists "Users read own orders" on orders;
create policy "Users read own orders" on orders
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users read own order items" on order_items;
create policy "Users read own order items" on order_items
  for select to authenticated
  using (exists (select 1 from orders o where o.id = order_id and o.user_id = auth.uid()));

-- 3. place_order(): basket -> orders + order_items, then empty the basket.
--    Runs as one transaction: if any step fails, nothing is saved and the basket stays.
--    Names and prices are copied from "Flowers" at this moment (sale price if on sale),
--    so later price changes don't change old orders.
create or replace function public.place_order()
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  new_order_id bigint;
begin
  if uid is null then
    raise exception 'Please sign in to place an order';
  end if;

  -- lock the basket rows so a second click can't place the same basket twice
  perform 1 from public.cart where user_id = uid for update;
  if not found then
    raise exception 'Your basket is empty';
  end if;

  insert into public.orders (user_id, status, created_at)
  values (uid, 'new', now())
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

-- Only signed-in users may call it
revoke execute on function public.place_order() from public, anon;
grant execute on function public.place_order() to authenticated;
