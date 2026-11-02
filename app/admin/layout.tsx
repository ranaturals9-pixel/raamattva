import type { Metadata } from "next";
import Link from "next/link";
import { requireStaff } from "@/lib/auth";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };
export const dynamic = "force-dynamic";

const NAV: { href: string; label: string; admin?: boolean }[] = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/registrations", label: "Registrations" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/enquiries", label: "Enquiries" },
  { href: "/admin/sessions", label: "Sessions & events" },
  { href: "/admin/courses", label: "Courses" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/recordings", label: "Recordings" },
  { href: "/admin/resources", label: "Articles & resources" },
  { href: "/admin/verses", label: "Scripture & reflections" },
  { href: "/admin/announcements", label: "Announcements" },
  { href: "/admin/gallery", label: "Gurukul gallery" },
  { href: "/admin/content", label: "Site text & policies", admin: true },
  { href: "/admin/team", label: "Team", admin: true },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireStaff();
  return (
    <section className="band" style={{ paddingTop: 28 }}>
      <div className="wrap admin">
        <nav aria-label="Admin sections">
          <p className="eyebrow" style={{ marginBottom: 10 }}>
            Admin · {profile.role === "admin" ? "Admin" : "Editor"}
          </p>
          <ul className="admin-nav">
            {NAV.filter((n) => !n.admin || profile.role === "admin").map((n) => (
              <li key={n.href}>
                <Link href={n.href}>{n.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="stack-lg" style={{ minWidth: 0 }}>
          {children}
        </div>
      </div>
    </section>
  );
}
