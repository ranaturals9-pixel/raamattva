import "server-only";

const SITE = "Raamattva Vidya Peeth";

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}

/** Simple, readable email layout in the site's colours. */
export function layout(title: string, rows: [string, string][], paragraphs: string[], link?: { label: string; href: string }) {
  const table = rows.length
    ? `<table style="border-collapse:collapse;width:100%;margin:16px 0;font-size:15px">${rows
        .map(
          ([k, v]) =>
            `<tr><td style="padding:8px 0;color:#675D4C;width:40%;vertical-align:top">${esc(k)}</td><td style="padding:8px 0;color:#2B2418;font-weight:600">${esc(v)}</td></tr>`
        )
        .join("")}</table>`
    : "";
  const body = paragraphs.map((p) => `<p style="margin:0 0 12px;color:#2B2418;font-size:15px;line-height:1.6">${esc(p)}</p>`).join("");
  const button = link
    ? `<p style="margin:20px 0"><a href="${esc(link.href)}" style="background:#94500F;color:#FFF9EE;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:600">${esc(link.label)}</a></p>`
    : "";
  return `<!doctype html><html><body style="margin:0;background:#FBF7EE;font-family:Arial,Helvetica,sans-serif">
<div style="max-width:560px;margin:0 auto;padding:28px 20px">
<p style="margin:0 0 4px;color:#7A6127;font-size:12px;letter-spacing:.14em;text-transform:uppercase">${SITE}</p>
<h1 style="margin:0 0 12px;color:#2B2418;font-family:Georgia,serif;font-weight:400;font-size:24px">${esc(title)}</h1>
${body}${table}${button}
<p style="margin:28px 0 0;color:#675D4C;font-size:13px">All times are India Standard Time (IST). Please keep this email; it contains your joining details.</p>
</div></body></html>`;
}

export async function sendEmail(to: string | null | undefined, subject: string, html: string): Promise<boolean> {
  if (!to) return false;
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) {
    console.info(`[email not configured] would send "${subject}" to ${to}`);
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], subject: `${subject} · ${SITE}`, html }),
    });
    if (!res.ok) console.error("Email failed", res.status, await res.text());
    return res.ok;
  } catch (e) {
    console.error("Email error", e);
    return false;
  }
}

export async function notifyTeam(subject: string, rows: [string, string][]) {
  const to = process.env.TEAM_NOTIFY_EMAIL;
  if (!to) return;
  await sendEmail(to, subject, layout(subject, rows, []));
}

/**
 * WhatsApp messages need a WhatsApp Business API provider (Interakt, AiSensy, WATI).
 * Until one is connected this logs instead of sending. Swap the body for the provider's API call.
 */
export async function sendWhatsApp(phone: string | null | undefined, template: string, params: Record<string, string>) {
  if (!phone) return false;
  console.info(`[whatsapp not configured] ${template} to ${phone}`, params);
  return false;
}
