-- =====================================================================
-- 0002 — small additions the website code relies on. Run after 0001.
-- =====================================================================

-- Seats: an unpaid registration only holds a seat for 30 minutes.
create or replace view session_availability with (security_invoker = false) as
  select s.id as session_id,
         s.capacity,
         count(r.id) filter (
           where r.status = 'confirmed'
              or (r.status = 'pending_payment' and r.created_at > now() - interval '30 minutes')) as taken,
         case when s.capacity is null then null
              else greatest(s.capacity - count(r.id) filter (
                     where r.status = 'confirmed'
                        or (r.status = 'pending_payment' and r.created_at > now() - interval '30 minutes')), 0)
         end as seats_left
  from sessions s
  left join registrations r on r.session_id = s.id
  where s.status = 'published'
  group by s.id;
grant select on session_availability to anon, authenticated;

-- Unguessable token so a buyer can see their order confirmation without signing in.
alter table orders add column if not exists public_token uuid not null default gen_random_uuid();
create unique index if not exists orders_public_token_idx on orders (public_token);

-- Invoice numbers, assigned when payment is confirmed: RVP/2026-27/0001
create sequence if not exists invoice_seq start 1;

create or replace function next_invoice_number() returns text
language plpgsql security definer set search_path = public as $$
declare fy text; y int; m int;
begin
  y := extract(year from (now() at time zone 'Asia/Kolkata'));
  m := extract(month from (now() at time zone 'Asia/Kolkata'));
  if m < 4 then y := y - 1; end if;
  fy := y || '-' || lpad(((y + 1) % 100)::text, 2, '0');
  return 'RVP/' || fy || '/' || lpad(nextval('invoice_seq')::text, 4, '0');
end $$;
revoke execute on function next_invoice_number() from public, anon, authenticated;

-- Normalised contact columns so records made before sign-in can be linked to the account later.
alter table registrations add column if not exists email_norm text generated always as (lower(trim(email))) stored;
alter table orders        add column if not exists email_norm text generated always as (lower(trim(email))) stored;
create index if not exists registrations_email_norm_idx on registrations (email_norm);
create index if not exists registrations_phone_idx on registrations (phone);
create index if not exists orders_email_norm_idx on orders (email_norm);
create index if not exists orders_phone_idx on orders (phone);

-- Link earlier registrations and orders to a person when they sign in, and grant course access.
create or replace function claim_records(p_user uuid, p_email text, p_phone text) returns void
language plpgsql security definer set search_path = public as $$
begin
  update registrations set user_id = p_user
   where user_id is null
     and ((p_email is not null and email_norm = lower(trim(p_email)))
       or (p_phone is not null and phone = p_phone));
  update orders set user_id = p_user
   where user_id is null
     and ((p_email is not null and email_norm = lower(trim(p_email)))
       or (p_phone is not null and phone = p_phone));
  insert into enrolments (user_id, course_id, registration_id)
  select p_user, r.course_id, r.id from registrations r
   where r.user_id = p_user and r.course_id is not null and r.status = 'confirmed'
  on conflict (user_id, course_id) do nothing;
end $$;
revoke execute on function claim_records(uuid, text, text) from public, anon, authenticated;

-- Restore stock when a paid order is cancelled or refunded (called by the server).
create or replace function restore_stock_for_order(p_order_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare item record;
begin
  for item in select variant_id, quantity from order_items where order_id = p_order_id and variant_id is not null loop
    update product_variants set stock = stock + item.quantity where id = item.variant_id;
  end loop;
end $$;
revoke execute on function restore_stock_for_order(uuid) from public, anon, authenticated;

-- Staff need to read every profile to manage the team; admins change roles (policy exists in 0001).
-- Helpful indexes
create index if not exists sessions_starts_at_idx on sessions (starts_at);
create index if not exists payments_registration_idx on payments (registration_id);
create index if not exists payments_order_idx on payments (order_id);
