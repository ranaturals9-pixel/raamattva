import "server-only";
import { cookies } from "next/headers";
import type { Lang } from "./i18n-shared";

export * from "./i18n-shared";

export async function getLang(): Promise<Lang> {
  const c = await cookies();
  return c.get("lang")?.value === "hi" ? "hi" : "en";
}
