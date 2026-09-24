import { useEffect, useMemo, useState } from "react";
import DocBadge from "./DocBadge";

export default function StationRow({
  station,
  index,
  isFirst,
  isLast,
  isAdmin,
  isOpen,
  onToggle,
  onViewHistory,
  onEdit,
  onDelete,
  onMove,
}) {
  const docCount = station.docs.length;
  const [activeCategory, setActiveCategory] = useState("All");

  // Categories present on this station's docs, in first-seen order.
  const categories = useMemo(() => {
    const seen = [];
    station.docs.forEach((d) => {
      const cat = d.category || "General";
      if (!seen.includes(cat)) seen.push(cat);
    });
    return seen;
  }, [station.docs]);

  // Reset to "All" if the active tab no longer exists (e.g. docs were edited),
  // and whenever the row collapses, so it starts fresh next time it opens.
  useEffect(() => {
    if (!isOpen) {
      setActiveCategory("All");
    } else if (activeCategory !== "All" && !categories.includes(activeCategory)) {
      setActiveCategory("All");
    }
  }, [isOpen, categories, activeCategory]);

  const visibleDocs = activeCategory === "All" ? station.docs : station.docs.filter((d) => (d.category || "General") === activeCategory);

  return (
    <>
      <tr className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => onToggle(station.id)}>
        <td className="px-6 py-3.5 font-medium text-slate-900">
          <div className="flex items-center gap-2">
            <svg
              className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-150 ${isOpen ? "rotate-90" : ""}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m9 6 6 6-6 6" />
            </svg>
            <span className="text-xs font-semibold text-slate-400 w-4">{index + 1}.</span>
            <div>
              {station.name}
              <span className="block text-xs font-normal text-slate-500">{station.zone || "Indian Railways"}</span>
            </div>
          </div>
        </td>
        <td className="px-6 py-3.5">
          <span className="bg-slate-100 text-slate-700 font-mono font-semibold px-2 py-0.5 rounded text-xs border border-slate-300">
            {station.code.toUpperCase()}
          </span>
        </td>
        <td className="px-6 py-3.5">
          {docCount === 0 ? (
            <span className="text-xs text-slate-400">No documents linked</span>
          ) : (
            <span className="text-xs text-slate-600 font-medium">
              {docCount} document{docCount !== 1 ? "s" : ""}
            </span>
          )}
        </td>
        {isAdmin && (
          <td className="px-6 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
            <div className="inline-flex items-center gap-1">
              <div className="flex items-center border border-slate-200 rounded-md bg-white p-0.5 mr-1 shadow-sm">
                <button
                  type="button"
                  disabled={isFirst}
                  onClick={() => onMove(station.id, "up")}
                  className={isFirst ? "p-1 text-slate-300 cursor-not-allowed" : "p-1 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded"}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button
                  type="button"
                  disabled={isLast}
                  onClick={() => onMove(station.id, "down")}
                  className={isLast ? "p-1 text-slate-300 cursor-not-allowed" : "p-1 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded"}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              <button
                type="button"
                onClick={() => onEdit(station.id)}
                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold text-xs border border-blue-200 hover:border-blue-400 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-md transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>

              <button
                type="button"
                onClick={() => onDelete(station.id)}
                title="Delete Station"
                className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-800 font-semibold text-xs border border-rose-200 hover:border-rose-400 bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded-md transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </td>
        )}
      </tr>

      {isOpen && (
        <tr className="bg-slate-50/70">
          <td colSpan={isAdmin ? 4 : 3} className="px-6 pb-4 pt-0.5">
            {docCount === 0 ? (
              <p className="text-xs text-slate-400 italic pl-6">No documents linked to this station yet.</p>
            ) : (
              <div className="pl-6">
                {categories.length > 1 && (
                  <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                    <button
                      type="button"
                      onClick={() => setActiveCategory("All")}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                        activeCategory === "All" ? "bg-blue-600 text-white shadow-sm" : "bg-white text-slate-600 border border-slate-300 hover:bg-slate-100"
                      }`}
                    >
                      All ({docCount})
                    </button>
                    {categories.map((cat) => {
                      const count = station.docs.filter((d) => (d.category || "General") === cat).length;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setActiveCategory(cat)}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                            activeCategory === cat ? "bg-blue-600 text-white shadow-sm" : "bg-white text-slate-600 border border-slate-300 hover:bg-slate-100"
                          }`}
                        >
                          {cat} ({count})
                        </button>
                      );
                    })}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {visibleDocs.map((d) => (
                    <DocBadge key={d.id} doc={d} onViewHistory={() => onViewHistory(station.id, d.id)} />
                  ))}
                </div>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}
