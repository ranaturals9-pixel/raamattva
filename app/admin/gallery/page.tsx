import { createClient } from "@/lib/supabase/server";
import { storageUrl } from "@/lib/format";
import { addGalleryPhoto, deleteGalleryPhoto, saveGalleryPhoto } from "@/app/admin/actions";
import { AdminHead, Flash } from "@/components/admin/bits";
import { Uploader } from "@/components/admin/Uploader";

export default async function Gallery({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const sp = await searchParams;
  const supabase = await createClient();
  const [{ data: photos }, { data: consents }] = await Promise.all([
    supabase.from("gallery_photos").select("*").order("created_at", { ascending: false }),
    supabase.from("registrations").select("id, child_first_name, name, city").eq("photo_consent", true).eq("status", "confirmed").order("child_first_name"),
  ]);

  return (
    <>
      <AdminHead title="Gurukul gallery" lede="A photo that shows children can be published only after you tick the guardian consent of every child visible in it." />
      <Flash sp={sp} />
      <Uploader bucket="public-media" folder="gallery" accept="image/jpeg,image/png,image/webp" label="Add a photograph" onUploaded={addGalleryPhoto} />
      {photos?.length ? (
        <div className="stack-lg">
          {photos.map((p) => (
            <form key={p.id} action={saveGalleryPhoto.bind(null, p.id)} className="card split" style={{ gap: 18 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={storageUrl(p.storage_path)!} alt={p.alt_text} style={{ borderRadius: 12, width: "100%", aspectRatio: "4/3", objectFit: "cover" }} />
              <div className="stack">
                <div className="field">
                  <label htmlFor={`alt-${p.id}`}>Description (for screen readers)</label>
                  <input id={`alt-${p.id}`} name="alt_text" defaultValue={p.alt_text} />
                </div>
                <div className="field">
                  <label htmlFor={`cap-${p.id}`}>Caption</label>
                  <input id={`cap-${p.id}`} name="caption" defaultValue={p.caption ?? ""} />
                </div>
                <label className="check">
                  <input type="checkbox" name="shows_children" defaultChecked={p.shows_children} /> Children can be seen in this photo
                </label>
                <fieldset className="stack" style={{ border: 0, padding: 0 }}>
                  <legend className="small" style={{ fontWeight: 600 }}>
                    Guardian consent for the children shown
                  </legend>
                  {consents?.length ? (
                    <div className="stack" style={{ gap: 4, maxHeight: 180, overflow: "auto" }}>
                      {consents.map((c) => (
                        <label className="check" key={c.id}>
                          <input type="checkbox" name="consent" value={c.id} defaultChecked={p.consent_registration_ids?.includes(c.id)} /> {c.child_first_name} (guardian {c.name}
                          {c.city ? `, ${c.city}` : ""})
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className="small muted">No guardian has given photo consent yet.</p>
                  )}
                </fieldset>
                <div className="field">
                  <label htmlFor={`st-${p.id}`}>Visibility</label>
                  <select id={`st-${p.id}`} name="status" defaultValue={p.status}>
                    <option value="draft">Hidden</option>
                    <option value="published">Published on the Gurukul page</option>
                  </select>
                </div>
                <div className="ctas">
                  <button className="btn primary small" type="submit">
                    Save
                  </button>
                  <button className="btn ghost small" type="submit" formAction={deleteGalleryPhoto.bind(null, p.id)}>
                    Delete
                  </button>
                </div>
              </div>
            </form>
          ))}
        </div>
      ) : (
        <div className="card empty">No photographs yet.</div>
      )}
    </>
  );
}
