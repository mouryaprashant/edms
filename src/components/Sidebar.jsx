import { useState } from "react";

export default function Sidebar({
  sections,
  divisions,
  activeDivisionFilter,
  activeSectionFilter,
  onSelectDivision,
  onSelectSection,
  isAdmin,
  onEditSection,
  onDeleteSection,
  onAddStationToSection,
  isOpen,
  onClose,
}) {
  const [collapsedDivisions, setCollapsedDivisions] = useState(() => new Set());

  const toggleDivisionCollapse = (name) => {
    setCollapsedDivisions((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const sectionsByDivision = (divisionName) => sections.filter((s) => (s.division || "Unassigned") === divisionName);

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-slate-900/50 z-30 lg:hidden" onClick={onClose} />}
      <aside
        className={`fixed lg:sticky top-0 lg:top-24 left-0 z-40 lg:z-0 w-64 shrink-0 h-screen lg:h-[calc(100vh-6rem)] bg-white border-r border-slate-200 overflow-y-auto custom-scrollbar transform transition-transform duration-200 lg:transform-none ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="p-3">
          <button
            type="button"
            onClick={() => {
              onSelectDivision("ALL");
              onClose?.();
            }}
            className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-sm font-semibold mb-2 transition-colors ${
              activeDivisionFilter === "ALL" && activeSectionFilter === "ALL" ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            All Sections
          </button>

          {divisions.map((div) => {
            const divSections = sectionsByDivision(div.name);
            const isCollapsed = collapsedDivisions.has(div.name);
            const isActiveDiv = activeDivisionFilter === div.name;

            return (
              <div key={div.name} className="mb-0.5">
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => toggleDivisionCollapse(div.name)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded shrink-0"
                    title={isCollapsed ? "Expand" : "Collapse"}
                  >
                    <svg className={`w-3 h-3 transition-transform ${isCollapsed ? "-rotate-90" : ""}`} fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectDivision(div.name);
                      onClose?.();
                    }}
                    className={`flex-1 min-w-0 flex items-center justify-between px-2 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide transition-colors ${
                      isActiveDiv && activeSectionFilter === "ALL" ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    <span className="truncate">{div.name}</span>
                    <span className="text-[10px] font-medium text-slate-400 shrink-0 ml-1">{div.count}</span>
                  </button>
                </div>

                {!isCollapsed && (
                  <div className="ml-5 border-l border-slate-200 pl-2 mt-0.5 mb-1.5 space-y-0.5">
                    {divSections.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic px-2 py-1">No sections yet</p>
                    ) : (
                      divSections.map((sec) => (
                        <div key={sec.id} className="group flex items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              onSelectSection(sec.id, sec.division);
                              onClose?.();
                            }}
                            className={`flex-1 min-w-0 text-left px-2 py-1.5 rounded-md text-xs flex items-center justify-between transition-colors ${
                              activeSectionFilter === sec.id ? "bg-blue-50 text-blue-700 font-semibold" : "text-slate-600 hover:bg-slate-100 font-medium"
                            }`}
                          >
                            <span className="truncate">{sec.name}</span>
                            <span className="text-[10px] text-slate-400 ml-1 shrink-0">{sec.stations.length}</span>
                          </button>
                          {isAdmin && (
                            <div className="flex items-center gap-0.5 shrink-0 pr-0.5">
                              <button
                                type="button"
                                onClick={() => onAddStationToSection(sec.id)}
                                title="Add station to this section"
                                className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={() => onEditSection(sec.id)}
                                title="Rename section"
                                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteSection(sec.id)}
                                title="Delete section"
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {divisions.length === 0 && <p className="text-xs text-slate-400 italic px-2 py-2">No sections added yet.</p>}
        </div>
      </aside>
    </>
  );
}
