import type { Metadata } from "next";
import { PolicyPage } from "@/components/PolicyPage";

export const metadata: Metadata = { title: "Privacy policy" };

export default function Page() {
  return <PolicyPage which="privacy" />;
}
