# Raamattva Vidya Peeth — website

Next.js 15 (App Router) on Vercel, Supabase (database, sign-in, file storage) and Razorpay (UPI, cards, net banking).

What it does: public site in English and Hindi; Gurukul registration by a parent or guardian; free and paid
registration for courses and sessions; a shop with cart, checkout, stock and order tracking; student accounts with
class links, recordings and study material; and an admin area for the team.

## Setting it up

Do these once, in order.

### 1. Database (Supabase)

1. Supabase → **SQL Editor** → **New query**. Paste and run each file, one at a time:
   1. `supabase/migrations/0001_schema.sql`
   2. `supabase/migrations/0002_app_support.sql`
   3. `supabase/seed.sql` (starting content: the three courses, the two Gurukul workshops, products and three verses)
2. **Authentication → Sign In / Providers → Email**: keep Email on.
3. **Authentication → Email Templates → Magic Link**: replace the body so it sends a code, not a link:
   ```html
   <h2>Your sign-in code</h2>
   <p>Enter this code on the Raamattva Vidya Peeth website: <strong>{{ .Token }}</strong></p>
   <p>It expires in one hour. If you did not ask for it, ignore this email.</p>
   ```
4. **Authentication → URL Configuration**: set Site URL to the live address (e.g. `https://raamattva.org`).
5. **Authentication → Emails → SMTP**: connect Resend (or another SMTP) so sign-in codes are not limited by
   Supabase's built-in sender, which only allows a few emails an hour.

### 2. Hosting (Vercel)

1. Import the GitHub repo into Vercel. Framework: Next.js. No build settings to change.
2. **Settings → Environment Variables**: add every variable in `.env.example`.
   - `SUPABASE_SERVICE_ROLE_KEY` and `RAZORPAY_KEY_SECRET` are secrets: only ever here, never in code or chat.
   - Start with Razorpay **test** keys. Switch to live keys at launch.
3. Deploy. Before taking real payments, upgrade the project to **Vercel Pro** (the free plan is non-commercial
   only) and the Supabase project to **Pro** (free projects pause after a week without activity).
4. **Domains**: add the domain and follow Vercel's DNS instructions (at Hostinger: DNS / Nameservers).

### 3. Payments (Razorpay)

1. **Account & Settings → Payment capture**: make sure payments are captured automatically.
2. **Webhooks → Add**: URL `https://<your-domain>/api/razorpay/webhook`, a secret of your choice (put the same value
   in `RAZORPAY_WEBHOOK_SECRET`), events `payment.captured`, `order.paid`, `refund.processed`.
   The webhook confirms a payment even if the buyer closes the page before returning to the site.

### 4. Email (Resend)

Add and verify the domain in Resend, then set `RESEND_API_KEY`, `EMAIL_FROM` and `TEAM_NOTIFY_EMAIL`.
Without these the site still works; confirmations are written to the server log instead of sent.

### 5. Make yourself admin

Sign in on the website once with your email, then in Supabase → SQL Editor:

```sql
update profiles set role = 'admin' where email = 'you@example.com';
```

After that, add the team from **Admin → Team**. Editors manage content, sessions, products and orders. Admins can also
refund, edit site text and policies, and manage the team.

## Optional services

| Service | For | How |
|---|---|---|
| Bunny Stream | Recordings that only enrolled students can watch | Create a Stream library, turn on token authentication, set `BUNNY_STREAM_LIBRARY_ID` and `BUNNY_STREAM_TOKEN_KEY`. Add recordings in Admin → Recordings by video ID. |
| WhatsApp Business API (Interakt, AiSensy, WATI) | WhatsApp confirmations and reminders | Replace the body of `sendWhatsApp` in `lib/email.ts` with the provider's API call and approved templates. |
| SMS or WhatsApp sign-in codes | Sign in by phone instead of email | Connect Twilio or MessageBird in Supabase → Authentication → Phone, then set `NEXT_PUBLIC_PHONE_LOGIN=1` (and `OTP_CHANNEL=whatsapp` for WhatsApp via Twilio). |
| Shiprocket | Courier booking and tracking | Book in Shiprocket, then enter courier, AWB and tracking link on the order in Admin → Orders. Setting status to Shipped emails the customer. |

## Day-to-day (for the team)

- **Open registration**: in Admin → Sessions or Courses, set the Fee to Free, or to Paid with an amount. While it
  says "To be confirmed" the button shows "Registration opens soon".
- **Meeting links**: on the session's admin page, under "Private joining details". Only registrants see them.
- **Shop**: a product appears with a price only after it has at least one option row with a price. Set the
  shipping charge in Admin → Site text (`shop.shipping_paise`, ticked Confirmed) to open checkout.
- **Gallery**: a photo that shows children can only be published once guardian consent is ticked for them.
- **Policies**: paste approved text in Admin → Site text and tick Confirmed; until then the draft shows with a
  "draft under review" note.

## How it is built

| Folder | What is in it |
|---|---|
| `app/` | Pages. `app/admin` is the admin area; `app/actions` holds the server code for registration, checkout and sign-in. |
| `app/api/razorpay/webhook` | Payment confirmations from Razorpay. |
| `lib/` | Database queries (`data.ts`), payment fulfilment (`fulfil.ts`), emails, formatting (INR, IST). |
| `lib/admin/config.ts` | The admin forms. Add a field here to add it to the admin. |
| `supabase/` | Database schema, security rules and starting content. |

Security model: visitors can only read published content. Every registration, order and payment is written by the
server after validation, and prices are always recalculated on the server. A payment counts only after Razorpay's
signature is verified. Meeting links, recordings and student material are protected by database rules, not only by
the page.

## Running locally

```bash
cp .env.example .env.local   # fill in the values
npm install
npm run dev
```
