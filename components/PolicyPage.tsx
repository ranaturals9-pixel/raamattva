import { getSiteContent } from "@/lib/data";
import { POLICIES, type PolicyKey } from "@/lib/policies";
import { PageHead, Prose } from "./ui";

export async function PolicyPage({ which }: { which: PolicyKey }) {
  const content = await getSiteContent();
  const approved = content[`policy.${which}`];
  const isApproved = Boolean(approved?.en && approved.confirmed);
  const p = POLICIES[which];
  return (
    <>
      <PageHead eyebrow="Policy" title={p.title} crumbs={[{ label: p.title }]}>
        {!isApproved && <p className="notice">This policy is a draft under review. Items marked &quot;to be confirmed&quot; are still being decided.</p>}
      </PageHead>
      <section className="band">
        <div className="wrap">
          <Prose text={isApproved ? approved!.en : p.draft} />
        </div>
      </section>
    </>
  );
}
