import { ImageResponse } from "next/og";

export const alt = "Raamattva Vidya Peeth, founded by Swami Ananta Giri";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** The preview card shown when the site is shared on WhatsApp or social media. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#FBF7EE", padding: 64 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", border: "2px solid #B39556", borderRadius: 24, padding: 56 }}>
          <div style={{ fontSize: 26, letterSpacing: 6, color: "#7A6127", textTransform: "uppercase" }}>Founded by Swami Ananta Giri</div>
          <div style={{ fontSize: 84, color: "#2B2418", marginTop: 18, lineHeight: 1.05 }}>Raamattva Vidya Peeth</div>
          <div style={{ fontSize: 36, color: "#94500F", marginTop: 22 }}>Rooted in Wisdom. Growing in Awareness.</div>
          <div style={{ fontSize: 26, color: "#675D4C", marginTop: 34 }}>Gurukul for children · Courses · Sessions · Spiritual shop</div>
        </div>
      </div>
    ),
    size
  );
}
