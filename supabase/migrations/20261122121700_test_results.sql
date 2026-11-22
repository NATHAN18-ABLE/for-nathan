-- Applied to project seoul-curated-metaverse on 2026-11-22 (kept here as the record of the schema).
-- One row per finished personality test. Nothing personal: the type, the two matched
-- districts, the twelve answers, the site language and the kind of device.
create table public.test_results (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  type_code text not null check (type_code ~ '^[HT][AO][CB][LF]$'),
  best text not null check (best in ('jongno','jung','dongdaemun','seodaemun','nowon','songpa','yongsan','mapo','seongdong','yeongdeungpo','gwanak','gangnam')),
  runner_up text not null check (runner_up in ('jongno','jung','dongdaemun','seodaemun','nowon','songpa','yongsan','mapo','seongdong','yeongdeungpo','gwanak','gangnam')),
  answers text not null check (answers ~ '^[ab]{12}$'),
  lang text not null check (lang in ('en','ko')),
  device text not null check (device in ('phone','tablet','desktop'))
);

alter table public.test_results enable row level security;

-- The site may add a result; nobody reads, changes or deletes rows through the API.
create policy "site adds results" on public.test_results for insert to anon, authenticated with check (true);
revoke all on public.test_results from anon, authenticated;
grant insert on public.test_results to anon, authenticated;

create index test_results_created_at on public.test_results (created_at);

-- Totals for the stats page (/stats): no row is ever returned, only counts.
-- Callable without signing in on purpose (Supabase's advisor flags it): it exposes totals only.
create or replace function public.test_stats()
returns json language sql stable security definer set search_path = '' as $$
  select json_build_object(
    'total', (select count(*) from public.test_results),
    'today', (select count(*) from public.test_results where (created_at at time zone 'Asia/Seoul')::date = (now() at time zone 'Asia/Seoul')::date),
    'types', coalesce((select json_agg(t order by t.n desc, t.code) from (select type_code as code, count(*) as n from public.test_results group by 1) t), '[]'::json),
    'districts', coalesce((select json_agg(d order by d.n desc, d.slug) from (select best as slug, count(*) as n from public.test_results group by 1) d), '[]'::json),
    'days', coalesce((select json_agg(x order by x.day) from (
      select to_char((created_at at time zone 'Asia/Seoul')::date, 'YYYY-MM-DD') as day, count(*) as n
      from public.test_results where created_at > now() - interval '30 days' group by 1) x), '[]'::json),
    'langs', coalesce((select json_object_agg(lang, n) from (select lang, count(*) as n from public.test_results group by 1) l), '{}'::json),
    'devices', coalesce((select json_object_agg(device, n) from (select device, count(*) as n from public.test_results group by 1) v), '{}'::json),
    'questions', coalesce((select json_agg(q order by q.i) from (
      select i, count(*) filter (where substr(r.answers, i, 1) = 'a') as a, count(*) filter (where substr(r.answers, i, 1) = 'b') as b
      from public.test_results r cross join generate_series(1, 12) as i group by i) q), '[]'::json)
  );
$$;

revoke all on function public.test_stats() from public;
grant execute on function public.test_stats() to anon, authenticated;
