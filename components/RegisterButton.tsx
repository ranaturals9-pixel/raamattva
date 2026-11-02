"use client";

import { useEffect, useRef, useState } from "react";
import { confirmPayment, startRegistration } from "@/app/actions/register";
import { payWithRazorpay } from "@/lib/razorpay-client";
import { inr } from "@/lib/format";
import type { RegState } from "@/lib/registration-state";

type Props = {
  targetType: "session" | "course";
  targetId: string;
  title: string;
  state: RegState;
  feePaise: number | null;
  forChildren: boolean;
  summary: [string, string][];
  labels: { free: string; paid: string; soon: string; full: string };
  className?: string;
};

type Stage = { kind: "form" } | { kind: "paying" } | { kind: "done"; message: string } | { kind: "error"; message: string };

export function RegisterButton(p: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const [stage, setStage] = useState<Stage>({ kind: "form" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const onClose = () => setStage((s) => (s.kind === "done" ? { kind: "form" } : s));
    d.addEventListener("close", onClose);
    return () => d.removeEventListener("close", onClose);
  }, []);

  if (p.state === "soon" || p.state === "full") {
    return (
      <button className={p.className ?? "btn ghost small"} type="button" disabled>
        {p.state === "full" ? p.labels.full : p.labels.soon}
      </button>
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    const res = await startRegistration({
      targetType: p.targetType,
      targetId: p.targetId,
      name: String(f.get("name") ?? ""),
      phone: String(f.get("phone") ?? ""),
      email: String(f.get("email") ?? ""),
      childFirstName: String(f.get("childFirstName") ?? ""),
      childAge: f.get("childAge") ? Number(f.get("childAge")) : undefined,
      city: String(f.get("city") ?? ""),
      guardianConfirmed: f.get("guardianConfirmed") === "on",
      photoConsent: f.get("photoConsent") === "on",
      website: String(f.get("website") ?? ""),
    });
    if (!res.ok) {
      setBusy(false);
      setStage({ kind: "error", message: res.error });
      return;
    }
    if (res.status === "confirmed") {
      setBusy(false);
      setStage({ kind: "done", message: res.message });
      return;
    }
    setStage({ kind: "paying" });
    const paid = await payWithRazorpay(res.pay);
    if (paid === "failed-to-load") {
      setBusy(false);
      setStage({ kind: "error", message: "The payment window could not open. Please check your connection and try again." });
      return;
    }
    if (!paid) {
      setBusy(false);
      setStage({ kind: "error", message: "Payment was not completed, so you are not registered yet. You can try again." });
      return;
    }
    const conf = await confirmPayment(paid);
    setBusy(false);
    setStage(conf.ok ? { kind: "done", message: "Payment received. You are registered, and your confirmation is on its way." } : { kind: "error", message: conf.error });
  }

  const showForm = stage.kind === "form" || stage.kind === "error";
  return (
    <>
      <button className={p.className ?? "btn primary small"} type="button" onClick={() => ref.current?.showModal()}>
        {p.state === "free" ? p.labels.free : p.labels.paid}
      </button>
      <dialog ref={ref} className="modal" aria-labelledby={`reg-${p.targetId}`}>
        <header>
          <div className="stack" style={{ gap: 6 }}>
            <p className="eyebrow">{p.forChildren ? "Register your child" : "Registration"}</p>
            <h3 id={`reg-${p.targetId}`}>{p.title}</h3>
          </div>
          <button className="x" type="button" aria-label="Close" onClick={() => ref.current?.close()}>
            ×
          </button>
        </header>
        <div className="summary">
          {p.summary.map(([k, v]) => (
            <div key={k}>
              <span>{k}</span>
              <span>{v}</span>
            </div>
          ))}
          <div>
            <span>Fee</span>
            <b>{p.state === "free" ? "Free" : inr(p.feePaise)}</b>
          </div>
        </div>
        {stage.kind === "done" && (
          <div className="stack">
            <p className="notice ok">{stage.message}</p>
            <button className="btn ghost" type="button" onClick={() => ref.current?.close()}>
              Close
            </button>
          </div>
        )}
        {stage.kind === "paying" && <p className="notice">Complete the payment in the Razorpay window…</p>}
        {showForm && (
          <form className="stack" onSubmit={onSubmit}>
            <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hp" aria-hidden="true" />
            {p.forChildren ? (
              <>
                <div className="row2">
                  <div className="field">
                    <label htmlFor={`n-${p.targetId}`}>Parent or guardian name</label>
                    <input id={`n-${p.targetId}`} name="name" required autoComplete="name" />
                  </div>
                  <div className="field">
                    <label htmlFor={`ph-${p.targetId}`}>WhatsApp number</label>
                    <input id={`ph-${p.targetId}`} name="phone" required type="tel" autoComplete="tel" inputMode="tel" />
                  </div>
                </div>
                <div className="field">
                  <label htmlFor={`em-${p.targetId}`}>Email (optional)</label>
                  <input id={`em-${p.targetId}`} name="email" type="email" autoComplete="email" />
                </div>
                <div className="row2">
                  <div className="field">
                    <label htmlFor={`cn-${p.targetId}`}>Child&apos;s first name</label>
                    <input id={`cn-${p.targetId}`} name="childFirstName" required />
                  </div>
                  <div className="field">
                    <label htmlFor={`ca-${p.targetId}`}>Child&apos;s age</label>
                    <input id={`ca-${p.targetId}`} name="childAge" required type="number" min={3} max={18} inputMode="numeric" />
                  </div>
                </div>
                <div className="field">
                  <label htmlFor={`ct-${p.targetId}`}>City</label>
                  <input id={`ct-${p.targetId}`} name="city" autoComplete="address-level2" />
                </div>
                <label className="check">
                  <input type="checkbox" name="guardianConfirmed" required /> I am this child&apos;s parent or legal guardian.
                </label>
                <label className="check">
                  <input type="checkbox" name="photoConsent" /> I allow photographs of my child in the Gurukul gallery. (Optional. You can withdraw this at any time.)
                </label>
              </>
            ) : (
              <>
                <div className="field">
                  <label htmlFor={`n-${p.targetId}`}>Your name</label>
                  <input id={`n-${p.targetId}`} name="name" required autoComplete="name" />
                </div>
                <div className="row2">
                  <div className="field">
                    <label htmlFor={`ph-${p.targetId}`}>WhatsApp number</label>
                    <input id={`ph-${p.targetId}`} name="phone" type="tel" autoComplete="tel" inputMode="tel" />
                  </div>
                  <div className="field">
                    <label htmlFor={`em-${p.targetId}`}>Email</label>
                    <input id={`em-${p.targetId}`} name="email" type="email" autoComplete="email" />
                  </div>
                </div>
                <p className="small muted">Give at least one, so we can send your confirmation.</p>
              </>
            )}
            {stage.kind === "error" && <p className="notice">{stage.message}</p>}
            <p className="small muted">{p.state === "paid" ? "You will pay securely by UPI, card or net banking." : "No payment details are needed."}</p>
            <button className="btn primary" type="submit" disabled={busy}>
              {busy ? "Please wait…" : p.state === "paid" ? `Continue to pay ${inr(p.feePaise)}` : "Register"}
            </button>
          </form>
        )}
      </dialog>
    </>
  );
}
