-- Flowers in several colours. Run once in Supabase -> SQL Editor (safe to run again).
--
-- How it works: every colour is its OWN row in "Flowers" (own id, photos, price, sale).
-- Rows with the same name (capital letters and extra spaces don't matter) AND a colour
-- are shown on the site as one flower with colour buttons on its page.
-- Flowers sold in one colour only: leave "color" empty, nothing changes for them.
--
-- Example: "Crimson Tulip" id 11 color 'Red', and a new row "Crimson Tulip" color 'Pink'.
-- Note: the first row needs a colour too (here 'Red'), otherwise it isn't part of the group.

-- 1. The new column
alter table "Flowers" add column if not exists color text;

alter table "Flowers" drop constraint if exists flowers_color_length;
alter table "Flowers" add constraint flowers_color_length
  check (color is null or char_length(btrim(color)) between 1 and 40);

-- 2. Orders remember the colour.
--    Order items store the flower's name at the moment of ordering. All colours share one
--    name, so without this the order would say "Crimson Tulip" and not which colour.
--    This trigger runs inside the database for every new order item and turns the name
--    into "Crimson Tulip (Pink)". Both place_order() and place_single_order() go through it,
--    so neither of them has to change.
create or replace function public.order_item_add_color()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  flower_color text;
begin
  select nullif(btrim(color), '') into flower_color
  from public."Flowers"
  where id = new.flower_id;

  if flower_color is not null then
    new.name := new.name || ' (' || flower_color || ')';
  end if;
  return new;
end;
$$;

drop trigger if exists order_item_add_color on order_items;
create trigger order_item_add_color
  before insert on order_items
  for each row execute function public.order_item_add_color();
