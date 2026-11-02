import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getResource } from "@/lib/data";
import { getUser } from "@/lib/auth";
import { videoEmbedUrl } from "@/lib/video";
import { createClient } from "@/lib/supabase/server";
import { PageHead, Prose } from "@/components/ui";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const d = await getResource((await params).slug);
  return d ? { title: d.resource.title_en, description: d.resource.summary ?? undefined } : { title: "Not found" };
}

export default async function ResourcePage({ params }: Props) {
  const { slug } = await params;
  const [data, user] = await Promise.all([getResource(slug), getUser()]);
  if (!data) notFound();
  const { resource: r, body } = data;
  const locked = !body;
  const video = body?.video_id ? videoEmbedUrl(body.video_id) : null;
  let fileUrl: string | null = null;
  if (body?.file_path) {
    const supabase = await createClient();
    const { data: signed } = await supabase.storage.from("study-material").createSignedUrl(body.file_path, 3600);
    fileUrl = signed?.signedUrl ?? null;
  }

  return (
    <>
      <PageHead eyebrow={r.access === "free" ? "Free resource" : "For enrolled students"} title={r.title_en} lede={r.summary ?? undefined} crumbs={[{ href: "/wisdom", label: "Wisdom" }, { label: r.title_en }]} />
      <section className="band">
        <div className="wrap narrow stack-lg">
          {locked ? (
            <div className="slot">
              <b>For enrolled students</b>
              {user ? (
                <>This resource opens for students enrolled in the linked course. <Link href="/courses">See courses</Link>.</>
              ) : (
                <>
                  Please <Link href={`/login?next=/wisdom/${r.slug}`}>sign in</Link> with the phone or email you registered with.
                </>
              )}
            </div>
          ) : (
            <>
              {video && (
                <div className="video">
                  <iframe src={video} title={r.title_en} loading="lazy" allow="accelerometer; gyroscope; encrypted-media; picture-in-picture" allowFullScreen />
                </div>
              )}
              <Prose text={body?.body} />
              {fileUrl && (
                <p>
                  <a className="btn ghost" href={fileUrl} target="_blank" rel="noopener noreferrer">
                    Open study material
                  </a>
                </p>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}
