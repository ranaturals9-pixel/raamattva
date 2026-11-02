import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { setRole } from "@/app/admin/actions";
import { AdminHead, Flash } from "@/components/admin/bits";

export default async function Team({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("email, phone, full_name, role").in("role", ["editor", "admin"]).order("role");
  return (
    <>
      <AdminHead title="Team" lede="Editors manage content, sessions, products and orders. Admins can also issue refunds, edit site text and policies, and manage the team." />
      <Flash sp={sp} />
      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>Person</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((p) => (
              <tr key={p.email ?? p.phone}>
                <td>{p.full_name ?? p.email ?? p.phone}</td>
                <td>{p.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <form action={setRole} className="card inline-form">
        <div className="field" style={{ flex: "2 1 240px" }}>
          <label htmlFor="email">Email of the person</label>
          <input id="email" name="email" type="email" required placeholder="They must have signed in once" />
        </div>
        <div className="field" style={{ flex: "1 1 160px" }}>
          <label htmlFor="role">Role</label>
          <select id="role" name="role" defaultValue="editor">
            <option value="editor">Editor</option>
            <option value="admin">Admin</option>
            <option value="student">Remove from team</option>
          </select>
        </div>
        <button className="btn primary small" type="submit">
          Save
        </button>
      </form>
    </>
  );
}
