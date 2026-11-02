import type { Metadata } from "next";
import { PolicyPage } from "@/components/PolicyPage";

export const metadata: Metadata = { title: "Shipping policy" };

export default function Page() {
  return <PolicyPage which="shipping" />;
}
