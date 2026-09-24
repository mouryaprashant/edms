const STATUS_DOT = {
  loading: "bg-blue-500 animate-pulse",
  ready: "bg-emerald-500",
  error: "bg-rose-500",
  unconfigured: "bg-rose-500",
};
const STATUS_TEXT = {
  loading: "text-blue-700",
  ready: "text-emerald-700",
  error: "text-rose-700",
  unconfigured: "text-rose-700",
};

export default function Toolbar({
  status,
  isSyncing,
  isAdmin,
  onRefresh,
  onExpandAll,
  onCollapseAll,
  onAddSection,
  onAddStation,
  overallStatsText,
}) {
  return (
    <div className="bg-white border-b border-slate-200 sticky top-14 z-20">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 sm:px-5 py-2.5">
        <span className={`text-xs font-semibold flex items-center gap-1.5 ${STATUS_TEXT[status.state]}`}>
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[status.state]}`} />
          {status.message}
        </span>
        <span className="text-slate-300 hidden sm:inline">|</span>
        <span className="text-xs text-slate-500 font-medium">{overallStatsText}</span>

        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={onRefresh}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-2.5 py-1.5 rounded-md flex items-center gap-1 transition-colors"
          >
            <svg className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          <button type="button" onClick={onExpandAll} className="text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-2.5 py-1.5 rounded-md transition-colors">
            Expand All
          </button>
          <button type="button" onClick={onCollapseAll} className="text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-2.5 py-1.5 rounded-md transition-colors">
            Collapse All
          </button>

          {isAdmin && (
            <>
              <div className="w-px h-4 bg-slate-200 mx-1" />
              <button
                type="button"
                onClick={onAddSection}
                className="text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 px-2.5 py-1.5 rounded-md flex items-center gap-1 shadow-sm transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Section
              </button>
              <button
                type="button"
                onClick={() => onAddStation()}
                className="text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 px-2.5 py-1.5 rounded-md flex items-center gap-1 shadow-sm transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Station
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
