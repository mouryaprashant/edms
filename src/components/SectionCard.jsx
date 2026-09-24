import StationRow from "./StationRow";

export default function SectionCard({
  section,
  filteredStations,
  isAdmin,
  onEditStation,
  onDeleteStation,
  onMoveStation,
  onViewHistory,
  openStationIds,
  onToggleStation,
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Plain, non-interactive label — section navigation and admin actions
          (rename/delete/add station) now live in the sidebar, not here. */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-6 py-2.5 flex flex-wrap items-center gap-2">
        <h2 className="text-sm font-bold text-slate-700 tracking-wide">{section.name}</h2>
        <span className="bg-white text-slate-500 text-[11px] px-2 py-0.5 rounded-full font-medium border border-slate-200">
          {section.stations.length} Stations
        </span>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-slate-600 uppercase text-xs font-bold tracking-wider">
            <tr>
              <th className="px-6 py-3">Station Name</th>
              <th className="px-6 py-3">Code</th>
              <th className="px-6 py-3">Linked Documents &amp; Revisions</th>
              {isAdmin && <th className="px-6 py-3 text-right">Order / Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {filteredStations.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 4 : 3} className="px-6 py-6 text-center text-slate-400 text-xs italic">
                  No stations added to this section yet.
                </td>
              </tr>
            ) : (
              filteredStations.map((st) => {
                const actualIdx = section.stations.findIndex((x) => x.id === st.id);
                return (
                  <StationRow
                    key={st.id}
                    station={st}
                    index={actualIdx}
                    isFirst={actualIdx === 0}
                    isLast={actualIdx === section.stations.length - 1}
                    isAdmin={isAdmin}
                    isOpen={openStationIds.has(st.id)}
                    onToggle={onToggleStation}
                    onViewHistory={onViewHistory}
                    onEdit={(stId) => onEditStation(section.id, stId)}
                    onDelete={(stId) => onDeleteStation(section.id, stId)}
                    onMove={(stId, dir) => onMoveStation(section.id, stId, dir)}
                  />
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
