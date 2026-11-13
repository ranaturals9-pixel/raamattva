"use client";

import { useState } from "react";
import { sendEnquiry } from "@/app/actions/misc";

const TOPICS = [
  ["gurukul", "Gurukul admissions"],
  ["courses", "Courses"],
  ["sessions", "Sessions and events"],
  ["shop", "Shop orders"],
  ["other", "Something else"],
] as const;

export function EnquiryForm({ topic, order, message }: { topic?: string; order?: string; message?: string }) {
  const [state, setState] = useState<{ kind: "idle" | "sent" | "error"; msg?: string }>({ kind: "idle" });
  const [busy, setBusy] = useState(false);
  const [chosen, setChosen] = useState(TOPICS.some(([v]) => v === topic) ? topic! : "gurukul");

  if (state.kind === "sent") return <p className="notice ok">Thank you. Your message has reached the team, and we will reply on WhatsApp or email.</p>;

  return (
    <form
      className="card"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        setBusy(true);
        const r = await sendEnquiry({
          topic: chosen as (typeof TOPICS)[number][0],
          name: String(f.get("name")),
          phone: String(f.get("phone") ?? ""),
          email: String(f.get("email") ?? ""),
          orderNumber: String(f.get("order") ?? ""),
          message: String(f.get("message")),
          website: String(f.get("website") ?? ""),
        });
        setBusy(false);
        setState(r.ok ? { kind: "sent" } : { kind: "error", msg: r.error });
      }}
    >
      <h3>Send an enquiry</h3>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hp" aria-hidden="true" />
      <div className="field">
        <label htmlFor="cTopic">What is it about?</label>
        <select id="cTopic" value={chosen} onChange={(e) => setChosen(e.target.value)}>
          {TOPICS.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </div>
      <div className="row2">
        <div className="field">
          <label htmlFor="cName">Your name</label>
          <input id="cName" name="name" required autoComplete="name" />
        </div>
        <div className="field">
          <label htmlFor="cPhone">WhatsApp number</label>
          <input id="cPhone" name="phone" type="tel" autoComplete="tel" inputMode="tel" />
        </div>
      </div>
      <div className="field">
        <label htmlFor="cEmail">Email</label>
        <input id="cEmail" name="email" type="email" autoComplete="email" />
      </div>
      {chosen === "shop" && (
        <div className="field">
          <label htmlFor="cOrder">Order number</label>
          <input id="cOrder" name="order" defaultValue={order} placeholder="RVP-1001" />
        </div>
      )}
      <div className="field">
        <label htmlFor="cMsg">Message</label>
        <textarea id="cMsg" name="message" rows={5} required defaultValue={message} />
      </div>
      {state.kind === "error" && <p className="notice">{state.msg}</p>}
      <button className="btn primary" type="submit" disabled={busy}>
        {busy ? "Sending…" : "Send enquiry"}
      </button>
    </form>
  );
}
