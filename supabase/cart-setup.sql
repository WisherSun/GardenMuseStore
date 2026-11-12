-- Prepares the "cart" table for the basket page. Run once in Supabase -> SQL Editor.

-- 1. One row per flower per user (the app adds to "quantity" instead of adding a second row).
--    If this fails with "could not create unique index", run this first to remove duplicates:
--    delete from cart a using cart b where a.user_id = b.user_id and a.flower_id = b.flower_id and a.id > b.id;
alter table cart add constraint cart_user_flower_unique unique (user_id, flower_id);

-- 2. Quantity must be at least 1 (rows are deleted instead of set to 0).
alter table cart add constraint cart_quantity_positive check (quantity > 0);

-- 3. Fill user_id automatically with the logged-in user.
alter table cart alter column user_id set default auth.uid();

-- 4. Each user can only see and change their own basket.
alter table cart enable row level security;

create policy "Users read own cart"   on cart for select to authenticated using (auth.uid() = user_id);
create policy "Users add to own cart" on cart for insert to authenticated with check (auth.uid() = user_id);
create policy "Users update own cart" on cart for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users delete own cart" on cart for delete to authenticated using (auth.uid() = user_id);
