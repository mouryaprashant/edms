import { useEffect, useMemo, useRef, useState } from "react";
import { useRailwayData } from "./hooks/useRailwayData";
import { useAdmin } from "./hooks/useAdmin";

import Toast from "./components/Toast";
import TopNav from "./components/TopNav";
import Toolbar from "./components/Toolbar";
import Sidebar from "./components/Sidebar";
import SectionCard from "./components/SectionCard";

import AdminAuthModal from "./components/modals/AdminAuthModal";
import ConfirmModal from "./components/modals/ConfirmModal";
import SectionModal from "./components/modals/SectionModal";
import StationModal from "./components/modals/StationModal";
import VersionHistoryModal from "./components/modals/VersionHistoryModal";
import UserManagementModal from "./components/modals/UserManagementModal";

export default function App() {
  const {
    sections,
    status,
    isSyncing,
    fetchData,
    saveSection,
    deleteSection,
    saveStation,
    deleteStation,
    moveStation,
    publishNewVersion,
  } = useRailwayData();
  const { isAuthenticated, isAdmin, canEdit, canDelete, role, userEmail, login, logout } = useAdmin();

  const [search, setSearch] = useState("");
  const [activeDivisionFilter, setActiveDivisionFilter] = useState("ALL");
  const [activeSectionFilter, setActiveSectionFilter] = useState("ALL");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Station rows are collapsed by default; this tracks which ones are expanded.
  const [openStationIds, setOpenStationIds] = useState(() => new Set());

  const [toast, setToast] = useState({ message: "", isError: false, visible: false });
  const toastTimer = useRef(null);

  const [adminAuthOpen, setAdminAuthOpen] = useState(false);
  const [userManagementOpen, setUserManagementOpen] = useState(false);
  const [confirmState, setConfirmState] = useState({ open: false, title: "", message: "", onConfirm: null });
  const [versionModal, setVersionModal] = useState({ open: false, stationId: null, docId: null });
  const [sectionModal, setSectionModal] = useState({ open: false, editingId: null });
  const [stationModal, setStationModal] = useState({ open: false, editingSectionId: null, editingStationId: null });

  const showToast = (message, isError = false) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, isError, visible: true });
    toastTimer.current = setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3500);
  };

  // ---------- derived / filtered data ----------
  const findStation = (stationId) => {
    for (const sec of sections) {
      const st = sec.stations.find((x) => x.id === stationId);
      if (st) return st;
    }
    return null;
  };

  const findStationAndDoc = (stationId, docId) => {
    const st = findStation(stationId);
    const doc = st?.docs.find((d) => d.id === docId) || null;
    return { station: st, doc };
  };

  const query = search.trim().toLowerCase();
  let totalStationsInFilter = 0;

  // Divisions present across all sections, with a count of sections in each —
  // used for the top-level division filter bar.
  const divisionOrder = [];
  const divisionCounts = {};
  sections.forEach((sec) => {
    const div = sec.division || "Unassigned";
    if (!(div in divisionCounts)) {
      divisionOrder.push(div);
      divisionCounts[div] = 0;
    }
    divisionCounts[div] += 1;
  });
  const divisions = divisionOrder.map((name) => ({ name, count: divisionCounts[name] }));

  // Sections within the currently selected division (or all of them) — this is
  // what the section pill bar below the division tabs should offer to filter by.
  const sectionsInActiveDivision = sections.filter((sec) => activeDivisionFilter === "ALL" || (sec.division || "Unassigned") === activeDivisionFilter);

  const visibleSections = sectionsInActiveDivision
    .filter((sec) => activeSectionFilter === "ALL" || activeSectionFilter === sec.id)
    .map((sec) => {
      totalStationsInFilter += sec.stations.length;
      const filteredStations = sec.stations.filter((st) => {
        const searchStr = `${st.name} ${st.code} ${st.zone} ${sec.name} ${st.docs.map((d) => `${d.label} ${d.version}`).join(" ")}`.toLowerCase();
        return searchStr.includes(query);
      });
      return { section: sec, filteredStations };
    })
    .filter(({ filteredStations }) => !query || filteredStations.length > 0);

  // When showing all divisions, group the rendered list under a division
  // heading so the Division → Section → Station hierarchy reads clearly.
  const groupedByDivision = [];
  if (activeDivisionFilter === "ALL") {
    const groups = new Map();
    visibleSections.forEach((item) => {
      const div = item.section.division || "Unassigned";
      if (!groups.has(div)) groups.set(div, []);
      groups.get(div).push(item);
    });
    divisionOrder.forEach((div) => {
      if (groups.has(div)) groupedByDivision.push({ division: div, items: groups.get(div) });
    });
  }

  const totalStations = sections.reduce((sum, sec) => sum + sec.stations.length, 0);
  const totalDocuments = sections.reduce((sum, sec) => sum + sec.stations.reduce((n, st) => n + st.docs.length, 0), 0);
  const overallStatsText = `${sections.length} Sections | ${totalStationsInFilter} Total Stations`;

  // If the division a filter points to no longer exists (e.g. its last section was deleted), fall back to "All".
  useEffect(() => {
    if (activeDivisionFilter !== "ALL" && !divisions.some((d) => d.name === activeDivisionFilter)) {
      setActiveDivisionFilter("ALL");
    }
  }, [divisions, activeDivisionFilter]);

  // ---------- collapse handlers (station rows only — sections are no longer collapsible; navigation is via the sidebar) ----------
  const allStationIds = () => sections.flatMap((s) => s.stations.map((st) => st.id));

  const toggleStationOpen = (id) => {
    setOpenStationIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => setOpenStationIds(new Set(allStationIds()));
  const collapseAll = () => setOpenStationIds(new Set());

  const handleDivisionSelect = (division) => {
    setActiveDivisionFilter(division);
    setActiveSectionFilter("ALL"); // section list changes meaning when the division changes
  };

  // Selecting a section directly (from the sidebar) also aligns the division
  // filter to that section's division, so sidebar highlighting stays consistent.
  const handleSelectSection = (sectionId, division) => {
    setActiveDivisionFilter(division || "ALL");
    setActiveSectionFilter(sectionId);
  };

  // ---------- admin ----------
  const handleAdminToggle = async () => {
    if (isAuthenticated) {
      await logout();
      showToast("Logged out");
    } else {
      setAdminAuthOpen(true);
    }
  };
  const handleAdminLoginSubmit = async (email, password) => {
    const res = await login(email, password);
    if (res.ok) {
      setAdminAuthOpen(false);
      showToast("✓ Admin Mode Unlocked!");
    }
    return res;
  };

  // ---------- sections ----------
  const openAddSection = () => setSectionModal({ open: true, editingId: null });
  const openRenameSection = (id) => setSectionModal({ open: true, editingId: id });
  const closeSectionModal = () => setSectionModal({ open: false, editingId: null });

  const handleSaveSection = async (name, division, editingId) => {
    const res = await saveSection(name, division, editingId);
    if (res.ok) {
      closeSectionModal();
      showToast("✓ Section saved!");
    } else {
      showToast("Failed to save section: " + (res.error?.message || ""), true);
    }
  };

  const handleDeleteSection = (id) => {
    const sec = sections.find((s) => s.id === id);
    if (!sec) return;
    const msg =
      sec.stations.length > 0
        ? `Delete section "${sec.name}" and all ${sec.stations.length} station(s) inside it?`
        : `Delete section "${sec.name}"?`;
    setConfirmState({
      open: true,
      title: "Delete Section",
      message: msg,
      onConfirm: async () => {
        setConfirmState((c) => ({ ...c, open: false }));
        const res = await deleteSection(id);
        if (res.ok) {
          if (activeSectionFilter === id) setActiveSectionFilter("ALL");
          showToast("✓ Section deleted!");
        } else {
          showToast("Failed to delete section", true);
        }
      },
    });
  };

  // ---------- stations ----------
  const openAddStation = (sectionId = null) => {
    if (sections.length === 0) {
      showToast("Please add at least one Section before adding stations!", true);
      openAddSection();
      return;
    }
    setStationModal({ open: true, editingSectionId: sectionId, editingStationId: null });
  };
  const openEditStation = (sectionId, stationId) => setStationModal({ open: true, editingSectionId: sectionId, editingStationId: stationId });
  const closeStationModal = () => setStationModal({ open: false, editingSectionId: null, editingStationId: null });

  const handleSaveStation = async (payload) => {
    const res = await saveStation(payload);
    if (res.ok) {
      closeStationModal();
      showToast("✓ Station saved!");
    } else {
      showToast("Failed to save station: " + (res.error?.message || ""), true);
    }
  };

  const handleDeleteStation = (sectionId, stationId) => {
    const st = findStation(stationId);
    if (!st) return;
    setConfirmState({
      open: true,
      title: "Delete Station",
      message: `Delete station "${st.name}" (${st.code})?`,
      onConfirm: async () => {
        setConfirmState((c) => ({ ...c, open: false }));
        const res = await deleteStation(stationId);
        showToast(res.ok ? "✓ Station deleted!" : "Failed to delete station", !res.ok);
      },
    });
  };

  const handleMoveStation = async (sectionId, stationId, direction) => {
    const res = await moveStation(sectionId, stationId, direction);
    if (!res.ok && res.error) showToast("Failed to update position", true);
  };

  // ---------- version history ----------
  const openVersionHistory = (stationId, docId) => setVersionModal({ open: true, stationId, docId });
  const closeVersionHistory = () => setVersionModal({ open: false, stationId: null, docId: null });

  const handlePublishNewVersion = async ({ tag, url, note }) => {
    const { stationId, docId } = versionModal;
    const res = await publishNewVersion(stationId, docId, { tag, url, note });
    if (res.ok) {
      closeVersionHistory();
      showToast("✓ New Revision Published Successfully!");
    } else {
      showToast("Failed to update revision: " + (res.error?.message || ""), true);
    }
  };

  const { station: versionStation, doc: versionDoc } = findStationAndDoc(versionModal.stationId, versionModal.docId);
  const editingSectionForModal = sections.find((s) => s.id === sectionModal.editingId) || null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased flex flex-col">
      <Toast message={toast.message} isError={toast.isError} visible={toast.visible} />

      <TopNav
        isAdmin={isAdmin}
        isAuthenticated={isAuthenticated}
        role={role}
        userEmail={userEmail}
        onAdminToggle={handleAdminToggle}
        search={search}
        onSearchChange={setSearch}
        onToggleSidebar={() => setSidebarOpen(true)}
        onOpenUserManagement={() => setUserManagementOpen(true)}
      />

      <Toolbar
        status={status}
        isSyncing={isSyncing}
        isAdmin={isAdmin}
        canEdit={canEdit}
        onRefresh={() => fetchData()}
        onExpandAll={expandAll}
        onCollapseAll={collapseAll}
        onAddSection={openAddSection}
        onAddStation={() => openAddStation()}
        overallStatsText={overallStatsText}
      />

      <div className="flex-1 flex min-h-0 w-full">
        <Sidebar
          sections={sections}
          divisions={divisions}
          activeDivisionFilter={activeDivisionFilter}
          activeSectionFilter={activeSectionFilter}
          onSelectDivision={handleDivisionSelect}
          onSelectSection={handleSelectSection}
          canEdit={canEdit}
          canDelete={canDelete}
          onEditSection={openRenameSection}
          onDeleteSection={handleDeleteSection}
          onAddStationToSection={openAddStation}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <main className="app-grid flex-1 min-w-0 p-3 sm:p-5 lg:p-6 space-y-5">
          <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_35px_rgba(15,23,42,.06)]">
            <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-blue-100/60 blur-3xl" />
            <div className="absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-cyan-100/50 blur-3xl" />
            <div className="relative flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[.16em] text-blue-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500" /> Directory overview
                </div>
                <h1 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">Section & Station Directory</h1>
                <p className="mt-1.5 text-xs leading-5 text-slate-500 sm:text-sm">Browse railway sections, stations and linked document revisions from one organized workspace.</p>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:min-w-[520px]">
                {[
                  ["Divisions", divisions.length, "bg-violet-50 text-violet-700"],
                  ["Sections", sections.length, "bg-blue-50 text-blue-700"],
                  ["Stations", totalStations, "bg-emerald-50 text-emerald-700"],
                  ["Documents", totalDocuments, "bg-amber-50 text-amber-700"],
                ].map(([label, value, style]) => (
                  <div key={label} className="rounded-xl border border-slate-200/80 bg-white/80 p-3 shadow-sm backdrop-blur">
                    <div className={`mb-2 inline-flex rounded-lg px-2 py-1 text-[9px] font-extrabold uppercase tracking-wider ${style}`}>{label}</div>
                    <div className="text-xl font-black text-slate-900">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
          {(status.state === "error" || status.state === "unconfigured") && (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-xl text-xs flex justify-between items-center font-medium">
              <span>{status.message}</span>
              <button onClick={() => fetchData()} className="underline font-bold hover:text-amber-950">
                Retry Connection
              </button>
            </div>
          )}

          {sections.length === 0 && status.state === "ready" ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-3">
              <div className="inline-flex p-3 bg-blue-50 text-blue-600 rounded-full">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-slate-800">No Sections Available</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">There are currently no sections in the directory.</p>
              {canEdit && (
                <button
                  type="button"
                  onClick={openAddSection}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-4 py-2 rounded-lg font-semibold inline-flex items-center gap-1.5 shadow"
                >
                  + Add First Section
                </button>
              )}
            </div>
          ) : activeDivisionFilter === "ALL" ? (
            groupedByDivision.map(({ division, items }) => (
              <div key={division} className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">{division}</span>
                  <div className="flex-1 h-px bg-slate-300" />
                </div>
                <div className="space-y-4">
                  {items.map(({ section, filteredStations }) => (
                    <SectionCard
                      key={section.id}
                      section={section}
                      filteredStations={filteredStations}
                      canEdit={canEdit}
                      canDelete={canDelete}
                      onEditStation={openEditStation}
                      onDeleteStation={handleDeleteStation}
                      onMoveStation={handleMoveStation}
                      onViewHistory={openVersionHistory}
                      openStationIds={openStationIds}
                      onToggleStation={toggleStationOpen}
                    />
                  ))}
                </div>
              </div>
            ))
          ) : (
            visibleSections.map(({ section, filteredStations }) => (
              <SectionCard
                key={section.id}
                section={section}
                filteredStations={filteredStations}
                canEdit={canEdit}
                canDelete={canDelete}
                onEditStation={openEditStation}
                onDeleteStation={handleDeleteStation}
                onMoveStation={handleMoveStation}
                onViewHistory={openVersionHistory}
                openStationIds={openStationIds}
                onToggleStation={toggleStationOpen}
              />
            ))
          )}
        </main>
      </div>

      <VersionHistoryModal
        open={versionModal.open}
        station={versionStation}
        doc={versionDoc}
        canEdit={canEdit}
        onClose={closeVersionHistory}
        onPublish={handlePublishNewVersion}
      />

      <AdminAuthModal open={adminAuthOpen} onClose={() => setAdminAuthOpen(false)} onSubmit={handleAdminLoginSubmit} />

      <UserManagementModal open={userManagementOpen && isAdmin} onClose={() => setUserManagementOpen(false)} onToast={showToast} />

      <ConfirmModal
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        onCancel={() => setConfirmState((c) => ({ ...c, open: false }))}
        onConfirm={() => confirmState.onConfirm && confirmState.onConfirm()}
      />

      <SectionModal open={sectionModal.open} editingSection={editingSectionForModal} allSections={sections} onClose={closeSectionModal} onSave={handleSaveSection} />

      <StationModal
        open={stationModal.open}
        sections={sections}
        editingSectionId={stationModal.editingSectionId}
        editingStationId={stationModal.editingStationId}
        onClose={closeStationModal}
        onSave={handleSaveStation}
        onNeedsSectionFirst={() => {
          closeStationModal();
          showToast("Please add at least one Section before adding stations!", true);
          openAddSection();
        }}
      />
    </div>
  );
}
