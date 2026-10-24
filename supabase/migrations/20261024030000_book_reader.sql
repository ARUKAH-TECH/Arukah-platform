-- Online reader: the book's text, page by page (taken from the PDF in the
-- admin). Private: admins, and our server for buyers who have paid.
create table public.book_pages (
  book_id  uuid not null references public.books (id) on delete cascade,
  page_no  int not null check (page_no between 1 and 5000),
  content  text not null default '' check (char_length(content) <= 60000),
  primary key (book_id, page_no)
);

alter table public.book_pages enable row level security;
grant select, insert, update, delete on public.book_pages to authenticated;
create policy "admins read book pages" on public.book_pages for select to authenticated using (public.is_admin());
create policy "admins add book pages" on public.book_pages for insert to authenticated with check (public.is_admin());
create policy "admins edit book pages" on public.book_pages for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "admins remove book pages" on public.book_pages for delete to authenticated using (public.is_admin());
grant select on public.book_pages to service_role;

-- Catchy lines from the book: shown on the book page and highlighted in the reader.
alter table public.books
  add column if not exists highlights text[] not null default '{}'
    check (cardinality(highlights) <= 12);

grant select (slug, title, author, highlights) on public.books to service_role;
