"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

/**
 * Uploads a file straight from the browser to Supabase Storage (so large phone
 * photos do not pass through the server), then records it with `onUploaded`.
 */
export function Uploader({
  bucket,
  folder,
  accept,
  withAlt = true,
  label,
  onUploaded,
}: {
  bucket: "public-media" | "study-material";
  folder: string;
  accept: string;
  withAlt?: boolean;
  label: string;
  onUploaded: (path: string, alt: string) => Promise<void>;
}) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [alt, setAlt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="inline-form card"
      style={{ padding: 16 }}
      onSubmit={async (e) => {
        e.preventDefault();
        if (!file) return;
        if (file.size > 15 * 1024 * 1024) {
          setError("Please choose a file under 15 MB.");
          return;
        }
        setBusy(true);
        setError(null);
        const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
        const path = `${folder}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await createClient().storage.from(bucket).upload(path, file, { cacheControl: "31536000", upsert: false, contentType: file.type });
        if (upErr) {
          setBusy(false);
          setError(`Upload failed: ${upErr.message}`);
          return;
        }
        await onUploaded(path, alt);
        setBusy(false);
        setFile(null);
        setAlt("");
        (e.target as HTMLFormElement).reset();
        router.refresh();
      }}
    >
      <div className="field" style={{ flex: "1 1 200px" }}>
        <label htmlFor={`up-${folder}`}>{label}</label>
        <input id={`up-${folder}`} type="file" accept={accept} onChange={(e) => setFile(e.target.files?.[0] ?? null)} required />
      </div>
      {withAlt && (
        <div className="field" style={{ flex: "2 1 240px" }}>
          <label htmlFor={`alt-${folder}`}>Describe the image (for screen readers)</label>
          <input id={`alt-${folder}`} value={alt} onChange={(e) => setAlt(e.target.value)} required placeholder="e.g. 5 mukhi rudraksha mala on a brass plate" />
        </div>
      )}
      <button className="btn primary small" type="submit" disabled={busy || !file}>
        {busy ? "Uploading…" : "Upload"}
      </button>
      {error && <p className="error-text" style={{ flexBasis: "100%" }}>{error}</p>}
    </form>
  );
}
