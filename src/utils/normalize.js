export function makeId(prefix = "doc") {
  return `${prefix}_${Math.random().toString(36).substr(2, 9)}`;
}

// Presets shown as suggestions in the admin form — admins can still type any
// custom category; these are just a sensible starting point.
export const DEFAULT_DOC_CATEGORIES = ["Plans", "Sanctions", "Estimates", "Inspection Reports", "Correspondence", "Other"];

// Same idea for divisions — a starting set of presets, not a hard-coded list.
// Add more here (or just type a new one in the Section form) as your office adds divisions.
export const DEFAULT_DIVISIONS = ["JBP Division", "BPL Division", "Kota Division"];

export function normalizeDoc(d) {
  return {
    id: d.id || makeId("doc"),
    label: d.label || "Document",
    category: d.category || "General",
    url: d.url || "",
    version: d.version || "Alt-A",
    last_updated: d.last_updated || new Date().toISOString().split("T")[0],
    history: Array.isArray(d.history) ? d.history : [],
  };
}

const BADGE_PALETTE = [
  "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100",
  "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
  "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",
  "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
  "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100",
  "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100",
  "bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100",
];

export function getBadgeStyle(label) {
  const cleanStr = (label || "").trim().toLowerCase();
  let hash = 0;
  for (let i = 0; i < cleanStr.length; i++) {
    hash = cleanStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  return BADGE_PALETTE[Math.abs(hash) % BADGE_PALETTE.length];
}
