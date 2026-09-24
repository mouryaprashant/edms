export default function TopNav({ isAdmin, userEmail, onAdminToggle, search, onSearchChange, onToggleSidebar }) {
  return (
    <header className="bg-slate-900 text-white sticky top-0 z-30 border-b border-slate-800">
      <div className="flex items-center gap-3 px-3 sm:px-5 h-14">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="lg:hidden p-1.5 -ml-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded-md shrink-0"
          title="Toggle navigation"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="flex items-center gap-2 shrink-0">
          <svg className="w-6 h-6 text-blue-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8m0 0V4a2 2 0 00-2-2H8a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7.5L12 13z" />
          </svg>
          <span className="font-bold text-sm tracking-wide hidden sm:inline whitespace-nowrap">Railway Directory</span>
        </div>

        <div className="flex-1 min-w-0 max-w-xl relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search station, code, version, or document..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-md text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-slate-900 transition-colors"
          />
        </div>

        <button
          type="button"
          onClick={onAdminToggle}
          className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold shrink-0 transition-colors ${
            isAdmin ? "bg-rose-700 hover:bg-rose-600" : "bg-amber-600 hover:bg-amber-500"
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span className="hidden md:inline max-w-[10rem] truncate">{isAdmin ? userEmail || "Exit Admin" : "Admin Login"}</span>
        </button>
      </div>
    </header>
  );
}
