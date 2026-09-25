const STATUS = {
  loading: { dot: "bg-blue-500", text: "text-blue-700", label: "Syncing" },
  ready: { dot: "bg-emerald-500", text: "text-emerald-700", label: "Connected" },
  error: { dot: "bg-rose-500", text: "text-rose-700", label: "Connection issue" },
  unconfigured: { dot: "bg-rose-500", text: "text-rose-700", label: "Setup required" },
};

export default function Toolbar({ status, isSyncing, isAdmin, canEdit, onRefresh, onExpandAll, onCollapseAll, onAddSection, onAddStation, overallStatsText }) {
  const s = STATUS[status.state] || STATUS.ready;
  return (
    <div className="sticky top-[72px] z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1800px] flex-wrap items-center gap-2 px-3 py-2.5 sm:px-5 lg:px-6">
        <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-1.5">
          <span className={`h-2 w-2 rounded-full ${s.dot} ${status.state === "loading" ? "animate-pulse" : ""}`} />
          <span className={`text-[11px] font-bold ${s.text}`}>{s.label}</span>
          <span className="hidden text-[11px] text-slate-400 sm:inline">{status.message}</span>
        </div>
        <span className="hidden h-5 w-px bg-slate-200 sm:block" />
        <span className="text-xs font-semibold text-slate-500">{overallStatsText}</span>

        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          <button type="button" onClick={onRefresh} className="ui-button"><svg className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M5 9a7 7 0 0 1 13.5-2M19 15a7 7 0 0 1-13.5 2" /></svg>Refresh</button>
          <button type="button" onClick={onExpandAll} className="ui-button hidden sm:inline-flex">Expand all</button>
          <button type="button" onClick={onCollapseAll} className="ui-button hidden sm:inline-flex">Collapse all</button>
          {canEdit && <>
            <span className="mx-1 hidden h-5 w-px bg-slate-200 sm:block" />
            <button type="button" onClick={onAddSection} className="ui-button !border-emerald-600 !bg-emerald-600 !text-white hover:!bg-emerald-700"><span className="text-base leading-none">+</span> Section</button>
            <button type="button" onClick={() => onAddStation()} className="ui-button ui-button-primary"><span className="text-base leading-none">+</span> Station</button>
          </>}
        </div>
      </div>
    </div>
  );
}
