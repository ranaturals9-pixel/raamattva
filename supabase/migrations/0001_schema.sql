-- =====================================================================
-- Raamattva Vidya Peeth — database schema (v1)
-- Run once in Supabase: SQL Editor → New query → paste → Run.
--
-- Security model
--   • Visitors can READ published content (courses, sessions, products,
--     free resources). They cannot write anything directly.
--   • Every public write (registrations, orders, enquiries, payments)
--   goes through the website's server using the service_role key, so it
--   can be validated, priced and verified with Razorpay first.
--   • Signed-in students can read their own registrations, enrolments,
--     orders, and the links/recordings/materials they are entitled to.
--   • Staff (role 'editor' or 'admin') can manage everything.
--   • Money is stored in paise (integer) to avoid rounding errors.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------
create type user_role         as enum ('student', 'editor', 'admin');
create type publish_status    as enum ('draft', 'published', 'archived');
create type audience_type     as enum ('adults', 'children', 'everyone');
create type delivery_format   as enum ('online', 'in_person', 'hybrid');
create type session_kind      as enum ('one_time', 'recurring', 'workshop', 'satsang', 'programme');
create type registration_status as enum ('pending_payment', 'confirmed', 'cancelled', 'refunded');
create type product_category  as enum ('rudraksha', 'course_kit');
create type order_status      as enum ('pending_payment', 'paid', 'packed', 'shipped', 'delivered', 'cancelled', 'refunded');
create type payment_purpose   as enum ('order', 'registration');
create type payment_status    as enum ('created', 'paid', 'failed', 'refunded');
create type resource_topic    as enum ('hanuman', 'ram', 'meditation', 'living');
create type resource_type     as enum ('article', 'reflection', 'video', 'audio', 'study_material');
create type resource_access   as enum ('free', 'students');
create type enquiry_topic     as enum ('gurukul', 'courses', 'sessions', 'shop', 'other');
create type announcement_scope as enum ('general', 'gurukul');

-- ---------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------
create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- ---------------------------------------------------------------------
-- People
-- ---------------------------------------------------------------------
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  phone       text,
  email       text,
  role        user_role not null default 'student',
  preferred_language text not null default 'en' check (preferred_language in ('en','hi')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Create a profile automatically when someone signs up.
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, email, phone)
  values (new.id, new.email, new.phone)
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Is the current user staff?
create or replace function is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role in ('editor','admin'));
$$;

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

-- ---------------------------------------------------------------------
-- Editable site text and contact details (English + Hindi)
-- e.g. key 'contact.whatsapp', 'home.headline', 'founder.bio'
-- ---------------------------------------------------------------------
create table site_content (
  key         text primary key,
  value_en    text,
  value_hi    text,
  is_confirmed boolean not null default false,  -- false shows "To be confirmed"
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Courses
-- ---------------------------------------------------------------------
create table courses (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  title_en      text not null,
  title_hi      text,
  summary_en    text,
  summary_hi    text,
  overview_en   text,
  overview_hi   text,
  suitable_for  text[] not null default '{}',
  outcomes      text[] not null default '{}',
  audience      audience_type not null default 'adults',
  format        delivery_format,
  language      text,
  duration_text text,              -- e.g. "6 weeks, 12 sessions"
  starts_on     date,
  ends_on       date,
  timings_text  text,              -- always IST
  facilitator   text,
  prerequisites text,
  is_free       boolean,
  fee_paise     integer check (fee_paise is null or fee_paise >= 0),
  recordings_included boolean,
  materials_included  boolean,
  kit_product_id uuid,             -- FK added after products exists
  kit_required  boolean,
  status        publish_status not null default 'draft',
  sort_order    integer not null default 0,
  seo_title     text,
  seo_description text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint paid_course_has_fee check (is_free is distinct from false or fee_paise is not null or status = 'draft')
);

create table course_modules (
  id          uuid primary key default gen_random_uuid(),
  course_id   uuid not null references courses(id) on delete cascade,
  position    integer not null,
  title_en    text not null,
  title_hi    text,
  description text,
  unique (course_id, position)
);

create table course_faqs (
  id          uuid primary key default gen_random_uuid(),
  course_id   uuid not null references courses(id) on delete cascade,
  position    integer not null,
  question    text not null,
  answer      text not null
);

-- ---------------------------------------------------------------------
-- Sessions & events (one-time, recurring, workshops, satsangs, programmes)
-- ---------------------------------------------------------------------
create table sessions (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique,
  title_en         text not null,
  title_hi         text,
  description      text,
  kind             session_kind not null,
  audience         audience_type not null default 'adults',
  format           delivery_format not null,
  course_id        uuid references courses(id) on delete set null,
  starts_at        timestamptz,          -- null = date to be announced
  duration_minutes integer check (duration_minutes is null or duration_minutes > 0),
  recurrence_text  text,                 -- e.g. "Every Saturday"
  city             text,
  venue            text,                 -- public venue name/address for in-person
  facilitator      text,
  capacity         integer check (capacity is null or capacity > 0),
  is_free          boolean,
  fee_paise        integer check (fee_paise is null or fee_paise >= 0),
  recording_available boolean,
  cancellation_note text,
  status           publish_status not null default 'draft',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Kept apart from `sessions` so meeting links are never publicly readable.
create table session_private (
  session_id   uuid primary key references sessions(id) on delete cascade,
  meeting_link text,
  meeting_note text
);

-- ---------------------------------------------------------------------
-- Shop
-- ---------------------------------------------------------------------
create table products (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  category      product_category not null,
  title_en      text not null,
  title_hi      text,
  description   text,
  care_instructions text,
  -- Rudraksha facts: only filled once verified. Keys like
  -- {"type": "5 Mukhi", "size_mm": "6", "origin": "Nepal", "certification": "..."}
  verified_details jsonb not null default '{}'::jsonb,
  -- Course kits
  related_course_id uuid references courses(id) on delete set null,
  kit_contents  text[] not null default '{}',
  kit_required  boolean,
  weight_grams  integer,                -- for shipping
  hsn_code      text,                   -- for GST invoices
  gst_rate      numeric(4,2),
  status        publish_status not null default 'draft',
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table courses
  add constraint courses_kit_fk foreign key (kit_product_id) references products(id) on delete set null;

create table product_variants (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references products(id) on delete cascade,
  label       text not null,            -- e.g. "6 mm", "Medium wrist", or "Standard"
  sku         text unique,
  price_paise integer not null check (price_paise >= 0),
  stock       integer not null default 0 check (stock >= 0),
  is_active   boolean not null default true,
  position    integer not null default 0
);

create table product_images (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references products(id) on delete cascade,
  storage_path text not null,           -- in bucket 'public-media'
  alt_text    text not null,
  position    integer not null default 0
);

create sequence order_number_seq start 1001;

create table orders (
  id             uuid primary key default gen_random_uuid(),
  order_number   text not null unique default ('RVP-' || nextval('order_number_seq')),
  user_id        uuid references auth.users(id) on delete set null,
  status         order_status not null default 'pending_payment',
  email          text,
  phone          text not null,
  ship_name      text not null,
  ship_line1     text not null,
  ship_line2     text,
  ship_city      text not null,
  ship_state     text not null,
  ship_pincode   text not null check (ship_pincode ~ '^[1-9][0-9]{5}$'),
  subtotal_paise integer not null check (subtotal_paise >= 0),
  shipping_paise integer not null default 0 check (shipping_paise >= 0),
  total_paise    integer not null check (total_paise >= 0),
  courier        text,
  awb_number     text,
  tracking_url   text,
  shiprocket_order_id text,
  invoice_number text unique,
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references orders(id) on delete cascade,
  variant_id    uuid references product_variants(id) on delete set null,
  title_snapshot text not null,         -- product + variant name at time of purchase
  unit_price_paise integer not null check (unit_price_paise >= 0),
  quantity      integer not null check (quantity > 0)
);

-- ---------------------------------------------------------------------
-- Registrations (sessions, courses, Gurukul) & enrolments
-- ---------------------------------------------------------------------
create table registrations (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete set null,
  session_id      uuid references sessions(id) on delete cascade,
  course_id       uuid references courses(id) on delete cascade,
  status          registration_status not null default 'confirmed',
  name            text not null,        -- participant, or guardian for children
  phone           text,
  email           text,
  -- Children (guardian-led registration)
  child_first_name text,
  child_age       integer check (child_age is null or child_age between 3 and 18),
  city            text,
  guardian_confirmed boolean not null default false,
  photo_consent   boolean not null default false,
  photo_consent_at timestamptz,
  amount_paise    integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint one_target check ((session_id is not null) <> (course_id is not null)),
  constraint contact_given check (phone is not null or email is not null),
  constraint child_needs_guardian check (child_first_name is null or guardian_confirmed)
);

create index on registrations (user_id);
create index on registrations (session_id);
create index on registrations (course_id);

-- Access to a course's recordings and study material.
create table enrolments (
  user_id     uuid not null references auth.users(id) on delete cascade,
  course_id   uuid not null references courses(id) on delete cascade,
  registration_id uuid references registrations(id) on delete set null,
  granted_at  timestamptz not null default now(),
  revoked_at  timestamptz,
  primary key (user_id, course_id)
);

-- ---------------------------------------------------------------------
-- Payments (Razorpay) — written only by the server after verifying
-- the signature or webhook.
-- ---------------------------------------------------------------------
create table payments (
  id                  uuid primary key default gen_random_uuid(),
  purpose             payment_purpose not null,
  order_id            uuid references orders(id) on delete set null,
  registration_id     uuid references registrations(id) on delete set null,
  razorpay_order_id   text not null unique,
  razorpay_payment_id text unique,
  amount_paise        integer not null check (amount_paise > 0),
  currency            text not null default 'INR',
  status              payment_status not null default 'created',
  method              text,               -- upi, card, netbanking
  raw_event           jsonb,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint one_ref check ((order_id is not null) <> (registration_id is not null))
);

-- ---------------------------------------------------------------------
-- Learning content
-- ---------------------------------------------------------------------
create table resources (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  title_en    text not null,
  title_hi    text,
  summary     text,
  topic       resource_topic not null,
  type        resource_type not null,
  access      resource_access not null default 'free',
  course_id   uuid references courses(id) on delete set null,  -- for student-only items
  cover_path  text,
  status      publish_status not null default 'draft',
  published_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Body kept separately so student-only content stays locked while the
-- title and summary can still be listed publicly.
create table resource_bodies (
  resource_id uuid primary key references resources(id) on delete cascade,
  body        text,                     -- article text (markdown)
  video_id    text,                     -- Bunny Stream video id
  file_path   text                      -- in bucket 'study-material'
);

-- Scripture shown with the teacher's reflection kept visibly separate.
create table verses (
  id            uuid primary key default gen_random_uuid(),
  topic         resource_topic not null,
  text_original text not null,           -- Devanagari
  transliteration text,
  translation   text,
  source        text not null,           -- e.g. "Bhagavad Gita 6.19"
  reflection    text,                    -- Swamiji's contemplative interpretation
  reflection_approved boolean not null default false,
  status        publish_status not null default 'draft',
  sort_order    integer not null default 0
);

create table recordings (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  course_id   uuid references courses(id) on delete cascade,
  session_id  uuid references sessions(id) on delete cascade,
  video_id    text not null,            -- Bunny Stream video id
  duration_seconds integer,
  is_published boolean not null default false,
  recorded_on date,
  created_at  timestamptz not null default now(),
  constraint rec_target check (course_id is not null or session_id is not null)
);

-- ---------------------------------------------------------------------
-- Gurukul announcements & gallery
-- ---------------------------------------------------------------------
create table announcements (
  id          uuid primary key default gen_random_uuid(),
  scope       announcement_scope not null default 'general',
  title_en    text not null,
  title_hi    text,
  body        text,
  status      publish_status not null default 'draft',
  published_at timestamptz,
  created_at  timestamptz not null default now()
);

create table gallery_photos (
  id            uuid primary key default gen_random_uuid(),
  storage_path  text not null,          -- in bucket 'public-media'
  alt_text      text not null,
  caption       text,
  shows_children boolean not null default true,
  consent_registration_ids uuid[] not null default '{}',  -- guardians who consented
  status        publish_status not null default 'draft',
  taken_on      date,
  created_at    timestamptz not null default now(),
  -- A photo showing children can only be published with at least one consent on record.
  constraint child_photo_consent check (
    status <> 'published' or shows_children = false or cardinality(consent_registration_ids) > 0)
);

-- ---------------------------------------------------------------------
-- Contact enquiries
-- ---------------------------------------------------------------------
create table enquiries (
  id           uuid primary key default gen_random_uuid(),
  topic        enquiry_topic not null,
  name         text not null,
  phone        text,
  email        text,
  order_number text,
  message      text not null,
  handled      boolean not null default false,
  created_at   timestamptz not null default now(),
  constraint enquiry_contact check (phone is not null or email is not null)
);

-- ---------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['profiles','courses','sessions','products','orders','registrations','payments','resources']
  loop
    execute format('create trigger %I_updated before update on %I for each row execute function set_updated_at()', t, t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table profiles          enable row level security;
alter table site_content      enable row level security;
alter table courses           enable row level security;
alter table course_modules    enable row level security;
alter table course_faqs       enable row level security;
alter table sessions          enable row level security;
alter table session_private   enable row level security;
alter table products          enable row level security;
alter table product_variants  enable row level security;
alter table product_images    enable row level security;
alter table orders            enable row level security;
alter table order_items       enable row level security;
alter table registrations     enable row level security;
alter table enrolments        enable row level security;
alter table payments          enable row level security;
alter table resources         enable row level security;
alter table resource_bodies   enable row level security;
alter table verses            enable row level security;
alter table recordings        enable row level security;
alter table announcements     enable row level security;
alter table gallery_photos    enable row level security;
alter table enquiries         enable row level security;

-- Staff can do everything on every table.
do $$
declare t text;
begin
  foreach t in array array['site_content','courses','course_modules','course_faqs','sessions','session_private',
    'products','product_variants','product_images','orders','order_items','registrations','enrolments',
    'payments','resources','resource_bodies','verses','recordings','announcements','gallery_photos','enquiries']
  loop
    execute format('create policy staff_all on %I for all using (is_staff()) with check (is_staff())', t);
  end loop;
end $$;

-- Profiles: users see and edit their own; only admins change roles.
create policy own_profile_read   on profiles for select using (id = auth.uid() or is_staff());
create or replace function my_role() returns user_role
language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid();
$$;
create policy own_profile_update on profiles for update using (id = auth.uid())
  with check (id = auth.uid() and role = my_role());
create policy admin_profiles     on profiles for all using (is_admin()) with check (is_admin());

-- Public reads of published content.
create policy public_read on site_content     for select using (true);
create policy public_read on courses          for select using (status = 'published');
create policy public_read on course_modules   for select using (exists (select 1 from courses c where c.id = course_id and c.status = 'published'));
create policy public_read on course_faqs      for select using (exists (select 1 from courses c where c.id = course_id and c.status = 'published'));
create policy public_read on sessions         for select using (status = 'published');
create policy public_read on products         for select using (status = 'published');
create policy public_read on product_variants for select using (is_active and exists (select 1 from products p where p.id = product_id and p.status = 'published'));
create policy public_read on product_images   for select using (exists (select 1 from products p where p.id = product_id and p.status = 'published'));
create policy public_read on resources        for select using (status = 'published');
create policy public_read on verses           for select using (status = 'published');
create policy public_read on announcements    for select using (status = 'published');
create policy public_read on gallery_photos   for select using (status = 'published');

-- Meeting links: only confirmed registrants of that session.
create policy registrant_read on session_private for select using (
  exists (select 1 from registrations r
          where r.session_id = session_private.session_id
            and r.user_id = auth.uid() and r.status = 'confirmed'));

-- Students see their own records.
create policy own_read on registrations for select using (user_id = auth.uid());
create policy own_read on enrolments    for select using (user_id = auth.uid() and revoked_at is null);
create policy own_read on orders        for select using (user_id = auth.uid());
create policy own_read on order_items   for select using (exists (select 1 from orders o where o.id = order_id and o.user_id = auth.uid()));
create policy own_read on payments      for select using (
  exists (select 1 from orders o where o.id = order_id and o.user_id = auth.uid())
  or exists (select 1 from registrations r where r.id = registration_id and r.user_id = auth.uid()));

-- Resource bodies: free ones for everyone; student ones for enrolled students.
create policy body_read on resource_bodies for select using (
  exists (select 1 from resources res
          where res.id = resource_id and res.status = 'published'
            and (res.access = 'free'
                 or exists (select 1 from enrolments e
                            where e.user_id = auth.uid() and e.course_id = res.course_id and e.revoked_at is null))));

-- Recordings: enrolled in the course, or confirmed for the session.
create policy entitled_read on recordings for select using (
  is_published and (
    exists (select 1 from enrolments e where e.user_id = auth.uid() and e.course_id = recordings.course_id and e.revoked_at is null)
    or exists (select 1 from registrations r where r.user_id = auth.uid() and r.session_id = recordings.session_id and r.status = 'confirmed')));

-- enquiries, registrations, orders and payments have no public insert policy:
-- the website server writes them with the service_role key after validation.

-- ---------------------------------------------------------------------
-- Public view: seats left per session (counts only, no personal data)
-- ---------------------------------------------------------------------
create or replace view session_availability with (security_invoker = false) as
  select s.id as session_id,
         s.capacity,
         count(r.id) filter (where r.status in ('confirmed','pending_payment')) as taken,
         case when s.capacity is null then null
              else greatest(s.capacity - count(r.id) filter (where r.status in ('confirmed','pending_payment')), 0) end as seats_left
  from sessions s
  left join registrations r on r.session_id = s.id
  where s.status = 'published'
  group by s.id;

grant select on session_availability to anon, authenticated;

-- ---------------------------------------------------------------------
-- Stock: decrement safely when an order is paid (called by the server)
-- ---------------------------------------------------------------------
create or replace function decrement_stock_for_order(p_order_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare item record;
begin
  for item in select variant_id, quantity from order_items where order_id = p_order_id and variant_id is not null loop
    update product_variants set stock = stock - item.quantity
    where id = item.variant_id and stock >= item.quantity;
    if not found then
      raise exception 'Insufficient stock for variant %', item.variant_id;
    end if;
  end loop;
end $$;

revoke execute on function decrement_stock_for_order(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- Storage buckets
--   public-media   : product photos, gallery, covers (public read)
--   study-material : PDFs/notes for students (private, served via signed URLs)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public) values
  ('public-media', 'public-media', true),
  ('study-material', 'study-material', false)
on conflict (id) do nothing;

create policy "staff upload media"   on storage.objects for insert with check (bucket_id in ('public-media','study-material') and is_staff());
create policy "staff update media"   on storage.objects for update using (bucket_id in ('public-media','study-material') and is_staff());
create policy "staff delete media"   on storage.objects for delete using (bucket_id in ('public-media','study-material') and is_staff());
create policy "public read media"    on storage.objects for select using (bucket_id = 'public-media');
create policy "staff read material"  on storage.objects for select using (bucket_id = 'study-material' and is_staff());
