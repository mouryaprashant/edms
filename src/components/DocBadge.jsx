import { safeDocumentUrl } from "../utils/urlSecurity";

export default function DocBadge({ doc, onViewHistory }) {
  const url = safeDocumentUrl(doc.url);
  const category = doc.category && doc.category !== "General" ? doc.category : "—";

  return (
    <div className="group grid grid-cols-[minmax(0,1.45fr)_minmax(140px,1.2fr)_90px_minmax(90px,0.8fr)_minmax(130px,1fr)_auto] items-center gap-3 border-b border-slate-100 px-3 py-3 last:border-b-0 hover:bg-blue-50/35 sm:px-4">
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-400" aria-hidden="true">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 2v6h6M8 13h8M8 17h6" />
            </svg>
          </span>
          <span className="truncate text-xs font-extrabold text-slate-700" title={doc.label}>
            {doc.label || "Document"}
          </span>
        </div>
      </div>

      <div className="min-w-0">
        <span className="block truncate text-[10px] font-medium text-slate-500" title={doc.description || "No description"}>
          {doc.description || "—"}
        </span>
      </div>

      <div>
        <span className="inline-flex rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-[10px] font-extrabold text-slate-600">
          {doc.version || "—"}
        </span>
      </div>

      <div className="min-w-0">
        <span className="block truncate text-[10px] font-semibold text-slate-500" title={category}>
          {category}
        </span>
      </div>

      <div className="min-w-0">
        <span className="block truncate text-[10px] font-medium text-slate-400" title={doc.last_updated || "Not available"}>
          {doc.last_updated || "Not available"}
        </span>
      </div>

      <div className="flex shrink-0 items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={onViewHistory}
          title="Version history"
          className="rounded-lg border border-slate-200 bg-white p-2 text-slate-400 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
          aria-label={`View version history for ${doc.label || "document"}`}
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        </button>

        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            title="Open document"
            aria-label={`Open ${doc.label || "document"}`}
            className="rounded-lg border border-blue-100 bg-blue-50 p-2 text-blue-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-100"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        ) : (
          <span className="rounded-lg border border-slate-100 bg-slate-50 p-2 text-slate-200" title="No valid document link" aria-label="No valid document link">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" />
            </svg>
          </span>
        )}
      </div>
    </div>
  );
}
