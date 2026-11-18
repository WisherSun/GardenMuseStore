-- Photos in reviews: up to 3 per review, shown straight away.
-- Run once in Supabase -> SQL Editor, after reviews.sql (safe to run again).
--
-- How it works:
-- - The photo FILES live in Supabase Storage, in the bucket "review-photos"
--   (Storage = folders for files; tables are for short facts, not pictures).
-- - The Reviews table only keeps the file paths, in the new "photos" column.
-- - Every customer has their own folder: "<their user id>/<random name>.webp".
--   The rules below let a customer put files only into their OWN folder, and only if they
--   have a delivered order (the same people who may write reviews).
-- - The browser makes photos smaller before uploading (about 1600px, a few hundred KB).
--   The 2 MB limit and the list of image types below are checked by Supabase itself.

-- 1. The bucket. "public" = anyone can VIEW the photos by their link (they are shown on the
--    shop's pages anyway); uploading and deleting still follow the rules in step 2.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('review-photos', 'review-photos', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- 2. Who may upload / delete files in it
drop policy if exists "Review photos: customers upload to own folder" on storage.objects;
create policy "Review photos: customers upload to own folder" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'review-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
    and exists (
      select 1 from public.orders o
      where o.user_id = auth.uid() and o.status = 'delivered'
    )
  );

-- Deleting needs the file to be "visible" to the user as well, hence the select rule.
drop policy if exists "Review photos: owners and admins see files" on storage.objects;
create policy "Review photos: owners and admins see files" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'review-photos'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

drop policy if exists "Review photos: owners and admins delete" on storage.objects;
create policy "Review photos: owners and admins delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'review-photos'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

-- 3. The photo paths on each review (none = empty list). Never more than 3.
alter table public."Reviews" add column if not exists photos text[] not null default '{}';
alter table public."Reviews" drop constraint if exists reviews_photos_max_3;
alter table public."Reviews" add constraint reviews_photos_max_3 check (cardinality(photos) <= 3);

-- 4. save_review() now also takes the photos.
--    p_photos = the full list of photo paths the review should have after saving
--    (null = leave the photos as they are). Every path must be a file the customer has
--    really uploaded into their own folder.
drop function if exists public.save_review(bigint, int, text);

create or replace function public.save_review(
  p_flower_id bigint,
  p_mark      int,
  p_text      text,
  p_photos    text[] default null
)
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
  photo text;
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

  if p_photos is not null then
    if cardinality(p_photos) > 3 then
      raise exception 'You can add up to 3 photos';
    end if;
    if (select count(distinct p) from unnest(p_photos) p) <> cardinality(p_photos) then
      raise exception 'The same photo was added twice';
    end if;
    foreach photo in array p_photos loop
      if photo is null
         or split_part(photo, '/', 1) <> uid::text
         or not exists (
           select 1 from storage.objects
           where bucket_id = 'review-photos' and name = photo
         ) then
        raise exception 'A photo could not be found. Please add it again.';
      end if;
    end loop;
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
    insert into public."Reviews" (user_id, product_id, mark, review_text, author_name, photos)
    values (uid, bought_id, p_mark, clean_text, display_name, coalesce(p_photos, '{}'))
    returning id into saved_id;
  else
    update public."Reviews"
    set mark = p_mark,
        review_text = clean_text,
        author_name = display_name,
        photos = coalesce(p_photos, photos),
        updated_at = now()
    where id = existing_id
    returning id into saved_id;
  end if;

  return saved_id;
end;
$$;

revoke execute on function public.save_review(bigint, int, text, text[]) from public, anon;
grant execute on function public.save_review(bigint, int, text, text[]) to authenticated;
