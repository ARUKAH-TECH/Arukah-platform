-- R.O.M Bible Guide daily schedule, on the minute (Ghana time = UTC):
--   5:30am  write today's devotional if the owner hasn't published one by 5:00am
--   6:00am  (write if still missing, then) send the daily notification
-- Vercel Cron in vercel.json stays as a backup; the endpoint never repeats work.
create extension if not exists pg_cron;
create extension if not exists pg_net;
select cron.schedule('rom-devotional-write', '30 5 * * *', $$select net.http_get(url := 'https://zivarukah.com/api/cron/devotional?step=write', timeout_milliseconds := 60000)$$);
select cron.schedule('rom-devotional-notify', '0 6 * * *', $$select net.http_get(url := 'https://zivarukah.com/api/cron/devotional', timeout_milliseconds := 60000)$$);
