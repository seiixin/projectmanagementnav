// src/components/Geoportal/Includes/FAQ.jsx
import React from "react";

/**
 * Minimal, stable FAQ
 * - Search (case-insensitive)
 * - Expand/Collapse all
 * - Deep link support (#faq-<id>)
 *
 * Props:
 *   items: Array<{ id: string, q: string, a: React.ReactNode, tags?: string[] }>
 *   defaultOpenIds?: string[]
 */
export default function FAQ({ items = [], defaultOpenIds = [] }) {
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(() => new Set(defaultOpenIds));

  // Deep-link open on mount (#faq-<id>)
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const id = window.location.hash.replace("#faq-", "");
    if (id) setOpen((s) => new Set(s).add(id));
  }, []);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => {
      const hay =
        (it.q || "").toLowerCase() +
        " " +
        (typeof it.a === "string" ? it.a.toLowerCase() : "") +
        " " +
        (it.tags || []).join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [items, query]);

  function toggle(id) {
    setOpen((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const allOpen = filtered.length > 0 && filtered.every((it) => open.has(it.id));

  return (
    <div style={S.wrap}>
      {/* Toolbar */}
      <div style={S.toolbar}>
        <label style={S.search}>
          <SearchIcon />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search FAQs…"
            aria-label="Search FAQs"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} style={S.clear} title="Clear">
              ×
            </button>
          )}
        </label>

        <div style={{ flex: 1 }} />

        <button
          type="button"
          onClick={() => {
            if (allOpen) setOpen(new Set()); // collapse all
            else setOpen(new Set(filtered.map((it) => it.id))); // expand all
          }}
          style={S.ghostBtn}
          title={allOpen ? "Collapse all" : "Expand all"}
        >
          {allOpen ? "Collapse all" : "Expand all"}
        </button>
      </div>

      {/* List */}
      <div style={S.list}>
        {filtered.length === 0 ? (
          <div style={S.empty}>No results for “{query}”.</div>
        ) : (
          filtered.map((it) => {
            const isOpen = open.has(it.id);
            return (
              <div key={it.id} id={`faq-${it.id}`} style={S.item}>
                <button
                  style={{ ...S.head, ...(isOpen ? S.headOpen : null) }}
                  aria-expanded={isOpen}
                  onClick={() => toggle(it.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggle(it.id);
                    }
                  }}
                >
                  <span style={S.q}>{it.q}</span>
                  <span aria-hidden style={S.caret}>
                    {isOpen ? "▾" : "▸"}
                  </span>
                </button>

                {isOpen && (
                  <div style={S.body}>
                    <div style={S.answer}>{it.a}</div>
                    {(it.tags?.length ?? 0) > 0 && (
                      <div style={S.tags}>
                        {it.tags.map((t) => (
                          <em key={t}>#{t}</em>
                        ))}
                      </div>
                    )}
                    <button
                      type="button"
                      style={S.copyBtn}
                      onClick={() => {
                        const url = `${window.location.origin}${window.location.pathname}#faq-${it.id}`;
                        navigator.clipboard?.writeText(url);
                      }}
                      title="Copy link to this question"
                    >
                      Copy link
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

/* Icons */
function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M9.5 3a6.5 6.5 0 015.2 10.4l4.7 4.7-1.4 1.4-4.7-4.7A6.5 6.5 0 119.5 3m0 2a4.5 4.5 0 100 9 4.5 4.5 0 000-9z"
      />
    </svg>
  );
}

/* Styles (simple and safe) */
const S = {
  wrap: { display: "grid", gap: 10 },
  toolbar: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" },

  search: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "rgba(255,255,255,.06)",
    border: "1px solid rgba(255,255,255,.18)",
    borderRadius: 10,
    padding: "6px 10px",
    color: "#eaf0ff",
    minWidth: 240,
  },
  clear: {
    all: "unset",
    cursor: "pointer",
    fontSize: 18,
    lineHeight: 1,
    opacity: 0.85,
  },
  ghostBtn: {
    background: "transparent",
    border: "1px solid rgba(255,255,255,.2)",
    borderRadius: 10,
    padding: "8px 10px",
    color: "#eaf0ff",
    cursor: "pointer",
  },

  list: { display: "grid", gap: 10 },
  empty: { color: "#b9c6e3", fontSize: 14, padding: "12px 6px" },

  item: {
    border: "1px solid rgba(255,255,255,.12)",
    borderRadius: 12,
    background: "linear-gradient(180deg, rgba(255,255,255,.03), rgba(255,255,255,.02))",
  },
  head: {
    all: "unset",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    cursor: "pointer",
    width: "100%",
    padding: "10px 12px",
    borderBottom: "1px solid rgba(255,255,255,.08)",
    borderRadius: "12px 12px 0 0",
    color: "#eaf0ff",
  },
  headOpen: {
    background: "rgba(76,137,255,.08)",
    borderColor: "rgba(76,137,255,.22)",
  },
  q: { fontWeight: 700, color: "#eaf0ff" },
  caret: { opacity: 0.85 },

  body: {
    padding: "10px 12px 12px",
    color: "#cfe0ff",
    fontSize: 14,
    lineHeight: 1.6,
    display: "grid",
    gap: 8,
  },
  answer: { },
  tags: { display: "flex", gap: 6, color: "#9fb2da", fontSize: 12 },
  copyBtn: {
    justifySelf: "end",
    background: "rgba(255,255,255,.06)",
    border: "1px solid rgba(255,255,255,.2)",
    color: "#e8ecf7",
    borderRadius: 8,
    padding: "6px 10px",
    cursor: "pointer",
  },
};
