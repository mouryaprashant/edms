import StationRow from "./StationRow";

export default function SectionCard({ section, filteredStations, canEdit, canDelete, onEditStation, onDeleteStation, onMoveStation, onViewHistory, openStationIds, onToggleStation }) {
  return <section className="ui-card overflow-hidden">
    <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 bg-gradient-to-r from-white to-slate-50/80 px-4 py-3.5 sm:px-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 19h16M6 17V7l6-3 6 3v10M9 17v-4h6v4" /></svg></div>
      <div className="min-w-0 flex-1"><h2 className="truncate text-sm font-extrabold text-slate-800">{section.name}</h2><p className="mt-0.5 text-[10px] font-medium uppercase tracking-[.14em] text-slate-400">{section.division || "Unassigned"} · Section</p></div>
      <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-500">{section.stations.length} stations</span>
    </div>
    <div className="overflow-x-auto custom-scrollbar">
      <table className="min-w-full text-left text-sm"><thead className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-extrabold uppercase tracking-[.14em] text-slate-400"><tr><th className="px-5 py-3 sm:px-6">Station</th><th className="px-5 py-3 sm:px-6">Code</th><th className="px-5 py-3 sm:px-6">Documents</th>{canEdit && <th className="px-5 py-3 text-right sm:px-6">Actions</th>}</tr></thead>
        <tbody className="divide-y divide-slate-100 bg-white">{filteredStations.length === 0 ? <tr><td colSpan={canEdit ? 4 : 3} className="px-6 py-8 text-center text-xs text-slate-400">No stations match the current search.</td></tr> : filteredStations.map((st) => { const actualIdx = section.stations.findIndex((x) => x.id === st.id); return <StationRow key={st.id} station={st} index={actualIdx} isFirst={actualIdx === 0} isLast={actualIdx === section.stations.length - 1} canEdit={canEdit} canDelete={canDelete} isOpen={openStationIds.has(st.id)} onToggle={onToggleStation} onViewHistory={onViewHistory} onEdit={(stId) => onEditStation(section.id, stId)} onDelete={(stId) => onDeleteStation(section.id, stId)} onMove={(stId, dir) => onMoveStation(section.id, stId, dir)} />; })}</tbody>
      </table>
    </div>
  </section>;
}
