import { useState } from "react";

export default function Sidebar({ sections, divisions, activeDivisionFilter, activeSectionFilter, canEdit, canDelete, onEditSection, onDeleteSection, onAddStationToSection, onSelectDivision, onSelectSection, isOpen, onClose }) {
  const [collapsedDivisions, setCollapsedDivisions] = useState(() => new Set());
  const toggleDivisionCollapse = (name) => setCollapsedDivisions((prev) => { const next = new Set(prev); next.has(name) ? next.delete(name) : next.add(name); return next; });
  const sectionsByDivision = (name) => sections.filter((s) => (s.division || "Unassigned") === name);

  return <>
    {isOpen && <div className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden" onClick={onClose} />}
    <aside className={`fixed left-0 top-[72px] z-50 h-[calc(100vh-72px)] w-[290px] overflow-y-auto border-r border-slate-200 bg-white/95 shadow-xl backdrop-blur-xl transition-transform duration-200 lg:sticky lg:top-[72px] lg:z-20 lg:h-[calc(100vh-72px)] lg:shadow-none ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
      <div className="p-4">
        <div className="mb-3 flex items-center justify-between px-2">
          <div><div className="text-[10px] font-bold uppercase tracking-[.18em] text-slate-400">Navigation</div><div className="mt-0.5 text-sm font-extrabold text-slate-800">Railway hierarchy</div></div>
          <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 lg:hidden" onClick={onClose}><svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg></button>
        </div>
        <button type="button" onClick={() => { onSelectDivision("ALL"); onClose?.(); }} className={`mb-3 flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ${activeDivisionFilter === "ALL" && activeSectionFilter === "ALL" ? "border-blue-200 bg-blue-50 text-blue-700 shadow-sm" : "border-transparent text-slate-700 hover:border-slate-200 hover:bg-slate-50"}`}>
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600"><svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m3 11 9-8 9 8M5 10v10h14V10M9 20v-6h6v6" /></svg></span>
          <span className="flex-1"><span className="block text-xs font-bold">All sections</span><span className="block text-[10px] text-slate-400">Complete directory</span></span>
          <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-slate-400 shadow-sm">{sections.length}</span>
        </button>

        <div className="space-y-2">
          {divisions.map((div) => {
            const divSections = sectionsByDivision(div.name);
            const isCollapsed = collapsedDivisions.has(div.name);
            const isActiveDiv = activeDivisionFilter === div.name;
            return <div key={div.name} className="rounded-xl border border-slate-100 bg-slate-50/70 p-1.5">
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => toggleDivisionCollapse(div.name)} className="rounded-lg p-2 text-slate-400 hover:bg-white hover:text-slate-700"><svg className={`h-3.5 w-3.5 transition-transform ${isCollapsed ? "-rotate-90" : ""}`} fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" /></svg></button>
                <button type="button" onClick={() => { onSelectDivision(div.name); onClose?.(); }} className={`flex min-w-0 flex-1 items-center justify-between rounded-lg px-2 py-2 text-left ${isActiveDiv && activeSectionFilter === "ALL" ? "bg-white text-blue-700 shadow-sm" : "text-slate-700 hover:bg-white"}`}>
                  <span className="truncate text-[11px] font-extrabold uppercase tracking-wide">{div.name}</span><span className="ml-2 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">{div.count}</span>
                </button>
              </div>
              {!isCollapsed && <div className="ml-4 mt-1 space-y-1 border-l border-slate-200 pl-2">
                {divSections.map((sec) => <div key={sec.id} className="group flex items-center gap-1">
                  <button type="button" onClick={() => { onSelectSection(sec.id, sec.division); onClose?.(); }} className={`flex min-w-0 flex-1 items-center justify-between rounded-lg px-2.5 py-2 text-left ${activeSectionFilter === sec.id ? "bg-blue-600 text-white shadow-md shadow-blue-600/15" : "text-slate-600 hover:bg-white"}`}><span className="truncate text-xs font-semibold">{sec.name}</span><span className={`ml-2 text-[10px] font-bold ${activeSectionFilter === sec.id ? "text-blue-100" : "text-slate-400"}`}>{sec.stations.length}</span></button>
                  {canEdit && <div className="hidden gap-0.5 group-hover:flex">
                    <button type="button" title="Add station" onClick={() => onAddStationToSection(sec.id)} className="rounded p-1 text-slate-400 hover:bg-blue-50 hover:text-blue-600">+</button>
                    <button type="button" title="Rename" onClick={() => onEditSection(sec.id)} className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700">✎</button>
                    {canDelete && <button type="button" title="Delete" onClick={() => onDeleteSection(sec.id)} className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600">×</button>}
                  </div>}
                </div>)}
              </div>}
            </div>;
          })}
        </div>
        {divisions.length === 0 && <p className="px-2 py-5 text-center text-xs italic text-slate-400">No sections added yet.</p>}
      </div>
    </aside>
  </>;
}
