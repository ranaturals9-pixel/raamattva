import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { ENTITIES, type Field } from "@/lib/admin/config";
import { inr, storageUrl, toIstInput, istDate } from "@/lib/format";
import { addProductImage, deleteEntity, notifyRegistrants, removeProductImage, saveEntity, setResourceFile } from "@/app/admin/actions";
import { AdminHead, Flash } from "@/components/admin/bits";
import { Uploader } from "@/components/admin/Uploader";

type SP = { saved?: string; error?: string; notified?: string };

function FieldInput({ f, value, refOptions }: { f: Field; value: unknown; refOptions?: { id: string; label: string }[] }) {
  const id = `f_${f.name}`;
  const help = "help" in f && f.help ? <span className="small muted">{f.help}</span> : null;
  const req = "required" in f && f.required;
  const str = value === null || value === undefined ? "" : String(value);
  let input: React.ReactNode;
  switch (f.type) {
    case "textarea":
      input = <textarea id={id} name={f.name} rows={f.rows ?? 3} defaultValue={str} required={req} />;
      break;
    case "lines":
      input = <textarea id={id} name={f.name} rows={4} defaultValue={Array.isArray(value) ? value.join("\n") : ""} />;
      break;
    case "number":
      input = <input id={id} name={f.name} type="number" step="any" defaultValue={str} required={req} />;
      break;
    case "money":
      input = <input id={id} name={f.name} inputMode="decimal" defaultValue={value === null || value === undefined ? "" : String((value as number) / 100)} placeholder="e.g. 1500" />;
      break;
    case "date":
      input = <input id={id} name={f.name} type="date" defaultValue={str} />;
      break;
    case "datetime":
      input = <input id={id} name={f.name} type="datetime-local" defaultValue={toIstInput(value as string | null)} />;
      break;
    case "bool":
      return (
        <label className="check">
          <input type="checkbox" name={f.name} defaultChecked={Boolean(value)} /> {f.label}
        </label>
      );
    case "tri":
      input = (
        <select id={id} name={f.name} defaultValue={value === true ? "yes" : value === false ? "no" : ""}>
          <option value="">To be confirmed</option>
          <option value="yes">{f.yes}</option>
          <option value="no">{f.no}</option>
        </select>
      );
      break;
    case "select":
      input = (
        <select id={id} name={f.name} defaultValue={str || (f.nullable ? "" : f.options[0].value)} required={req}>
          {f.nullable && <option value="">To be confirmed</option>}
          {f.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
      break;
    case "ref":
      input = (
        <select id={id} name={f.name} defaultValue={str}>
          <option value="">None</option>
          {refOptions?.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      );
      break;
    default:
      input = <input id={id} name={f.name} defaultValue={str} required={req} />;
  }
  return (
    <div className="field">
      <label htmlFor={id}>{f.label}</label>
      {input}
      {help}
    </div>
  );
}

export default async function EntityEdit({ params, searchParams }: { params: Promise<{ entity: string; id: string }>; searchParams: Promise<SP> }) {
  const [{ entity, id }, sp] = await Promise.all([params, searchParams]);
  const cfg = ENTITIES[entity];
  if (!cfg) notFound();
  const isNew = id === "new";
  if (!isNew && !z.string().uuid().safeParse(id).success) notFound();
  const supabase = await createClient();
  const profile = await getProfile();

  const row: Record<string, unknown> = isNew ? { status: "draft" } : ((await supabase.from(cfg.table).select("*").eq("id", id).maybeSingle()).data ?? {});
  if (!isNew && !row.id) notFound();

  // Options for reference fields
  const refFields = cfg.sections.flatMap((s) => s.fields).filter((f): f is Extract<Field, { type: "ref" }> => f.type === "ref");
  const refOptions: Record<string, { id: string; label: string }[]> = {};
  await Promise.all(
    refFields.map(async (f) => {
      let q = supabase.from(f.table).select(`id, ${f.labelColumn}`).order(f.labelColumn).limit(500);
      if (f.filter) q = q.eq(f.filter[0], f.filter[1]);
      const { data } = await q;
      refOptions[f.name] = ((data ?? []) as unknown as Record<string, string>[]).map((r) => ({ id: r.id, label: r[f.labelColumn] }));
    })
  );

  const ex = cfg.extras ?? [];
  const extra = {
    modules: "",
    faqs: "",
    meeting: { meeting_link: "", meeting_note: "" },
    variants: [] as { id: string; label: string; sku: string | null; price_paise: number; stock: number; is_active: boolean }[],
    images: [] as { id: string; storage_path: string; alt_text: string }[],
    body: { body: "", video_id: "", file_path: "" as string | null },
    registrations: [] as { id: string; name: string; phone: string | null; email: string | null; status: string; child_first_name: string | null; child_age: number | null; created_at: string }[],
  };
  if (!isNew) {
    if (ex.includes("modules")) {
      const { data } = await supabase.from("course_modules").select("title_en, description").eq("course_id", id).order("position");
      extra.modules = (data ?? []).map((m) => (m.description ? `${m.title_en} | ${m.description}` : m.title_en)).join("\n");
    }
    if (ex.includes("faqs")) {
      const { data } = await supabase.from("course_faqs").select("question, answer").eq("course_id", id).order("position");
      extra.faqs = (data ?? []).map((f) => `${f.question}\n${f.answer}`).join("\n\n");
    }
    if (ex.includes("meeting")) {
      const { data } = await supabase.from("session_private").select("meeting_link, meeting_note").eq("session_id", id).maybeSingle();
      extra.meeting = { meeting_link: data?.meeting_link ?? "", meeting_note: data?.meeting_note ?? "" };
    }
    if (ex.includes("variants")) extra.variants = (await supabase.from("product_variants").select("*").eq("product_id", id).order("position")).data ?? [];
    if (ex.includes("images")) extra.images = (await supabase.from("product_images").select("*").eq("product_id", id).order("position")).data ?? [];
    if (ex.includes("body")) {
      const { data } = await supabase.from("resource_bodies").select("*").eq("resource_id", id).maybeSingle();
      extra.body = { body: data?.body ?? "", video_id: data?.video_id ?? "", file_path: data?.file_path ?? null };
    }
    if (ex.includes("registrations")) {
      const col = entity === "sessions" ? "session_id" : "course_id";
      extra.registrations = (await supabase.from("registrations").select("id, name, phone, email, status, child_first_name, child_age, created_at").eq(col, id).order("created_at", { ascending: false })).data ?? [];
    }
  }
  const facts = (row.verified_details ?? {}) as Record<string, string>;
  const variantRows = [...extra.variants, ...Array.from({ length: 3 }, () => null)];
  const save = saveEntity.bind(null, entity, isNew ? null : id);
  const title = isNew ? `New ${cfg.singular}` : String(row.title_en ?? row.title ?? row.source ?? cfg.singular);
  const publicHref =
    !isNew && row.status === "published"
      ? entity === "courses"
        ? `/courses/${row.slug}`
        : entity === "products"
          ? `/shop/${row.slug}`
          : entity === "resources"
            ? `/wisdom/${row.slug}`
            : null
      : null;

  return (
    <>
      <p className="crumb">
        <Link href={`/admin/${entity}`}>{cfg.label}</Link> / {isNew ? "New" : title}
      </p>
      <AdminHead title={title} />
      <Flash sp={sp} />
      {publicHref && (
        <p className="small">
          <Link href={publicHref} target="_blank">
            View on the website ↗
          </Link>
        </p>
      )}

      <form action={save} className="stack-lg">
        {cfg.sections.map((s) => (
          <fieldset key={s.title} className="card stack">
            <legend className="eyebrow">{s.title}</legend>
            <div className="grid g2">
              {s.fields.map((f) => (
                <FieldInput key={f.name} f={f} value={row[f.name]} refOptions={refOptions[f.name]} />
              ))}
            </div>
          </fieldset>
        ))}

        {ex.includes("facts") && (
          <fieldset className="card stack">
            <legend className="eyebrow">Verified rudraksha details</legend>
            <p className="small muted">Fill these in only once verified. Empty ones show as &quot;Shown once verified&quot; on the website.</p>
            <div className="grid g2">
              {[
                ["type", "Type (e.g. 5 Mukhi)"],
                ["size_mm", "Size (mm)"],
                ["origin", "Origin"],
                ["certification", "Certification"],
              ].map(([k, l]) => (
                <div className="field" key={k}>
                  <label htmlFor={`fact_${k}`}>{l}</label>
                  <input id={`fact_${k}`} name={`fact_${k}`} defaultValue={facts[k] ?? ""} />
                </div>
              ))}
            </div>
          </fieldset>
        )}

        {ex.includes("variants") && (
          <fieldset className="card stack">
            <legend className="eyebrow">Options, prices and stock</legend>
            <p className="small muted">One row per option (e.g. bead size). For a product with no options, use one row called &quot;Standard&quot;. Clear a name to remove that row.</p>
            <div className="tablewrap">
              <table>
                <thead>
                  <tr>
                    <th>Option name</th>
                    <th>SKU</th>
                    <th>Price (₹)</th>
                    <th>Stock</th>
                    <th>For sale</th>
                  </tr>
                </thead>
                <tbody>
                  {variantRows.map((v, i) => (
                    <tr key={v?.id ?? `new-${i}`}>
                      <td>
                        <input type="hidden" name="v_id" value={v?.id ?? ""} />
                        <input name="v_label" defaultValue={v?.label ?? ""} aria-label="Option name" />
                      </td>
                      <td>
                        <input name="v_sku" defaultValue={v?.sku ?? ""} aria-label="SKU" />
                      </td>
                      <td>
                        <input name="v_price" inputMode="decimal" defaultValue={v ? v.price_paise / 100 : ""} aria-label="Price" />
                      </td>
                      <td>
                        <input name="v_stock" type="number" min={0} defaultValue={v?.stock ?? 0} aria-label="Stock" />
                      </td>
                      <td>
                        <select name="v_active" defaultValue={v?.is_active === false ? "no" : "yes"} aria-label="For sale">
                          <option value="yes">Yes</option>
                          <option value="no">No</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </fieldset>
        )}

        {ex.includes("modules") && (
          <fieldset className="card stack">
            <legend className="eyebrow">Course outline</legend>
            <div className="field">
              <label htmlFor="modules">Modules, one per line, in order</label>
              <textarea id="modules" name="modules" rows={6} defaultValue={extra.modules} placeholder={"Introduction to the practice | What the saadhna is and how to begin\nDaily discipline"} />
              <span className="small muted">Optionally add a short description after a | sign.</span>
            </div>
          </fieldset>
        )}
        {ex.includes("faqs") && (
          <fieldset className="card stack">
            <legend className="eyebrow">Course questions</legend>
            <div className="field">
              <label htmlFor="faqs">Question on the first line, answer below it. Leave a blank line between questions.</label>
              <textarea id="faqs" name="faqs" rows={8} defaultValue={extra.faqs} />
            </div>
          </fieldset>
        )}
        {ex.includes("meeting") && (
          <fieldset className="card stack">
            <legend className="eyebrow">Private joining details</legend>
            <p className="small muted">Only sent to registered participants and shown in their account. Never shown on the public website.</p>
            <div className="grid g2">
              <div className="field">
                <label htmlFor="meeting_link">Meeting link (Zoom or Google Meet)</label>
                <input id="meeting_link" name="meeting_link" type="url" defaultValue={extra.meeting.meeting_link} />
              </div>
              <div className="field">
                <label htmlFor="meeting_note">Note for participants</label>
                <input id="meeting_note" name="meeting_note" defaultValue={extra.meeting.meeting_note} placeholder="e.g. Passcode 1234. Join 5 minutes early." />
              </div>
            </div>
          </fieldset>
        )}
        {ex.includes("body") && (
          <fieldset className="card stack">
            <legend className="eyebrow">Content</legend>
            <div className="field">
              <label htmlFor="body">Text</label>
              <textarea id="body" name="body" rows={12} defaultValue={extra.body.body} />
              <span className="small muted">Leave a blank line between paragraphs. Start a line with ## for a heading, or - for a list.</span>
            </div>
            <div className="field">
              <label htmlFor="video_id">Bunny Stream video ID (for videos)</label>
              <input id="video_id" name="video_id" defaultValue={extra.body.video_id} />
            </div>
          </fieldset>
        )}

        <div className="ctas">
          <button className="btn primary" type="submit">
            Save
          </button>
          <Link className="btn ghost" href={`/admin/${entity}`}>
            Back to list
          </Link>
        </div>
      </form>

      {!isNew && ex.includes("images") && (
        <div className="card stack">
          <h2 style={{ fontSize: "1.3rem" }}>Photographs</h2>
          {extra.images.length ? (
            <div className="gallery">
              {extra.images.map((im) => (
                <div className="stack" key={im.id}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={storageUrl(im.storage_path)!} alt={im.alt_text} style={{ borderRadius: 10, aspectRatio: "1", objectFit: "cover" }} />
                  <form action={removeProductImage.bind(null, im.id, id)}>
                    <button className="btn ghost small" type="submit">
                      Remove
                    </button>
                  </form>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted small">No photographs yet. The first one is used in the shop.</p>
          )}
          <Uploader bucket="public-media" folder={`products/${id}`} accept="image/jpeg,image/png,image/webp" label="Add a photograph" onUploaded={addProductImage.bind(null, id)} />
        </div>
      )}

      {!isNew && ex.includes("body") && (
        <div className="card stack">
          <h2 style={{ fontSize: "1.3rem" }}>Study material file</h2>
          <p className="small muted">{extra.body.file_path ? `Current file: ${extra.body.file_path.split("/").pop()}` : "No file yet."} PDFs are served through expiring links to signed-in, entitled students only.</p>
          <Uploader bucket="study-material" folder={`resources/${id}`} accept="application/pdf" withAlt={false} label="Upload a PDF" onUploaded={setResourceFile.bind(null, id)} />
        </div>
      )}

      {!isNew && ex.includes("registrations") && (
        <div className="card stack">
          <div className="head row" style={{ margin: 0 }}>
            <h2 style={{ fontSize: "1.3rem" }}>Registrations ({extra.registrations.filter((r) => r.status === "confirmed").length} confirmed)</h2>
            <a className="btn ghost small" href={`/admin/export?${entity === "sessions" ? "session" : "course"}=${id}`}>
              Download CSV
            </a>
          </div>
          {extra.registrations.length ? (
            <div className="tablewrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Child</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Registered</th>
                  </tr>
                </thead>
                <tbody>
                  {extra.registrations.map((r) => (
                    <tr key={r.id}>
                      <td>{r.name}</td>
                      <td>{r.child_first_name ? `${r.child_first_name}, ${r.child_age}` : "—"}</td>
                      <td>{r.phone ?? "—"}</td>
                      <td>{r.email ?? "—"}</td>
                      <td>{r.status.replace(/_/g, " ")}</td>
                      <td>{istDate(r.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="muted small">No registrations yet.</p>
          )}
          {entity === "sessions" && (
            <form action={notifyRegistrants.bind(null, id)} className="stack">
              <h3>Message everyone registered</h3>
              <p className="small muted">For a cancellation, a new date or a reminder. Sent by email (and WhatsApp once connected) to confirmed registrants.</p>
              <div className="field">
                <label htmlFor="subject">Subject</label>
                <input id="subject" name="subject" required placeholder="Change of time for Sunday's session" />
              </div>
              <div className="field">
                <label htmlFor="message">Message</label>
                <textarea id="message" name="message" rows={4} required />
              </div>
              <button className="btn ghost small" type="submit" style={{ justifySelf: "start" }}>
                Send to registrants
              </button>
            </form>
          )}
        </div>
      )}

      {!isNew && profile?.role === "admin" && (
        <form action={deleteEntity.bind(null, entity, id)}>
          <details>
            <summary className="small muted" style={{ cursor: "pointer" }}>
              Delete this {cfg.singular}
            </summary>
            <p className="small" style={{ marginBlock: 8 }}>
              This cannot be undone. Anything with registrations or orders cannot be deleted; set it to Archived instead.
            </p>
            <button className="btn ghost small" type="submit">
              Delete permanently
            </button>
          </details>
        </form>
      )}
      {entity === "sessions" && !isNew && row.fee_paise ? <p className="small muted">Fee: {inr(row.fee_paise as number)}</p> : null}
    </>
  );
}
