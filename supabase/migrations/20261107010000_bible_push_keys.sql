-- Daily notifications: keep each phone's public encryption keys (given by its
-- browser) so the notification text can travel inside the push itself and
-- shows even when the phone limits background internet. Additive only.
alter table public.bible_push add column if not exists p256dh text check (p256dh is null or p256dh ~ '^[A-Za-z0-9_-]{80,100}$');
alter table public.bible_push add column if not exists auth text check (auth is null or auth ~ '^[A-Za-z0-9_-]{16,32}$');
grant update on public.bible_push to service_role;
