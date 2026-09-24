import { getBadgeStyle } from "../utils/normalize";

export default function DocBadge({ doc, onViewHistory }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-2.5 flex items-center justify-between gap-2 shadow-sm hover:border-slate-300 transition-colors">
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${getBadgeStyle(doc.label)}`}>{doc.label}</span>
          <span className="text-xs font-mono font-semibold text-slate-700">{doc.version}</span>
        </div>
        <div className="text-[10px] text-slate-400 mt-1">
          {doc.category && doc.category !== "General" ? `${doc.category} · ` : ""}Updated {doc.last_updated}
        </div>
      </div>
      <div className="flex items-center gap-0.5 shrink-0">
        <button
          type="button"
          onClick={onViewHistory}
          title="Version history"
          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
        <a
          href={doc.url || "#"}
          target="_blank"
          rel="noreferrer"
          title="Open document"
          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </div>
  );
}
