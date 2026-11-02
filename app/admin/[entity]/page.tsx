import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ENTITIES } from "@/lib/admin/config";
import { AdminHead, Cell } from "@/components/admin/bits";

export default async function EntityList({ params }: { params: Promise<{ entity: string }> }) {
  const { entity } = await params;
  const cfg = ENTITIES[entity];
  if (!cfg) notFound();
  const supabase = await createClient();
  const { data } = await supabase
    .from(cfg.table)
    .select("*")
    .order(cfg.orderBy[0], { ascending: cfg.orderBy[1], nullsFirst: false })
    .limit(300);
  const rows = (data ?? []) as Record<string, unknown>[];

  return (
    <>
      <AdminHead title={cfg.label} action={{ href: `/admin/${entity}/new`, label: `Add ${cfg.singular}` }} />
      {rows.length ? (
        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                {cfg.listColumns.map((c) => (
                  <th key={c.name}>{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={String(r.id)}>
                  {cfg.listColumns.map((c, i) => (
                    <td key={c.name}>
                      {i === 0 ? (
                        <Link href={`/admin/${entity}/${r.id}`}>
                          <Cell v={r[c.name]} kind={c.kind} />
                        </Link>
                      ) : (
                        <Cell v={r[c.name]} kind={c.kind} />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card empty">Nothing here yet.</div>
      )}
    </>
  );
}
