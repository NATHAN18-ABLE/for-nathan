-- Travelers can now choose their own name in the wardrobe (Korean, English, anything), filtered
-- in the browser for swearing, links and phone numbers. The old check only allowed "Traveler 12"
-- style names, so lanterns hung under a chosen name were refused. Allow any one-line name of
-- 1-24 characters without control characters or surrounding spaces.
alter table public.lanterns drop constraint if exists lanterns_name_check;
alter table public.lanterns add constraint lanterns_name_check check (
  char_length(name) between 1 and 24
  and name !~ '[[:cntrl:]]'
  and name = btrim(name)
);
