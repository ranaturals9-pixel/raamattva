import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { istDate } from "@/lib/format";
import { setEnquiryHandled } from "@/app/admin/actions";
import { AdminHead } from "@/components/admin/bits";

export default async function Enquiries({ searchParams }: { searchParams: Promise<{ done?: string }> }) {
  const { done } = await searchParams;
  const showDone = done === "1";
  const supabase = await createClient();
  const { data } = await supabase.from("enquiries").select("*").eq("handled", showDone).order("created_at", { ascending: false }).limit(300);
  return (
    <>
      <AdminHead title="Enquiries" lede="Messages from the contact page." />
      <div className="chipset">
        <Link className="btn small ghost" href="/admin/enquiries" style={!showDone ? { background: "var(--ink)", color: "var(--on-accent)" } : undefined}>
          Open
        </Link>
        <Link className="btn small ghost" href="/admin/enquiries?done=1" style={showDone ? { background: "var(--ink)", color: "var(--on-accent)" } : undefined}>
          Handled
        </Link>
      </div>
      {data?.length ? (
        <div className="stack">
          {data.map((e) => (
            <div className="card stack" key={e.id}>
              <div className="tags">
                <span className="tag">{e.topic}</span>
                <span className="small muted">{istDate(e.created_at)}</span>
              </div>
              <b>{e.name}</b>
              <p className="small">
                {e.phone && (
                  <a href={`https://wa.me/${e.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">
                    {e.phone}
                  </a>
                )}
                {e.phone && e.email && " · "}
                {e.email && <a href={`mailto:${e.email}`}>{e.email}</a>}
                {e.order_number && ` · Order ${e.order_number}`}
              </p>
              <p style={{ whiteSpace: "pre-wrap" }}>{e.message}</p>
              <form action={setEnquiryHandled.bind(null, e.id, !showDone)}>
                <button className="btn ghost small" type="submit">
                  {showDone ? "Reopen" : "Mark as handled"}
                </button>
              </form>
            </div>
          ))}
        </div>
      ) : (
        <div className="card empty">{showDone ? "Nothing handled yet." : "No open enquiries."}</div>
      )}
    </>
  );
}
