import type { Metadata } from "next";
import { PolicyPage } from "@/components/PolicyPage";

export const metadata: Metadata = { title: "Terms of use" };

export default function Page() {
  return <PolicyPage which="terms" />;
}
