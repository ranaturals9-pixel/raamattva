"use client";

import { useEffect, useRef, useState } from "react";

type Group = { key: string; label: string; options: { value: string; label: string }[] };

/**
 * Filters server-rendered cards by their data-* attributes.
 * Cards stay in the page for search engines and readers without JavaScript.
 */
export function Filters({
  groups,
  children,
  emptyText,
  initial,
  className = "",
}: {
  groups: Group[];
  children: React.ReactNode;
  emptyText: string;
  initial?: Record<string, string>;
  className?: string;
}) {
  const [sel, setSel] = useState<Record<string, string>>(() => Object.fromEntries(groups.map((g) => [g.key, initial?.[g.key] ?? "all"])));
  const [empty, setEmpty] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cards = Array.from(box.current?.children ?? []) as HTMLElement[];
    let shown = 0;
    for (const c of cards) {
      if (!c.dataset) continue;
      const ok = groups.every((g) => {
        const v = sel[g.key];
        const have = c.dataset[g.key];
        if (v === "all" || have === undefined) return true;
        // a hybrid session counts as both online and in person
        if (g.key === "format" && have === "hybrid") return true;
        return have === v;
      });
      c.hidden = !ok;
      if (ok) shown++;
    }
    setEmpty(shown === 0);
  }, [sel, groups]);

  return (
    <>
      <div className="filters">
        {groups.map((g) => (
          <div className="chipset" key={g.key} role="group" aria-label={g.label}>
            <span className="label">{g.label}</span>
            {[{ value: "all", label: "All" }, ...g.options].map((o) => (
              <button key={o.value} type="button" aria-pressed={sel[g.key] === o.value} onClick={() => setSel({ ...sel, [g.key]: o.value })}>
                {o.label}
              </button>
            ))}
          </div>
        ))}
      </div>
      <div ref={box} className={className}>
        {children}
      </div>
      {empty && <div className="card empty">{emptyText}</div>}
    </>
  );
}
