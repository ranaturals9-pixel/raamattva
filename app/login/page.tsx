import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { PageHead } from "@/components/ui";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/account";
  if (await getUser()) redirect(safeNext);
  return (
    <>
      <PageHead
        eyebrow="खाता · Account"
        title="Sign in to your account"
        lede="See your courses, upcoming sessions, recordings, study material and orders in one place."
        crumbs={[{ label: "Sign in" }]}
      />
      <section className="band">
        <div className="wrap narrow">
          <LoginForm next={safeNext} phoneEnabled={process.env.NEXT_PUBLIC_PHONE_LOGIN === "1"} />
        </div>
      </section>
    </>
  );
}
