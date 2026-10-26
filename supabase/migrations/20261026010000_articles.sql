-- Articles and blog. Visitors can read only PUBLISHED articles whose
-- publish time has passed; drafts are invisible to them at the database
-- level. Only verified admins (is_admin(): two-factor + admin_users row)
-- can create, change or delete. Images use the existing public "media"
-- bucket under articles/.

create table public.article_categories (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 60),
  name       text not null unique check (char_length(name) between 1 and 80),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

insert into public.article_categories (slug, name, sort_order) values
  ('technology-and-innovation', 'Technology and Innovation', 1),
  ('education-and-learning', 'Education and Learning', 2),
  ('entrepreneurship-and-business', 'Entrepreneurship and Business', 3),
  ('faith-and-spiritual-growth', 'Faith and Spiritual Growth', 4),
  ('books-and-reading', 'Books and Reading', 5);

create table public.articles (
  id                  uuid primary key default gen_random_uuid(),
  slug                text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 100),
  title               text not null check (char_length(title) between 1 and 200),
  excerpt             text not null default '' check (char_length(excerpt) <= 400),
  content             text not null default '' check (char_length(content) <= 100000),
  category_id         uuid references public.article_categories (id) on delete set null,
  featured_image_path text check (featured_image_path is null or featured_image_path ~ '^articles/[0-9a-f-]{36}\.webp$'),
  featured_image_alt  text not null default '' check (char_length(featured_image_alt) <= 300),
  featured_width      int,
  featured_height     int,
  author_name         text not null default '' check (char_length(author_name) <= 120),
  seo_title           text not null default '' check (char_length(seo_title) <= 120),
  meta_description    text not null default '' check (char_length(meta_description) <= 300),
  status              text not null default 'draft' check (status in ('draft', 'published')),
  published_at        timestamptz,
  created_by          uuid references auth.users (id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  check (status <> 'published' or published_at is not null)
);

create index articles_public_idx on public.articles (status, published_at desc);
create index articles_category_idx on public.articles (category_id);

alter table public.article_categories enable row level security;
alter table public.articles enable row level security;

grant select on public.article_categories to anon, authenticated;
grant insert, update, delete on public.article_categories to authenticated;
grant select on public.articles to anon, authenticated;
grant insert, update, delete on public.articles to authenticated;

-- Categories: everyone reads; admins manage.
create policy "visitors read categories" on public.article_categories for select to anon using (true);
create policy "signed-in read categories" on public.article_categories for select to authenticated using (true);
create policy "admins add categories" on public.article_categories for insert to authenticated with check (public.is_admin());
create policy "admins edit categories" on public.article_categories for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "admins remove categories" on public.article_categories for delete to authenticated using (public.is_admin());

-- Articles: split by role because anon can't execute is_admin().
create policy "visitors read published articles" on public.articles for select to anon
  using (status = 'published' and published_at <= now());
create policy "signed-in read published articles, admins read all" on public.articles for select to authenticated
  using ((status = 'published' and published_at <= now()) or public.is_admin());
create policy "admins add articles" on public.articles for insert to authenticated with check (public.is_admin());
create policy "admins edit articles" on public.articles for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "admins remove articles" on public.articles for delete to authenticated using (public.is_admin());
