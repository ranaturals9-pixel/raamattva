"use client";

import { useState } from "react";
import { sendCode, verifyCode } from "@/app/actions/auth";

export function LoginForm({ next, phoneEnabled }: { next: string; phoneEnabled: boolean }) {
  const [id, setId] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!sentTo)
    return (
      <form
        className="card"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError(null);
          const r = await sendCode(id);
          setBusy(false);
          if (r.ok) setSentTo(r.sentTo!);
          else setError(r.error ?? "Please try again.");
        }}
      >
        <h3>Sign in</h3>
        <p className="small muted">We will send a one-time code. No password needed. Use the {phoneEnabled ? "email or WhatsApp number" : "email"} you registered with.</p>
        <div className="field">
          <label htmlFor="identifier">{phoneEnabled ? "Email or WhatsApp number" : "Email"}</label>
          <input id="identifier" required value={id} onChange={(e) => setId(e.target.value)} autoComplete={phoneEnabled ? "username" : "email"} inputMode={phoneEnabled ? "text" : "email"} />
        </div>
        {error && <p className="notice">{error}</p>}
        <button className="btn primary" type="submit" disabled={busy}>
          {busy ? "Sending…" : "Send code"}
        </button>
      </form>
    );

  return (
    <form
      className="card"
      onSubmit={async (e) => {
        e.preventDefault();
        const code = String(new FormData(e.currentTarget).get("code") ?? "");
        setBusy(true);
        setError(null);
        const r = await verifyCode(sentTo, code, next);
        setBusy(false);
        if (r && !r.ok) setError(r.error);
      }}
    >
      <h3>Enter your code</h3>
      <p className="small muted">We sent a code to {sentTo}. It expires in a few minutes.</p>
      <div className="field">
        <label htmlFor="code">Code</label>
        <input id="code" name="code" className="otp" required inputMode="numeric" autoComplete="one-time-code" maxLength={10} />
      </div>
      {error && <p className="notice">{error}</p>}
      <button className="btn primary" type="submit" disabled={busy}>
        {busy ? "Checking…" : "Sign in"}
      </button>
      <button className="btn ghost small" type="button" onClick={() => setSentTo(null)}>
        Use a different email or number
      </button>
    </form>
  );
}
