-- Book PDFs: kept in a PRIVATE bucket. Only admins can upload/see them;
-- buyers get a short-lived link after a verified Paystack payment.

alter table public.books
  add column if not exists book_file_path text check (book_file_path is null or book_file_path ~ '^books/[0-9a-f-]{36}\.pdf$'),
  add column if not exists book_file_name text not null default '' check (char_length(book_file_name) <= 200),
  add column if not exists book_file_size bigint check (book_file_size is null or book_file_size >= 0);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('book-files', 'book-files', false, 52428800, array['application/pdf'])
on conflict (id) do nothing;

create policy "admins upload book files" on storage.objects for insert to authenticated
  with check (bucket_id = 'book-files' and public.is_admin());
create policy "admins read book files" on storage.objects for select to authenticated
  using (bucket_id = 'book-files' and public.is_admin());
create policy "admins update book files" on storage.objects for update to authenticated
  using (bucket_id = 'book-files' and public.is_admin());
create policy "admins delete book files" on storage.objects for delete to authenticated
  using (bucket_id = 'book-files' and public.is_admin());

-- The payment code finds which file to hand over after a paid order.
grant select (id, book_file_path, book_file_name) on public.books to service_role;
