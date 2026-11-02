import type { Metadata } from "next";
import { PolicyPage } from "@/components/PolicyPage";

export const metadata: Metadata = { title: "Cancellations, refunds and returns" };

export default function Page() {
  return <PolicyPage which="refunds" />;
}
