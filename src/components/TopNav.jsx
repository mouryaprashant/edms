export default function TopNav({ isAdmin, isAuthenticated, role, userEmail, onAdminToggle, onOpenUserManagement, search, onSearchChange, onToggleSidebar }) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950 text-white shadow-[0_6px_25px_rgba(2,6,23,.16)]">
      <div className="mx-auto flex h-[72px] max-w-[1800px] items-center gap-3 px-3 sm:px-5 lg:px-6">
        <button type="button" onClick={onToggleSidebar} className="ui-button !border-slate-700 !bg-slate-900 !text-slate-200 lg:hidden" aria-label="Open navigation">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>

        <div className="flex min-w-[190px] items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 shadow-lg shadow-blue-950/40">
            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 18h16M6 15l3-9h6l3 9M8 15h8M9 10h6M7 18v2m10-2v2" />
            </svg>
          </div>
          <div className="hidden sm:block leading-tight">
            <div className="text-sm font-extrabold tracking-wide">eDMS</div>
            <div className="text-[10px] font-medium uppercase tracking-[.18em] text-slate-400">Document Portal</div>
          </div>
        </div>

        <div className="relative min-w-0 flex-1 max-w-2xl">
          <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35m1.35-5.65a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" /></svg>
          <input value={search} onChange={(e) => onSearchChange(e.target.value)} placeholder="Search stations, codes, documents or revisions..." className="h-10 w-full rounded-xl border border-slate-700 bg-slate-900/90 pl-10 pr-10 text-sm text-white outline-none placeholder:text-slate-500 transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
          <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded-md border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400 md:block">/</kbd>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className={`hidden items-center gap-2 rounded-xl border px-3 py-2 sm:flex ${isAdmin ? "border-emerald-500/20 bg-emerald-500/10" : "border-slate-700 bg-slate-900"}`}>
            <span className={`h-2 w-2 rounded-full ${isAdmin ? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,.7)]" : "bg-slate-500"}`} />
            <span className="text-[11px] font-semibold text-slate-300">{isAuthenticated ? `${role || "user"} mode` : "Directory"}</span>
          </div>
          {isAdmin && <button type="button" onClick={onOpenUserManagement} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 text-xs font-bold text-slate-200 transition hover:bg-slate-800" title="User management">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m8-8a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm8-1v6m3-3h-6" /></svg>
            <span className="hidden lg:inline">Users</span>
          </button>}
          <button type="button" onClick={onAdminToggle} className={`inline-flex h-10 items-center gap-2 rounded-xl px-3 text-xs font-bold transition ${isAuthenticated ? "bg-emerald-500 text-white hover:bg-emerald-400" : "border border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"}`}>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2Zm10-10V7a4 4 0 0 0-8 0v4h8Z" /></svg>
            <span className="hidden md:inline max-w-[12rem] truncate">{isAuthenticated ? userEmail || "Sign out" : "Sign in"}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
