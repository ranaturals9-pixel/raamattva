import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { storageUrl } from "@/lib/format";
import { saveSiteContent, setContentImage } from "@/app/admin/actions";
import { AdminHead, Flash } from "@/components/admin/bits";
import { Uploader } from "@/components/admin/Uploader";

const LABELS: Record<string, string> = {
  "home.headline": "Home: headline",
  "home.tagline": "Tagline",
  "home.intro": "Home: introduction",
  "about.vision": "About: vision statement",
  "founder.titles": "Swamiji's titles (shown under her name)",
  "founder.bio": "Swamiji's approved biography",
  "contact.whatsapp": "WhatsApp number",
  "contact.email": "Email address",
  "contact.address": "Address",
  "contact.map_url": "Google Maps link",
  "social.instagram": "Instagram link",
  "social.youtube": "YouTube link",
  "social.facebook": "Facebook link",
  "gurukul.age_groups": "Gurukul: age groups",
  "gurukul.language": "Gurukul: language",
  "shop.shipping_paise": "Shop: flat shipping charge in paise (e.g. 9900 = ₹99, 0 = free)",
  "shop.ships_to": "Shop: where we ship",
  "billing.legal_name": "Invoices: legal name",
  "billing.gstin": "Invoices: GSTIN",
  "billing.address": "Invoices: registered address",
  "policy.privacy": "Privacy policy (approved text)",
  "policy.terms": "Terms of use (approved text)",
  "policy.shipping": "Shipping policy (approved text)",
  "policy.refunds": "Cancellations and refunds (approved text)",
};

const LONG = /bio|intro|vision|policy|address/;

export default async function Content({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.from("site_content").select("*").order("key");
  const rows = (data ?? []).filter((r) => !r.key.endsWith("_path"));
  const img = (k: string) => (data ?? []).find((r) => r.key === k)?.value_en ?? null;

  return (
    <>
      <AdminHead title="Site text & policies" lede="Tick 'Confirmed' once a value is approved. Unconfirmed values show as 'To be confirmed' on the website where that matters (shipping, policies)." />
      <Flash sp={sp} />
      <div className="grid g2">
        {[
          ["founder.portrait_path", "Swamiji's portrait"],
          ["home.hero_path", "Home page photograph"],
        ].map(([k, l]) => (
          <div className="card stack" key={k}>
            <h2 style={{ fontSize: "1.1rem" }}>{l}</h2>
            {img(k) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={storageUrl(img(k))!} alt={l} style={{ borderRadius: 12, maxHeight: 220, objectFit: "cover" }} />
            ) : (
              <p className="small muted">Not added yet.</p>
            )}
            <Uploader bucket="public-media" folder="site" accept="image/jpeg,image/png,image/webp" withAlt={false} label="Upload" onUploaded={setContentImage.bind(null, k)} />
          </div>
        ))}
      </div>
      <form action={saveSiteContent} className="stack-lg">
        {rows.map((r) => (
          <fieldset className="card stack" key={r.key}>
            <legend className="eyebrow">{LABELS[r.key] ?? r.key}</legend>
            <input type="hidden" name="key" value={r.key} />
            <div className="grid g2">
              <div className="field">
                <label htmlFor={`en:${r.key}`}>English</label>
                {LONG.test(r.key) ? (
                  <textarea id={`en:${r.key}`} name={`en:${r.key}`} rows={r.key.startsWith("policy") ? 12 : 5} defaultValue={r.value_en ?? ""} />
                ) : (
                  <input id={`en:${r.key}`} name={`en:${r.key}`} defaultValue={r.value_en ?? ""} />
                )}
              </div>
              <div className="field">
                <label htmlFor={`hi:${r.key}`}>Hindi</label>
                {LONG.test(r.key) ? (
                  <textarea id={`hi:${r.key}`} name={`hi:${r.key}`} rows={r.key.startsWith("policy") ? 12 : 5} defaultValue={r.value_hi ?? ""} lang="hi" />
                ) : (
                  <input id={`hi:${r.key}`} name={`hi:${r.key}`} defaultValue={r.value_hi ?? ""} lang="hi" />
                )}
              </div>
            </div>
            <label className="check">
              <input type="checkbox" name={`ok:${r.key}`} defaultChecked={r.is_confirmed} /> Confirmed
            </label>
          </fieldset>
        ))}
        <div className="field" style={{ maxWidth: 360 }}>
          <label htmlFor="new_key">Add a new text key (advanced)</label>
          <input id="new_key" name="new_key" placeholder="e.g. home.notice" pattern="[a-z0-9_.]+" />
        </div>
        <button className="btn primary" type="submit" style={{ justifySelf: "start" }}>
          Save all
        </button>
      </form>
    </>
  );
}
