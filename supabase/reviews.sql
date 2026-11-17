-- Customer reviews of flowers. Run once in Supabase -> SQL Editor, after admin-setup.sql
-- and flower-stock.sql (safe to run again).
--
-- Rules (agreed with the team):
-- - Only customers whose order with this flower is DELIVERED can review it.
-- - One review per customer per flower. They can change or delete it later.
-- - Reviews are shown straight away; the admin can delete any review.
-- - A flower in several colours (see flower-colors.sql) shares ONE set of reviews:
--   a review written on any colour's page shows on all of them, labelled with the colour
--   the customer actually received. Buying any colour lets you review the flower.
--
-- Security: everyone can READ reviews. Nobody writes to the table directly from the browser
-- (there are no insert/update policies on purpose): new and changed reviews only go through
-- save_review() below, which checks the rules. Deleting your own review is allowed directly.

-- 1. The table
create table if not exists public."Reviews" (
  id          bigint generated always as identity primary key,
  user_id     uuid   not null default auth.uid() references auth.users (id) on delete cascade,
  product_id  bigint not null references public."Flowers" (id) on delete cascade,
  mark        smallint not null check (mark between 1 and 5),
  review_text text   not null check (char_length(btrim(review_text)) between 10 and 2000),
  -- The name shown on the review: the customer's display name from Supabase -> Authentication
  -- -> Users (see review_author_name() below). Copied in when the review is saved,
  -- because visitors can't read that private user list.
  author_name text   not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, product_id)
);

create index if not exists reviews_product_id_idx on public."Reviews" (product_id);

-- 2. Who can do what
alter table public."Reviews" enable row level security;

drop policy if exists "Anyone reads reviews" on public."Reviews";
create policy "Anyone reads reviews" on public."Reviews"
  for select to anon, authenticated
  using (true);

drop policy if exists "Authors and admins delete reviews" on public."Reviews";
create policy "Authors and admins delete reviews" on public."Reviews"
  for delete to authenticated
  using (auth.uid() = user_id or public.is_admin());

-- 3. All colours of the same flower (rows with a colour and the same name;
--    capital letters and extra spaces don't matter, same as src/api/flowers.js).
--    A flower without a colour is just itself.
create or replace function public.flower_group_ids(p_flower_id bigint)
returns setof bigint
language sql
stable
set search_path = ''
as $$
  select other.id
  from public."Flowers" this
  join public."Flowers" other
    on other.id = this.id
    or (
      this.color is not null and other.color is not null
      and lower(regexp_replace(btrim(this.name), '\s+', ' ', 'g'))
        = lower(regexp_replace(btrim(other.name), '\s+', ' ', 'g'))
    )
  where this.id = p_flower_id;
$$;

-- 4. The flower (colour) this customer received in a DELIVERED order, or null if none.
--    Prefers the colour whose page they are on, otherwise the most recent delivered one.
create or replace function public.reviewable_flower_id(p_flower_id bigint)
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select i.flower_id
  from public.order_items i
  join public.orders o on o.id = i.order_id
  where o.user_id = auth.uid()
    and o.status = 'delivered'
    and i.flower_id in (select public.flower_group_ids(p_flower_id))
  order by (i.flower_id = p_flower_id) desc, o.created_at desc
  limit 1;
$$;

-- For the flower page: may the signed-in customer write a review of this flower?
create or replace function public.can_review(p_flower_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.reviewable_flower_id(p_flower_id) is not null;
$$;

-- 5. The name shown on a review = the "Display name" in Supabase -> Authentication -> Users.
--    Supabase takes that from the user's metadata: "display_name" if it is set (e.g. typed in
--    by hand in the dashboard), otherwise "full_name", the name given at sign-up on our site.
--    Users without any name are shown as "Customer".
create or replace function public.review_author_name(p_user_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    nullif(btrim(u.raw_user_meta_data ->> 'display_name'), ''),
    nullif(btrim(u.raw_user_meta_data ->> 'full_name'), ''),
    nullif(btrim(u.raw_user_meta_data ->> 'name'), ''),
    'Customer'
  )
  from auth.users u
  where u.id = p_user_id;
$$;

-- Used inside the database only: nobody can look up someone's name by their id.
revoke execute on function public.review_author_name(uuid) from public, anon, authenticated;

-- Reviews written before this version get the current display name too.
update public."Reviews" r
set author_name = coalesce(public.review_author_name(r.user_id), 'Customer')
where author_name is distinct from coalesce(public.review_author_name(r.user_id), 'Customer');

-- 6. Write or change your review. Returns the review id.
--    If you already reviewed any colour of this flower, that review is changed (one per flower).
create or replace function public.save_review(p_flower_id bigint, p_mark int, p_text text)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  clean_text text := btrim(coalesce(p_text, ''));
  bought_id bigint;
  display_name text;
  existing_id bigint;
  saved_id bigint;
begin
  if uid is null then
    raise exception 'Please sign in to write a review';
  end if;
  if p_mark is null or p_mark < 1 or p_mark > 5 then
    raise exception 'Please choose a rating from 1 to 5 stars';
  end if;
  if char_length(clean_text) < 10 or char_length(clean_text) > 2000 then
    raise exception 'Please write a review of 10 to 2000 characters';
  end if;

  bought_id := public.reviewable_flower_id(p_flower_id);
  if bought_id is null then
    raise exception 'You can review this flower once your order of it has been delivered';
  end if;

  display_name := coalesce(public.review_author_name(uid), 'Customer');

  select id into existing_id
  from public."Reviews"
  where user_id = uid and product_id in (select public.flower_group_ids(p_flower_id))
  limit 1;

  if existing_id is null then
    insert into public."Reviews" (user_id, product_id, mark, review_text, author_name)
    values (uid, bought_id, p_mark, clean_text, display_name)
    returning id into saved_id;
  else
    update public."Reviews"
    set mark = p_mark,
        review_text = clean_text,
        author_name = display_name,
        updated_at = now()
    where id = existing_id
    returning id into saved_id;
  end if;

  return saved_id;
end;
$$;

-- Only signed-in customers may call these; the helpers are used inside them only.
revoke execute on function public.reviewable_flower_id(bigint) from public, anon, authenticated;
revoke execute on function public.can_review(bigint) from public, anon;
grant execute on function public.can_review(bigint) to authenticated;
revoke execute on function public.save_review(bigint, int, text) from public, anon;
grant execute on function public.save_review(bigint, int, text) to authenticated;
